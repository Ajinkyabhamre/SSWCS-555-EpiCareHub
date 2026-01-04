# EpiCareHub Repository Restructure Plan - REVISED

**Branch:** `chore/repo-cleanup-deploy`
**Mission:** Transform repo into lightweight, production-ready monorepo structure
**Status:** REVISED PLAN - BLOCKERS ADDRESSED

---

## BLOCKERS ADDRESSED

1. ✅ **`.dockerignore` kept** - Moved to `apps/*/`, not deleted (root `.gitignore` doesn't replace them)
2. ✅ **Vite env fixed** - Added `envDir: '../../'` in `vite.config.js` to read root `.env`
3. ✅ **Docker-first env strategy** - Rely on `env_file: ./.env`, minimal dotenv path changes
4. ✅ **Accurate git size** - 132.58 MiB tracked (not 920MB disk size)
5. ✅ **Brain assets required** - `brain_lh.obj`, `brain_rh.obj` used by WebGL viewer, need CDN refactor
6. ✅ **No `.env.example`** - Deleted, env vars documented in README table only
7. ✅ **Single README** - All docs merged, all other `.md` deleted

---

## EXECUTIVE SUMMARY

**Current State (Git Tracked):** 132.58 MiB with scattered configs, 4 .gitignore files, 3 .dockerignore files, multiple .env files, 60+ markdown files, and 70MB of brain model files.

**Target State:** Clean monorepo with single root config, consolidated documentation, CDN-hosted assets, flexible deployment options.

**Key Wins:**
- **Single source of truth**: ONE .gitignore, ONE .env, ONE README.md (no .env.example)
- **Clean monorepo**: `apps/frontend`, `apps/backend`, `apps/brain-api` with per-app .dockerignore preserved
- **Zero pipeline breakage**: `/visualize_brain` works, docker compose up -d unchanged behavior
- **CDN-hosted assets**: 70MB brain models on CDN, code refactored to load via env var
- **Preserved deployment**: Vercel/Render OR VPS Docker both supported

**Critical Actions:**
1. Move services to `apps/*`, keep `.dockerignore` files
2. Consolidate .gitignore (4→1), .env (3→1), .md files (60→1)
3. Add `envDir: '../../'` to `apps/frontend/vite.config.js`
4. Refactor WebGL viewer to load models from `VITE_BRAIN_MODELS_BASE_URL`
5. Remove 70MB brain models from git, host on CDN
6. Update docker-compose.yml (build contexts, env_file)

---

## PHASE A: DISCOVERY FINDINGS (CORRECTED)

### A1. Git Repository Size (Accurate)

```bash
$ git count-objects -vH
count: 127
size: 628.00 KiB
in-pack: 20016
packs: 2
size-pack: 132.58 MiB  ← ACTUAL GIT SIZE
```

**Disk size vs Git size:**
- Disk: ~920MB (includes node_modules/, uploads/, .cache/)
- Git tracked: 132.58 MiB
- Largest files: 70MB brain models (obj/gltf files)

---

### A2. Largest Tracked Files (Git ls-files)

| Size | File | Usage | Action |
|------|------|-------|--------|
| 35M | Frontend/public/obj/brain1.gltf | Unused? | DELETE |
| 10M | Frontend/public/models/brain_rh.obj | **USED** by WebGL | CDN + refactor |
| 10M | Frontend/public/models/brain_lh.obj | **USED** by WebGL | CDN + refactor |
| 9.0M | Frontend/public/obj/brain.gltf | Unused? | DELETE |
| 6.5M | Frontend/public/obj/brain.Obj | Unused? | DELETE |
| 2.3M | Frontend/public/obj/blender/Brain2.bin | Unused | DELETE |
| 504K | Frontend/public/obj/blender/Brain-1.png | Unused | DELETE |

**Code Evidence:**
```javascript
// Frontend/src/components/BrainWebGLViewer.jsx:116-117
const lh = useLoader(OBJLoader, "/models/brain_lh.obj");
const rh = useLoader(OBJLoader, "/models/brain_rh.obj");
```

**Conclusion:** Only `brain_lh.obj` and `brain_rh.obj` are required. All other files can be deleted.

---

### A3. `.dockerignore` Files (MUST KEEP)

| File | Purpose | Action |
|------|---------|--------|
| Backend/.dockerignore | Excludes tests, docs, .env from Docker build context | **MOVE** to apps/backend/.dockerignore |
| Frontend/.dockerignore | Excludes node_modules, dist, coverage | **MOVE** to apps/frontend/.dockerignore |
| Localization-Algorithm/.dockerignore | Excludes uploads/, datasets/, model weights | **MOVE** to apps/brain-api/.dockerignore |

**Why keep them?**
- `.dockerignore` controls **Docker build context**, not git tracking
- Root `.gitignore` only affects git, not Docker
- Each service needs specific exclusions for efficient builds

---

### A4. Environment Variable Files

| File | Committed? | Action |
|------|-----------|--------|
| .env (root) | ❌ No | **KEEP** (gitignored, single source) |
| .env.example (root) | ✅ Yes | **DELETE** (env vars in README table instead) |
| Backend/.env | ❌ No | **DELETE** (use root) |
| Frontend/.env | ❌ No | **DELETE** (use root) |
| Localization-Algorithm/.env | ❌ No | **DELETE** (use root) |

**User preference:** No extra files unless needed → Delete .env.example, document in README.

---

### A5. Markdown Files (60+ total)

**All markdown files except root README.md will be deleted:**

```
CLAUDE.md                                     → DELETE
BEFORE_YOU_PUSH.md                            → DELETE
CLEANUP_SUMMARY.md                            → DELETE
RESTRUCTURE_PLAN.md                           → DELETE (this file, after execution)
Backend/Readme.md                             → DELETE
Frontend/README.md                            → DELETE
Frontend/COMPONENT_ANALYSIS.md                → DELETE
Localization-Algorithm/data/README.md         → DELETE
Localization-Algorithm/model/README.md        → DELETE
docs/                                         → DELETE ENTIRE FOLDER
deploy/README.md                              → DELETE
deploy/deployment-plan.md                     → DELETE
```

**Content merged into:** Root `README.md` (comprehensive single-file docs)

---

## PHASE B: PROPOSED TARGET STRUCTURE

```
SSWCS-555-EpiCareHub/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   ├── public/                    (NO large models, use CDN)
│   │   ├── Dockerfile
│   │   ├── .dockerignore              ← KEPT (moved from Frontend/)
│   │   ├── nginx.conf
│   │   ├── vite.config.js             ← UPDATED (envDir: '../../')
│   │   └── package.json
│   │
│   ├── backend/
│   │   ├── config/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── Dockerfile
│   │   ├── .dockerignore              ← KEPT (moved from Backend/)
│   │   ├── server.js
│   │   ├── app.js
│   │   └── package.json
│   │
│   └── brain-api/
│       ├── data/                      (NO large datasets)
│       ├── model/
│       ├── Dockerfile
│       ├── .dockerignore              ← KEPT (moved from Localization-Algorithm/)
│       ├── brain_api.py
│       ├── brain_visualizer.py
│       └── requirements.txt
│
├── scripts/
│   ├── dev-up.sh                      (UPDATE paths)
│   ├── dev-down.sh                    (UPDATE paths)
│   ├── check-artifacts.sh
│   ├── rebuild-brain-api.sh           (UPDATE paths)
│   ├── fetch-assets.sh                (NEW - optional CDN download)
│   └── vps/
│       └── nginx.conf                 (moved from deploy/)
│
├── .github/
│   └── workflows/
│       └── ci.yml                     (UPDATE paths)
│
├── .gitignore                         (CONSOLIDATED - single source)
├── .env                               (gitignored, ONLY env file)
├── README.md                          (CONSOLIDATED - all docs, env var table)
├── docker-compose.yml                 (UPDATED - build contexts, env_file)
├── docker-compose.prod.yml            (UPDATED - build contexts, env_file)
└── .git/
```

**No `.env.example`** - Environment variables documented in README.md table.

---

## PHASE C: DETAILED RESTRUCTURE PLAN

### C1. File Moves (Exact Mappings)

#### Service Directories
```bash
git mv Backend/ apps/backend/
git mv Frontend/ apps/frontend/
git mv Localization-Algorithm/ apps/brain-api/
```

#### Scripts
```bash
mkdir -p scripts/vps
git mv deploy/nginx-vps.conf scripts/vps/nginx.conf
```

#### .dockerignore Files (KEEP, MOVE)
```bash
# These files move with their service directories (already inside)
# apps/backend/.dockerignore   (was Backend/.dockerignore)
# apps/frontend/.dockerignore  (was Frontend/.dockerignore)
# apps/brain-api/.dockerignore (was Localization-Algorithm/.dockerignore)
```

---

### C2. File Deletions

#### Environment Files
```bash
rm -f .env.example                    # Env vars in README instead
rm -f apps/backend/.env               # Use root .env
rm -f apps/frontend/.env              # Use root .env
rm -f apps/brain-api/.env             # Use root .env
```

#### Markdown Files (ALL except root README.md)
```bash
rm -f CLAUDE.md
rm -f BEFORE_YOU_PUSH.md
rm -f CLEANUP_SUMMARY.md
rm -f RESTRUCTURE_PLAN.md
rm -f apps/backend/Readme.md
rm -f apps/frontend/README.md
rm -f apps/frontend/COMPONENT_ANALYSIS.md
rm -f apps/brain-api/data/README.md
rm -f apps/brain-api/model/README.md
rm -rf docs/
rm -rf deploy/
```

#### Large Brain Model Files (70MB total)

**CRITICAL ORDER:**
1. First `git mv` services to `apps/*` and commit
2. Then remove large files from git tracking
3. Optionally remove from disk

```bash
# STEP 1: After git mv and commit, remove from git tracking (keep in history)
git rm --cached apps/frontend/public/obj/brain1.gltf           # 35M (unused)
git rm --cached apps/frontend/public/obj/brain.gltf            # 9M (unused)
git rm --cached apps/frontend/public/obj/brain.Obj             # 6.5M (unused)
git rm --cached apps/frontend/public/obj/blender/Brain2.bin    # 2.3M (unused)
git rm --cached apps/frontend/public/obj/blender/Brain-1.png   # ~500K (unused)
git rm --cached apps/frontend/public/obj/blender/Brain.png     # ~500K (unused)
git rm --cached apps/frontend/public/obj/blender/Brain-2.png   # ~500K (unused)
git rm --cached apps/frontend/public/models/brain_lh.obj       # 10M (USED - need CDN)
git rm --cached apps/frontend/public/models/brain_rh.obj       # 10M (USED - need CDN)

# STEP 2: Optional - remove from working tree (after git rm --cached)
# Can keep files locally for testing, or delete to save disk space
# rm -rf apps/frontend/public/obj/
# rm -f apps/frontend/public/models/brain_*.obj
```

---

### C3. Root .gitignore (Consolidated)

**New .gitignore content:**

```gitignore
# ============================================
# ROOT .gitignore - CONSOLIDATED
# ============================================

# ============================================
# SECRETS & ENV FILES
# ============================================
.env
.env.local
.env.*.local
*.pem
*.key
*.crt

# ============================================
# NODE.JS (Backend + Frontend)
# ============================================
node_modules/
npm-debug.log*
yarn-error.log*

# Build outputs
apps/frontend/dist/
apps/frontend/build/
apps/backend/dist/
apps/backend/build/

# Testing
coverage/
.nyc_output/

# IDE & OS
.DS_Store
.vscode/
.idea/
*.swp
*~

# ============================================
# PYTHON (Brain-API)
# ============================================
__pycache__/
*.py[cod]
*.so
.Python
*.egg-info/

# Virtual environments
venv/
env/
.conda/

# ============================================
# ML & DATA FILES (BLOAT PREVENTION)
# ============================================
# Model weights
*.pkl
*.pth
*.h5
*.hdf5
*.ckpt

# Datasets
*.fif
*.mat
apps/brain-api/data/*.fif
apps/brain-api/data/*.mat

# Large brain models (now on CDN)
apps/frontend/public/models/*.obj
apps/frontend/public/models/*.gltf
apps/frontend/public/obj/*.obj
apps/frontend/public/obj/*.gltf
apps/frontend/public/obj/*.bin

# Runtime artifacts
apps/brain-api/uploads/
apps/brain-api/result/

# ============================================
# LOGS
# ============================================
logs/
*.log

# ============================================
# CLAUDE CODE
# ============================================
CLAUDE.md
.claude/

# ============================================
# TEMPORARY
# ============================================
.cache/
tmp/
*.tmp
```

---

### C4. Root .env Strategy (Docker-First)

#### How It Works

**Docker Compose (PRIMARY - no code changes needed):**
```yaml
# docker-compose.yml
services:
  backend:
    env_file: ./.env         # All vars injected by Docker
  brain-api:
    env_file: ./.env
  frontend:
    env_file: ./.env
    build:
      args:
        - VITE_API_BASE_URL
        - VITE_PYTHON_API_URL
        - VITE_EPICARE_DEV_MODE
        - VITE_ENABLE_WEBGL_BRAIN
        - VITE_BRAIN_MODELS_BASE_URL  # NEW - CDN URL
```

**Manual Start (FALLBACK - must run from service directory):**
- Backend: `cd apps/backend && npm start` - `dotenv.config()` in `app.js` loads from current dir (no change needed)
- Frontend: `cd apps/frontend && npm run dev` - Vite reads from `envDir: '../../'` (see C5)
- Brain-API: `cd apps/brain-api && uvicorn brain_api:app` - `load_dotenv()` loads from current dir (no change needed)

**CRITICAL:** If running from repo root, services won't find `.env`. Two options:
1. **Recommended:** Always `cd apps/<service>` before running
2. **Alternative:** Update dotenv paths to `path.join(__dirname, '../../.env')` (not recommended, adds complexity)

**Validation Note:** Add to validation plan - verify manual start only works from `apps/*/` directory.

**Production:**
- Vercel/Render: Set env vars via UI
- VPS Docker: `env_file: ./.env` on server

---

### C5. Vite Config Update (Fix envDir)

**File:** `apps/frontend/vite.config.js`

**REQUIRED CHANGE:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // CRITICAL: Read .env from repo root (2 levels up)
  envDir: '../../',

  server: {
    port: 5173,
    strictPort: false,
  },
})
```

**Why?** After moving to `apps/frontend/`, Vite looks for `.env` in `apps/frontend/` by default. `envDir: '../../'` tells it to look at repo root instead.

---

### C6. WebGL Brain Model Refactor (CDN Loading)

**Current Code (hardcoded paths):**
```javascript
// apps/frontend/src/components/BrainWebGLViewer.jsx:116-117
const lh = useLoader(OBJLoader, "/models/brain_lh.obj");
const rh = useLoader(OBJLoader, "/models/brain_rh.obj");
```

**NEW CODE (CDN with fallback):**

```javascript
// apps/frontend/src/components/BrainWebGLViewer.jsx
const BRAIN_MODELS_BASE_URL = import.meta.env.VITE_BRAIN_MODELS_BASE_URL || "/models";

const lh = useLoader(OBJLoader, `${BRAIN_MODELS_BASE_URL}/brain_lh.obj`);
const rh = useLoader(OBJLoader, `${BRAIN_MODELS_BASE_URL}/brain_rh.obj`);
```

**New .env Variable:**
```bash
# Root .env
# CDN Options (choose one):

# Option A: Cloudinary Raw Upload (RECOMMENDED)
VITE_BRAIN_MODELS_BASE_URL=https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models

# Option B: AWS S3
# VITE_BRAIN_MODELS_BASE_URL=https://your-bucket.s3.amazonaws.com/brain-models

# Option C: GitHub Release
# VITE_BRAIN_MODELS_BASE_URL=https://github.com/USER/REPO/releases/download/v1.0.0
```

**CDN Setup (Cloudinary - Recommended):**
1. Upload `brain_lh.obj` and `brain_rh.obj` to Cloudinary as "Raw" files
2. Organize in folder: `brain-models/brain_lh.obj`, `brain-models/brain_rh.obj`
3. Set public URL base: `https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models`
4. Code loads: `${VITE_BRAIN_MODELS_BASE_URL}/brain_lh.obj`

**Why Cloudinary Raw?**
- Already using Cloudinary for generated brain images
- Supports large files (up to 100MB)
- Global CDN with fast delivery
- Simple URL pattern: `https://res.cloudinary.com/{cloud_name}/raw/upload/{folder}/{filename}`

**Production:** Set `VITE_BRAIN_MODELS_BASE_URL` in Vercel UI to CDN base URL (without filename).

**Local Dev:** Either:
- Use CDN: Set `VITE_BRAIN_MODELS_BASE_URL` in `.env`
- OR run `scripts/fetch-assets.sh` to download models locally (defaults to `/models`)

---

### C7. docker-compose.yml Updates (Exact Diff)

**BEFORE:**
```yaml
services:
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    # ... rest

  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
        VITE_PYTHON_API_URL: ${VITE_PYTHON_API_URL}
        VITE_EPICARE_DEV_MODE: ${VITE_EPICARE_DEV_MODE}
        VITE_ENABLE_WEBGL_BRAIN: ${VITE_ENABLE_WEBGL_BRAIN}
    # ... rest

  brain-api:
    build:
      context: ./Localization-Algorithm
      dockerfile: Dockerfile
    # ... rest
```

**AFTER:**
```yaml
services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    env_file: ./.env             # ADDED - explicit env file
    # ... rest

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${VITE_API_BASE_URL}
        VITE_PYTHON_API_URL: ${VITE_PYTHON_API_URL}
        VITE_EPICARE_DEV_MODE: ${VITE_EPICARE_DEV_MODE}
        VITE_ENABLE_WEBGL_BRAIN: ${VITE_ENABLE_WEBGL_BRAIN}
        VITE_BRAIN_MODELS_BASE_URL: ${VITE_BRAIN_MODELS_BASE_URL}  # ADDED
    # NO env_file - frontend only needs build-time vars via args
    # ... rest

  brain-api:
    build:
      context: ./apps/brain-api
      dockerfile: Dockerfile
    env_file: ./.env             # ADDED
    # ... rest
```

**Key Changes:**
1. Build contexts: `./Backend` → `./apps/backend` (and same for others)
2. Added explicit `env_file: ./.env` to backend and brain-api (NOT frontend - build-time only)
3. Added `VITE_BRAIN_MODELS_BASE_URL` build arg for frontend

---

### C8. CI Workflow Updates (Exact Diff)

**File:** `.github/workflows/ci.yml`

**BEFORE:**
```yaml
jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: ./Frontend
        run: npm ci
      - name: Run tests
        working-directory: ./Frontend
        run: npm test

  backend-tests:
    needs: frontend-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: ./Backend
        run: npm ci
      - name: Run tests
        working-directory: ./Backend
        run: npm test
```

**AFTER:**
```yaml
jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: ./apps/frontend
        run: npm ci
      - name: Run tests
        working-directory: ./apps/frontend
        run: npm test

  backend-tests:
    needs: frontend-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: ./apps/backend
        run: npm ci
      - name: Run tests
        working-directory: ./apps/backend
        run: npm test
```

**Changes:** All `working-directory` paths updated to `apps/*`.

---

### C9. Scripts Updates

**Files to update:**
- `scripts/dev-up.sh`
- `scripts/dev-down.sh`
- `scripts/rebuild-brain-api.sh`

**Pattern:** Replace `Backend/`, `Frontend/`, `Localization-Algorithm/` with `apps/backend/`, `apps/frontend/`, `apps/brain-api/`.

**Example (scripts/dev-up.sh):**
```bash
# BEFORE
cd Backend && npm start &
cd Frontend && npm run dev &
cd Localization-Algorithm && uvicorn brain_api:app &

# AFTER
cd apps/backend && npm start &
cd apps/frontend && npm run dev &
cd apps/brain-api && uvicorn brain_api:app &
```

---

### C10. scripts/fetch-assets.sh (NEW - Optional CDN Download)

**File:** `scripts/fetch-assets.sh`

```bash
#!/bin/bash
# fetch-assets.sh - Download optional brain models from CDN

set -e

# Use BRAIN_MODELS_BASE_URL for script (without VITE_ prefix)
# Frontend uses VITE_BRAIN_MODELS_BASE_URL at build time
CDN_BASE_URL="${BRAIN_MODELS_BASE_URL:-https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models}"

echo "Downloading brain models from CDN..."
echo "CDN URL: $CDN_BASE_URL"

mkdir -p apps/frontend/public/models

echo "Downloading brain_lh.obj (10MB)..."
curl -L -o apps/frontend/public/models/brain_lh.obj "$CDN_BASE_URL/brain_lh.obj"

echo "Downloading brain_rh.obj (10MB)..."
curl -L -o apps/frontend/public/models/brain_rh.obj "$CDN_BASE_URL/brain_rh.obj"

echo "Done! Models downloaded to apps/frontend/public/models/"
echo "NOTE: These files are optional. Set VITE_BRAIN_MODELS_BASE_URL in .env to use CDN directly."
```

**Usage:**
```bash
# Option 1: Download models for local dev
export BRAIN_MODELS_BASE_URL=https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models
./scripts/fetch-assets.sh

# Option 2: Set CDN URL in .env (no download needed)
echo "VITE_BRAIN_MODELS_BASE_URL=https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models" >> .env
```

---

### C11. README.md Structure (Single File, No .env.example)

**New README.md outline (~400 lines):**

```markdown
# EpiCareHub

**3D Brain Seizure Localization Platform**

[![CI](https://github.com/.../badge.svg)](...)

## Overview
Medical platform for epilepsy seizure localization using 3D brain visualization and AI-powered analysis of intracranial EEG data.

## Features
- 3D brain visualization (WebGL)
- Intracranial EEG analysis
- AI-powered hotspot detection
- Multi-format EEG support (.fif, .h5, .mat)

## Tech Stack
- Frontend: React 18 + Vite 5 + Three.js
- Backend: Node.js 20 + Express + MongoDB
- ML API: Python 3.11 + FastAPI + MNE-Python

## Repository Structure
```
apps/
  frontend/    - React + Vite
  backend/     - Express API
  brain-api/   - Python ML service
scripts/       - Automation scripts
.env           - Environment variables (gitignored)
README.md      - This file (all documentation)
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB Atlas account
- Cloudinary account

### 1. Clone & Setup
```bash
git clone https://github.com/.../SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub
# Create .env file from table below
```

### 2. Environment Variables

**Create `.env` in repo root with these variables:**

| Variable | Service | Required | Default | Description |
|----------|---------|----------|---------|-------------|
| **FRONTEND (Build-Time)** |
| VITE_API_BASE_URL | Frontend | Yes | http://localhost:3000 | Backend API URL |
| VITE_PYTHON_API_URL | Frontend | Yes | http://localhost:8000 | ML API URL |
| VITE_EPICARE_DEV_MODE | Frontend | No | true | Enable dev mode |
| VITE_ENABLE_WEBGL_BRAIN | Frontend | No | true | Enable 3D viewer |
| VITE_BRAIN_MODELS_BASE_URL | Frontend | No | /models | Brain model CDN URL |
| **BACKEND (Runtime)** |
| MONGODB_URI | Backend | Yes | - | MongoDB connection string |
| MONGODB_DB_NAME | Backend | No | epicarehub | Database name |
| SESSION_SECRET | Backend | Yes | - | Express session secret (32-char random) |
| ADMIN_REGISTRATION_SECRET | Backend | Yes | - | Admin registration secret |
| EPICARE_INTERNAL_API_KEY | Backend | Yes | - | ML→Backend API key (16-char random) |
| PYTHON_API_URL | Backend | No | http://localhost:8000 | ML service URL |
| NODE_API_URL | Backend | No | http://localhost:3000 | Self-reference URL |
| PORT | Backend | No | 3000 | Server port |
| CORS_ORIGIN | Backend | No | http://localhost:5173 | CORS whitelist (comma-separated) |
| UPLOAD_MAX_MB | Backend | No | 100 | Max upload size |
| **ML API (Runtime)** |
| CLOUDINARY_CLOUD_NAME | Brain-API | Yes | - | Cloudinary account |
| CLOUDINARY_API_KEY | Brain-API | Yes | - | Cloudinary API key |
| CLOUDINARY_API_SECRET | Brain-API | Yes | - | Cloudinary secret |
| HOST | Brain-API | No | 0.0.0.0 | Server host |
| LOG_LEVEL | Brain-API | No | INFO | Logging level |
| UPLOADS_DIR | Brain-API | No | /app/uploads | Upload directory |

**Generate secrets:**
```bash
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 16  # EPICARE_INTERNAL_API_KEY
```

### 3. Docker Compose (Recommended)
```bash
docker compose up -d
```
Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- ML API: http://localhost:8000

### 4. Manual Start (Alternative)
```bash
# Terminal 1: Backend
cd apps/backend && npm install && npm start

# Terminal 2: Frontend
cd apps/frontend && npm install && npm run dev

# Terminal 3: ML API
cd apps/brain-api
conda env create -f environment.yml
conda activate brain
uvicorn brain_api:app --reload
```

## Optional: Brain Models (for 3D Viewer)

Brain models are hosted on CDN. For local dev:

**Option A: Use CDN (Recommended)**
```bash
# In .env (Cloudinary example)
VITE_BRAIN_MODELS_BASE_URL=https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models
```

**Option B: Download Locally**
```bash
# Set base URL for download script (without VITE_ prefix)
export BRAIN_MODELS_BASE_URL=https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models
./scripts/fetch-assets.sh
# Models saved to apps/frontend/public/models/
```

## Testing
```bash
# Frontend
cd apps/frontend && npm test

# Backend
cd apps/backend && npm test
```

## Deployment

### Option A: Managed Services (Recommended)
**Frontend (Vercel):**
1. Connect GitHub repo
2. Set Root Directory: `apps/frontend`
3. Add env vars (VITE_*)
4. Deploy

**Backend (Render/Railway):**
1. New Web Service
2. Dockerfile Path: `apps/backend/Dockerfile`
3. Add env vars (MONGODB_URI, etc.)
4. Deploy

**ML API (Render/Railway):**
1. New Web Service
2. Dockerfile Path: `apps/brain-api/Dockerfile`
3. Add persistent disk: `/app/uploads` (2GB)
4. Add env vars (CLOUDINARY_*, etc.)
5. Deploy

### Option B: VPS Docker
```bash
# On VPS
git clone <repo>
cd SSWCS-555-EpiCareHub

# Create .env file from README table
nano .env  # Fill in production values

docker compose -f docker-compose.prod.yml up -d

# Setup nginx reverse proxy
sudo cp scripts/vps/nginx.conf /etc/nginx/sites-available/epicarehub
sudo ln -s /etc/nginx/sites-available/epicarehub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Architecture

```
User → Frontend (React/Vite)
         ↓ POST /upload
       Backend (Express)
         ↓ Forward file
       ML API (FastAPI + MNE)
         ↓ Generate brain images
       Cloudinary (CDN)
         ↓ Return URLs
       Backend → MongoDB
         ↓ Fetch results
       Frontend (3D Viewer)
```

## Troubleshooting

### Backend can't connect to MongoDB
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas network access (allow 0.0.0.0/0 or your IP)

### CORS errors
- Check `CORS_ORIGIN` matches frontend URL
- Restart backend after env changes

### 3D brain models not loading
- Check `VITE_BRAIN_MODELS_BASE_URL` is set in `.env`
- Verify CDN URL format: `https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models` (base URL only, no filename)
- OR run `BRAIN_MODELS_BASE_URL=<cdn-url> ./scripts/fetch-assets.sh` to download locally
- Check browser console for 404 errors

### 413 Request Too Large
- Increase `UPLOAD_MAX_MB` in `.env`
- OR implement direct-to-S3 upload

## Contributing
1. Fork repo
2. Create feature branch
3. Make changes
4. Run tests: `npm test`
5. Submit PR

## License
[License info]

## Support
Issues: https://github.com/.../issues
```

**Key Points:**
- ✅ No `.env.example` file - env vars documented in README table
- ✅ All deployment docs merged
- ✅ Troubleshooting section
- ✅ Single file, ~400 lines

---

## PHASE D: VALIDATION PLAN (UPDATED)

### Step 1: Verify File Structure
```bash
tree -L 2 apps/
# Should show:
# apps/
# ├── backend/
# │   ├── .dockerignore  ← KEPT
# ├── frontend/
# │   ├── .dockerignore  ← KEPT
# └── brain-api/
#     ├── .dockerignore  ← KEPT

ls -lh .gitignore .env README.md
# Should show: .gitignore, .env, README.md ONLY (no .env.example)

! test -f .env.example && echo "✅ .env.example deleted"
! test -d docs/ && echo "✅ docs/ deleted"
```

### Step 2: Verify Vite envDir
```bash
grep -n "envDir" apps/frontend/vite.config.js
# Should show: envDir: '../../'
```

### Step 3: Verify docker-compose.yml
```bash
docker compose config | grep -E "(context|env_file)"
# Should show:
# context: apps/frontend
# context: apps/backend
# context: apps/brain-api
# env_file: ./.env (for all services)
```

### Step 4: Test Docker Build
```bash
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

### Step 5: Verify .env Loading (Docker)
```bash
docker compose exec backend node -e "console.log(process.env.MONGODB_URI ? '✅ Backend env OK' : '❌ FAIL')"
docker compose exec brain-api python -c "import os; print('✅ Brain-API env OK' if os.environ.get('CLOUDINARY_CLOUD_NAME') else '❌ FAIL')"

# Frontend build args (check during build, not runtime)
docker compose logs frontend | grep VITE_
```

### Step 5b: Verify Manual Start (Non-Docker)
```bash
# MUST run from service directory, not repo root
cd apps/backend
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI ? '✅ Backend manual OK' : '❌ FAIL - run from apps/backend/')"

cd ../frontend
npm run dev
# Check console: should show "Loaded env from ../../.env"

cd ../brain-api
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('✅ Brain-API manual OK' if os.environ.get('CLOUDINARY_CLOUD_NAME') else '❌ FAIL - run from apps/brain-api/')"
```

### Step 6: Test /visualize_brain Pipeline (CRITICAL)
```bash
# 1. Upload test EEG file via UI (http://localhost:5173)
# 2. Monitor logs
docker compose logs brain-api | grep -E "(output.json|overlay.json)"
docker compose logs backend | grep "upload callback"

# 3. Verify artifacts in Docker volume
docker compose exec brain-api ls -lh /app/uploads/<uploadId>/
# Should show: output.json, overlay.json, figures/*.png

# 4. Verify Cloudinary upload succeeded
# 5. Check MongoDB for study record
```

### Step 7: Test WebGL Brain Viewer
```bash
# Navigate to: http://localhost:5173/patients/<id>/study/<uploadId>
# Verify:
# - Static brain views load (4-view images from Cloudinary)
# - WebGL 3D viewer loads models from CDN (if VITE_BRAIN_MODELS_BASE_URL set)
# - OR loads from /models (if ran fetch-assets.sh)
```

### Step 8: Verify .gitignore
```bash
git status
# Should NOT show:
# - node_modules/
# - apps/frontend/dist/
# - apps/brain-api/uploads/
# - apps/brain-api/__pycache__/
# - .env
# - CLAUDE.md
# - apps/frontend/public/models/*.obj
```

### Step 9: Test CI
```bash
# Simulate GitHub Actions locally
gh act -j frontend-tests
gh act -j backend-tests
```

### Step 10: Verify No Secrets Committed
```bash
grep -r "mongodb+srv://" . --exclude-dir=.git --exclude=.env
# Should find: README.md (example), nothing else

grep -r "CLOUDINARY_API_SECRET" . --exclude-dir=.git --exclude=.env
# Should find: README.md (table), nothing else
```

---

## PHASE E: RISK REPORT (UPDATED)

### Risk 1: Vite envDir Not Configured
**Severity:** 🔴 HIGH → ✅ **MITIGATED**

**Issue:** After moving to `apps/frontend`, Vite won't read root `.env`.

**Fix:** Add `envDir: '../../'` to `vite.config.js` (see C5).

**Validation:**
```bash
cd apps/frontend
npm run dev
# Check logs: should show "Loaded env from ../../.env"
```

---

### Risk 2: Docker Build Context Changes
**Severity:** 🔴 HIGH → ✅ **MITIGATED**

**Issue:** Build contexts change from `./Backend` → `./apps/backend`.

**Fix:** Updated docker-compose.yml with correct paths (see C7).

**Validation:**
```bash
docker compose config | grep context
docker compose build
```

---

### Risk 3: WebGL Brain Models Not Loading
**Severity:** 🟡 MEDIUM → ✅ **MITIGATED**

**Issue:** Models removed from git, code hardcoded to `/models/brain_*.obj`.

**Fix:** Refactored `BrainWebGLViewer.jsx` to use `VITE_BRAIN_MODELS_BASE_URL` env var (see C6).

**Validation:**
```bash
# Test with CDN URL
echo "VITE_BRAIN_MODELS_BASE_URL=https://your-cdn.com/brain-models" >> .env
docker compose restart frontend

# Navigate to 3D viewer, check browser console for model loading
```

---

### Risk 4: .dockerignore Deleted Breaking Builds
**Severity:** 🔴 HIGH → ✅ **MITIGATED**

**Issue:** Original plan deleted `.dockerignore` files.

**Fix:** Keep `.dockerignore` files in each `apps/*/` (see C1, A3).

**Why it matters:**
- Backend build was including `tests/`, `docs/` (slow builds)
- ML build was including `uploads/` (2GB+ bloat)
- Frontend build was including `node_modules/` (duplicate)

**Validation:**
```bash
ls apps/*/.dockerignore
# Should show:
# apps/backend/.dockerignore
# apps/frontend/.dockerignore
# apps/brain-api/.dockerignore
```

---

### Risk 5: CI Workflow Paths Hardcoded
**Severity:** 🟡 MEDIUM → ✅ **MITIGATED**

**Fix:** Updated `.github/workflows/ci.yml` paths to `apps/*/` (see C8).

**Validation:**
```bash
gh act -j frontend-tests
# Should run tests from apps/frontend/
```

---

### Risk 6: Missing .env.example Confuses Contributors
**Severity:** 🟢 LOW → ✅ **ACCEPTED**

**User decision:** Delete `.env.example`, document env vars in README table.

**Rationale:** User wants no extra files unless needed. README table is sufficient.

---

### Risk 7: Git History Bloat
**Severity:** 🟡 MEDIUM → ✅ **ACCEPTED**

**User decision:** Keep history as-is (no force-push).

**Impact:** 70MB of brain models remain in git history.

**Mitigation:** Files removed from working tree via `git rm --cached`, added to `.gitignore`.

---

## EXECUTION CHECKLIST

**Review before approving:**

### A. Structure
- [ ] Monorepo `apps/*` structure acceptable?
- [ ] `.dockerignore` files kept (not deleted)?
- [ ] All markdown files except README.md will be deleted?

### B. Configuration
- [ ] Single root `.gitignore` adequate?
- [ ] Single root `.env` (no `.env.example`) acceptable?
- [ ] README.md env var table sufficient?

### C. Code Changes
- [ ] `vite.config.js` gets `envDir: '../../'`?
- [ ] WebGL viewer refactored to use `VITE_BRAIN_MODELS_BASE_URL`?
- [ ] docker-compose.yml updated (paths + env_file)?

### D. Assets
- [ ] Brain models removed from git, hosted on Cloudinary Raw?
- [ ] Understand CDN URL format: `https://res.cloudinary.com/{cloud}/raw/upload/brain-models/{file}`?
- [ ] `scripts/fetch-assets.sh` uses `BRAIN_MODELS_BASE_URL` (no VITE_ prefix)?
- [ ] Understand only `brain_lh.obj`, `brain_rh.obj` are used (20MB total)?

### E. Testing
- [ ] Will test `docker compose up -d` after changes?
- [ ] Will verify `/visualize_brain` pipeline works?
- [ ] Will check WebGL 3D viewer loads models?

### F. Deployment
- [ ] Understand Vercel needs Root Directory: `apps/frontend`?
- [ ] Understand Render needs Dockerfile: `apps/backend/Dockerfile`?
- [ ] Understand need to upload models to Cloudinary Raw folder: `brain-models/`?
- [ ] Set `VITE_BRAIN_MODELS_BASE_URL` base URL in Vercel/Render (no filename)?

### G. Risks & Constraints
- [ ] Reviewed all mitigated risks?
- [ ] Comfortable with .env.example deletion?
- [ ] Understand 70MB stays in git history?
- [ ] Understand manual start MUST run from `apps/*/` directory?
- [ ] Understand frontend doesn't need `env_file` in docker-compose (build-time only)?

---

## NEXT STEPS

1. **User reviews** this revised plan
2. **User approves** or requests changes
3. **Claude executes** in 7 phases:
   - Phase 1: Move services to `apps/*` (git mv, preserves .dockerignore)
   - Phase 2: Commit moves, then delete .env files, .env.example, markdown files
   - Phase 3: Update .gitignore (consolidated patterns)
   - Phase 4: Update vite.config.js (envDir: '../../')
   - Phase 5: Refactor BrainWebGLViewer.jsx (VITE_BRAIN_MODELS_BASE_URL)
   - Phase 6: Update docker-compose.yml (contexts, env_file, build args), CI workflow, scripts
   - Phase 7: git rm --cached brain models, create fetch-assets.sh, update README
4. **User validates** with 10-step checklist
5. **User commits** and creates PR

---

**END OF REVISED PLAN - AWAITING USER APPROVAL**
