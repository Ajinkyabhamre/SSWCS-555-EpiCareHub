# EpiCareHub: Architecture & 3D Brain Visualization Pipeline

**Technical Documentation for New Engineers**

Last updated: December 10, 2025
Branch: `feature/brainbrowser-webgl`

---

## Table of Contents

1. [High-Level Project Overview](#1-high-level-project-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Python Localization Pipeline](#3-python-localization-pipeline)
4. [Frontend Brain Visualization](#4-frontend-brain-visualization)
5. [UI & Theming](#5-ui--theming)
6. [How to Run and Test](#6-how-to-run-and-test)
7. [Limitations & Future Work](#7-limitations--future-work)

---

## 1. High-Level Project Overview

### What is EpiCareHub?

EpiCareHub is a **web-based platform for EEG/ECoG seizure source localization and 3D brain visualization**. It allows clinicians and researchers to:

- Upload patient EEG/iEEG data files
- Run automated localization pipelines to identify seizure hotspots
- Visualize results in both **static MNE-generated brain snapshots** and **interactive 3D brain models**
- Manage patient records and study history

### Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB (Mongoose for patient/study data)
- Cloudinary (image/file storage)
- REST API architecture

**Frontend:**
- React (with Vite build tool)
- React Router (navigation)
- Tailwind CSS (styling)
- React Three Fiber (3D rendering via Three.js)
- Axios (API calls)
- Framer Motion (animations)

**Python Pipeline:**
- MNE-Python (EEG/MEG signal processing, brain visualization)
- h5py (Human MTL dataset loading)
- PyTorch (ConvDip deep learning model for MEG source localization)
- Cloudinary SDK (image uploads)
- NumPy, SciPy, Matplotlib (scientific computing)

### End-to-End Data Flow

```
1. User uploads EEG/iEEG file via React frontend
   ↓
2. Frontend creates study record in Node backend (status: PROCESSING)
   ↓
3. Frontend calls Python pipeline with uploadId
   ↓
4. Python detects mode (DEMO/EPILEPSY_ECOG/HUMAN_MTL) based on file type
   ↓
5. Python runs appropriate pipeline:
   - Loads raw data (MEG .fif, iEEG .h5, etc.)
   - Computes electrode activity & hotspots
   - Generates static MNE brain snapshots (4 views: left, right, top, anterior)
   - Creates WebGL overlay JSON with electrode positions/activity
   - Uploads images and JSON to Cloudinary
   ↓
6. Python POSTs results to Node backend (/patients/upload)
   ↓
7. Node backend updates study record (status: PROCESSING → COMPLETED)
   ↓
8. Frontend polls for study completion, then displays:
   - Patient details page with study list
   - Brain visualization page with static/interactive tabs
```

### Key Features

- **Multi-modal data support**: MEG (sample_audvis), ECoG (epilepsy datasets), iEEG (Human MTL)
- **Dual visualization modes**:
  - **Static Views**: MNE-generated 2D brain snapshots (4 standard views)
  - **Interactive 3D**: React Three Fiber viewer with electrode spheres, activity coloring, camera controls
- **Study management**: Track multiple EEG studies per patient with status tracking (PROCESSING/COMPLETED/FAILED)
- **Dark mode**: Full light/dark theme support across UI
- **Processing overlay**: Real-time visual feedback during pipeline execution

---

## 2. Backend Architecture

### Overview

The Node.js backend serves as the **central coordination layer** between the frontend and Python pipeline. It:

- Exposes REST API endpoints for patient/study management
- Stores study metadata and results in MongoDB
- Receives callbacks from Python pipeline when processing completes
- Serves static assets (brain mesh models)

### Key Endpoints

#### Patient Management

**`POST /patients/`** - Create new patient
**`PUT /patients/`** - Update patient info (diagnosis, clinical notes)
**`GET /patients/:id`** - Get patient by ID
**`DELETE /patients/:id`** - Delete patient
**`POST /patients/get`** - Get all patients (with optional filters)
**`GET /patients/statistics`** - Get dashboard statistics

#### Study Management

**`POST /patients/:patientId/studies`** - Create new EEG study
Request body:
```json
{
  "title": "Baseline EEG",
  "status": "PROCESSING"
}
```

Response:
```json
{
  "success": true,
  "study": {
    "_id": "...",
    "uploadId": "uuid-generated-by-backend",
    "status": "PROCESSING",
    ...
  }
}
```

**`GET /patients/:patientId/studies`** - Get all studies for a patient
Returns studies sorted by most recent first.

#### Python Callback Endpoint

**`POST /patients/upload`** (protected by API key middleware)
This is the **critical endpoint** that Python calls when processing completes.

Request body (from Python):
```json
{
  "patientId": "64a1b2c3d4e5f6789",
  "uploadId": "human-mtl-bgl-test",
  "figUrl": "https://cloudinary.../topomap.png",
  "matUrl": null,
  "images": ["url1", "url2", ...],
  "metadata": {
    "modelVersion": "Human-MTL-Activity-1.0",
    "mneVersion": "1.8.0",
    "nElectrodes": 89,
    "samplingFreq": 32000
  },
  "summary": "Strongest activity in right hippocampus (0.92), followed by left amygdala (0.87).",
  "hotspots": [
    {
      "channel": "RH2",
      "region": "right hippocampus",
      "confidence": 0.92,
      "coordinates": [20.5, -25.3, -15.8]
    },
    ...
  ],
  "brainViews": {
    "left_lateral": "https://cloudinary.../left_view.png",
    "right_lateral": "https://cloudinary.../right_view.png",
    "top": "https://cloudinary.../top_view.png",
    "anterior": "https://cloudinary.../anterior_view.png"
  },
  "webglOverlayUrl": "https://cloudinary.../webglOverlay.json"
}
```

**What this endpoint does:**
1. Updates `patient.eegVisuals[]` array (legacy compatibility)
2. Finds study by `uploadId` in `eegStudies` collection
3. Updates study status from `PROCESSING` → `COMPLETED`
4. Stores all results (summary, hotspots, brainViews, webglOverlayUrl)
5. Calculates processing time
6. Returns success/failure response

**Location:** `Backend/routes/patients.js:180-323`

### Data Layer

#### `eegStudies` Collection (MongoDB)

Managed by `Backend/data/eegStudies.js`

**Schema:**
```javascript
{
  _id: ObjectId,
  patientId: ObjectId,              // Reference to patients collection
  uploadId: string,                 // UUID (e.g., "human-mtl-bgl-test")
  status: string,                   // "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED"
  title: string | null,
  uploadDate: Date,
  completionDate: Date | null,
  summary: string | null,           // e.g., "Strongest activity in left temporal lobe"
  hotspots: Array,                  // [{channel, region, confidence, coordinates}]
  brainViews: Object,               // {left_lateral: url, right_lateral: url, ...}
  webglOverlayUrl: string | null,   // Cloudinary URL to webglOverlay.json
  figureUrls: {
    topomap: string | null,
    brainViews: [string],
    annotated: [string]
  },
  metadata: {
    modelVersion: string,
    mneVersion: string,
    nElectrodes: number,
    samplingFreq: number
  },
  processingTime: number | null,    // Seconds
  errorMessage: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Key methods:**
- `createStudy(studyData)` - Create new study
- `findByUploadId(uploadId)` - Find study by uploadId
- `findByPatientId(patientId)` - Get all studies for patient
- `updateProcessingResults(uploadId, results)` - Update study with Python results

#### `patients` Collection

Legacy collection that also stores EEG data in `eegVisuals[]` array.

**Relevant fields:**
```javascript
{
  _id: ObjectId,
  firstName: string,
  lastName: string,
  age: number,
  gender: string,
  dob: string,
  email: string,
  isEpilepsy: boolean,
  comments: string,
  eegVisuals: [
    {
      uploadId: string,
      figUrl: string,
      images: [string],
      uploadDate: string,
      summary: string,
      hotspots: Array,
      brainViews: Object,
      webglOverlayUrl: string
    }
  ]
}
```

### Environment Variables

The backend requires these environment variables (set in `Backend/.env`):

**Required:**
- `MONGODB_URI` - MongoDB connection string (e.g., `mongodb://localhost:27017/epicarehub`)

**Optional:**
- `SESSION_SECRET` - Express session secret (default: "change_me_in_production")
- `EPICARE_INTERNAL_API_KEY` - API key for Python → Node callbacks (if enabled)
- `NODE_API_URL` - Base URL for Node backend (default: `http://localhost:3000`)

### Static Assets

The backend serves static files from `Backend/public/`:

- `Backend/public/models/brain.obj` - Brain mesh (legacy, not used by current 3D viewer)

Frontend has its own brain meshes:
- `Frontend/public/models/brain_lh.obj` - Left hemisphere
- `Frontend/public/models/brain_rh.obj` - Right hemisphere

### Debug Endpoints

**`GET /debug/studies`** - List all studies (useful for debugging)
Returns all studies in `eegStudies` collection with formatted JSON.

**Location:** Check `Backend/routes/index.js` for route configuration.

---

## 3. Python Localization Pipeline

### Overview

The Python pipeline (`Localization-Algorithm/brain_visualizer.py`) is the **core processing engine** that:
1. Detects the input file type and routes to the appropriate pipeline mode
2. Loads and preprocesses EEG/iEEG data
3. Computes electrode activity and identifies seizure hotspots
4. Generates 3D brain visualizations
5. POSTs results back to Node backend

### Pipeline Modes

The pipeline supports **three modes**, auto-detected by file extension:

| Mode | File Type | Example Dataset | Description |
|------|-----------|-----------------|-------------|
| **DEMO** | `.fif` | sample_audvis MEG | Original MEG pipeline with ConvDip model |
| **EPILEPSY_ECOG** | `.vhdr`, `.edf` | Epilepsy ECoG | iEEG/ECoG epilepsy datasets |
| **HUMAN_MTL** | `.h5` (in `human_mtl_units_wm/`) | Boran et al. 2019 | Human MTL single-unit recordings |

**Mode detection logic** (`helper.py:36-107`):
1. Check file extension (primary method)
2. If ambiguous, load file and inspect channel types (MEG vs EEG vs iEEG)

### HUMAN_MTL Pipeline (Focus)

This is the **primary mode** for the 3D brain pipeline demo. It processes Human MTL dataset files.

**Valid dataset file:**
```
Localization-Algorithm/datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5
```

**Pipeline steps** (`helper.py:2324-2509`):

#### Step 1: Load .h5 File

Function: `human_mtl_to_mne_raw(file_path)`

- Opens .h5 file with `h5py`
- Reads datasets:
  - `data_array` - iEEG recordings (shape: `[n_channels, n_samples]`)
  - `sampling_frequency` - Sampling rate (typically 32000 Hz)
  - `labels_electrodes` - Electrode labels (e.g., `['LH1', 'RH2', ...]`)
  - `MNI` - MNI coordinates (shape: `[n_channels, 3]`, in mm)
- Creates MNE `RawArray` object with proper channel info
- Returns: `(raw, coords_mm, labels)`

**Example output:**
```
Loaded 89 channels at 32000 Hz
Duration: 1.8 seconds
MNI coordinates: [[10.5, -20.3, -15.8], [20.1, -18.9, -12.4], ...]
```

#### Step 2: Preprocessing

- Apply high-pass filter (0.5 Hz) to remove slow drifts
- Data is already clean, minimal preprocessing needed

#### Step 3: Compute Electrode Activity

Function: `compute_electrode_activity(raw, tmin, tmax)`

- Extracts data window from `tmin` to `tmax` (e.g., 0-2 seconds)
- For each channel:
  - Compute RMS (root-mean-square) amplitude
  - Normalize to [0, 1] range
- Returns: `activity` array (shape: `[n_channels]`)

**Example:**
```python
activity = np.array([0.12, 0.87, 0.92, 0.65, ...])  # 89 values
```

#### Step 4: Compute Hotspots

Function: `compute_ecog_summary(raw, activity, electrode_positions, n_top=5)`

- Ranks electrodes by activity
- Selects top N electrodes as hotspots
- For each hotspot:
  - Gets channel name (e.g., `RH2`)
  - Gets MNI coordinates (e.g., `[20.5, -25.3, -15.8]`)
  - Estimates brain region from coordinates (e.g., `right hippocampus`)
  - Calculates confidence score (normalized activity)
- Generates summary text (e.g., "Strongest activity in right hippocampus (0.92)")

**Hotspot structure:**
```python
[
  {
    "channel": "RH2",
    "region": "right hippocampus",
    "hemisphere": "right",
    "confidence": 0.92,
    "coordinates": [20.5, -25.3, -15.8]
  },
  ...
]
```

#### Step 5: Generate MNE Brain Snapshots (4 Views)

Function: `generate_ecog_brain_snapshots(raw, hotspots, upload_dir, ...)`

- Creates MNE `Brain` object with FreeSurfer `fsaverage` template
- For each electrode:
  - Converts MNI mm coordinates to FreeSurfer surface space
  - Adds electrode as sphere on brain surface
  - Colors by activity (blue → cyan → green → yellow → red)
- Generates 4 standard views:
  - `left_lateral` - Left side view
  - `right_lateral` - Right side view
  - `top` - Superior (top-down) view
  - `anterior` - Front view
- Saves each view as PNG image
- Uploads images to Cloudinary
- Returns: `brainViews = {left_lateral: url, right_lateral: url, ...}`

**Implementation note:** Uses MNE's `mne.viz.Brain()` API with PyVista backend.

#### Step 6: Create WebGL Overlay JSON

Function: `save_webgl_overlay_json(upload_dir, coords_mm, labels, activity, hotspots)`

**Purpose:** Generate a JSON file for the React Three Fiber 3D viewer with electrode positions and activity data.

**JSON structure:**
```json
{
  "electrodes": [
    {
      "label": "RH2",
      "x": 20.5,
      "y": -25.3,
      "z": -15.8,
      "activity": 0.92,
      "hotspot": true
    },
    ...
  ],
  "hotspots": ["RH2", "LA3", ...],
  "metadata": {
    "nElectrodes": 89,
    "coordinateSystem": "MNI (mm)",
    "uploadId": "human-mtl-bgl-test"
  }
}
```

**Coordinate system:** MNI space in millimeters (no transformation needed for WebGL viewer).

**Output:**
- Saves to `{upload_dir}/webglOverlay.json`
- Uploads to Cloudinary
- Returns: `{overlay_path: "/path/to/webglOverlay.json", overlay_url: "https://..."}`

#### Step 7: Build Request Payload

Constructs JSON payload for Node backend:

```python
request = {
    "patientId": patientId,
    "uploadId": uploadId,
    "figUrl": None,                   # No topomap for HUMAN_MTL
    "matUrl": None,
    "images": [],
    "metadata": {
        "modelVersion": "Human-MTL-Activity-1.0",
        "mneVersion": "1.8.0",
        "nElectrodes": 89,
        "samplingFreq": 32000
    },
    "summary": "Strongest activity in right hippocampus (0.92)...",
    "hotspots": [...],                # List of dicts
    "brainViews": {                   # Cloudinary URLs
        "left_lateral": "https://...",
        "right_lateral": "https://...",
        "top": "https://...",
        "anterior": "https://..."
    },
    "webglOverlayUrl": "https://..."  # Cloudinary URL to JSON
}
```

#### Step 8: POST to Node Backend

- URL: `{NODE_API_URL}/patients/upload`
- Headers: `x-epicare-key: {EPICARE_INTERNAL_API_KEY}`
- Method: POST with JSON payload

**Success:** Node updates study status to `COMPLETED`
**Failure:** Logs error, study remains in `PROCESSING` state

### Environment Variables (Python)

Set in `Localization-Algorithm/.env`:

**Required:**
- `CLOUDINARY_CLOUD_NAME` - Cloudinary account name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `NODE_API_URL` - Node backend URL (e.g., `http://localhost:3000`)

**Optional:**
- `EPICARE_INTERNAL_API_KEY` - API key for Node callbacks

### Running the Pipeline Manually

From `Localization-Algorithm/` directory:

```bash
# Activate conda environment (if using)
conda activate epicare_env

# Run HUMAN_MTL pipeline
python brain_visualizer.py \
  --basePath="/path/to/uploads" \
  --file="datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId="64a1b2c3d4e5f6789" \
  --uploadId="human-mtl-bgl-test" \
  --historic=false
```

**Expected output:**
```
[PIPELINE] Detecting processing mode from file: datasets/human_mtl_units_wm/...
[PIPELINE] Mode: HUMAN_MTL
[HUMAN_MTL] ========================================
[HUMAN_MTL] Processing Human MTL Units WM dataset
[HUMAN_MTL] File: datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5
[HUMAN_MTL] ========================================
[HUMAN_MTL] Loaded 89 channels at 32000.00 Hz
[HUMAN_MTL] Preprocessing...
[HUMAN_MTL] ✓ Applied 0.5 Hz high-pass filter
[HUMAN_MTL] Computing electrode activity...
[HUMAN_MTL] Top 5 active channels:
  1. RH2: 0.920
  2. LA3: 0.870
  ...
[HUMAN_MTL] Generating 3D brain snapshots (4 standard views)...
[HUMAN_MTL] ✓ Generated 4 brain view(s): ['left_lateral', 'right_lateral', 'top', 'anterior']
[HUMAN_MTL] Generating WebGL overlay JSON...
[HUMAN_MTL] ✓ WebGL overlay JSON created at: /path/to/uploads/human-mtl-bgl-test/webglOverlay.json
[HUMAN_MTL] ✓ WebGL overlay URL: https://res.cloudinary.com/.../webglOverlay.json
[HUMAN_MTL] Sending data to Node backend: http://localhost:3000/patients/upload
[HUMAN_MTL] ✓ Node backend callback successful!
[HUMAN_MTL] Pipeline complete!
```

---

## 4. Frontend Brain Visualization

### Component Architecture

The brain visualization system has **three main components**:

1. **Brain.jsx** - Main brain visualization page (route: `/patient/:patientId/brain/:uploadId`)
2. **BrainWebGLViewer.jsx** - Interactive 3D viewer (React Three Fiber)
3. **PatientDetails.jsx** - Patient detail page with study list

### Brain.jsx (Main Page)

**Location:** `Frontend/src/components/Brain.jsx`

**Purpose:** Container page that displays both static MNE snapshots and interactive 3D viewer.

**Key features:**
- Fetches patient and study data from Node API
- **Tab UI** to switch between "Static Views (MNE)" and "Interactive 3D (beta)"
- Shows study metadata (upload date, processing time, status)
- Displays hotspots panel with confidence scores

**Data flow:**

1. Extract `patientId` and `uploadId` from URL params
2. Fetch patient: `GET /patients/:patientId`
3. Fetch studies: `GET /patients/:patientId/studies`
4. Find matching study by `uploadId`
5. Render appropriate tab content

**Feature flag:**
```javascript
const ENABLE_WEBGL_BRAIN = import.meta.env.VITE_ENABLE_WEBGL_BRAIN === "true";
```

Set in `Frontend/.env`:
```bash
VITE_ENABLE_WEBGL_BRAIN=true
```

**Tab logic:**
```javascript
// Show WebGL tab if:
// 1. Feature flag is enabled AND
// 2. Study is HUMAN_MTL mode OR has webglOverlayUrl
const isHumanMtlStudy = study?.metadata?.modelVersion?.includes("Human-MTL");
const hasOverlayHint = !!study?.webglOverlayUrl;
const showWebglTab = ENABLE_WEBGL_BRAIN && (isHumanMtlStudy || hasOverlayHint);
```

**Static Views Tab:**
- Displays `study.brainViews` (MNE-generated snapshots)
- 4 view selector buttons: left_lateral, right_lateral, top, anterior
- Full-size image display for selected view

**Interactive 3D Tab:**
- Renders `<BrainWebGLViewer uploadId={uploadId} study={study} />`

### BrainWebGLViewer.jsx (3D Viewer)

**Location:** `Frontend/src/components/BrainWebGLViewer.jsx`

**Purpose:** Interactive 3D brain viewer with electrode visualization using React Three Fiber.

**Architecture:**

```
BrainWebGLViewer (main component)
├── useEffect: Fetch webglOverlay JSON
├── Canvas (React Three Fiber)
│   ├── BrainMesh (left + right hemispheres)
│   ├── ElectrodePoints (spheres for each electrode)
│   ├── OrbitControls (camera controls)
│   └── CameraController (auto-fit logic)
└── Control Panel (UI above canvas)
    ├── Brain opacity slider
    ├── Show/hide electrodes
    ├── Hotspots-only filter
    └── Reset camera button
```

#### Data Loading

**Step 1: Fetch WebGL Overlay JSON**

```javascript
useEffect(() => {
  const overlayUrl = study?.webglOverlayUrl;
  if (!overlayUrl) return;

  fetch(overlayUrl)
    .then(res => res.json())
    .then(data => {
      const electrodes = data.electrodes || [];
      const hotspotLabels = new Set(data.hotspots || []);

      const points = electrodes.map(electrode => {
        // Convert MNI mm → scene coordinates
        const scale = 0.01; // 1mm = 0.01 scene units
        const position = [
          electrode.x * scale,
          electrode.z * scale,   // Z → Y (up)
          -electrode.y * scale   // Y → -Z (depth)
        ];

        return {
          label: electrode.label,
          position,
          activity: electrode.activity,
          isHotspot: hotspotLabels.has(electrode.label)
        };
      });

      setElectrodePoints(points);
    });
}, [study?.webglOverlayUrl]);
```

**Coordinate transformation:**
- Input: MNI coordinates in mm (e.g., `x=20.5, y=-25.3, z=-15.8`)
- Scale: `0.01` (to match brain mesh scale)
- Rotation applied to brain mesh aligns Z→Y axis (up) and Y→-Z (depth)
- Output: `[x*0.01, z*0.01, -y*0.01]` in Three.js world space

#### BrainMesh Component

**Purpose:** Load and render FreeSurfer pial surface meshes (left + right hemispheres).

**Mesh files:**
- `Frontend/public/models/brain_lh.obj` - Left hemisphere (FreeSurfer fsaverage pial surface)
- `Frontend/public/models/brain_rh.obj` - Right hemisphere

**Implementation:**
```javascript
function BrainMesh({ opacity, onBrainLoaded, brainGroupRef }) {
  const lh = useLoader(OBJLoader, "/models/brain_lh.obj");
  const rh = useLoader(OBJLoader, "/models/brain_rh.obj");

  const brainGroup = useMemo(() => {
    const group = new THREE.Group();

    // Clone and apply material to left hemisphere
    const lhClone = lh.clone();
    lhClone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.8,
          metalness: 0.1,
          transparent: true,
          opacity: opacity,
          side: THREE.DoubleSide
        });
      }
    });

    // Same for right hemisphere
    const rhClone = rh.clone();
    // ... (similar material setup)

    group.add(lhClone);
    group.add(rhClone);

    // Scale and rotate to match MNI space
    group.scale.set(0.01, 0.01, 0.01);
    group.rotation.x = -Math.PI / 2;  // Align Z→Y
    group.rotation.z = Math.PI;        // Flip front/back

    return group;
  }, [lh, rh, opacity]);

  // Compute bounding box for camera auto-fit
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(brainGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = size.length() / 2;
    onBrainLoaded({ box, size, center, radius });
  }, [brainGroup]);

  return <primitive object={brainGroup} />;
}
```

**Material properties:**
- Base color: Light gray (`#dddddd`)
- Transparent with controllable opacity (slider)
- Double-sided rendering (show inner surface)

#### ElectrodePoints Component

**Purpose:** Render electrode spheres with activity-based coloring.

**Color mapping:**
```javascript
// Activity value 0.0 → 1.0 maps to color gradient:
// Blue (0.0) → Cyan (0.25) → Green (0.5) → Yellow (0.75) → Red (1.0)
const activityToColor = (activity, isHotspot) => {
  if (isHotspot) return new THREE.Color(1, 0, 0); // Red for hotspots

  const value = Math.max(0, Math.min(1, activity));
  if (value < 0.25) {
    const t = value / 0.25;
    return new THREE.Color(0, t, 1); // Blue → Cyan
  } else if (value < 0.5) {
    const t = (value - 0.25) / 0.25;
    return new THREE.Color(0, 1, 1 - t); // Cyan → Green
  } else if (value < 0.75) {
    const t = (value - 0.5) / 0.25;
    return new THREE.Color(t, 1, 0); // Green → Yellow
  } else {
    const t = (value - 0.75) / 0.25;
    return new THREE.Color(1, 1 - t, 0); // Yellow → Red
  }
};
```

**Sphere sizing:**
- Base radius: `brainScale * 0.015` (1.5% of brain size)
- Hotspot radius: `brainScale * 0.025` (2.5% of brain size)
- Max radius cap: `brainScale * 0.04` (prevent over-sized spheres)
- Hover/selection: Scale up by 1.2x or 1.3x

**Interaction:**
```javascript
<mesh
  position={pt.position}
  onPointerOver={(e) => {
    e.stopPropagation();
    setHoveredElectrode(pt);
  }}
  onPointerOut={(e) => {
    e.stopPropagation();
    setHoveredElectrode(null);
  }}
  onClick={(e) => {
    e.stopPropagation();
    setSelectedElectrode(pt);
  }}
>
  <sphereGeometry args={[radius, 16, 16]} />
  <meshStandardMaterial
    color={activityToColor(pt.activity, pt.isHotspot)}
    emissive={pt.isHotspot || isSelected ? "#ff4400" : "#000000"}
    emissiveIntensity={pt.isHotspot || isSelected ? 0.4 : 0}
  />
</mesh>
```

#### CameraController Component

**Purpose:** Auto-fit camera to brain bounds and handle reset button.

**Logic:**
```javascript
function CameraController({ controlsRef, brainBounds, autoFitTrigger }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!brainBounds || !controlsRef.current) return;

    const { center, radius } = brainBounds;

    // Position camera at comfortable distance
    const distance = radius * 2.2;
    camera.position.set(center.x, center.y, center.z + distance);
    camera.lookAt(center);

    // Update controls target
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  }, [brainBounds, autoFitTrigger]);

  return null;
}
```

**Trigger:** `autoFitTrigger` counter increments when:
1. Brain mesh first loads (initial fit)
2. User clicks "Reset to Fit" button

#### OrbitControls

**Purpose:** Allow user to rotate, zoom, and pan the camera.

**Configuration:**
```javascript
<OrbitControls
  ref={controlsRef}
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  enableDamping={true}        // Smooth camera motion
  dampingFactor={0.08}
  rotateSpeed={0.7}
  zoomSpeed={0.8}
  panSpeed={0.8}
  minDistance={brainScale * 0.6}   // Prevent too close
  maxDistance={brainScale * 5.0}   // Prevent too far
/>
```

**User controls:**
- **Left-click + drag**: Rotate camera around brain
- **Scroll**: Zoom in/out
- **Right-click + drag**: Pan camera
- **Hover over electrode**: Show tooltip with label and activity
- **Click electrode**: Select and persist tooltip

### UI Controls

**Brain Opacity Slider:**
- Range: 0.1 (glass) → 1.0 (solid)
- Step: 0.05
- Dynamically updates brain mesh material opacity

**Show/Hide Electrodes:**
- Toggle button to show/hide all electrode spheres
- When hidden, 3D viewer shows only brain mesh

**Hotspots Only Filter:**
- When enabled, shows only electrodes marked as hotspots
- Disabled state when "Show Electrodes" is off

**Reset to Fit:**
- Triggers camera auto-fit to brain bounds
- Useful after user pans/zooms to weird angles

**Info Panel:**
- Shows selected/hovered electrode details:
  - Label (e.g., `RH2`)
  - Activity percentage (e.g., `92.0%`)
  - Hotspot badge (if applicable)

### Dark Mode Support

All components adapt to light/dark theme:
- Canvas background: Always dark (`#0f172a`) for 3D visibility
- Control panel: Light gray in light mode, dark gray in dark mode
- Text colors: Adjusted for contrast
- Button states: Emerald green active, slate gray inactive

---

## 5. UI & Theming

### Theme System

EpiCareHub uses **Tailwind CSS with custom dark mode configuration**.

**Implementation:**
- Theme context provider: `Frontend/src/contexts/ThemeContext.jsx`
- Theme toggle: `Frontend/src/components/Navbar.jsx`
- Dark mode enabled via `dark:` Tailwind classes

**How it works:**
1. User clicks theme toggle in Navbar
2. Theme context updates `darkMode` state
3. Context adds/removes `dark` class on `<html>` element
4. Tailwind applies `dark:` variants (e.g., `dark:bg-slate-900`)

**Example usage in components:**
```jsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  Content here
</div>
```

### Brain Page Theming

**Brain.jsx:**
- Background: `bg-emerald-50 dark:bg-slate-950` (light emerald vs dark slate)
- Cards: `bg-white dark:bg-slate-900` with `border-slate-800` in dark mode
- Shadows: Lighter in light mode, heavier black shadows in dark mode

**BrainWebGLViewer.jsx:**
- Canvas background: **Always dark** (`#0f172a`) for 3D visibility
- Control panel: Adapts to theme with `dark:bg-slate-900`, `dark:text-slate-100`
- Buttons: Emerald green active state, slate gray inactive

**Why canvas stays dark:** 3D brain mesh and electrodes are easier to see against dark background, regardless of UI theme.

### Color Palette

**Primary (Emerald):**
- Light mode: `emerald-600` (#059669)
- Dark mode: `emerald-400` (#34d399)
- Usage: Buttons, active states, accents

**Neutral (Slate):**
- Light mode: `slate-900` (text), `slate-50` (backgrounds)
- Dark mode: `slate-100` (text), `slate-950` (backgrounds)

**Status colors:**
- Success: `emerald-100/700` (light/dark)
- Warning: `amber-100/700`
- Error: `rose-100/700`

### Loading States

All major components have loading skeletons:
- **Patients.jsx**: Skeleton table rows with shimmer animation
- **PatientDetails.jsx**: Skeleton cards with pulsing effect
- **Brain.jsx**: Spinner with "Loading brain view..." message

**Skeleton example:**
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-3" />
  <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-16" />
</div>
```

### Error States

Components show clear error messages with retry options:
- **Brain.jsx**: "Unable to Load Study" card with back button
- **BrainWebGLViewer.jsx**: "Failed to load 3D viewer" with error details
- **PatientDetails.jsx**: Snackbar notifications for upload errors

---

## 6. How to Run and Test

### Prerequisites

- Node.js v16+ and npm
- Python 3.8+ with conda (recommended)
- MongoDB 4.4+ running locally or remote connection
- Cloudinary account (for image uploads)

### Step 1: Start MongoDB

**Local MongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Verify MongoDB is running:**
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

### Step 2: Set Up Backend

```bash
cd Backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/epicarehub
SESSION_SECRET=your_secret_here_change_in_production
EPICARE_INTERNAL_API_KEY=test-api-key-12345
NODE_API_URL=http://localhost:3000
EOF

# Start backend server
npm run dev
```

**Expected output:**
```
Server listening on port 3000
MongoDB Connected: localhost
```

**Test backend:**
```bash
curl http://localhost:3000/patients/statistics
# Should return JSON with patient stats
```

### Step 3: Set Up Frontend

```bash
cd Frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:8000
VITE_ENABLE_WEBGL_BRAIN=true
VITE_EPICARE_DEV_MODE=false
EOF

# Start frontend dev server
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open in browser:** `http://localhost:5173`

### Step 4: Set Up Python Environment

```bash
cd Localization-Algorithm

# Create conda environment (recommended)
conda create -n epicare_env python=3.9
conda activate epicare_env

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_API_URL=http://localhost:3000
EPICARE_INTERNAL_API_KEY=test-api-key-12345
EOF
```

### Step 5: Run HUMAN_MTL Pipeline (Demo)

**Prerequisites:**
1. Backend and frontend running
2. MongoDB running
3. Conda environment activated
4. Valid .h5 dataset file available

**Create a test patient first** (via frontend UI):
1. Navigate to http://localhost:5173
2. Click "Add patient"
3. Fill form: First Name: "Test", Last Name: "Patient", etc.
4. Submit → Note the patient ID from browser URL

**Run pipeline from terminal:**
```bash
cd Localization-Algorithm

# Example patient ID: 675847b2c1234567890abcdef
# Example uploadId: human-mtl-bgl-test

python brain_visualizer.py \
  --basePath="uploads" \
  --file="datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId="675847b2c1234567890abcdef" \
  --uploadId="human-mtl-bgl-test" \
  --historic=false
```

**Expected pipeline output:**
```
[PIPELINE] Detecting processing mode from file: datasets/human_mtl_units_wm/...
[PIPELINE] Mode: HUMAN_MTL
[HUMAN_MTL] ========================================
[HUMAN_MTL] Processing Human MTL Units WM dataset
[HUMAN_MTL] Loaded 89 channels at 32000.00 Hz
[HUMAN_MTL] Preprocessing...
[HUMAN_MTL] ✓ Applied 0.5 Hz high-pass filter
[HUMAN_MTL] Computing electrode activity...
[HUMAN_MTL] Top 5 active channels:
  1. RH2: 0.920
  2. LA3: 0.870
  3. LH5: 0.850
  4. RA1: 0.810
  5. RH8: 0.790
[HUMAN_MTL] Computing hotspots...
[HUMAN_MTL] Summary: Strongest activity in right hippocampus (0.92), followed by left amygdala (0.87), left hippocampus (0.85), right amygdala (0.81), and right hippocampus (0.79).
[HUMAN_MTL] Hotspots: 5 detected
  [1] RH2 - confidence: 0.920
  [2] LA3 - confidence: 0.870
  [3] LH5 - confidence: 0.850
  [4] RA1 - confidence: 0.810
  [5] RH8 - confidence: 0.790
[HUMAN_MTL] Generating 3D brain snapshots (4 standard views)...
[MNE] Saving brain snapshot: left_lateral
[MNE] Saving brain snapshot: right_lateral
[MNE] Saving brain snapshot: top
[MNE] Saving brain snapshot: anterior
[HUMAN_MTL] ✓ Generated 4 brain view(s): ['left_lateral', 'right_lateral', 'top', 'anterior']
[HUMAN_MTL] Generating WebGL overlay JSON...
[HUMAN_MTL] ✓ WebGL overlay JSON created at: uploads/human-mtl-bgl-test/webglOverlay.json
[HUMAN_MTL] ✓ Uploading to Cloudinary...
[HUMAN_MTL] ✓ WebGL overlay URL: https://res.cloudinary.com/.../webglOverlay.json
[HUMAN_MTL] Sending data to Node backend: http://localhost:3000/patients/upload
[HUMAN_MTL] ✓ Node backend callback successful!
[HUMAN_MTL] ✓ Response: {'success': True, 'message': 'Operation Successful', ...}
[HUMAN_MTL] Pipeline complete!
[HUMAN_MTL] ========================================
```

### Step 6: View Results in Frontend

**Method 1: Patient Details Page**
1. Navigate to http://localhost:5173
2. Click on "Test Patient" in patient list
3. URL: `http://localhost:5173/patient/675847b2c1234567890abcdef`
4. Scroll to "Previous EEG Studies" section
5. Find study with uploadId `human-mtl-bgl-test`
6. Click "3D Brain" button

**Method 2: Direct Brain View URL**
```
http://localhost:5173/patient/675847b2c1234567890abcdef/brain/human-mtl-bgl-test
```

**What you should see:**
- **Static Views (MNE) tab:**
  - 4 view selector buttons: left_lateral, right_lateral, top, anterior
  - Large brain image with colored electrode spheres
  - Hotspots highlighted in red

- **Interactive 3D (beta) tab:**
  - 3D brain mesh (left + right hemispheres)
  - Colored electrode spheres (blue → red based on activity)
  - Hotspots glow with red emissive color
  - Control panel:
    - Brain opacity slider (try setting to 0.3 for glass brain)
    - Show/hide electrodes toggle
    - Hotspots-only filter
    - Reset to Fit button
  - Mouse controls:
    - Left-drag to rotate
    - Scroll to zoom
    - Right-drag to pan
    - Hover over electrodes to see labels
    - Click to select

**Debugging tips:**

If 3D viewer shows "WebGL overlay not available":
1. Check browser console for fetch errors
2. Verify `study.webglOverlayUrl` exists in study document:
   ```bash
   # MongoDB shell
   mongosh
   use epicarehub
   db.eegStudies.findOne({uploadId: "human-mtl-bgl-test"})
   # Should have webglOverlayUrl field
   ```
3. Try fetching overlay JSON directly in browser:
   - Copy URL from `webglOverlayUrl` field
   - Open in new tab → should show JSON with electrodes array

If brain mesh doesn't load:
1. Check browser console for OBJ loader errors
2. Verify mesh files exist:
   ```bash
   ls Frontend/public/models/
   # Should show brain_lh.obj and brain_rh.obj
   ```

### Demo UploadIds for Testing

**Valid demo uploadIds** (if pipeline already run):
- `human-mtl-bgl-test` - Basic test run
- `human-mtl-r3f-test` - React Three Fiber viewer test

**To create new demo:**
1. Run pipeline with unique uploadId (e.g., `human-mtl-demo-2025-12-10`)
2. Use same patient ID
3. Pipeline will create new study in database

---

## 7. Limitations & Future Work

### Current Limitations

#### Dataset Limitations
- **Only one valid dataset file:** `Data_Subject_01_Session_01.h5` is currently available
- **No other subjects:** Boran et al. dataset has multiple subjects, but only Subject 1 Session 1 is tested
- **Single trial:** Each .h5 file contains one short trial (~1-2 seconds)

#### Brain Mesh Quality
- **Low-poly FreeSurfer meshes:** Current OBJ models are decimated for performance
- **No cortical labels:** Brain surface is generic, no anatomical parcellation shown
- **No subcortical structures:** Only cortical surface, no hippocampus/amygdala meshes (even though electrodes are in MTL)

#### 3D Viewer Features
- **No trajectory lines:** Depth electrode trajectories not shown
- **No cross-sections:** Can't slice brain to see internal electrodes
- **No time-series animation:** Activity is static, no temporal evolution
- **Basic camera presets:** Only "Reset to Fit", no anatomical view presets (e.g., "Left Temporal View")

#### Performance
- **Large electrode counts:** 100+ electrodes may cause frame rate drops on older GPUs
- **No LOD (level of detail):** Brain mesh always rendered at full resolution
- **No clustering:** Many nearby electrodes render as overlapping spheres

### Future Work

#### Short-term Improvements
1. **Add more dataset files:**
   - Test with other subjects from Boran et al. dataset
   - Add support for other iEEG/ECoG datasets

2. **Better camera presets:**
   - "Left Temporal View" - side view focused on left MTL
   - "Hippocampal View" - zoomed into hippocampus region
   - "All Hotspots View" - auto-frame all hotspots

3. **Electrode labels on hover:**
   - Show anatomical region (e.g., "Right Hippocampus CA1")
   - Show raw MNI coordinates

4. **Color legend:**
   - Show color scale for activity (Blue=0% → Red=100%)
   - Toggle between activity and hotspot coloring

#### Medium-term Enhancements
1. **High-quality brain meshes:**
   - Use Freesurfer pial surfaces with higher triangle count
   - Add subcortical structures (hippocampus, amygdala, thalamus)
   - Cortical parcellation colors (Desikan-Killiany atlas)

2. **Depth electrode trajectories:**
   - Draw lines from cortical entry point to depth contact
   - Show electrode shaft as cylinder

3. **Time-series visualization:**
   - Animate electrode activity over time
   - Timeline scrubber to select time window
   - Play/pause controls

4. **Multi-study comparison:**
   - Side-by-side 3D viewers for pre/post surgery
   - Overlay multiple studies on same brain

#### Long-term Vision
1. **Real-time EEG streaming:**
   - Connect to live EEG acquisition system
   - Stream activity data to 3D viewer
   - Real-time seizure detection alerts

2. **Surgical planning mode:**
   - Import patient-specific MRI brain mesh
   - Plan electrode placement with collision detection
   - Export trajectory plan for surgical navigation

3. **VR/AR support:**
   - WebXR integration for VR headsets
   - AR overlay on patient's head during surgery
   - Hand tracking for intuitive brain rotation

4. **Collaborative viewing:**
   - Multi-user 3D viewer with shared camera
   - Real-time annotations (draw on brain, place markers)
   - Video conferencing integration for surgical planning

---

## Appendix: Quick Reference

### Important File Locations

**Frontend:**
- `Frontend/src/components/Brain.jsx` - Main brain visualization page
- `Frontend/src/components/BrainWebGLViewer.jsx` - Interactive 3D viewer
- `Frontend/src/components/PatientDetails.jsx` - Patient detail page
- `Frontend/public/models/brain_lh.obj` - Left hemisphere mesh
- `Frontend/public/models/brain_rh.obj` - Right hemisphere mesh

**Backend:**
- `Backend/routes/patients.js` - Patient/study API routes
- `Backend/data/eegStudies.js` - EEG study data layer
- `Backend/app.js` - Express app config

**Python:**
- `Localization-Algorithm/brain_visualizer.py` - Main pipeline script
- `Localization-Algorithm/helper.py` - Pipeline functions
- `Localization-Algorithm/datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5` - Demo dataset

### Key URLs (Local Development)

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Patient list: `http://localhost:5173/patients`
- Patient details: `http://localhost:5173/patient/:patientId`
- Brain view: `http://localhost:5173/patient/:patientId/brain/:uploadId`
- Dashboard: `http://localhost:5173/dashboard`

### Environment Variables Summary

**Backend (.env):**
```bash
MONGODB_URI=mongodb://localhost:27017/epicarehub
SESSION_SECRET=your_secret_here
EPICARE_INTERNAL_API_KEY=test-api-key-12345
NODE_API_URL=http://localhost:3000
```

**Frontend (.env):**
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:8000
VITE_ENABLE_WEBGL_BRAIN=true
VITE_EPICARE_DEV_MODE=false
```

**Python (.env):**
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_API_URL=http://localhost:3000
EPICARE_INTERNAL_API_KEY=test-api-key-12345
```

### Common Commands

**Backend:**
```bash
npm run dev          # Start dev server (nodemon)
npm start            # Start production server
npm test             # Run tests
```

**Frontend:**
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

**Python:**
```bash
conda activate epicare_env   # Activate environment
python brain_visualizer.py --help   # Show help
```

---

**Questions or Issues?**

If you encounter problems:
1. Check browser console for errors
2. Check backend terminal for Node.js logs
3. Check Python terminal for pipeline errors
4. Verify all environment variables are set
5. Ensure MongoDB is running
6. Verify Cloudinary credentials are valid

For code changes:
1. Frontend hot-reloads automatically (Vite)
2. Backend restarts on file changes (nodemon)
3. Python requires manual re-run

Good luck, and happy coding! 🧠✨
