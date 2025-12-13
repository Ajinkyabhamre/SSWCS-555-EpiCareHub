# Brain Visualization Overview

## Current Design (December 2024)

EpiCareHub uses **MNE-Python generated static images** for 3D brain visualization instead of interactive WebGL/Three.js.

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   ds003029 Data │         │  Python Pipeline │         │  Node Backend  │
│  (BIDS Format)  │────────▶│  (MNE + helper)  │────────▶│   (Express)    │
│                 │         │                  │         │                │
│ • .vhdr/.edf    │         │ ✓ Load ECoG      │         │ ✓ Store study  │
│ • electrodes.tsv│         │ ✓ Compute hotspots│        │ ✓ Save images  │
│ • coordsystem   │         │ ✓ Render 3D brain│         │                │
└─────────────────┘         │ ✓ Upload to CDN  │         └────────────────┘
                            └──────────────────┘                │
                                                                 ▼
                                                       ┌────────────────┐
                                                       │ MongoDB        │
                                                       │ brainViews: {} │
                                                       └────────────────┘
                                                                 │
                                                                 ▼
                                                       ┌────────────────┐
                                                       │ Frontend       │
                                                       │ (React)        │
                                                       │ Display images │
                                                       └────────────────┘
```

---

## Pipeline Flow

### 1. **Python (Localization-Algorithm/)**

**File:** `helper.py`

**Function:** `generate_ecog_brain_snapshots()`

**Steps:**
1. Load electrode positions from BIDS `electrodes.tsv`
2. Create MNE montage from 3D coordinates
3. Use `mne.viz.plot_sensors(kind='3d')` to render brain + electrodes
4. Highlight hotspot electrodes with red markers
5. Generate left and right lateral views
6. Save as PNG files locally
7. Upload to Cloudinary
8. Return `brainViews` dict: `{left: url, right: url}`

**Called by:** `process_epilepsy_ecog()` in the EPILEPSY_ECOG pipeline

**Output:**
```python
{
    "patientId": "...",
    "uploadId": "...",
    "summary": "...",
    "hotspots": [...],
    "brainViews": {
        "left": "https://cloudinary.com/.../brain_left.png",
        "right": "https://cloudinary.com/.../brain_right.png"
    }
}
```

---

### 2. **Node Backend (Backend/)**

**Files:**
- `routes/patients.js` - `/patients/upload` endpoint
- `data/eegStudies.js` - Study schema and CRUD operations

**Storage:**
```javascript
{
  _id: ObjectId("..."),
  patientId: ObjectId("..."),
  uploadId: "fragility-sub-jh101-run01",
  status: "COMPLETED",
  summary: "Strongest activity in left frontal...",
  hotspots: [...],
  brainViews: {
    left: "https://cloudinary.com/.../brain_left.png",
    right: "https://cloudinary.com/.../brain_right.png"
  },
  ...
}
```

---

### 3. **Frontend (Frontend/)**

**File:** `Brain.jsx`

**Behavior:**
- Fetches study data from `/patients/:id/studies`
- Extracts `study.brainViews` object
- Displays images in a tabbed interface (if multiple views)
- Shows both views side-by-side (if only 2 views)
- Falls back to friendly message if no brain views available

**File:** `PatientDetails.jsx`

**Badge:**
- Shows "📍 3D Images Ready (N)" if `study.brainViews` has keys
- Where N = number of available views

---

## Data Structures

### Python → Node Request Body
```python
{
  "patientId": "69327ccdcefcdacb1eb274de",
  "uploadId": "fragility-sub-jh101-run01",
  "summary": "Strongest activity in left frontal (0.95)...",
  "hotspots": [
    {
      "region": "left frontal",
      "hemisphere": "L",
      "confidence": 0.95,
      "coordinates": [-45.2, 12.1, 58.7],
      "channel": "$LAF9"
    },
    ...
  ],
  "brainViews": {
    "left": "https://res.cloudinary.com/.../brain_left.png",
    "right": "https://res.cloudinary.com/.../brain_right.png"
  },
  "figUrl": "https://...",  # Activity plot
  "images": [...],
  "metadata": { "modelVersion": "ECoG-Activity-1.0", "mneVersion": "1.x.x" }
}
```

### MongoDB Study Document
```javascript
{
  _id: ObjectId("..."),
  patientId: ObjectId("..."),
  uploadId: "fragility-sub-jh101-run01",
  status: "COMPLETED",
  summary: "...",
  hotspots: [...],
  brainViews: {  // NEW
    left: "https://...",
    right: "https://..."
  },
  figureUrls: { topomap: "...", brainViews: [...], annotated: [] },
  metadata: {...},
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Frontend Study Object
```javascript
const study = {
  uploadId: "fragility-sub-jh101-run01",
  summary: "Strongest activity in left frontal...",
  hotspots: [...],
  brainViews: {
    left: "https://...",
    right: "https://..."
  },
  ...
};
```

---

## Testing

### Run Python Pipeline
```bash
cd Localization-Algorithm
conda activate brain

python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "datasets/fragility_ds003029/sub-jh101/ses-presurgery/ieeg/sub-jh101_ses-presurgery_task-ictal_acq-ecog_run-01_ieeg.vhdr" \
  --patientId 69327ccdcefcdacb1eb274de \
  --uploadId fragility-sub-jh101-run01 \
  --historic False
```

**Expected output:**
```
[BRAIN_SNAPSHOTS] Generating 3D brain snapshots for 3 hotspots
[BRAIN_SNAPSHOTS] Loaded 135 electrode positions
[BRAIN_SNAPSHOTS] Matched 135 channels to montage
[BRAIN_SNAPSHOTS] ✓ Saved left view: .../brain_left.png
[BRAIN_SNAPSHOTS] ✓ Uploaded left view to Cloudinary
[BRAIN_SNAPSHOTS] ✓ Saved right view: .../brain_right.png
[BRAIN_SNAPSHOTS] ✓ Uploaded right view to Cloudinary
[BRAIN_SNAPSHOTS] ✓ Generated 2 brain view(s)
[EPILEPSY_ECOG] ✓ Generated 2 brain view(s): ['left', 'right']
```

### Verify in Frontend
1. Navigate to patient details page
2. Find study with matching `uploadId`
3. Should see: **"📍 3D Images Ready (2)"** badge
4. Click "3D Brain" button
5. Brain view page shows:
   - Left and right lateral view images
   - Summary text
   - Hotspots list with confidence bars
   - Coordinates for each hotspot

---

## Fallback Behavior

**If electrodes.tsv is missing:**
- Python logs: `[BRAIN_SNAPSHOTS] WARNING: No electrode positions found, cannot generate brain views`
- Returns `brainViews = {}`
- Analysis still completes (summary + hotspots)
- Node stores `brainViews: {}`
- Frontend shows: "No 3D Brain Images Available"

**If MNE rendering fails:**
- Caught by try/except
- Logs warning
- Returns `brainViews = {}`
- Analysis continues

**DEMO mode (.fif files):**
- Currently does not generate brainViews
- Sends `brainViews: {}`
- Old MEG visualization pipeline still works for backwards compatibility

---

## Key Files

| Component | File | Key Functions |
|-----------|------|---------------|
| Python | `Localization-Algorithm/helper.py` | `generate_ecog_brain_snapshots()`, `process_epilepsy_ecog()` |
| Python | `Localization-Algorithm/brain_visualizer.py` | Entry point, mode detection |
| Node | `Backend/routes/patients.js` | `POST /patients/upload` |
| Node | `Backend/data/eegStudies.js` | `createStudy()`, `updateProcessingResults()` |
| Frontend | `Frontend/src/components/Brain.jsx` | Brain image display |
| Frontend | `Frontend/src/components/PatientDetails.jsx` | Study cards + badges |

---

## Limitations

1. **Static images only** - No interactive rotation/zoom (by design)
2. **macOS rendering** - MNE 3D plotting may have display issues; uses matplotlib backend
3. **Coordinate systems** - Currently assumes ACPC or native space from BIDS
4. **View angles** - Fixed left/right lateral views (can extend to top/bottom)
5. **DEMO mode** - MEG .fif files don't generate brainViews yet

---

## Future Enhancements

- [ ] Add superior/inferior views
- [ ] Overlay activation intensity on brain surface
- [ ] Generate animated GIF rotating views
- [ ] Support for depth electrode trajectories
- [ ] MNI space normalization for cross-patient comparison

---

**Last Updated:** December 2024
**Status:** ✅ Production Ready
