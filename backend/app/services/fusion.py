# ==============================================================================
# fusion.py — Gemini Flash Vision Interpretation Engine
# Sends raw video/audio bytes as base64 to Gemini Flash for real-time
# bark-to-human-language translation and body language analysis.
# Falls back to rich template narratives when no API key is configured.
# ==============================================================================

import re
import base64
import json
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

SYSTEM_PROMPT = """You are an expert canine behaviorist and ethologist. You analyze dog body language and vocalizations from video/audio and translate them into plain English for dog owners.

CRITICAL RULES:
1. ONLY describe what you can actually observe in the provided media. Do not invent behaviors.
2. Translate bark/growl/whine sounds into what the dog is communicating in plain human language.
3. Describe body posture, tail position, ear position, and movement patterns from video.
4. Keep the tone warm, practical, and helpful for a pet owner.
5. Do NOT use medical, clinical, or veterinary diagnostic terms.
6. Return ONLY valid JSON — no markdown fences, no extra text.

Return this exact JSON structure:
{
  "mood": "<one of: happy, excited, alert, relaxed, anxious, scared, angry, playful>",
  "posture": "<brief posture description>",
  "tail_wag": "<tail behavior description>",
  "ears": "<ear position>",
  "vocalization": "<bark/growl/whine/pant/silent/other>",
  "arousal": "<high/medium/low>",
  "valence": "<positive/neutral/negative>",
  "confidence": <0.0 to 1.0>,
  "dog_says": "<What the dog is communicating in first person, 1-2 sentences, as if the dog is speaking>",
  "analysis": "<Expert behavioral analysis for the owner, 2-3 sentences. Mention specific observed body language cues.>",
  "tip": "<One practical tip for the owner based on this behavior>"
}"""


class FusionService:
    """
    Sends media (video or audio bytes, base64-encoded) to Gemini Flash Vision
    and returns a structured behavior translation + human-language narrative.
    """

    FALLBACK_PROFILES = {
        "happy": {
            "mood": "happy", "posture": "play_bow", "tail_wag": "high_fast", "ears": "forward",
            "vocalization": "high_bark", "arousal": "high", "valence": "positive", "confidence": 0.85,
            "dog_says": "I am so happy right now! Let's play — throw something, run around, do anything! 🎾",
            "analysis": "Your dog is displaying clear play signals. The play bow posture (front legs down, rear up) is the universal canine invitation to play. A fast, high tail wag and forward ears confirm positive excitement.",
            "tip": "This is a great time for interactive play — fetch, tug-of-war, or a training session your dog will love."
        },
        "excited": {
            "mood": "excited", "posture": "bouncing", "tail_wag": "wagging_fast", "ears": "forward",
            "vocalization": "yip", "arousal": "high", "valence": "positive", "confidence": 0.88,
            "dog_says": "Something amazing is happening! Are we going out? Is that food? I can barely contain myself! 🌟",
            "analysis": "Your dog is in a state of high positive arousal. Bouncy movements, a rapidly wagging tail, and forward ears all signal intense excitement about something in their environment.",
            "tip": "Channel this energy into a positive activity. If this excitement is unwanted (e.g., at the door), wait for a calm moment before rewarding with attention."
        },
        "alert": {
            "mood": "alert", "posture": "alert_stand", "tail_wag": "medium_stiff", "ears": "perked",
            "vocalization": "mid_bark", "arousal": "medium", "valence": "neutral", "confidence": 0.83,
            "dog_says": "Hold on — I heard or saw something. I'm checking it out. Don't worry, I'm on guard. 👀",
            "analysis": "Your dog has detected a stimulus and is in focused alert mode. The upright posture, stiffly held tail, and perked ears indicate they are processing something interesting or unfamiliar.",
            "tip": "Follow your dog's gaze to identify what triggered the alert. Calmly acknowledging it with 'good dog' can help them settle faster."
        },
        "relaxed": {
            "mood": "relaxed", "posture": "loose_sit_or_lie", "tail_wag": "broad_slow", "ears": "neutral",
            "vocalization": "soft_pant", "arousal": "low", "valence": "positive", "confidence": 0.87,
            "dog_says": "I feel completely safe and content right now. Maybe a belly rub? 😌",
            "analysis": "Your dog is displaying all the hallmarks of a relaxed, content dog. The loose body posture, slow tail wag, and neutral ear position indicate low stress and high comfort.",
            "tip": "This is an ideal time for bonding — gentle grooming, calm petting, or just sitting together reinforces a sense of security."
        },
        "anxious": {
            "mood": "anxious", "posture": "lowered", "tail_wag": "low_stiff", "ears": "back",
            "vocalization": "whine", "arousal": "medium", "valence": "negative", "confidence": 0.86,
            "dog_says": "I'm not sure about this situation. Something is making me uncomfortable. Can we leave? 😟",
            "analysis": "Your dog is showing stress signals. A lowered body posture, ears pulled back, and whining are clear indicators of anxiety or discomfort about something in their environment.",
            "tip": "Identify and remove the stressor if possible. Do not force your dog toward what is worrying them — let them approach at their own pace."
        },
        "scared": {
            "mood": "scared", "posture": "cowering", "tail_wag": "tucked", "ears": "pinned",
            "vocalization": "whimper", "arousal": "low", "valence": "negative", "confidence": 0.89,
            "dog_says": "I am really frightened right now. Please make it stop — I just need to feel safe. 🥺",
            "analysis": "Your dog is in a fearful state. Cowering, a tucked tail, and pinned ears are unmistakable fear signals. This dog feels vulnerable and is seeking safety.",
            "tip": "Speak in a calm, soft voice. Give your dog a safe space to retreat to — a crate or quiet corner. Do not force interaction or reassure excessively, as that can reinforce the fear response."
        },
        "angry": {
            "mood": "angry", "posture": "stiff_stand", "tail_wag": "rigid_high", "ears": "forward_stiff",
            "vocalization": "growl", "arousal": "high", "valence": "negative", "confidence": 0.91,
            "dog_says": "Back off. I am warning you. I feel threatened and I am serious. ⚠️",
            "analysis": "Your dog is sending a clear warning. A stiff, rigid body, high tail, forward ears, and growling are escalating warning signals. This is the dog's final communication before they feel they must act.",
            "tip": "Do not punish growling — it is important communication. Create distance between your dog and the trigger immediately. Consult a behavioral professional if this is recurring."
        },
        "playful": {
            "mood": "playful", "posture": "play_bow", "tail_wag": "wagging", "ears": "forward",
            "vocalization": "play_bark", "arousal": "high", "valence": "positive", "confidence": 0.90,
            "dog_says": "Come on, let's wrestle! Chase me! This is the best day ever! 🐾",
            "analysis": "Your dog is in full play mode. Play barks, a play bow, and a wagging tail are universally recognized play invitations. The body language is loose and bouncy, not tense.",
            "tip": "Accept the invitation! Play is essential for your dog's mental and physical health. Keep sessions to 10-15 minutes to avoid over-stimulation."
        }
    }

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.has_key = bool(self.api_key and len(self.api_key) > 10)

    def _build_narrative(self, data: dict) -> str:
        """Convert structured Gemini JSON output into a rich display narrative."""
        dog_says = data.get("dog_says", "")
        analysis = data.get("analysis", "")
        tip = data.get("tip", "")
        return f'"{dog_says}"\n\nBehavior Analysis: {analysis}\n\n💡 Tip: {tip}'

    def _sanitize(self, text: str) -> str:
        """Strip any disallowed clinical/veterinary terms from output."""
        restricted = ["clinical", "veterinary", "rabies", "disease", "diagnosis",
                      "veterinarian", "patholog", "symptom"]
        for term in restricted:
            text = re.sub(re.escape(term), "behavioral", text, flags=re.IGNORECASE)
        return text

    def _get_fallback(self, hint: str = "") -> dict:
        """Return a fallback profile based on a hint keyword."""
        hint = hint.lower()
        for mood in ["happy", "excited", "alert", "relaxed", "anxious", "scared", "angry", "playful"]:
            if mood in hint:
                return self.FALLBACK_PROFILES[mood]
        return self.FALLBACK_PROFILES["relaxed"]

    async def analyze_media(
        self,
        video_bytes: bytes = None,
        audio_bytes: bytes = None,
        video_mime: str = "video/webm",
        audio_mime: str = "audio/webm",
        breed: str = "",
        age: int = None,
        pre_audio_classification: dict = None
    ) -> dict:
        """
        Main entry point. Sends media to Gemini Flash Vision or uses fallback.
        Returns structured dict with mood, posture, vocalization, narrative etc.
        """
        if not self.has_key:
            logger.warning("No GEMINI_API_KEY configured — using rich fallback narratives.")
            fallback = self._get_fallback()
            fallback["fusion_narrative"] = self._build_narrative(fallback)
            return fallback

        # Build Gemini multimodal request parts
        parts = []

        # Dog context metadata
        context = "Analyze this dog's behavior."
        if breed:
            context += f" The dog is a {breed}."
        if age:
            context += f" The dog is {age} years old."
        if pre_audio_classification:
            voc = pre_audio_classification.get("vocalization", "")
            arousal = pre_audio_classification.get("arousal", "")
            context += (f" On-device audio analysis detected: vocalization type='{voc}', "
                        f"arousal='{arousal}'. Use this as supporting evidence only.")

        parts.append({"text": f"{SYSTEM_PROMPT}\n\nContext: {context}"})

        # Attach video if available
        if video_bytes and len(video_bytes) > 100:
            b64_video = base64.b64encode(video_bytes).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": video_mime,
                    "data": b64_video
                }
            })

        # Attach audio if available (and no video, or as supplement)
        if audio_bytes and len(audio_bytes) > 100 and not video_bytes:
            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
            parts.append({
                "inline_data": {
                    "mime_type": audio_mime,
                    "data": b64_audio
                }
            })

        parts.append({"text": "Now analyze the dog behavior shown and return ONLY valid JSON as specified."})

        payload = {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 800,
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{GEMINI_API_URL}?key={self.api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

            if response.status_code != 200:
                logger.error(f"Gemini API error {response.status_code}: {response.text[:500]}")
                fallback = self._get_fallback()
                fallback["fusion_narrative"] = self._build_narrative(fallback)
                return fallback

            resp_json = response.json()
            raw_text = resp_json["candidates"][0]["content"]["parts"][0]["text"]
            # Strip markdown fences if present
            raw_text = re.sub(r"```(?:json)?", "", raw_text).strip()
            data = json.loads(raw_text)

            # Build full narrative from structured fields
            data["fusion_narrative"] = self._sanitize(self._build_narrative(data))
            return data

        except json.JSONDecodeError as e:
            logger.error(f"Gemini returned non-JSON: {e}")
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")

        # Fallback on any exception
        fallback = self._get_fallback()
        fallback["fusion_narrative"] = self._build_narrative(fallback)
        return fallback
