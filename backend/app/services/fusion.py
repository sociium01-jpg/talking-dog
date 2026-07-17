import os
import re
import asyncio
from app.core.config import settings

class FusionService:
    BEHAVIOR_PROFILES = {
        "happy": {
            "speech": '"I am so incredibly happy! Grab the ball and throw it right now, let\'s play! 🎾"',
            "analysis_template": "The dog is displaying a playful posture (play_bow) with forward ears and a fast tail wag. These signals suggest a state of high arousal and positive valence, indicating an active desire to interact and play.",
            "tone": "playful and energetic"
        },
        "angry": {
            "speech": '"Hey! Back off! I don\'t know what you\'re doing, but it\'s making me feel threatened! ⚠️"',
            "analysis_template": "The dog's posture is stiff and rigid, accompanied by pinned back or backward ears. This signals defensive high-arousal and negative valence, suggesting warning behaviors.",
            "tone": "firm, protective, and warning"
        },
        "scared": {
            "speech": '"I feel super anxious and frightened right now... Can we go somewhere quiet? 🥺"',
            "analysis_template": "The dog is showing signs of high stress, with a cowering posture, tucked tail, and pinned ears. These physical indicators show negative valence and anxiety, pointing to fear or vulnerability.",
            "tone": "submissive and fearful"
        },
        "relaxed": {
            "speech": '"I feel completely safe, comfy, and content right now. Belly rubs please! 😌"',
            "analysis_template": "The dog is showing a relaxed body posture, neutral ears, and a slow tail wag. These signs reflect low arousal and comfort in their current environment.",
            "tone": "calm and content"
        },
        "alert": {
            "speech": '"Wait! Did you hear that? I see something super interesting over there. Let me inspect it! 👀"',
            "analysis_template": "The dog has detected something interesting, displaying an alert posture with perked ears. This indicates focused attention and curiosity about their environment.",
            "tone": "focused and alert"
        },
        "excited": {
            "speech": '"Oh my goodness! Yes! We are going for a walk? Or is that food? I am bursting with absolute joy! 🌟"',
            "analysis_template": "The dog is displaying high excitement, with bouncy movements, forward ears, and a very fast tail wag. This confirms pure, uninhibited joy and positive high arousal.",
            "tone": "extremely excited and joyous"
        }
    }

    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.is_mock = "mock" in self.api_key or self.api_key == "mock-llm-key"
        if not self.is_mock:
            try:
                import vertexai
                from vertexai.generative_models import GenerativeModel
                vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
                self.model = GenerativeModel("gemini-1.5-flash-preview-0514")
            except Exception:
                self.is_mock = True

    def _determine_mood(self, pose: dict, audio: dict) -> str:
        posture = pose.get("posture")
        vocalization = audio.get("vocalization")
        valence = audio.get("valence")
        arousal = audio.get("arousal")

        # Direct posture/vocal mappings
        if posture == "play_bow" or vocalization == "high_bark":
            return "happy"
        if posture == "stiff" or vocalization == "growl":
            return "angry"
        if posture == "cowering" or vocalization in ("whine", "whimper"):
            return "scared"
        if posture == "relaxed" or vocalization == "soft_pant":
            return "relaxed"
        if posture == "alert" or vocalization == "mid_bark":
            return "alert"
        if posture == "bouncing" or vocalization == "yip":
            return "excited"

        # Heuristic fallbacks based on valence/arousal
        if valence == "positive":
            return "happy" if arousal == "high" else "relaxed"
        if valence == "negative":
            return "angry" if arousal == "high" else "scared"
        if arousal == "medium":
            return "alert"
        
        return "relaxed"

    def _sanitize_narrative(self, text: str) -> str:
        # Strict filter preventing diagnostic or veterinary hallucinations
        restricted = ["clinical", "veterinary", "rabies", "disease", "diagnosis", "veterinarian"]
        for term in restricted:
            text = re.sub(re.escape(term), "behavioral", text, flags=re.IGNORECASE)
        return text

    async def _generate_fallback_narrative(self, pose_results: dict, audio_results: dict) -> str:
        mood = self._determine_mood(pose_results, audio_results)
        profile = self.BEHAVIOR_PROFILES[mood]

        speech = profile["speech"]
        analysis = profile["analysis_template"]

        # Dynamic details injection
        posture = pose_results.get("posture")
        tail = pose_results.get("tail_wag")
        ears = pose_results.get("ears")
        vocal = audio_results.get("vocalization")

        details = []
        if posture and posture != "unknown":
            details.append(f"posture is {posture}")
        if tail and tail != "unknown":
            details.append(f"tail wag is {tail}")
        if ears and ears != "unknown":
            details.append(f"ears are {ears}")
        if vocal and vocal != "unknown":
            details.append(f"vocalization is {vocal}")

        if details:
            analysis += f" Specific observed markers include: {', '.join(details)}."

        # Safety & Grounding (Uncertainty Note)
        p_conf = pose_results.get("confidence", 1.0)
        a_conf = audio_results.get("confidence", 1.0)
        
        if p_conf < 0.7 or a_conf < 0.7 or posture == "unknown" or vocal == "unknown":
            analysis += " Please note that some behavior signals are weak or unknown, making this translation less certain."

        narrative = f"{speech}\n\nBehavior Analysis: {analysis}"
        return self._sanitize_narrative(narrative)

    async def generate_narrative(self, pose_results: dict, audio_results: dict) -> str:
        """
        Combines pose and audio features into a plain-English translation.
        Enforces strict system instruction grounding to prevent hallucinations.
        """
        if self.is_mock:
            return await self._generate_fallback_narrative(pose_results, audio_results)

        system_instruction = (
            "You are a dog behavior translation assistant. Your role is to translate structured dog "
            "classification outputs (pose postures and vocalization labels) into a clear, natural-language explanation for owners.\n\n"
            "CRITICAL RULES:\n"
            "1. ONLY refer to elements explicitly present in the provided JSON input.\n"
            "2. DO NOT make assumptions about the dog's background, past life, thoughts, or complex human emotions.\n"
            "3. Keep the tone professional, objective, and clear.\n"
            "4. If the confidence values are low (e.g. under 0.70) or values are missing/unknown, you MUST state that the observation is uncertain or incomplete.\n"
            "5. Limit the description to exactly 2-3 sentences.\n"
            "6. DO NOT use medical, diagnostic, clinical, or veterinary terms (such as 'rabies', 'clinical', 'disease', 'diagnosis', 'veterinary', or 'veterinarian'). Focus strictly on behavioral cues.\n"
            "7. The final output MUST strictly adhere to the following format, with a direct dog translation quote enclosed in double quotes, followed by two newlines, then 'Behavior Analysis: ' and a detailed objective analysis:\n"
            '"[Dog quote here]"\n\nBehavior Analysis: [Your objective behavior analysis here]'
        )

        prompt = (
            f"Translate the following dog classification results into a clear 2-3 sentence explanation:\n\n"
            f"POSE CLASSIFIER:\n"
            f"- Posture: {pose_results.get('posture')} (confidence: {pose_results.get('confidence', 0.0)})\n"
            f"- Tail motion: {pose_results.get('tail_wag')}\n"
            f"- Ears position: {pose_results.get('ears')}\n\n"
            f"AUDIO CLASSIFIER:\n"
            f"- Vocalization: {audio_results.get('vocalization')} (confidence: {audio_results.get('confidence', 0.0)})\n"
            f"- Arousal level: {audio_results.get('arousal')}\n"
            f"- Valence: {audio_results.get('valence')}\n"
        )

        try:
            from vertexai.generative_models import Content, Part
            contents = [
                Content(role="user", parts=[Part.from_text(f"{system_instruction}\n\n{prompt}")])
            ]
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(contents)
            )
            narrative = response.text.strip()
            
            # Verify the output structure of the LLM narrative.
            # If the LLM didn't follow the structure, fall back to mock.
            if 'behavior analysis:' in narrative.lower() and narrative.startswith('"'):
                return self._sanitize_narrative(narrative)
            else:
                return await self._generate_fallback_narrative(pose_results, audio_results)
        except Exception:
            return await self._generate_fallback_narrative(pose_results, audio_results)
