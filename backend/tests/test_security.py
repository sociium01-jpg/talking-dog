# ==============================================================================
# test_security.py — Backend Security Middleware Verification Tests
# Validates rate limiting, file upload limits, and secure HTTP response headers.
# ==============================================================================

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_http_security_headers():
    """
    Asserts that secure HTTP headers are set in responses.
    """
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in response.headers

def test_file_upload_size_limit():
    """
    Asserts that uploads exceeding the 50MB limit receive a 413 error status.
    """
    # Create a dummy payload with a simulated large content-length
    headers = {
        "Content-Length": str(60 * 1024 * 1024), # 60 MB
        "Content-Type": "multipart/form-data; boundary=boundary"
    }
    response = client.post("/api/v1/upload", headers=headers, content=b"dummy content")
    assert response.status_code == 413
    assert "exceeds maximum limit" in response.json()["detail"]

def test_rate_limiting_middleware():
    """
    Asserts that rate limiting returns a 429 status when limit is exceeded.
    """
    # Trigger multiple health/predict check hits
    # In test client, endpoints with /predict or /upload are rate-limited
    headers = {"Authorization": "Bearer mock-token-admin"}
    
    # Send multiple predict calls to trip the limit (limit is 60)
    limit_tripped = False
    for _ in range(65):
        response = client.post(
            "/api/v1/predict",
            json={"video_url": "http://mock.url/test.mp4", "audio_url": "http://mock.url/test.wav"},
            headers=headers
        )
        if response.status_code == 429:
            limit_tripped = True
            break
            
    assert limit_tripped
