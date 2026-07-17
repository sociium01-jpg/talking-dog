import uuid
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.services.supabase_service import supabase_service
from app.services.vertex_client import vertex_service
from app.services.fusion import FusionService
from app.services.razorpay_service import razorpay_service

router = APIRouter()
security = HTTPBearer()

# Pydantic Schemas
class PredictionRequest(BaseModel):
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PredictionResponse(BaseModel):
    id: str
    pose_results: Dict[str, Any]
    audio_results: Dict[str, Any]
    fusion_narrative: str
    confidence: float

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

# Dependency to fetch authenticated user via JWT
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    try:
        token = credentials.credentials
        user = supabase_service.get_user_from_token(token)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )

@router.post("/predict", response_model=PredictionResponse)
async def predict_intent(request: PredictionRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """
    Submits video/audio URLs, retrieves body language/bark classifications from Vertex AI,
    runs the grounded LLM narration fusion layer, and saves details to user history.
    """
    if not request.video_url and not request.audio_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of video_url or audio_url must be provided."
        )

    try:
        # 1. Execute classification model calls asynchronously
        pose_task = vertex_service.predict_pose(request.video_url)
        audio_task = vertex_service.predict_audio(request.audio_url)
        
        pose_res, audio_res = await asyncio.gather(pose_task, audio_task)

        # 2. Run LLM translation fusion layer
        fusion_service = FusionService()
        narrative = await fusion_service.generate_narrative(pose_res, audio_res)

        # 3. Calculate combined confidence score
        conf_scores = []
        if request.video_url and pose_res.get("confidence", 0) > 0:
            conf_scores.append(pose_res["confidence"])
        if request.audio_url and audio_res.get("confidence", 0) > 0:
            conf_scores.append(audio_res["confidence"])
        
        avg_confidence = sum(conf_scores) / len(conf_scores) if conf_scores else 0.5

        # 4. Save prediction record to database history
        saved_record = supabase_service.create_prediction(
            user_id=user["id"],
            video_url=request.video_url,
            audio_url=request.audio_url,
            pose_results=pose_res,
            audio_results=audio_res,
            fusion_narrative=narrative,
            confidence=avg_confidence
        )

        return PredictionResponse(
            id=saved_record["id"],
            pose_results=pose_res,
            audio_results=audio_res,
            fusion_narrative=narrative,
            confidence=avg_confidence
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: Dict[str, Any] = Depends(get_current_user)):
    """
    Uploads a video or audio file to Supabase Storage.
    """
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/history")
async def get_history(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches the prediction history for the authenticated user.
    """
    try:
        records = supabase_service.get_user_predictions(user["id"])
        return records
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/billing/subscribe", response_model=SubscribeResponse)
async def subscribe_user(request: SubscribeRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """
    Creates a Razorpay subscription/checkout link and saves a pending transaction.
    """
    try:
        sub_details = await razorpay_service.create_subscription(
            plan_id=request.plan_id,
            user_id=user["id"]
        )
        # Record pending transaction in Supabase
        # Mock transaction amount based on standard subscription rates (e.g. 499.00 INR)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/billing/webhook")
async def billing_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    """
    Consumes Razorpay webhooks to verify signatures and update user billing status / transactions.
    """
    body = await request.body()
    if not razorpay_service.verify_signature(body, x_razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature"
        )
        
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

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
        sub_id = sub_data.get("id")
        notes = sub_data.get("notes", {})
        user_id = notes.get("user_id")
        if user_id:
            supabase_service.update_profile_billing(user_id, "inactive")

    return {"status": "processed"}

@router.post("/vets/search")
async def search_nearby_vets(request: VetSearchRequest, user: Dict[str, Any] = Depends(get_current_user)):
    """
    Search real-world veterinary clinics nearby the user's lat/lng coordinates globally.
    """
    try:
        from app.services.vet_service import VetLocatorService
        results = await VetLocatorService.find_nearby_vets(request.lat, request.lng, request.radius)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

