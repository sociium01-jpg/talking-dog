import time
import uvicorn
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Dog Body Language & Bark Intent API",
    description="Backend service for predicting dog emotions and intents using pose and bark classifiers.",
    version="0.1.0"
)

# 1. CORS Configuration - Production Hardened
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://talking-dog-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 2. Rate Limiting Middleware (60 req/min for critical endpoints)
RATE_LIMITS = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 60

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    if "/api/v1/predict" in request.url.path or "/api/v1/upload" in request.url.path:
        # Prune older requests
        RATE_LIMITS[client_ip] = [t for t in RATE_LIMITS[client_ip] if current_time - t < 60]
        if len(RATE_LIMITS[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Rate limit exceeded (60 requests/minute)."}
            )
        RATE_LIMITS[client_ip].append(current_time)
        
    return await call_next(request)

# 3. File Size Limit Middleware (50 MB Max limit to prevent DoS)
MAX_FILE_SIZE = 50 * 1024 * 1024

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    if request.url.path == "/api/v1/upload" and request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length:
            if int(content_length) > MAX_FILE_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "File size exceeds maximum limit of 50MB."}
                )
    return await call_next(request)

# 4. HTTP Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' data: https:;"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.1.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
