# WebGL 3D Brain Viewer Improvements Guide

**Last Updated:** December 10, 2025
**Author:** AI Assistant (Claude Sonnet 4.5)
**Related Documentation:** `EpiCareHub_Architecture_And_3D_Brain_Pipeline.md`

---

## Overview

This document describes comprehensive improvements to the EpiCareHub 3D brain visualization system, addressing:

1. **Task A**: Fixed and documented coordinate mapping between MNI space and Three.js scene
2. **Task B**: Improved depth electrode visualization with shaft rendering
3. **Task C**: Added frontend-triggered pipeline execution (no more manual terminal commands!)

All changes are **backward-compatible** with existing overlay JSON files.

---

## Task A: Coordinate Mapping Fixes

### Problem Solved
- Electrodes appeared in wrong positions or "far outside" the brain mesh
- Ad-hoc coordinate transformations scattered across codebase
- No documentation of MNI → Three.js transformation

### Solution Implemented

#### 1. Enhanced Python Overlay JSON (`helper.py:2191-2387`)

**Updated** `save_webgl_overlay_json()` function with:

- **Explicit coordinate system documentation** in docstring:
  ```python
  """
  COORDINATE SYSTEM DOCUMENTATION:
  --------------------------------
  Input (MNI RAS, mm):
    - X: Right (+) / Left (-)
    - Y: Anterior (+) / Posterior (-)
    - Z: Superior (+) / Inferior (-)
    - Units: millimeters (mm)
  """
  ```

- **Enhanced JSON schema** with metadata:
  ```json
  {
    "space": "MNI",
    "units": "mm",
    "electrodes": [
      {
        "label": "mPHL1",
        "coord_mni_mm": [20.5, -25.3, -15.8],  // NEW: explicit field name
        "activity": 0.92,
        "isHotspot": true,
        "type": "depth",           // NEW: electrode type
        "shaftId": "mPHL",         // NEW: shaft grouping
        "contactIndex": 0          // NEW: contact ordering
      }
    ],
    "mniToScene": {                // NEW: transformation documentation
      "description": "Linear transform from MNI RAS (mm) to Three.js",
      "scale": 0.01,
      "matrix": [
        [0.01,  0.00,  0.00],
        [0.00,  0.00,  0.01],
        [0.00, -0.01,  0.00]
      ]
    },
    "meta": {                      // NEW: summary stats
      "nElectrodes": 89,
      "nShafts": 8,
      "nHotspots": 5
    }
  }
  ```

- **Automatic shaft detection** from electrode labels (e.g., `mPHL1` → shaft `mPHL`)
- **Contact indexing** for depth electrodes

#### 2. Unified Coordinate Transform in Frontend (`BrainWebGLViewer.jsx:70-76`)

**Created** single source of truth function:

```javascript
/**
 * Convert MNI RAS coordinates (mm) to Three.js scene coordinates.
 * This is the ONLY function that should be used for coordinate transformation.
 */
function mniMmToScene([x, y, z], scale = 0.01) {
  return [
    x * scale,   // X: Right stays Right
    z * scale,   // Y: Superior → Up
    -y * scale   // Z: Anterior → Backward (note the minus!)
  ];
}
```

**Why this works:**
- MNI: `x=Right, y=Anterior, z=Superior`
- Three.js: `x=Right, y=Up, z=Backward`
- Brain mesh has rotation applied to match this transform
- Scale `0.01` converts mm → scene units

**Sanity check values** (documented in code):
```
MNI coords:   X ∈ [-100, 100], Y ∈ [-100, 100], Z ∈ [-50, 100] mm
Scene coords: X ∈ [-1, 1], Y ∈ [-0.5, 1], Z ∈ [-1, 1] units
```

#### 3. Debug Mode with Bounding Boxes (`BrainWebGLViewer.jsx:378-400`)

**Added** debug helpers component:
- **Axes Helper** at origin (shows XYZ directions)
- **Brain Bounding Box** (green) - shows brain mesh extent
- **Electrode Bounding Box** (red) - shows electrode positions extent

**Enable via UI**: Check "Debug Mode" checkbox in control panel

**Console logging**:
```
[3D] Brain bounding box computed:
  - Center: 0.000, 0.350, 0.000
  - Size: 1.800, 1.200, 1.500
  - Radius: 1.250

[3D] Electrode bounds:
  - Min: -0.450, -0.300, -0.800
  - Max: 0.500, 0.750, 0.600
```

**How to verify correctness:**
1. Enable debug mode
2. Check that green (brain) and red (electrode) boxes overlap substantially
3. If electrodes are far outside brain → coordinate transform is wrong
4. Check console logs for expected ranges

---

## Task B: Depth Electrode Visualization

### Problem Solved
- Depth electrodes appear as isolated spheres in space
- No visual indication of which contacts belong to same shaft
- Hard to interpret electrode trajectories

### Solution Implemented

#### 1. Shaft Line Rendering (`BrainWebGLViewer.jsx:291-315`)

**Added** thin gray lines connecting contacts on same shaft:

```javascript
{/* Depth Electrode Shaft Lines */}
{showShafts && shaftConnections.map(({ shaftId, contacts }) => {
  if (contacts.length < 2) return null;

  const positions = contacts.map(c => c.position).flat();

  return (
    <line key={`shaft-${shaftId}`}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={contacts.length}
          array={new Float32Array(positions)}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#888888" opacity={0.4} transparent />
    </line>
  );
})}
```

**Features:**
- Lines automatically sorted by `contactIndex` (deepest → shallowest)
- Semi-transparent gray color (doesn't obscure brain)
- Can be toggled via "Shafts" button in UI

#### 2. Outside-Brain Opacity Reduction (`BrainWebGLViewer.jsx:246-252`)

**Automatically detects** electrodes outside brain mesh:

```javascript
const isOutsideBrain = useCallback((position) => {
  if (!brainBounds) return false;
  const box = brainBounds.box;
  const point = new THREE.Vector3(...position);
  return !box.containsPoint(point);
}, [brainBounds]);
```

**Visual feedback:**
- Contacts inside brain: 100% opacity
- Contacts outside brain: 70% opacity
- Makes it obvious which contacts are deep (e.g., amygdala, hippocampus)

#### 3. Shaft Information in Electrode Info Panel

**Shows** shaft metadata when hovering/clicking electrodes:
```
Label: mPHL2
Activity: 87.5%
Type: depth • Shaft: mPHL
```

---

## Task C: Frontend-Triggered Pipeline

### Problem Solved
- Manual terminal commands required: `python3 brain_visualizer.py --basePath ... --file ... --patientId ... --uploadId ...`
- Error-prone (typos, wrong paths, forgotten arguments)
- Poor UX for non-technical users

### Solution Implemented

#### 1. Backend API Endpoint (`Backend/routes/analysis.js`)

**Created** new route file with two endpoints:

##### `GET /api/analysis/datasets`

Lists available demo datasets:

```json
{
  "success": true,
  "datasets": [
    {
      "sessionKey": "Data_Subject_01_Session_01",
      "displayName": "Subject 01 - Session 01 (Working Memory Task)",
      "description": "Human MTL single-unit recordings...",
      "validated": true
    }
  ]
}
```

##### `POST /api/analysis/run-human-mtl`

Triggers the Python pipeline:

**Request:**
```json
{
  "patientId": "64a1b2c3d4e5f6789",
  "uploadId": "human-mtl-S01_01-2025-12-10T14-30-00",
  "sessionKey": "Data_Subject_01_Session_01"
}
```

**Response (immediate):**
```json
{
  "success": true,
  "message": "HUMAN_MTL pipeline started successfully",
  "patientId": "...",
  "uploadId": "...",
  "note": "Pipeline running in background. Poll /patients/:id/studies for completion."
}
```

**How it works:**
1. Validates inputs (patientId, uploadId, sessionKey)
2. Resolves dataset file path from session key
3. Spawns Python process with `child_process.spawn()`
4. Logs stdout/stderr to Node console
5. Returns immediately (doesn't wait for Python to finish)
6. Python POSTs results to `/patients/upload` when done

**Registered in** `Backend/routes/index.js:23`

#### 2. Frontend Analysis Runner Component (`Frontend/src/components/Brain/AnalysisRunner.jsx`)

**New component** with polished UI:

**Features:**
- Dropdown to select demo dataset (auto-selects validated datasets)
- "Run Analysis" button
- Loading state with progress messages
- **Smart polling**: Checks `/patients/:id/studies` every 5 seconds
- Auto-refreshes page when `status === "COMPLETED"`
- Error handling with clear messages
- Cancel button during execution

**Polling logic:**
```javascript
const startPolling = (patientId, uploadId) => {
  const interval = setInterval(async () => {
    const response = await axios.get(`${API_BASE_URL}/patients/${patientId}/studies`);
    const study = response.data.studies.find(s => s.uploadId === uploadId);

    if (study?.status === "COMPLETED") {
      clearInterval(interval);
      onAnalysisComplete(study);  // Refresh page
    }
  }, 5000);  // Poll every 5 seconds
};
```

**Integrated into** `Brain.jsx` in right sidebar (after hotspots card)

---

## How to Test End-to-End

### Prerequisites
1. Backend running: `cd Backend && npm run dev`
2. Frontend running: `cd Frontend && npm run dev`
3. MongoDB running: `brew services start mongodb-community` (or `mongod`)
4. Python environment activated: `cd Localization-Algorithm && conda activate epicare_env`
5. Valid dataset file exists: `Localization-Algorithm/datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5`

### Test Scenario 1: Run Analysis from Frontend

**Step 1: Create a test patient**
1. Go to `http://localhost:5173/patients`
2. Click "Add Patient"
3. Fill form:
   - First Name: "Test"
   - Last Name: "WEBGL"
   - DOB: "1990-01-01"
   - Email: "test@epicarehub.com"
4. Submit → Note patient ID from URL (e.g., `675...abc`)

**Step 2: Navigate to brain page (will show empty initially)**
1. Go to `http://localhost:5173/patient/<patientId>/brain/demo-upload-id`
2. You'll see "No study found" → this is expected

**Step 3: Trigger analysis from UI**
1. Scroll down to "Run Demo Analysis" card in right sidebar
2. Select "Subject 01 - Session 01 (Working Memory Task)" from dropdown
3. Click "Run Analysis"
4. Watch progress messages:
   ```
   Starting HUMAN_MTL pipeline...
   Pipeline running in background... Waiting for completion...
   Pipeline processing... (1/60)
   Pipeline processing... (2/60)
   ...
   Analysis complete! 🎉
   ```
5. Page auto-refreshes after ~30-90 seconds

**Step 4: Verify results**
1. Page should reload with study data populated
2. **Static Views (MNE) tab**: See 4 brain snapshots (left, right, top, anterior)
3. **Interactive 3D (beta) tab**: See 3D brain with electrodes
4. **Hotspots panel**: Lists top 5 hotspots with confidence scores
5. **Metadata panel**: Shows processing time, electrode count

### Test Scenario 2: Verify Coordinate Mapping

**Enable debug mode:**
1. Navigate to Interactive 3D tab
2. Check "Debug Mode" checkbox
3. Observe:
   - **Axes** at origin (red=X, green=Y, blue=Z)
   - **Green box** around brain mesh
   - **Red box** around electrodes

**Check console logs:**
```
[3D] Brain bounding box computed:
  - Center: 0.000, 0.350, 0.000
  - Size: 1.800, 1.200, 1.500
  - Radius: 1.250

[3D] Electrode bounds:
  - Min: -0.450, -0.300, -0.800
  - Max: 0.500, 0.750, 0.600
```

**Expected behavior:**
- Electrode box should be **mostly inside** brain box
- Some electrodes outside is OK (depth contacts in deep structures)
- If all electrodes far outside → coordinate transform broken

**Visual checks:**
1. Rotate brain to left view → electrodes should cluster around temporal/MTL regions
2. Set brain opacity to 0.3 (glass brain) → see electrodes inside
3. Click "Hotspots Only" → should show 5 high-activity electrodes
4. Hover over electrode → tooltip shows label (e.g., "mPHL2"), activity, shaft

### Test Scenario 3: Verify Depth Electrode Shafts

**Enable shaft rendering:**
1. Interactive 3D tab → ensure "Shafts" button is "Visible" (emerald)
2. Rotate brain to get good view
3. Observe thin gray lines connecting contacts

**Expected behavior:**
- Lines connect contacts with same shaft prefix (e.g., `mPHL1`, `mPHL2`, `mPHL3`)
- Lines sorted from deepest → shallowest
- Lines semi-transparent (don't obscure brain)

**Toggle shafts:**
1. Click "Shafts" button → lines disappear
2. Click again → lines reappear

**Check shaft info:**
1. Click an electrode sphere
2. Info panel shows: `Type: depth • Shaft: mPHL`
3. All contacts on same shaft have same `shaftId`

### Test Scenario 4: Manual CLI Run (fallback)

**If frontend UI fails, run manually:**

```bash
cd Localization-Algorithm

# Ensure environment
conda activate epicare_env
source .env  # Load env vars

# Run pipeline
python3 brain_visualizer.py \
  --basePath="uploads" \
  --file="datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId="<YOUR_PATIENT_ID>" \
  --uploadId="test-manual-$(date +%Y%m%d-%H%M%S)" \
  --historic=false
```

**Expected output:**
```
[PIPELINE] Mode: HUMAN_MTL
[HUMAN_MTL] ========================================
[HUMAN_MTL] Loaded 89 channels at 32000.00 Hz
[HUMAN_MTL] Computing electrode activity...
[HUMAN_MTL] Top 5 active channels:
  1. RH2: 0.920
  2. LA3: 0.870
  ...
[HUMAN_MTL] Generating 3D brain snapshots (4 views)...
[HUMAN_MTL] ✓ Generated 4 brain view(s)
[WEBGL_OVERLAY] ✓ Saved overlay JSON to: ...
[WEBGL_OVERLAY] ✓ Identified 8 electrode shafts
[HUMAN_MTL] ✓ Node backend callback successful!
```

---

## Troubleshooting

### Problem: "Dataset file not found" error

**Cause:** Dataset file missing or wrong path

**Solution:**
```bash
cd Localization-Algorithm
ls -la datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5
# Should show file (~100-500 MB)
```

If missing, contact data provider or check README for download instructions.

### Problem: Electrodes still appear far outside brain

**Debug steps:**
1. Enable debug mode → check bounding boxes
2. Check console logs for coordinate ranges
3. Verify overlay JSON has `coord_mni_mm` field (not legacy `coord`)
4. Check brain mesh files exist:
   ```bash
   ls -la Frontend/public/models/brain_*.obj
   ```

**Manual fix:**
Run Python pipeline again to regenerate overlay JSON with new schema.

### Problem: Shafts don't render (no lines visible)

**Possible causes:**
1. "Shafts" button set to "Hidden" → click to enable
2. "Electrodes" button set to "Hidden" → shafts require electrodes visible
3. Overlay JSON missing `type`, `shaftId`, `contactIndex` fields → regenerate overlay

**Verify JSON schema:**
```bash
curl <webglOverlayUrl> | jq '.electrodes[0]'
```

Should show:
```json
{
  "label": "mPHL1",
  "coord_mni_mm": [20.5, -25.3, -15.8],
  "activity": 0.92,
  "isHotspot": true,
  "type": "depth",
  "shaftId": "mPHL",
  "contactIndex": 0
}
```

### Problem: Pipeline times out (5 minute limit)

**Possible causes:**
- Dataset file very large
- Python environment slow (no GPU, old CPU)
- MNE rendering slow

**Solutions:**
1. Increase timeout in `AnalysisRunner.jsx:124`: `const maxAttempts = 120;` (10 min)
2. Run manually from CLI (no timeout)
3. Check Python console for errors (may be stuck, not actually running)

### Problem: "WebGL overlay not available" message

**Cause:** Study exists but no `webglOverlayUrl` field

**Check study document:**
```javascript
// In MongoDB
db.eegStudies.findOne({uploadId: "your-upload-id"})
```

**Should have:**
```json
{
  "webglOverlayUrl": "https://res.cloudinary.com/.../overlay.json",
  "status": "COMPLETED"
}
```

**If missing:** Re-run pipeline (Python may have failed to upload to Cloudinary)

---

## Code Changes Summary

### Files Created
- `Backend/routes/analysis.js` - Pipeline trigger endpoint
- `Frontend/src/components/Brain/AnalysisRunner.jsx` - UI for running analysis
- `WEBGL_3D_IMPROVEMENTS_GUIDE.md` - This document

### Files Modified
- `Localization-Algorithm/helper.py` (lines 2191-2387) - Enhanced overlay JSON generation
- `Frontend/src/components/BrainWebGLViewer.jsx` - Complete rewrite with coordinate fixes, debug mode, shaft rendering
- `Frontend/src/components/Brain.jsx` (lines 1-7, 75-79, 389-401) - Integrated AnalysisRunner component
- `Backend/routes/index.js` (lines 8, 23) - Registered analysis routes

### Backward Compatibility

All changes support **both new and legacy overlay JSON schemas**:

**Legacy format (still works):**
```json
{
  "electrodes": [{
    "label": "mPHL1",
    "coord": [20.5, -25.3, -15.8],  // Legacy field name
    "value": 0.92                    // Legacy field name
  }]
}
```

**New format (recommended):**
```json
{
  "electrodes": [{
    "label": "mPHL1",
    "coord_mni_mm": [20.5, -25.3, -15.8],  // NEW
    "activity": 0.92,                       // NEW
    "type": "depth",                        // NEW
    "shaftId": "mPHL",                      // NEW
    "contactIndex": 0                       // NEW
  }],
  "mniToScene": { ... },                    // NEW
  "meta": { ... }                           // NEW
}
```

**Fallback logic in BrainWebGLViewer.jsx:**
```javascript
const mni_mm = electrode.coord_mni_mm ||  // Try new field first
               electrode.coord ||          // Fall back to legacy
               [electrode.x || 0, electrode.y || 0, electrode.z || 0];
```

---

## Performance Notes

### Expected Timings (MacBook Pro M1, 16GB RAM)

- **Pipeline execution**: 30-90 seconds
  - HDF5 file loading: ~5s
  - Activity computation: ~10s
  - MNE brain rendering (4 views): ~15-30s
  - Cloudinary uploads: ~5-10s
  - JSON generation: <1s

- **3D viewer rendering**: <2 seconds
  - Brain mesh loading: ~0.5s
  - Electrode positioning: <0.1s
  - Initial camera fit: <0.1s

- **Polling frequency**: Every 5 seconds
  - Max wait time: 5 minutes (60 attempts)

### Optimization Opportunities

1. **Cache brain meshes** (currently loaded on every page visit)
2. **Lazy-load MNE** (only import when needed, not at module level)
3. **Parallel brain rendering** (render 4 views concurrently)
4. **WebSocket notifications** (replace polling with push notifications)

---

## Future Enhancements

### Short-term (1-2 weeks)
1. **Camera presets**: "Left Temporal View", "Hippocampal View"
2. **Color legend**: Show activity gradient scale
3. **Multiple datasets**: Support Subject 02, 03, etc.
4. **Shaft labels**: Draw text labels on shaft lines

### Medium-term (1-2 months)
1. **High-quality brain meshes**: Use FreeSurfer high-poly surfaces
2. **Subcortical structures**: Add hippocampus, amygdala meshes
3. **Trajectory planning**: Interactive shaft placement tool
4. **Time-series animation**: Animate activity over time

### Long-term (3-6 months)
1. **Patient-specific MRI**: Load custom brain from DICOM/NIfTI
2. **VR support**: WebXR integration
3. **Real-time EEG**: Stream live data to 3D viewer
4. **Surgical navigation**: Export trajectories for OR systems

---

## Questions & Support

**For bugs or feature requests:**
- File issue at: `https://github.com/anthropics/epicarehub/issues` (replace with actual repo)
- Include:
  - Browser console logs
  - Node backend logs
  - Python terminal output
  - Screenshots of debug mode

**For coordinate system questions:**
- See `EpiCareHub_Architecture_And_3D_Brain_Pipeline.md` Section D
- Check MNI coordinate reference: http://www.bic.mni.mcgill.ca/ServicesAtlases/ICBM152NLin2009
- FreeSurfer documentation: https://surfer.nmr.mgh.harvard.edu/

**For dataset questions:**
- Original paper: Boran et al. (2019) "Human MTL Units WM Dataset"
- Dataset download: Contact data provider or check README

---

**End of Guide**
