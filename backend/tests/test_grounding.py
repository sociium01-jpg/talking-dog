# ==============================================================================
# test_grounding.py — Grounded Narrator LLM Constraint Tests
# Verifies that translation layers strictly adhere to model outputs without hallucinations.
# ==============================================================================

import pytest
from app.services.fusion import FusionService

@pytest.mark.anyio
async def test_narrator_grounding_constraints():
    fusion_service = FusionService()
    
    # 1. Happy/Playful Flow Payload
    pose_happy = {"posture": "play_bow", "tail_wag": "high_fast", "ears": "forward", "confidence": 0.95}
    audio_happy = {"vocalization": "high_bark", "arousal": "high", "valence": "positive", "confidence": 0.93}
    
    narrative_happy = await fusion_service.generate_narrative(pose_happy, audio_happy)
    
    # Assert direct human quote translation matches valence
    assert "happy" in narrative_happy.lower() or "play" in narrative_happy.lower()
    # Assert no clinical diagnosis is injected
    assert "clinical" not in narrative_happy.lower()
    assert "veterinary" not in narrative_happy.lower()

@pytest.mark.anyio
async def test_narrator_grounding_angry_flow():
    fusion_service = FusionService()
    
    # 2. Defensive/Warning Flow Payload
    pose_angry = {"posture": "stiff", "tail_wag": "rigid_high", "ears": "backward", "confidence": 0.90}
    audio_angry = {"vocalization": "growl", "arousal": "high", "valence": "negative", "confidence": 0.89}
    
    narrative_angry = await fusion_service.generate_narrative(pose_angry, audio_angry)
    
    # Assert warning quote maps valence
    assert "threatened" in narrative_angry.lower() or "back off" in narrative_angry.lower()
    # Ensure it reports warning and doesn't hallucinate veterinary terms
    assert "rabies" not in narrative_angry.lower()
    assert "disease" not in narrative_angry.lower()

@pytest.mark.anyio
async def test_narrator_grounding_low_confidence_uncertainty():
    fusion_service = FusionService()
    
    # 3. Low Confidence / Unknown Parameter Payload
    pose_uncertain = {"posture": "unknown", "tail_wag": "unknown", "ears": "unknown", "confidence": 0.40}
    audio_uncertain = {"vocalization": "unknown", "arousal": "unknown", "valence": "unknown", "confidence": 0.35}
    
    narrative_uncertain = await fusion_service.generate_narrative(pose_uncertain, audio_uncertain)
    
    # Assert it mentions uncertainty/less certain due to weak signals
    assert "less certain" in narrative_uncertain.lower() or "weak" in narrative_uncertain.lower()
