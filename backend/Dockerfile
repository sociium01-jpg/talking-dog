# Use official slim Python runtime
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY main.py .
COPY app/ ./app/

# Expose FastAPI default port
EXPOSE 8000

# Set environment defaults
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
