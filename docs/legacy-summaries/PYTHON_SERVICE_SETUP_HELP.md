# Python ML Service - Setup Help

**Status:** Installing conda environment (ETA: 10-15 minutes)

---

## What's Happening

The conda `brain` environment is currently being created with the ARM64-compatible package list. This includes:

- Python 3.11
- NumPy, SciPy, Matplotlib
- MNE (EEG processing)
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Cloudinary (image hosting)
- python-dotenv (environment variables)

---

## Once Installation Completes

You'll be able to run:

```bash
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000
```

---

## What to Do While Waiting

### Option 1: Start the Other Services

In separate terminals:

**Terminal 1 - MongoDB:**
```bash
brew services start mongodb-community
```

**Terminal 2 - Backend:**
```bash
cd Backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm run dev
```

Then when the Python environment finishes:

**Terminal 4 - Python ML Service:**
```bash
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000
```

### Option 2: Monitor the Installation

Check progress in a new terminal:

```bash
# List conda environments
conda env list

# Once it shows "brain", test it
conda activate brain
python --version

# Should show Python 3.11.x
```

---

## After Services Start

### Test Connectivity

```bash
# Test Backend → Python API
curl http://localhost:3000/ml/health

# Test Python API directly
curl http://localhost:8000/health

# Access the app
open http://localhost:5173
```

---

## .env Configuration

Before running the Python service, configure `.env` in Localization-Algorithm/:

```bash
cd Localization-Algorithm
cp .env.example .env

# Edit with your Cloudinary credentials
nano .env
```

Required fields:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
BACKEND_ORIGIN=http://localhost:3000
LOG_LEVEL=INFO
```

---

## If Installation Fails

### Dependency Conflict Error

The original `environment.yml` had dependency conflicts on ARM64 Macs. I've created `environment-arm64.yml` which uses pip for MNE instead of conda, avoiding the conflict.

If you want to use the original environment on an Intel Mac:

```bash
cd Localization-Algorithm
conda env create -f environment.yml -y  # Original file
```

For Apple Silicon Macs:

```bash
cd Localization-Algorithm
conda env create -f environment-arm64.yml -y  # Simplified, pip-based
```

### Conda Not Found

If conda isn't found after installation:

```bash
# Restart your terminal first
# Then try:
conda --version

# If still not found:
~/miniconda3/bin/conda init zsh
# Or
~/miniconda3/bin/conda init bash
```

### Port Conflicts

If port 8000 is already in use:

```bash
# Find process on port 8000
lsof -i :8000

# Kill it (replace PID)
kill -9 <PID>

# Or use a different port
uvicorn brain_api:app --reload --port 8001
```

---

## Full Start-Up Sequence

Once everything is installed:

```bash
# Terminal 1
brew services start mongodb-community

# Terminal 2
cd Backend && npm start

# Terminal 3
cd Frontend && npm run dev

# Terminal 4
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000

# Then in browser:
open http://localhost:5173
```

---

## Documentation

- **COMPLETE_INTEGRATION_SUMMARY.md** - Full architecture guide
- **DEVELOPMENT_SETUP.md** - Development environment setup
- **CONDA_SETUP_GUIDE.md** - Detailed conda installation
- **QUICK_START_GUIDE.md** - Quick reference guide

---

**Installation in progress - you can start working on other services while waiting!**

