# EpiCareHub - Complete Startup Guide

This guide ensures ALL three services of the EpiCareHub project run properly on your machine.

## Table of Contents

1. [Quick Start Summary](#quick-start-summary)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration (.env Files)](#environment-configuration-env-files)
4. [Starting All Services](#starting-all-services)
5. [Port Checking & Management](#port-checking--management)
6. [Verification Steps](#verification-steps)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start Summary

**Expected Running Services:**

| Service | Technology | Port | Directory | Command |
|---------|-----------|------|-----------|---------|
| **Backend** | Node.js + Express | 3000 | `Backend/` | `npm start` |
| **Python ML** | FastAPI + Uvicorn | 8000 | `Localization-Algorithm/` | `uvicorn brain_api:app --reload --host 0.0.0.0 --port 8000` |
| **Frontend** | React + Vite | 5173 | `Frontend/` | `npm run dev` |

---

## Prerequisites

### Required Software

1. **Node.js** (v16+ recommended)
   ```bash
   node --version  # Should show v16.x or higher
   npm --version
   ```

2. **Python 3.11** (via Conda/Anaconda)
   ```bash
   python --version  # Should show 3.11.x
   conda --version
   ```

3. **MongoDB Atlas Account**
   - You must have a MongoDB Atlas cluster URL
   - No local MongoDB will work - backend REQUIRES Atlas

4. **Git** (to clone/manage repository)

---

## Environment Configuration (.env Files)

You MUST create `.env` files in three directories. Copy from `.env.example` if needed.

### 1. Backend Environment Variables

**File:** `/Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend/.env`

```bash
# REQUIRED - MongoDB Atlas Connection (NO localhost!)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=ClusterDB
MONGODB_DB_NAME=epicarehubData

# Session Security
SESSION_SECRET=your_session_secret_change_in_production

# Service URLs
PYTHON_API_URL=http://localhost:8000
NODE_API_URL=http://localhost:3000

# Internal API Key (must match Python service)
EPICARE_INTERNAL_API_KEY=your_secure_api_key_change_in_production

# Server Configuration
PORT=3000
NODE_ENV=development

# Dev Mode (enables /dev/* test endpoints)
EPICARE_DEV_MODE=false

# Admin Registration Secret
ADMIN_REGISTRATION_SECRET=your-admin-secret-here
```

**How to create:**
```bash
cd Backend
cp .env.example .env
# Then edit .env with your actual MongoDB Atlas credentials
```

---

### 2. Frontend Environment Variables

**File:** `/Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Frontend/.env`

```bash
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3000

# Python ML Service Base URL
VITE_PYTHON_API_URL=http://localhost:8000

# Dev Mode (bypasses real EEG processing)
VITE_EPICARE_DEV_MODE=false
```

**How to create:**
```bash
cd Frontend
cp .env.example .env
# Usually no changes needed for local development
```

---

### 3. Python ML Service Environment Variables

**File:** `/Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm/.env`

```bash
# Cloudinary Configuration (for file hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# FastAPI Server Configuration
PORT=8000
HOST=0.0.0.0

# Frontend & Backend Origins (for CORS)
FRONTEND_ORIGIN=http://localhost:5173
BACKEND_ORIGIN=http://localhost:3000

# Node Backend URL (for callbacks)
NODE_API_URL=http://localhost:3000

# Internal API Key (must match Backend)
EPICARE_INTERNAL_API_KEY=your_secure_api_key_change_in_production

# Logging
LOG_LEVEL=INFO

# Dev Mode
EPICARE_DEV_MODE=true
```

**How to create:**
```bash
cd Localization-Algorithm
# Create .env file with the above content
# Update with your Cloudinary credentials if needed
```

**IMPORTANT:** The `EPICARE_INTERNAL_API_KEY` must be the SAME in both Backend and Python .env files!

---

## Starting All Services

### Step 1: Start Backend (Node.js - Port 3000)

**Terminal 1:**
```bash
# Navigate to Backend directory
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend

# Install dependencies (first time only)
npm install

# Start the backend server
npm start
# OR for development with auto-reload:
npm run dev
```

**Expected Console Output:**
```
✓ MongoDB Atlas connection READY
  └─ Cluster: cluster.mongodb.net
  └─ Database: epicarehubData
  └─ Status: Connected

✓ EpiCareHub Backend running on:
  └─ http://localhost:3000

Development endpoints enabled:
  POST /dev/seed - Create demo patient & study data
  DELETE /dev/clean - Remove all demo data
```

**If you see this output, Backend is running correctly!**

---

### Step 2: Start Python ML Service (FastAPI - Port 8000)

**Terminal 2:**
```bash
# Navigate to Localization-Algorithm directory
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

# Create conda environment (first time only)
conda env create -f environment.yml

# Activate the conda environment
conda activate brain

# Start the FastAPI server
uvicorn brain_api:app --reload --host 0.0.0.0 --port 8000
```

**Expected Console Output:**
```
INFO:     Will watch for changes in these directories: ['/Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**If you see "Application startup complete", Python service is running!**

---

### Step 3: Start Frontend (React + Vite - Port 5173)

**Terminal 3:**
```bash
# Navigate to Frontend directory
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Frontend

# Install dependencies (first time only)
npm install

# Start the Vite dev server
npm run dev
```

**Expected Console Output:**
```
  VITE v5.1.4  ready in 543 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**If you see this output, Frontend is running correctly!**

---

## Port Checking & Management

### Check if Ports are Already in Use (macOS)

Before starting services, check if ports 3000, 8000, or 5173 are already occupied:

```bash
# Check Backend port
lsof -i :3000

# Check Python ML port
lsof -i :8000

# Check Frontend port
lsof -i :5173
```

**Example output if port is in use:**
```
COMMAND   PID   USER   FD   TYPE    DEVICE SIZE/OFF NODE NAME
node    12345  user   21u  IPv4  0x1234567      0t0  TCP *:3000 (LISTEN)
```

The **PID** (Process ID) is `12345` in this example.

---

### Kill Stuck Processes on macOS

If a port is blocked by a stuck process:

```bash
# Kill process by PID (use PID from lsof output)
kill -9 12345

# OR kill all processes on a specific port
# For port 3000:
lsof -ti :3000 | xargs kill -9

# For port 8000:
lsof -ti :8000 | xargs kill -9

# For port 5173:
lsof -ti :5173 | xargs kill -9
```

**WARNING:** Always verify the PID before killing. Don't kill system processes!

---

## Verification Steps

After all three services are running, verify they're communicating correctly:

### 1. Backend API Health Check

**Test in browser or curl:**
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "EpiCareHub Backend",
  "mongodb": "connected"
}
```

---

### 2. Python ML Service Health Check

**Test in browser or curl:**
```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "EpiCareHub Localization Algorithm",
  "version": "1.0.0"
}
```

**OR visit the auto-generated API docs:**
```
http://localhost:8000/docs
```

You should see the FastAPI interactive documentation.

---

### 3. Frontend Access

**Open in browser:**
```
http://localhost:5173
```

You should see the EpiCareHub login/registration page.

---

### 4. Test Backend → MongoDB Connection

**In browser or curl:**
```bash
curl http://localhost:3000/patients/get
```

**Expected response:**
- If no patients exist: `[]`
- If patients exist: Array of patient objects
- If MongoDB is NOT connected: Error message about database connection

---

### 5. Test Frontend → Backend Communication

1. Open browser developer tools (F12)
2. Go to **Network** tab
3. Navigate to `http://localhost:5173`
4. Log in or navigate around the app
5. Check Network tab for API calls to `localhost:3000`
6. Verify responses are `200 OK`

---

### 6. Test Full Pipeline (Frontend → Backend → Python → Backend)

**Only if you have EEG data uploaded:**

1. Upload an EEG file through the frontend
2. Check **Browser Network Tab**: Should see POST to `localhost:8000/visualize_brain`
3. Check **Python Terminal**: Should see processing logs
4. Check **Backend Terminal**: Should see callback from Python service
5. Check **Frontend**: Should display brain visualization

---

## Troubleshooting

### Problem 1: Backend Won't Start

**Symptom:**
```
Error: MONGODB_URI environment variable is not set or is invalid
```

**Solution:**
1. Verify `.env` file exists in `Backend/` directory
2. Check `MONGODB_URI` is set to valid MongoDB Atlas connection string
3. Format must be: `mongodb+srv://username:password@cluster.mongodb.net/?appName=AppName`
4. Replace `username`, `password`, and `cluster.mongodb.net` with your Atlas credentials
5. Ensure no spaces or special characters are unescaped

---

### Problem 2: Python Service Won't Start - "Module not found: brain_api"

**Symptom:**
```
ERROR:    Error loading ASGI app. Could not import module "brain_api".
```

**Solution:**
1. Make sure you're in the correct directory:
   ```bash
   cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
   pwd  # Should show .../Localization-Algorithm
   ```

2. Verify `brain_api.py` file exists:
   ```bash
   ls brain_api.py  # Should list the file
   ```

3. Ensure conda environment is activated:
   ```bash
   conda activate brain
   # Your prompt should show (brain) prefix
   ```

---

### Problem 3: Python Environment Not Found

**Symptom:**
```
Could not find conda environment: brain
```

**Solution:**
1. Create the environment:
   ```bash
   cd Localization-Algorithm
   conda env create -f environment.yml
   ```

2. If environment already exists but corrupted:
   ```bash
   conda env remove -n brain
   conda env create -f environment.yml
   ```

3. List all conda environments to verify:
   ```bash
   conda env list
   # Should show 'brain' environment
   ```

---

### Problem 4: Frontend Not Loading / Blank Page

**Symptom:**
- Browser shows blank page
- Console errors about Vite or missing modules

**Solution:**
1. Stop Vite server (Ctrl+C)
2. Delete `node_modules` and reinstall:
   ```bash
   cd Frontend
   rm -rf node_modules
   npm install
   npm run dev
   ```

3. Check browser console for errors (F12)
4. Verify `.env` file has correct API URLs:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   VITE_PYTHON_API_URL=http://localhost:8000
   ```

---

### Problem 5: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Find the process using the port:
   ```bash
   lsof -i :3000
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

3. Or kill all processes on that port:
   ```bash
   lsof -ti :3000 | xargs kill -9
   ```

4. Restart the service

---

### Problem 6: "Cannot connect to MongoDB Atlas"

**Symptom:**
```
MongoServerError: bad auth: Authentication failed
```

**Solution:**
1. Verify MongoDB Atlas credentials are correct in `Backend/.env`
2. Check your IP address is whitelisted in MongoDB Atlas:
   - Go to MongoDB Atlas Dashboard
   - Navigate to Network Access
   - Add your current IP or use `0.0.0.0/0` (allow all - for development only!)
3. Verify database user has correct permissions
4. Test connection string format - must be `mongodb+srv://` (not `mongodb://`)

---

### Problem 7: Python Service Returns 500 Errors

**Symptom:**
- Python service starts but returns errors when called
- Missing dependencies errors

**Solution:**
1. Ensure all dependencies are installed:
   ```bash
   conda activate brain
   conda env update -f environment.yml --prune
   ```

2. Check if `config.json` exists in `Localization-Algorithm/`:
   ```bash
   ls config.json
   ```

3. Verify `.env` file exists and has correct values

4. Check Python service logs in terminal for specific error messages

---

### Problem 8: CORS Errors in Browser Console

**Symptom:**
```
Access to fetch at 'http://localhost:3000/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Solution:**
1. Ensure Backend is running on port 3000
2. Check `Backend/.env` has CORS configured (usually defaults to allow all)
3. Restart Backend service
4. Clear browser cache and reload

---

### Problem 9: Dependencies Installation Fails

**Backend/Frontend npm install fails:**
```bash
# Clear npm cache
npm cache clean --force

# Delete package-lock.json and node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Python conda environment creation fails:**
```bash
# Update conda
conda update -n base -c defaults conda

# Try creating environment again
conda env create -f environment.yml
```

---

### Problem 10: Wrong Working Directory Errors

**Symptom:**
- Commands fail with "file not found"
- Services won't start

**Solution:**
Always ensure you're in the correct directory:

```bash
# For Backend:
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend
pwd  # Verify

# For Python ML:
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
pwd  # Verify

# For Frontend:
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Frontend
pwd  # Verify
```

---

## Quick Reference - Start All Services

**Copy and paste these commands in three separate terminal windows:**

**Terminal 1 - Backend:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend
npm install
npm start
```

**Terminal 2 - Python ML:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Frontend
npm install
npm run dev
```

---

## Development Commands Reference

### Backend Commands

```bash
cd Backend

# Start server
npm start              # Production mode
npm run dev           # Development mode (same as start)

# Testing
npm test              # Run Jest tests

# Database operations
npm run seed          # Seed demo patient and study data
npm run migrate:eegStudies  # Migrate EEG visuals to studies collection
```

### Python ML Commands

```bash
cd Localization-Algorithm

# Environment management
conda env create -f environment.yml    # Create environment (first time)
conda activate brain                   # Activate environment
conda deactivate                       # Deactivate environment

# Start server
uvicorn brain_api:app --reload --host 0.0.0.0 --port 8000

# Alternative (if uvicorn is not in PATH)
python -m uvicorn brain_api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Commands

```bash
cd Frontend

# Start development server
npm run dev           # Vite dev server with hot reload

# Build for production
npm run build         # Creates optimized production build

# Preview production build
npm run preview       # Preview the built app

# Testing
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode

# Linting
npm run lint          # Run ESLint
```

---

## Environment Variables Quick Reference

| Variable | Backend | Frontend | Python | Description |
|----------|---------|----------|--------|-------------|
| `MONGODB_URI` | ✅ Required | ❌ | ❌ | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | ✅ Required | ❌ | ❌ | Database name (default: epicarehubData) |
| `PYTHON_API_URL` | ✅ Required | ❌ | ❌ | Python service URL (http://localhost:8000) |
| `NODE_API_URL` | ✅ Required | ❌ | ✅ Required | Backend URL (http://localhost:3000) |
| `EPICARE_INTERNAL_API_KEY` | ✅ Required | ❌ | ✅ Required | Shared secret for Python→Backend auth |
| `VITE_API_BASE_URL` | ❌ | ✅ Required | ❌ | Backend API URL for frontend |
| `VITE_PYTHON_API_URL` | ❌ | ✅ Required | ❌ | Python API URL for frontend |
| `PORT` | Optional (3000) | ❌ | Optional (8000) | Service port number |
| `SESSION_SECRET` | ✅ Required | ❌ | ❌ | Express session encryption key |
| `ADMIN_REGISTRATION_SECRET` | ✅ Required | ❌ | ❌ | Secret for admin registration |
| `CLOUDINARY_*` | ❌ | ❌ | Optional | Cloudinary credentials for file hosting |
| `EPICARE_DEV_MODE` | Optional | Optional | Optional | Enable development/testing endpoints |

---

## Success Checklist

Before you start using EpiCareHub, verify all these are true:

- [ ] Backend running on port 3000
- [ ] Python ML service running on port 8000
- [ ] Frontend running on port 5173
- [ ] All three `.env` files created and configured
- [ ] MongoDB Atlas connection successful
- [ ] `http://localhost:3000/health` returns success
- [ ] `http://localhost:8000/health` returns success
- [ ] `http://localhost:5173` loads in browser
- [ ] No CORS errors in browser console
- [ ] Can see API calls to backend in Network tab

If all checkboxes are checked, your EpiCareHub environment is ready!

---

## Additional Resources

- **MongoDB Atlas Setup Guide:** `MONGODB_ATLAS_CONFIG.md`
- **MongoDB Connection Debugging:** `MONGODB_CONNECTION_DEBUG_GUIDE.md`
- **Admin Registration Guide:** `ADMIN_REGISTRATION_GUIDE.md`
- **Development Mode Guide:** `DEV_TEST_MODE.md`

---

## Need Help?

If you're still experiencing issues:

1. Check terminal logs for specific error messages
2. Verify all `.env` files are correctly configured
3. Ensure MongoDB Atlas is accessible from your IP
4. Check firewall/antivirus isn't blocking ports
5. Try restarting all services in order: Backend → Python → Frontend

**Common Issue:** Services must be started in this order:
1. Backend (needs MongoDB connection)
2. Python ML (standalone, but Backend calls it)
3. Frontend (calls both Backend and Python)
