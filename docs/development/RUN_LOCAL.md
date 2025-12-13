# Running the Localization-Algorithm (Python FastAPI Service) Locally

This guide explains how to set up and run the Python FastAPI service that handles EEG → brain visualization processing.

---

## Prerequisites

- **Python 3.11+**
- **Conda** (Anaconda or Miniconda)
- **Git** (already cloned repository)

---

## Step 1: Create the Conda Environment (First Time Only)

Navigate to the Localization-Algorithm directory:

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
```

Create the conda environment from the environment.yml file:

```bash
conda env create -f environment.yml
```

This will create an environment named `brain` with all required dependencies.

Verify the environment was created:

```bash
conda env list
# You should see "brain" in the list
```

---

## Step 2: Configure Environment Variables

1. Copy the example .env file:

```bash
cp .env.example .env
```

2. Edit `.env` and add your Cloudinary credentials:

```bash
# .env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret

# Other settings (adjust if needed)
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
BACKEND_ORIGIN=http://localhost:3000
LOG_LEVEL=INFO
```

Get Cloudinary credentials from: https://cloudinary.com/

---

## Step 3: Activate the Conda Environment

```bash
conda activate brain
```

You should see `(brain)` prefix in your terminal prompt.

---

## Step 4: Start the FastAPI Server

With the `brain` environment activated, run:

```bash
uvicorn brain_api:app --reload --port 8000
```

**Expected output:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

The API is now running at: **http://localhost:8000**

---

## Step 5: Verify the Service is Running

In a new terminal, test the health check endpoint:

```bash
curl http://localhost:8000/health
```

**Expected response:**

```json
{
  "status": "ok",
  "service": "Localization-Algorithm",
  "version": "1.0.0",
  "port": 8000
}
```

---

## Available Endpoints

### Health Check
- **GET** `/health`
- Returns status of the service
- Used by the Backend to verify connectivity

### Brain Visualization (New EEG)
- **POST** `/visualize_brain`
- Uploads EEG file and processes it
- Returns visualization URLs for 11 brain views

### Brain Visualization (Historic)
- **POST** `/visualize_brain_historic`
- Re-visualizes a previously uploaded EEG
- Uses cached results if available

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Required | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Required | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Required | Your Cloudinary API secret |
| `PORT` | 8000 | Port to run the FastAPI server on |
| `FRONTEND_ORIGIN` | http://localhost:5173 | Frontend URL (for CORS) |
| `BACKEND_ORIGIN` | http://localhost:3000 | Backend URL (for CORS) |
| `LOG_LEVEL` | INFO | Logging level (DEBUG, INFO, WARNING, ERROR) |

---

## Troubleshooting

### Issue: `conda activate brain` doesn't work

**Solution:**
Make sure conda is initialized:
```bash
conda init bash
# or
conda init zsh
```

Then restart your terminal.

### Issue: `uvicorn: command not found`

**Solution:**
Make sure the `brain` environment is activated:
```bash
conda activate brain
```

### Issue: `ModuleNotFoundError: No module named 'mne'` or `No module named 'dotenv'`

**Solution:**
Reinstall the environment:
```bash
conda env remove --name brain
conda env create -f environment.yml
conda activate brain
```

Alternatively, install missing dependencies:
```bash
conda activate brain
pip install python-dotenv mne
```

### Issue: Port 8000 is already in use

**Solution:**
Either:
1. Kill the process using port 8000:
   ```bash
   lsof -i :8000 | grep -v PID | awk '{print $2}' | xargs kill -9
   ```

2. Or use a different port:
   ```bash
   uvicorn brain_api:app --reload --port 8001
   ```

### Issue: Cloudinary upload fails

**Check:**
1. Cloudinary credentials in `.env` are correct
2. Your Cloudinary account is active and has available quota
3. Test the connection with the Backend health check:
   ```bash
   curl http://localhost:3000/ml/health
   ```

---

## Running the Full Stack Locally

To run all services together, use 4 separate terminals:

**Terminal 1 - MongoDB:**
```bash
brew services start mongodb-community
# or use MongoDB Atlas (update MONGODB_URI in Backend/.env)
```

**Terminal 2 - Backend:**
```bash
cd Backend
npm start
# Runs on http://localhost:3000
```

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 4 - Python ML Service:**
```bash
cd Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000
# Runs on http://localhost:8000
```

Then access the application at: **http://localhost:5173**

---

## Next Steps

1. **Backend Integration:** The Backend calls `http://localhost:8000/visualize_brain` when EEG files are uploaded
2. **Frontend Integration:** The Frontend sends EEG files to the Python API via the Backend
3. **Testing:** Use the `/health` endpoint to verify connectivity between services

---

## Integration with Backend & Frontend

### Flow:
1. User uploads EEG file in Frontend
2. Frontend sends file to **Backend** (http://localhost:3000)
3. Backend forwards file to **Python API** (http://localhost:8000)
4. Python API processes EEG and uploads visualizations to Cloudinary
5. Python API returns visualization URLs to Backend
6. Backend stores URLs in MongoDB and returns to Frontend
7. Frontend displays visualizations in Patient Details page

### Health Check:
Check all services are connected:
```bash
# Test Backend can reach Python API
curl http://localhost:3000/ml/health
```

---

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MNE-Python Documentation](https://mne.tools/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Uvicorn Documentation](https://www.uvicorn.org/)

---

**Last Updated:** December 2, 2025
