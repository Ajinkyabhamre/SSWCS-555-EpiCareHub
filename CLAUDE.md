# EpiCareHub - Claude Code Context File

**Last Updated:** 2026-01-02
**Purpose:** Comprehensive project context for Claude Code sessions to minimize token usage

---

## Project Overview

**EpiCareHub** is a full-stack medical platform for epilepsy seizure localization using 3D brain visualization and AI-powered analysis of intracranial EEG (iEEG) data.

**Tech Stack:**
- Frontend: React 18 + Vite 5 + Tailwind CSS
- Backend: Node.js 20 + Express 4.18.3 + MongoDB
- ML API: Python 3.11 + FastAPI + MNE-Python (neuroimaging)

**Deployment Target:**
- Frontend → Vercel (static)
- Backend → Render/Railway (Docker)
- ML API → Render/Railway (Docker with persistent storage)

---

## Repository Structure

```
SSWCS-555-EpiCareHub/
├── Backend/                   # Node.js Express API (86MB)
│   ├── Dockerfile             # Production-ready
│   ├── .dockerignore          # Excludes tests, docs, .env
│   ├── server.js              # Entry point (PORT=3000)
│   ├── app.js                 # Express config + middleware
│   ├── routes/                # API endpoints
│   │   ├── index.js           # Route aggregator
│   │   ├── user.js            # Auth endpoints
│   │   ├── patients.js        # Patient CRUD + upload callback
│   │   ├── studies.js         # EEG study management
│   │   └── ml.js              # ML service health checks
│   ├── data/                  # MongoDB data access layer
│   ├── config/                # DB connection (mongoConnection.js)
│   └── middleware/            # internalApiKey.js (ML callback auth)
│
├── Frontend/                  # React + Vite (857MB, 59MB dist)
│   ├── Dockerfile             # Multi-stage: build → nginx
│   ├── nginx.conf             # Reverse proxy config
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Brain.jsx                  # 3D viewer (WebGL)
│   │   │   ├── BrainStudyViewer.jsx       # Study-specific brain view
│   │   │   ├── PatientDetails.jsx         # Patient detail page
│   │   │   ├── Dashboard.jsx              # Main dashboard
│   │   │   └── EpiCareHubLogin.jsx        # Auth page
│   │   ├── routes/            # RequireAuth.jsx, PublicOnly.jsx
│   │   ├── utils/api.js       # Axios instance (baseURL from env)
│   │   └── store.js           # Redux store
│   └── vite.config.js         # Build config
│
├── Localization-Algorithm/    # Python ML pipeline (2.7GB - BLOAT!)
│   ├── Dockerfile             # Python 3.11-slim + MNE deps
│   ├── .dockerignore          # Excludes uploads/, datasets/
│   ├── brain_api.py           # FastAPI entry (PORT=8000)
│   ├── brain_visualizer.py    # Core ML pipeline
│   ├── helper.py              # Analysis functions
│   ├── requirements.txt       # FastAPI, MNE, NumPy, Cloudinary
│   ├── environment.yml        # Conda spec (alternative)
│   ├── config.json            # Path config (mac_path, windows_path)
│   ├── data/                  # ~20MB dataset files
│   └── uploads/               # 🔴 2.5GB test data (DELETE BEFORE DEPLOY)
│
├── docker-compose.yml         # Full orchestration (3 services)
├── docker-compose.prod.yml    # Production variant
├── .env.example               # Unified env template
└── claude.md                  # This file (context for future sessions)
```

---

## Service Details

### Frontend (Port 5173 → 80 in prod)

**Entry:** `Frontend/src/main.jsx` → React app
**Build:** `npm run build` → outputs to `Frontend/dist/`
**Prod Server:** Nginx (serves static files, proxies `/api` and `/brain`)

**Environment Variables (Build-time):**
```bash
VITE_API_BASE_URL=          # Backend URL (e.g., https://api.epicarehub.com)
VITE_PYTHON_API_URL=        # ML API URL (e.g., https://ml.epicarehub.com)
VITE_EPICARE_DEV_MODE=      # Dev mode flag (true/false)
VITE_ENABLE_WEBGL_BRAIN=    # WebGL viewer toggle
```

**Key Components:**
- `Brain.jsx` - 3D brain visualization (WebGL/Three.js)
- `BrainStudyViewer.jsx` - Displays ML analysis results (hotspots, brain views)
- `PatientDetails.jsx` - Patient info + study list
- `Dashboard.jsx` - Main patient list

**API Client:** `src/utils/api.js` - Axios instance with `baseURL` from `VITE_API_BASE_URL`

---

### Backend (Port 3000)

**Entry:** `Backend/server.js` → imports `app.js`
**Start:** `node server.js` (production) or `npm run dev` (development)

**Environment Variables (Runtime):**
```bash
# Database (REQUIRED)
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=epicarehub

# Security (REQUIRED)
SESSION_SECRET=<32-char-random>
ADMIN_REGISTRATION_SECRET=<secret-for-admin-reg>
EPICARE_INTERNAL_API_KEY=<shared-with-ml-api>

# Service URLs
PYTHON_API_URL=http://localhost:8000   # ML API
NODE_API_URL=http://localhost:3000      # Self-reference
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173       # 🔴 NOT USED - hardcoded to "*"
```

**Critical Endpoints:**
- `GET /health` - Health check (🔴 MISSING - needs to be added)
- `GET /ml/health` - ML service proxy health check
- `POST /patients/upload` - ML callback endpoint (receives brain images)
- `GET /patients/:id` - Patient details
- `GET /patients/:id/studies` - Patient EEG studies

**Database:** MongoDB via `config/mongoConnection.js`
**Auth:** Express sessions + bcrypt

**🔴 Known Issues:**
1. CORS set to `*` (line 44 of `app.js`) - should use `CORS_ORIGIN` env var
2. No upload size limits on `fileUpload()` middleware
3. No `/health` endpoint for Render/Railway health checks

---

### ML API (Port 8000)

**Entry:** `Localization-Algorithm/brain_api.py` (FastAPI app)
**Start:** `uvicorn brain_api:app --host 0.0.0.0 --port 8000`

**Environment Variables (Runtime):**
```bash
# Cloudinary (REQUIRED for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Callback to Backend
NODE_API_URL=http://localhost:3000
EPICARE_INTERNAL_API_KEY=<match-backend-key>

# Optional
LOG_LEVEL=WARNING
HOST=0.0.0.0
```

**Endpoints:**
- `GET /health` - Health check (returns service status)
- `POST /visualize_brain` - Main ML pipeline (accepts .fif/.h5 file upload)
- `POST /visualize_brain_dev` - Dev mode (placeholder data, no ML)
- `POST /api/human-mtl-demo` - Demo dataset processing

**ML Pipeline Flow:**
1. Receive EEG file upload (`.fif`, `.h5`, `.mat`)
2. Load with MNE-Python → RawArray
3. Preprocess (high-pass filter)
4. Compute electrode activity
5. Detect hotspots (top N channels)
6. Generate 4-view brain images (Matplotlib)
7. Upload images to Cloudinary
8. POST results to Backend `/patients/upload` (with API key)

**Dependencies:**
- MNE 1.6.1 (neuroimaging toolkit)
- FastAPI 0.109 + Uvicorn
- NumPy, SciPy, Matplotlib, h5py
- Cloudinary SDK

**CORS:** Configured with `FRONTEND_ORIGIN` and `BACKEND_ORIGIN` from env

---

## Docker Setup

**Orchestration:** `docker-compose.yml` defines 3 services

### Service: frontend
- **Image:** Custom (multi-stage build)
- **Port:** 5173:80
- **Build Args:** `VITE_*` env vars
- **Nginx Config:** Proxies `/api` → `backend:3000`, `/brain` → `brain-api:8000`

### Service: backend
- **Image:** node:20-alpine
- **Port:** 3000:3000
- **Depends On:** brain-api
- **Health Check:** `node -e "require('http').get('http://localhost:3000/health', ...)"` (🔴 endpoint missing)

### Service: brain-api
- **Image:** python:3.11-slim
- **Port:** 8000:8000
- **Volume:** `brain-uploads:/app/uploads`
- **Health Check:** `requests.get('http://localhost:8000/health')`

**Network:** `epicarehub-network` (bridge driver)

**Start All Services:**
```bash
docker compose up -d
```

---

## Critical Issues & Fixes

### 🔴 CRITICAL (Must Fix Before Deploy)

**1. CORS Vulnerability (Backend/app.js:44)**
```javascript
// Current (INSECURE):
app.use(cors({ origin: "*" }));

// Fix:
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:5173"],
  credentials: true
}));
```

**2. No Upload Size Limits (Backend/app.js:42)**
```javascript
// Current (NO LIMIT):
app.use(fileUpload());

// Fix:
app.use(fileUpload({
  limits: { fileSize: 500 * 1024 * 1024 },  // 500MB
  abortOnLimit: true
}));
```

**3. 2.5GB Test Data in Localization-Algorithm/uploads/**
- Causes OOM on free-tier services
- Slows Docker builds
- **Fix:** `rm -rf Localization-Algorithm/uploads/*` before deployment

**4. Missing /health Endpoint in Backend**
- Render/Railway require health checks
- **Fix:** Add to `Backend/routes/index.js`:
```javascript
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "epicarehub-backend" });
});
```

### 🟡 MEDIUM (Should Fix)

**5. Frontend/dist (59MB build artifacts)**
- Should be deleted from working directory
- **Fix:** `rm -rf Frontend/dist` (already in .gitignore)

**6. 30 Markdown Files in Root**
- Documentation bloat (MONGODB_DEBUG_SUMMARY.md, PHASE_1_SUMMARY.md, etc.)
- **Fix:** Move to `docs/legacy-summaries/`

### 🟢 LOW (Nice to Have)

**7. README Too Long (878 lines)**
- Should be ~200 lines for quick onboarding
- Move Docker/EC2 guides to separate docs

---

## Environment Variables Reference

### Complete .env Template (Root Level)

```bash
# =============================================================================
# FRONTEND (Vite Build-Time)
# =============================================================================
VITE_API_BASE_URL=https://api.epicarehub.com
VITE_PYTHON_API_URL=https://ml.epicarehub.com
VITE_EPICARE_DEV_MODE=false
VITE_ENABLE_WEBGL_BRAIN=true

# =============================================================================
# BACKEND (Node Runtime)
# =============================================================================
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/epicarehub
MONGODB_DB_NAME=epicarehub
SESSION_SECRET=<generate-with-openssl-rand-hex-32>
ADMIN_REGISTRATION_SECRET=<admin-secret>
EPICARE_INTERNAL_API_KEY=<generate-with-openssl-rand-hex-16>
PYTHON_API_URL=https://ml.epicarehub.com
NODE_API_URL=https://api.epicarehub.com
PORT=3000
NODE_ENV=production
EPICARE_DEV_MODE=false
CORS_ORIGIN=https://epicarehub.vercel.app

# =============================================================================
# PYTHON ML API (FastAPI Runtime)
# =============================================================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijk123456
NODE_API_URL=https://api.epicarehub.com
EPICARE_INTERNAL_API_KEY=<must-match-backend>
HOST=0.0.0.0
LOG_LEVEL=WARNING
```

---

## Deployment Architecture (Target)

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (Frontend)                                          │
│  - React static build                                       │
│  - Auto HTTPS + global CDN                                  │
│  - Free tier: 100GB bandwidth/month                         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS API calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RENDER/RAILWAY (Backend API)                               │
│  - Node.js Express (Docker)                                 │
│  - Health check: /health (🔴 TODO)                          │
│  - Env: MONGODB_URI, SESSION_SECRET, etc.                   │
└────────────────┬────────────────────────────────────────────┘
                 │ Internal callback
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RENDER/RAILWAY (ML API)                                    │
│  - Python FastAPI + MNE (Docker)                            │
│  - Persistent Disk: /app/uploads (1-5GB)                    │
│  - Min 2GB RAM (MNE memory-intensive)                       │
└─────────────────────────────────────────────────────────────┘

External Services (Cloud):
- MongoDB Atlas (Free M0: 512MB)
- Cloudinary (Free: 25GB storage/bandwidth)
- Optional: Cloudflare R2 (direct upload for large files)
```

**Cost Estimate:**
- Vercel: $0 (hobby)
- Backend: $0-7 (Render free or Railway hobby)
- ML API: $7-21 (needs 2GB RAM)
- MongoDB + Cloudinary: $0 (free tiers)
- **Total: $7-28/month**

---

## Upload Flow (413 Risk)

**Current Flow (PROBLEMATIC):**
```
Frontend → Backend (fileUpload) → ML API (save to disk)
           ↑ 413 ERROR if file > 100MB (Render/Railway limit)
```

**Issue:** Large EEG files (.fif) range from 123MB to 391MB → will fail on free tiers.

**Recommended Flow (Direct to Object Storage):**
```
Frontend → Backend (/generate-upload-url) → Presigned URL
         ↓ Upload directly to R2/Supabase
         ↓ Trigger ML processing
Backend → ML API (with R2 URL, not file upload)
ML API → Fetch from R2 → Process → Upload images to Cloudinary
```

**Benefits:**
- No 413 errors
- Cheaper bandwidth
- Faster uploads

---

## Common Tasks

### Start All Services Locally (Docker)
```bash
docker compose up -d
docker compose logs -f  # Watch logs
```

### Start Services Manually (Development)
```bash
# Terminal 1: Backend
cd Backend
npm install
npm start

# Terminal 2: Frontend
cd Frontend
npm install
npm run dev

# Terminal 3: ML API (requires conda)
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload
```

### Run Tests
```bash
# Backend
cd Backend && npm test

# Frontend
cd Frontend && npm test
```

### Clean Large Files Before Deploy
```bash
rm -rf Localization-Algorithm/uploads/*
rm -rf Frontend/dist
docker system prune -a  # Clean Docker cache
```

### Generate Secrets
```bash
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 16  # EPICARE_INTERNAL_API_KEY
```

---

## Git Workflow

**Main Branch:** `main`

**Recent Commits (as of 2026-01-02):**
- `8181127e` - edit:nginx
- `83930e98` - changed-nginx
- `9387790a` - Refactor nginx configuration
- `06363f2b` - enhance brain_api.py logging
- `27f1aab7` - Unify env config (root .env)

**Git Status:** Clean (no uncommitted changes)

---

## Known Dataset Files

**Location:** `Localization-Algorithm/data/`
- `eeg_maptable.mat` - EEG channel mapping
- `meg-fwd.fif` (20MB) - MEG forward solution
- `real_data/evoked_eeg_*.mat` - Sample evoked responses

**Human MTL Dataset (external):**
- Download from: https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM
- File: `Data_Subject_01_Session_01.h5` (391MB)
- Contains: iEEG recordings + MNI electrode coordinates

---

## Troubleshooting

### Issue: Backend can't connect to MongoDB
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas network access (allow your IP or 0.0.0.0/0)
- Test connection: `mongosh "mongodb+srv://..."`

### Issue: ML API fails with "No module named 'mne'"
```bash
conda activate brain
conda install -c conda-forge mne
```

### Issue: CORS errors in browser console
- Check `CORS_ORIGIN` in Backend `.env`
- Verify Frontend is calling correct `VITE_API_BASE_URL`
- Fix `app.js:44` to use env var instead of `*`

### Issue: Images don't load in Brain view
- Check Cloudinary credentials in ML API `.env`
- Verify Cloudinary URLs in MongoDB study records
- Check browser console for CORS errors

### Issue: 413 Request Entity Too Large
- Increase Backend upload limits (see "Critical Issues" section)
- Or implement direct-to-R2 upload flow

---

## File Upload Limits by Platform

| Platform | Default Limit | Max Configurable |
|----------|--------------|------------------|
| Express (body-parser) | 100KB | Unlimited |
| Express (fileUpload) | Unlimited | Config via `limits.fileSize` |
| Render Free | 100MB | 100MB (hard limit) |
| Railway | 100MB | 500MB (paid) |
| Vercel | N/A (static only) | N/A |
| Cloudflare R2 | 5GB | 5GB (per object) |

---

## Security Notes

**Secrets Management:**
- ✅ `.pem`, `.key`, `.env` files in `.gitignore`
- ✅ No secrets committed to git (verified 2026-01-02)
- ⚠️ `epicare-aws-newkey.pem` exists in root but NOT tracked

**Session Security:**
- Backend uses `express-session` with `SESSION_SECRET`
- 🔴 CORS set to `*` (fix required)

**API Authentication:**
- ML → Backend callbacks use `EPICARE_INTERNAL_API_KEY` header (`x-epicare-key`)
- Middleware: `Backend/middleware/internalApiKey.js`

---

## Testing

**Backend Tests:** `Backend/routes/__test__/`
- `index.test.js` - Route tests
- `userDetails.test.js` - User data tests

**Frontend Tests:** `Frontend/src/__tests__/`
- `EpiCareHubLogin.test.js` - Login component
- `Home.test.js` - Home page

**Test Runner:** Jest (configured in package.json)

---

## CI/CD

**GitHub Actions:** `.github/workflows/ci.yml`
- Runs on push/PR
- Badge: ![CI](https://github.com/.../badge.svg)

---

## Brain Visualization Tech

**3D Rendering:**
- Library: Three.js via `@react-three/fiber` + `@react-three/drei`
- Model Format: `.obj` (Wavefront), `.gltf` (glTF)
- Brain Models: `Frontend/public/models/brain_lh.obj`, `brain_rh.obj`

**ML-Generated Views:**
- 4-view brain snapshots (left lateral, right lateral, superior, anterior)
- Generated by `brain_visualizer.py` using Matplotlib + MNE
- Uploaded to Cloudinary, URLs stored in MongoDB

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `Backend/app.js` | Express config (CORS, middleware) |
| `Backend/server.js` | Entry point (starts Express) |
| `Backend/routes/patients.js` | Patient CRUD + ML callback endpoint |
| `Frontend/src/utils/api.js` | Axios API client |
| `Frontend/src/components/Brain.jsx` | 3D brain viewer (WebGL) |
| `Localization-Algorithm/brain_api.py` | FastAPI entry (ML service) |
| `Localization-Algorithm/brain_visualizer.py` | Core ML pipeline |
| `docker-compose.yml` | Full orchestration (3 services) |
| `.env.example` | Environment variable template |
| `claude.md` | This file (project context) |

---

## Next Steps for Deployment

1. **Pre-Deployment Cleanup**
   - Delete `Localization-Algorithm/uploads/*` (2.5GB)
   - Delete `Frontend/dist/`
   - Move 30 MD files to `docs/legacy-summaries/`

2. **Code Fixes**
   - Fix CORS in `Backend/app.js:44`
   - Add upload limits to `fileUpload()` middleware
   - Add `/health` endpoint to Backend

3. **Deployment Config**
   - Create `.env.vercel.example`, `.env.render.example`, `.env.ml.example`
   - Set up MongoDB Atlas cluster
   - Get Cloudinary credentials

4. **Deploy**
   - Frontend → Vercel (connect GitHub, set build dir to `Frontend/`)
   - Backend → Render/Railway (Docker, add env vars, set health check)
   - ML API → Render/Railway (Docker, persistent disk, 2GB RAM min)

5. **Post-Deploy**
   - Test end-to-end flow
   - Monitor error rates
   - Implement direct-to-R2 upload if 413 errors occur

---

**End of Context File**
