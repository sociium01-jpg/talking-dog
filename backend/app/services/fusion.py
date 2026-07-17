import os
import asyncio
from app.core.config import settings

class FusionService:
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

    async def generate_narrative(self, pose_results: dict, audio_results: dict) -> str:
        """
        Combines pose and audio features into a plain-English translation.
        Enforces strict system instruction grounding to prevent hallucinations.
        """
        system_instruction = (
            "You are a dog behavior translation assistant. Your role is to translate structured dog "
            "classification outputs (pose postures and vocalization labels) into a clear, natural-language explanation for owners.\n\n"
            "CRITICAL RULES:\n"
            "1. ONLY refer to elements explicitly present in the provided JSON input.\n"
            "2. DO NOT make assumptions about the dog's background, past life, thoughts, or complex human emotions.\n"
            "3. Keep the tone professional, objective, and clear.\n"
            "4. If the confidence values are low (e.g. under 0.70) or values are missing/unknown, you MUST state that the observation is uncertain or incomplete.\n"
            "5. Limit the description to exactly 2-3 sentences."
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

        if self.is_mock:
            posture = pose_results.get("posture")
            tail = pose_results.get("tail_wag")
            ears = pose_results.get("ears")
            vocalization = audio_results.get("vocalization")
            arousal = audio_results.get("arousal")
            valence = audio_results.get("valence")
            
            p_conf = pose_results.get("confidence", 1.0)
            a_conf = audio_results.get("confidence", 1.0)

            uncertainty_note = ""
            if p_conf < 0.7 or a_conf < 0.7 or posture == "unknown" or vocalization == "unknown":
                uncertainty_note = " Please note that some behavior signals are weak or unknown, making this translation less certain."

            if posture == "play_bow" or vocalization == "high_bark":
                narrative = f"The dog is displaying a classic play bow posture with a high-pitched bark and fast tail wagging. These signals suggest a state of high arousal and positive valence, indicating an active desire to play and interact.{uncertainty_note}"
            elif posture == "stiff" or vocalization == "growl":
                narrative = f"The dog's posture is stiff and rigid, accompanied by a low-pitched growl and pinned back ears. This combination signals defensive high-arousal and negative valence, suggesting that the dog is feeling threatened or showing signs of warning.{uncertainty_note}"
            elif posture == "cowering" or vocalization == "whine" or vocalization == "whimper":
                narrative = f"The dog is cowering or whimpering with its tail tucked and ears pinned. These physical indicators show negative valence and medium arousal, pointing to anxiety, fear, or vulnerability.{uncertainty_note}"
            else:
                narrative = f"The dog is showing a relaxed posture, neutral ears, and a slow tail wag. These signs reflect low arousal and a positive state, suggesting the dog is comfortable and content in its current environment.{uncertainty_note}"
            
            return narrative

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
            return response.text.strip()
        except Exception as e:
            return f"The dog exhibits {pose_results.get('posture')} posture and a {audio_results.get('vocalization')} sound. (Warning: translation generation failed, falling back to raw data)."
