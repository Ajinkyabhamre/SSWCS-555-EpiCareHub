# Brain API - EEG Visualization Service

FastAPI service for EEG brain visualization and analysis using MNE and ConvDip models.

## Overview

This service provides endpoints for:
- EEG file upload and brain visualization
- Historical data reprocessing
- Human MTL demo dataset analysis
- Development mode placeholder generation

## Endpoints

### `POST /visualize_brain`
Main endpoint for EEG brain visualization. Accepts uploaded EEG files (.fif, .h5, .mat) and runs the ML pipeline.

**Parameters:**
- `file` (UploadFile): EEG data file
- `patientId` (string): Patient identifier
- `uploadId` (string, optional): Upload session ID (auto-generated if not provided)

**Upload Limits:**
- **Maximum file size:** 50MB (default, configurable via `MAX_UPLOAD_MB` env var)
- Files exceeding the limit will return HTTP 413 with details

**Response (Success - 200):**
```json
{
  "message": "Brain visualization complete",
  "data": { /* visualization results */ },
  "request_id": "uuid",
  "timing": {
    "total_seconds": 45.32,
    "pipeline_seconds": 42.15,
    "save_seconds": 0.87
  }
}
```

**Response (File Too Large - 413):**
```json
{
  "error": "File too large",
  "message": "Upload size 120.5MB exceeds maximum allowed size",
  "max_mb": 50,
  "received_bytes": 126353920,
  "received_mb": 120.5,
  "request_id": "uuid",
  "recommendation": "For large files, consider uploading directly to object storage and providing a URL"
}
```

### `GET /health`
Health check endpoint for service monitoring.

**Response (200):**
```json
{
  "status": "ok",
  "service": "Localization-Algorithm",
  "version": "1.0.0",
  "port": 8000
}
```

### `POST /visualize_brain_historic`
Reprocess historical EEG data from a previous upload.

**Parameters:**
- `uploadId` (string): Previously uploaded session ID

### `POST /api/human-mtl-demo`
Run Human MTL demo analysis pipeline with pre-loaded datasets.

**Parameters:**
- `patientId` (string): Patient identifier
- `uploadId` (string): Upload session ID
- `datasetFilePath` (string): Path to dataset file

### `POST /visualize_brain_dev` (Dev Mode Only)
Development endpoint that simulates processing without requiring real .fif files.

Requires `EPICARE_DEV_MODE=true` in environment.

## Large File Uploads

### Current Limitations
- Default maximum upload size: **50MB**
- Can be increased via `MAX_UPLOAD_MB` environment variable
- Very large files (>100MB) may cause timeouts or memory issues

### Recommended Approach for Large Files (Future Enhancement)
For production deployments with large EEG files (>50MB):

1. **Direct Upload to Object Storage:**
   - Upload files directly to cloud storage (S3, Cloudinary, etc.) from frontend
   - Use presigned URLs or direct upload APIs
   - Benefits: No backend memory constraints, faster uploads, resumable uploads

2. **URL-Based Processing (Future API):**
   ```
   POST /visualize_brain_from_url
   {
     "fileUrl": "https://storage.example.com/eeg-files/patient123.fif",
     "patientId": "123",
     "uploadId": "uuid"
   }
   ```
   - Backend downloads file directly from storage
   - Avoids browser upload limits
   - Better for mobile/slow connections

3. **Chunked Upload (Future Enhancement):**
   - Split large files into chunks on frontend
   - Upload chunks sequentially
   - Reassemble on backend

## Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string (validated at startup)

### Optional
- `PORT` - Server port (default: 8000)
- `MAX_UPLOAD_MB` - Maximum file upload size in MB (default: 50)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
  - Example: `https://frontend.vercel.app,https://staging.vercel.app`
- `FRONTEND_ORIGIN` - Legacy: Single frontend origin (default: http://localhost:5173)
- `BACKEND_ORIGIN` - Legacy: Single backend origin (default: http://localhost:3000)
- `LOG_LEVEL` - Logging level: DEBUG, INFO, WARNING, ERROR (default: INFO)
- `UPLOADS_DIR` - Upload directory path (default: /app/uploads)
- `NODE_API_URL` - Node backend URL for callbacks (default: http://localhost:3000)
- `EPICARE_INTERNAL_API_KEY` - API key for Node backend authentication
- `EPICARE_DEV_MODE` - Enable dev mode endpoints (default: false)

### Cloudinary (for result upload)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## CORS Configuration

The API supports CORS for browser-based uploads. Configure allowed origins via environment variables:

**Option 1: Comma-separated list (recommended)**
```bash
ALLOWED_ORIGINS=https://epicarehub.vercel.app,https://staging.epicarehub.vercel.app,http://localhost:5173
```

**Option 2: Legacy individual variables**
```bash
FRONTEND_ORIGIN=https://epicarehub.vercel.app
BACKEND_ORIGIN=https://backend.railway.app
```

All responses (including errors) include proper CORS headers for whitelisted origins.

## Request Tracking

All requests to `/visualize_brain` include a unique `request_id` for debugging:
- Logged in all related log messages as `[REQUEST:uuid]`, `[PIPELINE:uuid]`, etc.
- Returned in all responses (success and error)
- Helps trace issues across logs and database records

## Logging

The service uses structured logging with the following tags:
- `[REQUEST:uuid]` - HTTP request handling
- `[PIPELINE:uuid]` - Brain visualizer subprocess execution
- `[TIMING:uuid]` - Performance metrics
- `[SUCCESS:uuid]` - Successful completions
- `[ERROR:uuid]` - Error conditions
- `[TIMEOUT:uuid]` - Timeout events
- `[EXCEPTION:uuid]` - Uncaught exceptions
- `[ARTIFACT]` - File I/O operations

Set `LOG_LEVEL=DEBUG` for verbose output including stdout/stderr from subprocesses.

## Deployment

### Docker Build
```bash
cd apps/brain-api
docker build -t ghcr.io/your-org/epicarehub-brain-api:latest .
docker push ghcr.io/your-org/epicarehub-brain-api:latest
```

### Railway Deployment
1. Push Docker image to GitHub Container Registry (GHCR)
2. In Railway project settings:
   - Set image source to GHCR: `ghcr.io/your-org/epicarehub-brain-api:latest`
   - Configure environment variables (see above)
   - Set `ALLOWED_ORIGINS` to include your Vercel frontend URL
   - Adjust `MAX_UPLOAD_MB` based on expected file sizes
3. Deploy

### Environment Variable Checklist for Production
- [ ] `ALLOWED_ORIGINS` includes production frontend URL
- [ ] `MAX_UPLOAD_MB` set appropriately (consider Railway memory limits)
- [ ] `LOG_LEVEL=INFO` or `WARNING` (not DEBUG in production)
- [ ] `NODE_API_URL` points to production backend
- [ ] `EPICARE_INTERNAL_API_KEY` configured and matches backend
- [ ] Cloudinary credentials configured
- [ ] `EPICARE_DEV_MODE=false` (disable dev endpoints)

## Performance Considerations

### File Size Impact
- Small files (<10MB): ~5-15 seconds
- Medium files (10-50MB): ~15-45 seconds
- Large files (>50MB): May timeout (180s limit) or exhaust memory

### Timeout Settings
- Brain visualizer subprocess: 180 seconds (3 minutes)
- Human MTL demo: 300 seconds (5 minutes)

### Memory Usage
- Each upload is processed synchronously
- Large files are read entirely into memory
- Consider Railway memory limits when setting `MAX_UPLOAD_MB`

## Development

### Local Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and configure
3. Run: `uvicorn brain_api:app --reload --port 8000`
4. API docs: http://localhost:8000/docs

### Testing CORS
```bash
# Preflight request
curl -X OPTIONS http://localhost:8000/visualize_brain \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return 200 with Access-Control-Allow-Origin header
```

### Testing Upload Limit
```bash
# Create a test file larger than limit
dd if=/dev/zero of=large.bin bs=1M count=60

# Should return 413
curl -X POST http://localhost:8000/visualize_brain \
  -F "file=@large.bin" \
  -F "patientId=test123" \
  -v
```

## Troubleshooting

### "No 'Access-Control-Allow-Origin' header"
- Verify `ALLOWED_ORIGINS` includes the requesting origin
- Check Railway logs for CORS configuration at startup
- Ensure origin includes protocol (https://) and exact domain

### "File too large" (413)
- Increase `MAX_UPLOAD_MB` environment variable
- Consider implementing direct-to-storage upload for very large files
- Check Railway memory limits (upload + processing must fit in memory)

### "Pipeline timeout" (500)
- EEG processing exceeded 180 second limit
- Check file format compatibility
- Review brain_visualizer.py logs in Railway
- Consider optimizing pipeline or increasing timeout

### Missing CORS headers on errors
- FastAPI's CORSMiddleware should add headers to all responses
- Verify middleware is configured before route handlers
- Check that origin is in allowed list
