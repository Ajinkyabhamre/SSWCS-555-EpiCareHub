# Localization-Algorithm Dockerfile - Python/FastAPI with MNE
FROM python:3.11-slim

# Install system dependencies required by MNE, NumPy, and Matplotlib
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgomp1 \
    libxrender1 \
    libxext6 \
    libsm6 \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    KMP_DUPLICATE_LIB_OK=TRUE \
    MPLBACKEND=Agg \
    BASE_PATH=/app/uploads

# Create upload directory
RUN mkdir -p /app/uploads

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health').raise_for_status()"

# Start FastAPI server
CMD ["uvicorn", "brain_api:app", "--host", "0.0.0.0", "--port", "8000"]
