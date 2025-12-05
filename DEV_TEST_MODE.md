# Dev/Test Mode Guide for EpiCareHub

This guide explains how to use the dev/test mode features to work on EpiCareHub **without needing real EEG .fif files** or heavy ML processing.

## 🎯 What Dev Mode Provides

Dev mode gives you two ways to populate your local database with test data:

### Option 1: Backend-Only Seeding (Fastest)
- **Endpoint**: `POST /dev/seed`
- **What it does**: Creates a demo patient + demo EEG study with placeholder images
- **Use case**: Quick database setup for UI development
- **No Python service needed**: ✅

### Option 2: Full Pipeline with Fake Data
- **Endpoint**: `POST /visualize_brain_dev` (Python)
- **What it does**: Simulates the entire EEG upload → processing → callback flow, but with fake data
- **Use case**: Testing the complete integration without real EEG files
- **Requires Python service**: ✅

---

## 🚀 Quick Start

### Step 1: Enable Dev Mode

**Backend** (`Backend/.env`):
```bash
EPICARE_DEV_MODE=true
```

**Python Service** (`Localization-Algorithm/.env`):
```bash
EPICARE_DEV_MODE=true
```

**Frontend** (`Frontend/.env` or `Frontend/.env.local`):
```bash
VITE_EPICARE_DEV_MODE=true
```

> **Important**: Make sure MongoDB is running locally or you have a valid MongoDB Atlas connection string in `Backend/.env`

---

### Step 2: Start All Services

**Terminal 1 - Backend:**
```bash
cd Backend
npm install  # if needed
npm start
```

You should see:
```
[DEV MODE] Enabling /dev/* endpoints
Server running on http://localhost:3000
```

**Terminal 2 - Python ML Service:**
```bash
cd Localization-Algorithm
pip install -r requirements.txt  # if needed
uvicorn brain_api:app --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8000
```

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm install  # if needed
npm run dev
```

You should see:
```
Local:   http://localhost:5173/
```

---

## 🌱 Option 1: Backend-Only Seeding

This is the **fastest way** to get demo data into your database.

### Seed the Database

```bash
curl -X POST http://localhost:3000/dev/seed
```

**What this creates:**
- ✅ 1 demo patient (Demo Patient, email: demo.patient@epicarehub.dev)
- ✅ 1 demo EEG study (status: COMPLETED, with 11 placeholder brain views)
- ✅ Updates both `patient.eegVisuals` (legacy) and `eegStudies` collection

**Expected Response:**
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "patient": {
    "_id": "...",
    "firstName": "Demo",
    "lastName": "Patient",
    "email": "demo.patient@epicarehub.dev"
  },
  "study": {
    "_id": "...",
    "uploadId": "dev-seed-1733374800000",
    "status": "COMPLETED",
    "title": "Demo EEG Study"
  },
  "instructions": {
    "frontend": "Navigate to http://localhost:5173/patients to see demo patient",
    "patientDetails": "Click on patient to view EEG visualizations",
    "database": {
      "patients": "db.patients.findOne({email: \"demo.patient@epicarehub.dev\"})",
      "studies": "db.eegStudies.findOne({uploadId: \"...\"})"
    }
  }
}
```

### View in UI

1. Open http://localhost:5173/patients
2. You should see **Demo Patient** in the table
3. Click on the patient to view details
4. You should see placeholder brain visualizations (11 views)

### Clean Up Demo Data

```bash
curl -X DELETE http://localhost:3000/dev/clean
```

This removes all demo patients and their studies.

---

## 🔄 Option 2: Full Pipeline with Fake Data

This simulates the **entire EEG upload workflow** using the Python dev endpoint.

### Prerequisites

- Backend running with `EPICARE_DEV_MODE=true`
- Python service running with `EPICARE_DEV_MODE=true`
- Frontend running with `VITE_EPICARE_DEV_MODE=true`

### How to Use

1. **Create a patient** (if you don't have one):
   - Go to http://localhost:5173/patients
   - Click "Add patient"
   - Fill in details and save

2. **Upload "EEG" file** (dev mode will ignore it):
   - Click the upload icon for any patient
   - Select **any file** (doesn't need to be .fif in dev mode)
   - Click "Start analysis"

3. **What happens**:
   - Frontend sends file to Python `/visualize_brain_dev` endpoint
   - Python generates fake brain visualization URLs
   - Python calls Node `/patients/upload` callback
   - Node updates both `patient.eegVisuals` and `eegStudies`
   - Frontend navigates to patient details page
   - You see placeholder brain images

### Test with cURL (Manual)

If you already have a patient ID:

```bash
# Replace with your actual patient ID
PATIENT_ID="674f7a8e2f1b3c4d5e6f7890"

curl -X POST http://localhost:8000/visualize_brain_dev \
  -F "patientId=$PATIENT_ID" \
  -F "file=@/path/to/any/file.txt"
```

**Expected Python Logs:**
```
[DEV] Processing dev upload for patient: 674f...
[DEV] Calling Node backend at: http://localhost:3000/patients/upload
[DEV] ✓ Node backend callback successful
[DEV] ✓ Patient updated: True
[DEV] ✓ Study updated: True
```

**Expected Node Logs:**
```
[/patients/upload] Patient update: true
[/patients/upload] Study update: true
```

---

## 📊 What You'll See in the Database

### MongoDB Queries

**Check patients collection:**
```javascript
db.patients.find({ email: "demo.patient@epicarehub.dev" }).pretty()
```

You should see:
- `eegVisuals` array with entries containing `uploadId`, `figUrl`, `matUrl`, `images`

**Check eegStudies collection:**
```javascript
db.eegStudies.find({ status: "COMPLETED" }).pretty()
```

You should see:
- Full study documents with:
  - `patientId`: Reference to patient
  - `uploadId`: Unique identifier
  - `status`: "COMPLETED"
  - `figureUrls.topomap`: Placeholder URL
  - `figureUrls.brainViews`: Array of 11 placeholder URLs
  - `metadata.modelVersion`: "ConvDip-DEV"
  - `metadata.mneVersion`: "dev-mode-1.0.0" or "dev-mode"

---

## 🧪 Testing Checklist

### ✅ Backend Seeding Test

1. Start Backend with `EPICARE_DEV_MODE=true`
2. Run `curl -X POST http://localhost:3000/dev/seed`
3. Check MongoDB for demo patient and study
4. Open UI and verify patient appears
5. Click patient and verify brain images load
6. Run `curl -X DELETE http://localhost:3000/dev/clean`
7. Verify demo data is removed

### ✅ Full Pipeline Test

1. Start all 3 services with dev mode enabled
2. Open UI at http://localhost:5173/patients
3. Create a new patient
4. Click upload icon, select any file
5. Click "Start analysis"
6. Verify you're redirected to patient details
7. Verify placeholder brain images appear
8. Check MongoDB for new study in `eegStudies` collection

### ✅ Dashboard Test

1. Seed database with demo data
2. Navigate to http://localhost:5173/dashboard
3. Verify statistics update (total patients, studies, etc.)

---

## 🔍 Troubleshooting

### Issue: `/dev/seed` returns 404

**Cause**: `EPICARE_DEV_MODE` is not set to `"true"` in Backend/.env

**Fix**:
```bash
# In Backend/.env
EPICARE_DEV_MODE=true

# Restart backend
cd Backend && npm start
```

### Issue: `/visualize_brain_dev` returns 403 Forbidden

**Cause**: `EPICARE_DEV_MODE` is not set in Python service

**Fix**:
```bash
# In Localization-Algorithm/.env
EPICARE_DEV_MODE=true

# Restart Python service
cd Localization-Algorithm && uvicorn brain_api:app --reload
```

### Issue: Callback from Python to Node fails

**Possible causes**:
1. Node backend not running
2. `NODE_API_URL` in Python .env is incorrect
3. `EPICARE_INTERNAL_API_KEY` mismatch

**Check**:
```bash
# In Localization-Algorithm/.env
NODE_API_URL=http://localhost:3000
EPICARE_INTERNAL_API_KEY=<must match Backend/.env>
```

### Issue: Frontend still uses real endpoint

**Cause**: `VITE_EPICARE_DEV_MODE` not set or app not restarted

**Fix**:
```bash
# In Frontend/.env or Frontend/.env.local
VITE_EPICARE_DEV_MODE=true

# Restart Vite dev server (IMPORTANT: Vite needs restart for env changes)
cd Frontend && npm run dev
```

### Issue: MongoDB connection failed

**Cause**: MongoDB not running or connection string incorrect

**Fix**:
```bash
# For local MongoDB:
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongod            # Linux

# For MongoDB Atlas:
# Verify MONGODB_URI in Backend/.env is correct
```

---

## 🔒 Security Notes

### ⚠️ NEVER Enable Dev Mode in Production

Dev mode endpoints:
- Bypass authentication checks
- Use fake/placeholder data
- Skip expensive ML processing
- Are intended for local development only

**Production checklist:**
```bash
# Backend/.env
EPICARE_DEV_MODE=false  # or omit entirely

# Localization-Algorithm/.env
EPICARE_DEV_MODE=false  # or omit entirely

# Frontend/.env.production
VITE_EPICARE_DEV_MODE=false  # or omit entirely
```

---

## 📝 Summary of Dev Endpoints

| Endpoint | Method | Service | Purpose |
|----------|--------|---------|---------|
| `/dev/seed` | POST | Backend | Create demo patient + study |
| `/dev/clean` | DELETE | Backend | Remove all demo data |
| `/visualize_brain_dev` | POST | Python | Simulate EEG upload with fake data |

---

## 🎓 Next Steps

Once you've tested with dev mode and are comfortable with the flow:

1. **Get real EEG data**: Obtain sample .fif files for testing
2. **Disable dev mode**: Set all `EPICARE_DEV_MODE` flags to `false`
3. **Test real pipeline**: Upload real .fif files through `/visualize_brain`
4. **Verify processing**: Check that real brain visualizations are generated
5. **Compare results**: Ensure dual-write pattern works with real data

---

## 💡 Tips

- **Keep dev mode enabled during UI development** - much faster iteration
- **Use backend seeding for quick database resets** - `POST /dev/seed` is instant
- **Use full pipeline for integration testing** - tests the complete flow
- **Clean up regularly** - `DELETE /dev/clean` removes test data
- **Check browser console** - Dev mode logs helpful debugging info
- **MongoDB Compass** - Use GUI to inspect database changes visually

---

## 📞 Support

If you encounter issues not covered here:
1. Check all three .env files have correct settings
2. Verify all services are running (Backend, Python, Frontend)
3. Check service logs for error messages
4. Verify MongoDB is accessible
5. Ensure ports 3000, 8000, 5173 are not in use by other apps

---

**Happy developing! 🚀**
