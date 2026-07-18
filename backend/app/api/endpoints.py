# ==============================================================================
# endpoints.py — Talking Dog API Router
# All routes: predict (real Gemini analysis), upload, history, billing, vets.
# ==============================================================================

import uuid
import asyncio
from typing import Optional, Dict, Any
from fastapi import (
    APIRouter, UploadFile, File, HTTPException,
    Depends, Request, Header, status, Form
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.services.supabase_service import supabase_service
from app.services.fusion import FusionService
from app.services.razorpay_service import razorpay_service

router = APIRouter()
security = HTTPBearer()

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class PredictionResponse(BaseModel):
    id: str
    pose_results: Dict[str, Any]
    audio_results: Dict[str, Any]
    fusion_narrative: str
    confidence: float
    mood: Optional[str] = None

class SubscribeRequest(BaseModel):
    plan_id: str

class SubscribeResponse(BaseModel):
    subscription_id: str
    payment_link: str
    order_id: Optional[str] = None

class VetSearchRequest(BaseModel):
    lat: float
    lng: float
    radius: Optional[int] = 5000

# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    try:
        token = credentials.credentials
        # Accept any non-empty token in mock mode (Supabase not configured)
        user = supabase_service.get_user_from_token(token)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )

# ---------------------------------------------------------------------------
# PREDICT — Core endpoint: sends real media bytes to Gemini Flash Vision
# ---------------------------------------------------------------------------
@router.post("/predict")
async def predict_intent(
    video: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    breed: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    audio_classification: Optional[str] = Form(None),  # JSON string from on-device classifier
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Accepts actual video/audio file bytes. Sends them to Gemini Flash Vision
    for real behavior analysis and bark-to-English translation.
    """
    if not video and not audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one video or audio file must be provided."
        )

    try:
        video_bytes = await video.read() if video else None
        audio_bytes = await audio.read() if audio else None
        video_mime = video.content_type if video else "video/webm"
        audio_mime = audio.content_type if audio else "audio/webm"

        # Parse on-device audio classification if provided
        pre_audio = None
        if audio_classification:
            import json
            try:
                pre_audio = json.loads(audio_classification)
            except Exception:
                pass

        # Run Gemini Flash Vision analysis
        fusion_service = FusionService()
        result = await fusion_service.analyze_media(
            video_bytes=video_bytes,
            audio_bytes=audio_bytes,
            video_mime=video_mime,
            audio_mime=audio_mime,
            breed=breed or "",
            age=age,
            pre_audio_classification=pre_audio
        )

        # Build structured response fields from Gemini output
        pose_results = {
            "posture": result.get("posture", "unknown"),
            "tail_wag": result.get("tail_wag", "unknown"),
            "ears": result.get("ears", "unknown"),
            "confidence": result.get("confidence", 0.8)
        }
        audio_results = {
            "vocalization": result.get("vocalization", "unknown"),
            "arousal": result.get("arousal", "medium"),
            "valence": result.get("valence", "neutral"),
            "confidence": result.get("confidence", 0.8)
        }
        narrative = result.get("fusion_narrative", "")
        confidence = result.get("confidence", 0.8)
        mood = result.get("mood", "relaxed")

        # Save to history (best-effort)
        record_id = str(uuid.uuid4())
        try:
            saved = supabase_service.create_prediction(
                user_id=user["id"],
                video_url=None,
                audio_url=None,
                pose_results=pose_results,
                audio_results=audio_results,
                fusion_narrative=narrative,
                confidence=confidence
            )
            record_id = saved.get("id", record_id)
        except Exception:
            pass  # History save is non-critical

        return {
            "id": record_id,
            "pose_results": pose_results,
            "audio_results": audio_results,
            "fusion_narrative": narrative,
            "confidence": confidence,
            "mood": mood
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ---------------------------------------------------------------------------
# UPLOAD — Store file to Supabase (used for history playback)
# ---------------------------------------------------------------------------
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        file_bytes = await file.read()
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "dat"
        file_path = f"{user['id']}/{uuid.uuid4()}.{file_ext}"

        public_url = supabase_service.upload_file(
            bucket_name="uploads",
            file_path=file_path,
            file_bytes=file_bytes,
            content_type=file.content_type
        )
        return {"filename": file.filename, "status": "uploaded", "url": public_url}
    except Exception as e:
        # Non-critical — return local reference
        return {"filename": file.filename, "status": "local", "url": f"local://{file.filename}"}

# ---------------------------------------------------------------------------
# HISTORY
# ---------------------------------------------------------------------------
@router.get("/history")
async def get_history(user: Dict[str, Any] = Depends(get_current_user)):
    try:
        records = supabase_service.get_user_predictions(user["id"])
        return records
    except Exception:
        return []

# ---------------------------------------------------------------------------
# BILLING
# ---------------------------------------------------------------------------
@router.post("/billing/subscribe", response_model=SubscribeResponse)
async def subscribe_user(
    request: SubscribeRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        sub_details = await razorpay_service.create_subscription(
            plan_id=request.plan_id,
            user_id=user["id"]
        )
        supabase_service.create_transaction(
            user_id=user["id"],
            amount=499.00,
            currency="INR",
            status="pending",
            razorpay_order_id=sub_details.get("order_id"),
            razorpay_payment_id=None
        )
        return SubscribeResponse(
            subscription_id=sub_details["subscription_id"],
            payment_link=sub_details["payment_link"],
            order_id=sub_details.get("order_id")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/billing/webhook")
async def billing_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None)
):
    body = await request.body()
    if not razorpay_service.verify_signature(body, x_razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    event_name = event.get("event")
    payload = event.get("payload", {})

    if event_name in ("subscription.activated", "subscription.charged"):
        sub_data = payload.get("subscription", {}).get("entity", {})
        sub_id = sub_data.get("id")
        notes = sub_data.get("notes", {})
        user_id = notes.get("user_id")
        if user_id and sub_id:
            supabase_service.update_profile_billing(user_id, "active", sub_id)

    elif event_name in ("payment.captured", "payment.authorized"):
        payment_data = payload.get("payment", {}).get("entity", {})
        order_id = payment_data.get("order_id")
        payment_id = payment_data.get("id")
        if order_id:
            supabase_service.update_transaction_status(
                razorpay_order_id=order_id,
                status="successful",
                razorpay_payment_id=payment_id,
                razorpay_signature=x_razorpay_signature
            )

    elif event_name in ("subscription.halted", "subscription.cancelled"):
        sub_data = payload.get("subscription", {}).get("entity", {})
        notes = sub_data.get("notes", {})
        user_id = notes.get("user_id")
        if user_id:
            supabase_service.update_profile_billing(user_id, "inactive")

    return {"status": "processed"}

# ---------------------------------------------------------------------------
# VET SEARCH — Real-world location-specific clinic finder via OSM Overpass
# ---------------------------------------------------------------------------
@router.post("/vets/search")
async def search_nearby_vets(
    request: VetSearchRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        from app.services.vet_service import VetLocatorService
        results = await VetLocatorService.find_nearby_vets(request.lat, request.lng, request.radius)
        return results
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
