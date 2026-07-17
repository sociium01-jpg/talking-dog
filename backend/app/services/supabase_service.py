import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

class SupabaseService:
    def __init__(self):
        self.is_mock = (
            not settings.SUPABASE_URL
            or "mock" in settings.SUPABASE_URL
            or settings.SUPABASE_URL == "https://mock.supabase.co"
        )
        if not self.is_mock:
            try:
                self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            except Exception:
                self.is_mock = True
                self.client = None
        else:
            self.client = None
            
        if self.is_mock:
            # Local mock storage for test runtime
            self._mock_predictions = []
            self._mock_profiles = {}
            self._mock_transactions = []

    def get_user_from_token(self, token: str) -> Dict[str, Any]:
        if self.is_mock:
            if token.startswith("mock-token-"):
                user_id = token.replace("mock-token-", "")
            else:
                user_id = "00000000-0000-0000-0000-000000000000"
            return {"id": user_id, "email": f"user_{user_id[:8]}@example.com"}
        try:
            res = self.client.auth.get_user(token)
            if res.user:
                return {"id": res.user.id, "email": res.user.email}
            raise Exception("Invalid token")
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")

    def upload_file(self, bucket_name: str, file_path: str, file_bytes: bytes, content_type: str) -> str:
        if self.is_mock:
            filename = os.path.basename(file_path)
            return f"https://mock.supabase.co/storage/v1/object/public/{bucket_name}/{filename}"
        
        try:
            self.client.storage.from_(bucket_name).upload(
                path=file_path,
                file=file_bytes,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
            public_url = self.client.storage.from_(bucket_name).get_public_url(file_path)
            return public_url
        except Exception as e:
            raise Exception(f"Failed to upload file to Supabase: {str(e)}")

    def create_prediction(self, user_id: str, video_url: Optional[str], audio_url: Optional[str],
                          pose_results: Dict[str, Any], audio_results: Dict[str, Any],
                          fusion_narrative: str, confidence: float) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "video_url": video_url,
            "audio_url": audio_url,
            "pose_results": pose_results,
            "audio_results": audio_results,
            "fusion_narrative": fusion_narrative,
            "confidence": confidence
        }
        if self.is_mock:
            import uuid
            from datetime import datetime
            data["id"] = str(uuid.uuid4())
            data["created_at"] = datetime.utcnow().isoformat()
            self._mock_predictions.append(data)
            return data
        
        try:
            res = self.client.table("predictions").insert(data).execute()
            if res.data:
                return res.data[0]
            raise Exception("No data returned from prediction insert")
        except Exception as e:
            raise Exception(f"Failed to save prediction: {str(e)}")

    def get_user_predictions(self, user_id: str) -> List[Dict[str, Any]]:
        if self.is_mock:
            return [p for p in self._mock_predictions if p["user_id"] == user_id]
        
        try:
            res = self.client.table("predictions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            raise Exception(f"Failed to fetch user predictions: {str(e)}")

    def get_profile(self, user_id: str) -> Dict[str, Any]:
        if self.is_mock:
            return self._mock_profiles.get(user_id, {
                "id": user_id,
                "email": f"user_{user_id[:8]}@example.com",
                "full_name": "Mock User",
                "billing_status": "inactive",
                "subscription_id": None
            })
        
        try:
            res = self.client.table("profiles").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
            return {"id": user_id, "billing_status": "inactive", "subscription_id": None}
        except Exception as e:
            raise Exception(f"Failed to fetch user profile: {str(e)}")

    def update_profile_billing(self, user_id: str, billing_status: str, subscription_id: Optional[str] = None) -> Dict[str, Any]:
        data = {"billing_status": billing_status}
        if subscription_id:
            data["subscription_id"] = subscription_id
            
        if self.is_mock:
            profile = self.get_profile(user_id)
            profile.update(data)
            self._mock_profiles[user_id] = profile
            return profile
        
        try:
            res = self.client.table("profiles").update(data).eq("id", user_id).execute()
            if res.data:
                return res.data[0]
            raise Exception("No data returned from profile update")
        except Exception as e:
            raise Exception(f"Failed to update profile: {str(e)}")

    def create_transaction(self, user_id: str, amount: float, currency: str, status: str,
                           razorpay_order_id: Optional[str] = None, razorpay_payment_id: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "amount": amount,
            "currency": currency,
            "status": status,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id
        }
        if self.is_mock:
            import uuid
            from datetime import datetime
            data["id"] = str(uuid.uuid4())
            data["created_at"] = datetime.utcnow().isoformat()
            self._mock_transactions.append(data)
            return data
            
        try:
            res = self.client.table("transactions").insert(data).execute()
            if res.data:
                return res.data[0]
            raise Exception("No data returned from transaction insert")
        except Exception as e:
            raise Exception(f"Failed to create transaction: {str(e)}")

    def update_transaction_status(self, razorpay_order_id: str, status: str, razorpay_payment_id: Optional[str] = None, razorpay_signature: Optional[str] = None) -> Dict[str, Any]:
        data = {"status": status}
        if razorpay_payment_id:
            data["razorpay_payment_id"] = razorpay_payment_id
        if razorpay_signature:
            data["razorpay_signature"] = razorpay_signature

        if self.is_mock:
            for tx in self._mock_transactions:
                if tx["razorpay_order_id"] == razorpay_order_id:
                    tx.update(data)
                    return tx
            import uuid
            return {
                "id": str(uuid.uuid4()),
                "razorpay_order_id": razorpay_order_id,
                **data
            }
            
        try:
            res = self.client.table("transactions").update(data).eq("razorpay_order_id", razorpay_order_id).execute()
            if res.data:
                return res.data[0]
            # Not found is non-fatal for webhooks (duplicate events are common)
            import uuid
            return {"id": str(uuid.uuid4()), "razorpay_order_id": razorpay_order_id, **data}
        except Exception as e:
            raise Exception(f"Failed to update transaction: {str(e)}")

# Singleton instance
supabase_service = SupabaseService()
