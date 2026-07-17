import pytest
from fastapi.testclient import TestClient
from main import app
from app.services.supabase_service import supabase_service

client = TestClient(app)

# Mock token format accepted by supabase_service mock layer
MOCK_USER_ID = "test-user-guid-12345"
AUTH_HEADERS = {"Authorization": f"Bearer mock-token-{MOCK_USER_ID}"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "version": "0.1.0"}

def test_predict_endpoint_no_auth():
    response = client.post("/api/v1/predict", json={})
    assert response.status_code == 401  # HTTPBearer returns 401 when credentials not supplied

def test_predict_endpoint_empty_payload():
    response = client.post("/api/v1/predict", json={}, headers=AUTH_HEADERS)
    assert response.status_code == 400
    assert "At least one of video_url or audio_url must be provided" in response.json()["detail"]

def test_predict_happy_flow():
    payload = {
        "video_url": "https://example.com/happy_dog.mp4",
        "audio_url": "https://example.com/happy_bark.wav",
        "metadata": {"breed": "Golden Retriever"}
    }
    response = client.post("/api/v1/predict", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "pose_results" in data
    assert "audio_results" in data
    assert "fusion_narrative" in data
    assert data["confidence"] > 0

def test_predict_scared_flow():
    payload = {
        "video_url": "https://example.com/fear_dog.mp4",
        "audio_url": "https://example.com/whine.wav"
    }
    response = client.post("/api/v1/predict", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "pose_results" in data
    assert "audio_results" in data
    assert "fusion_narrative" in data

def test_upload_endpoint():
    file_content = b"fake audio data"
    files = {"file": ("dog_bark.wav", file_content, "audio/wav")}
    response = client.post("/api/v1/upload", files=files, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "uploaded"
    assert "url" in data

def test_history_endpoint():
    # First post a prediction to populate local mock storage
    payload = {
        "video_url": "https://example.com/play_dog.mp4",
        "audio_url": "https://example.com/bark.wav"
    }
    client.post("/api/v1/predict", json=payload, headers=AUTH_HEADERS)

    # Get history
    response = client.get("/api/v1/history", headers=AUTH_HEADERS)
    assert response.status_code == 200
    history = response.json()
    assert len(history) > 0

def test_subscribe_endpoint():
    payload = {"plan_id": "plan_monthly_pro"}
    response = client.post("/api/v1/billing/subscribe", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "subscription_id" in data
    assert "payment_link" in data

def test_billing_webhook_subscription_activated():
    payload = {
        "event": "subscription.activated",
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_test123",
                    "notes": {
                        "user_id": MOCK_USER_ID
                    }
                }
            }
        }
    }
    response = client.post(
        "/api/v1/billing/webhook",
        json=payload,
        headers={"X-Razorpay-Signature": "mock-sig"}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "processed"}

def test_billing_webhook_payment_captured():
    # Pre-seed a matching transaction so the mock lookup succeeds
    supabase_service._mock_transactions.append({
        "id": "tx-seed-001",
        "user_id": MOCK_USER_ID,
        "razorpay_order_id": "order_test123",
        "status": "pending",
        "amount": 499.0,
        "currency": "INR"
    })

    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test123",
                    "order_id": "order_test123"
                }
            }
        }
    }
    response = client.post(
        "/api/v1/billing/webhook",
        json=payload,
        headers={"X-Razorpay-Signature": "mock-sig"}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "processed"}
