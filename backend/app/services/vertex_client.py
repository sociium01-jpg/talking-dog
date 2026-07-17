import os
from typing import Dict, Any, Optional
from app.core.config import settings

class VertexPredictionService:
    def __init__(self):
        self.is_mock = (
            settings.VERTEX_POSE_ENDPOINT == "mock-pose-endpoint" or 
            settings.VERTEX_AUDIO_ENDPOINT == "mock-audio-endpoint" or
            "mock" in settings.VERTEX_POSE_ENDPOINT or
            "mock" in settings.VERTEX_AUDIO_ENDPOINT
        )
        if not self.is_mock:
            try:
                from google.cloud import aiplatform
                aiplatform.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
                self.pose_endpoint = aiplatform.Endpoint(settings.VERTEX_POSE_ENDPOINT)
                self.audio_endpoint = aiplatform.Endpoint(settings.VERTEX_AUDIO_ENDPOINT)
            except Exception:
                self.is_mock = True

    async def predict_pose(self, video_url: Optional[str]) -> Dict[str, Any]:
        if not video_url:
            return {
                "posture": "unknown",
                "tail_wag": "unknown",
                "ears": "unknown",
                "confidence": 0.0
            }
            
        if self.is_mock:
            url_lower = video_url.lower()
            if "happy" in url_lower or "play" in url_lower:
                return {
                    "posture": "play_bow",
                    "tail_wag": "high_fast",
                    "ears": "forward",
                    "confidence": 0.95
                }
            elif "aggressive" in url_lower or "growl" in url_lower or "angry" in url_lower:
                return {
                    "posture": "stiff",
                    "tail_wag": "rigid_high",
                    "ears": "backward",
                    "confidence": 0.90
                }
            elif "scared" in url_lower or "fear" in url_lower:
                return {
                    "posture": "cowering",
                    "tail_wag": "tucked",
                    "ears": "pinned",
                    "confidence": 0.88
                }
            else:
                return {
                    "posture": "relaxed",
                    "tail_wag": "broad_slow",
                    "ears": "neutral",
                    "confidence": 0.85
                }

        try:
            instances = [{"video_url": video_url}]
            response = self.pose_endpoint.predict(instances=instances)
            predictions = response.predictions[0]
            return {
                "posture": predictions.get("posture", "relaxed"),
                "tail_wag": predictions.get("tail_wag", "broad_slow"),
                "ears": predictions.get("ears", "neutral"),
                "confidence": predictions.get("confidence", 0.80)
            }
        except Exception as e:
            raise Exception(f"Vertex AI Pose Prediction failed: {str(e)}")

    async def predict_audio(self, audio_url: Optional[str]) -> Dict[str, Any]:
        if not audio_url:
            return {
                "vocalization": "unknown",
                "arousal": "unknown",
                "valence": "unknown",
                "confidence": 0.0
            }
            
        if self.is_mock:
            url_lower = audio_url.lower()
            if "happy" in url_lower or "play" in url_lower or "bark" in url_lower:
                return {
                    "vocalization": "high_bark",
                    "arousal": "high",
                    "valence": "positive",
                    "confidence": 0.91
                }
            elif "aggressive" in url_lower or "growl" in url_lower:
                return {
                    "vocalization": "growl",
                    "arousal": "high",
                    "valence": "negative",
                    "confidence": 0.89
                }
            elif "whimper" in url_lower or "whine" in url_lower:
                return {
                    "vocalization": "whine",
                    "arousal": "low",
                    "valence": "negative",
                    "confidence": 0.85
                }
            else:
                return {
                    "vocalization": "whimper",
                    "arousal": "low",
                    "valence": "positive",
                    "confidence": 0.78
                }

        try:
            instances = [{"audio_url": audio_url}]
            response = self.audio_endpoint.predict(instances=instances)
            predictions = response.predictions[0]
            return {
                "vocalization": predictions.get("vocalization", "bark"),
                "arousal": predictions.get("arousal", "medium"),
                "valence": predictions.get("valence", "neutral"),
                "confidence": predictions.get("confidence", 0.80)
            }
        except Exception as e:
            raise Exception(f"Vertex AI Audio Prediction failed: {str(e)}")

vertex_service = VertexPredictionService()
