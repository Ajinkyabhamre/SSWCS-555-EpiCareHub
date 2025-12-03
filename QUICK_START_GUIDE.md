# Quick Start Guide - Running All Services

**Date:** December 2, 2025
**Status:** Python ML environment being created (ETA: 5-10 minutes)

---

## Current Status

✅ Conda installed (version 25.9.1)
✅ Conda TOS accepted
⏳ Creating `brain` conda environment (currently downloading packages)

Once the `brain` environment is ready, you can start all services.

---

## How to Start All Services (After conda finishes)

### Terminal 1: MongoDB
```bash
brew services start mongodb-community
```

### Terminal 2: Backend (Express API)
```bash
cd Backend
npm start
# Runs on http://localhost:3000
```

### Terminal 3: Frontend (React + Vite)
```bash
cd Frontend
npm run dev
# Runs on http://localhost:5173
```

### Terminal 4: Python ML Service (FastAPI)
**WAIT for conda brain environment to be created first**

```bash
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## Access the Application

Once all services are running:
```
http://localhost:5173
```

---

## Testing Connectivity

### Test Backend → Python API
```bash
curl http://localhost:3000/ml/health
```

### Test Python API Direct
```bash
curl http://localhost:8000/health
```

---

## Environment Status

### MongoDB
- Already running or use: `brew services start mongodb-community`
- Connection: MongoDB Atlas configured in Backend/.env

### Backend
- Ready to run: `npm install` already done
- Port: 3000
- Environment: Backend/.env configured

### Frontend
- Ready to run: `npm install` already done
- Port: 5173
- Environment: Frontend/.env configured

### Python ML Service
- ⏳ **Creating conda environment** (this takes 5-10 minutes)
- Once created: `conda activate brain && uvicorn brain_api:app --reload --port 8000`
- Port: 8000
- Environment: Localization-Algorithm/.env needs Cloudinary credentials

---

## Monitoring Environment Creation

To check progress of conda environment creation in a new terminal:

```bash
# Check if brain environment exists yet
conda env list | grep brain

# Once created, test it
conda activate brain
python --version

# If it works, exit and go to Localization-Algorithm
conda deactivate
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000
```

---

## Environment Variables Summary

**Backend/.env** - Already configured ✅
```
MONGODB_URI=mongodb+srv://...
PYTHON_API_URL=http://localhost:8000
PORT=3000
```

**Frontend/.env** - Already configured ✅
```
VITE_API_BASE_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:8000
```

**Localization-Algorithm/.env** - Needs Cloudinary credentials
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
BACKEND_ORIGIN=http://localhost:3000
```

Edit it:
```bash
cd Localization-Algorithm
nano .env  # Add your Cloudinary credentials
```

---

## Documentation Files

For more detailed information, see:

- **COMPLETE_INTEGRATION_SUMMARY.md** - Full architecture and setup
- **PYTHON_ML_INTEGRATION_SUMMARY.md** - ML service integration details
- **DEVELOPMENT_SETUP.md** - Development environment guide
- **Localization-Algorithm/RUN_LOCAL.md** - Python service setup
- **CONDA_SETUP_GUIDE.md** - Detailed conda installation guide

---

## What Happens Next

1. Wait for conda environment creation to complete (5-10 minutes)
2. Once done, you can start the Python ML service
3. Run all 4 services in separate terminals
4. Access the application at http://localhost:5173
5. Test EEG file upload and visualization

---

## Troubleshooting

### Conda environment creation takes too long
- This is normal - MNE and PyTorch are large packages
- Can take 5-15 minutes depending on internet speed
- You can start other services (Backend, Frontend) while waiting

### "conda: command not found"
- Restart your terminal
- Run: `conda --version` to verify installation

### Port already in use
```bash
# Find and kill process on port (example for 3000)
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Or use a different port when starting service
uvicorn brain_api:app --reload --port 8001
```

### Other issues
- See CONDA_SETUP_GUIDE.md for detailed troubleshooting
- Check individual service docs (RUN_LOCAL.md, DEVELOPMENT_SETUP.md)

---

**Status: Environment setup in progress - check back in 5-10 minutes!**

