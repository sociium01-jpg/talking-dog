# Dog Body Language & Bark Intent App

This application analyzes dog body language (pose keypoints) and bark vocalizations (audio) to estimate dog intent/emotions, combining the predictions through a fusion layer narrated by a grounded LLM.

## Repository Structure

- `backend/` - FastAPI backend service, including prediction routing and LLM narration logic.
- `data/` - Dataset download and preprocessing scripts (StanfordExtra, Dog-Pose, AudioSet, EmotionalCanines).
- `frontend/` - React frontend application (scaffold placeholder).

## Features

1. **Pose Detection**: Posture, tail position/wag, ear position from video frames.
2. **Audio Classification**: Bark, growl, whine classification and emotional arousal/valence.
3. **Fusion & Narration**: Strict structured-JSON-grounded LLM translation of dog behavior.
