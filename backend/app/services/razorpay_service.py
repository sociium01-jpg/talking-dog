import httpx
import hmac
import hashlib
from app.core.config import settings

class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.is_mock = "mock" in self.key_id or self.key_id == "mock-rzp-key"

    async def create_subscription(self, plan_id: str, user_id: str) -> dict:
        """
        Creates a subscription on Razorpay or generates a mock response.
        """
        if self.is_mock:
            import uuid
            sub_id = f"sub_{uuid.uuid4().hex[:10]}"
            order_id = f"order_{uuid.uuid4().hex[:10]}"
            return {
                "subscription_id": sub_id,
                "payment_link": f"https://rzp.io/i/{sub_id}",
                "order_id": order_id
            }
        
        url = "https://api.razorpay.com/v1/subscriptions"
        auth = (self.key_id, self.key_secret)
        payload = {
            "plan_id": plan_id,
            "customer_notify": 1,
            "total_count": 12,
            "notes": {
                "user_id": user_id
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, auth=auth)
            if response.status_code not in (200, 201):
                raise Exception(f"Razorpay subscription creation failed: {response.text}")
            res_data = response.json()
            return {
                "subscription_id": res_data.get("id"),
                "payment_link": res_data.get("short_url"),
                "order_id": res_data.get("order_id")
            }

    def verify_signature(self, body: bytes, signature: str) -> bool:
        """
        Verifies the webhook signature sent by Razorpay.
        """
        if self.is_mock:
            return True
            
        if not signature or not self.webhook_secret:
            return False
            
        expected = hmac.new(
            self.webhook_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

razorpay_service = RazorpayService()
