# EpiCareHub Python Pipeline Analysis

**Date**: 2025-12-08
**Purpose**: Document current pipeline assumptions before adapting for epilepsy ECoG data

---

## Current Pipeline Architecture

### 1. Entry Point: `brain_api.py`

**Endpoints**:
- `POST /visualize_brain` - Main processing endpoint
  - Accepts: `.fif` file upload, patientId, optional uploadId
  - Spawns subprocess: `python brain_visualizer.py --basePath ... --file ... --patientId ... --uploadId ... --historic False`

- `POST /visualize_brain_dev` - Dev mode (placeholder data, no MNE processing)

**Current Limitations**:
- No `mode` parameter to distinguish DEMO vs EPILEPSY_ECOG
- Always uses same subprocess command structure

---

### 2. Orchestrator: `brain_visualizer.py`

**Flow**:
1. Parse CLI arguments (basePath, file, patientId, uploadId, historic)
2. Hard-coded: `event_id = "LA"` (line 47)
3. Call `save_evoked_data()` → preprocessing & epoching
4. Call `ConvDip_ESI()` → ML model inference (1984-dim output)
5. Call `compute_localization_summary()` → generate summary + hotspots
6. Call `brain3d()` → visualize on fsaverage brain, upload images, POST to Node

**Hard-coded Assumptions**:
- Event ID: `"LA"` (auditory left)
- No conditional logic for different data types

---

### 3. Core Processing: `helper.py`

#### 3.1 `data_preprocessing(file)`
**What it does**:
- Reads `.fif` file with MNE
- Band-pass filter: **1–30 Hz**
- Resample to **480 Hz**
- Find events from channel **"STI 014"** (trigger channel in sample_audvis)

**Hard-coded**:
- `l_freq=1, h_freq=30` (line 291-292)
- `sfreq_resample=480` (line 293)
- `stim_channel="STI 014"` (line 295)

#### 3.2 `save_evoked_data(uploadId, file, event, path)`
**What it does**:
- Call `data_preprocessing()`
- Create epochs using `event_dict = {"LA": 1, "RA": 2, "LV": 3, "RV": 4}` (line 31-36)
- **Bad channels**: `'MEG 2443', 'EEG 053'` (line 314)
- Epoch window: **tmin=-0.1, tmax=0.4** (line 312-313)
- Baseline: **(None, 0)** (line 315)
- Rejection thresholds: `grad=4000e-13, mag=4e-12, eog=150e-6` (line 316)
- Average epochs → evoked response
- Plot topomap at times [0.0, 0.08, 0.1, 0.12, 0.2] (line 325)
- Save as PNG and MAT file
- Upload to Cloudinary

**Hard-coded**:
- Event codes specific to sample_audvis dataset
- MEG-specific rejection thresholds
- Specific bad channels from sample dataset
- Channel picks: `meg=True, eeg=True, eog=True` (line 317-318)

#### 3.3 `ConvDip_ESI(task_id, path)`
**What it does**:
- Load test data from `{path}/data/EEG_{task_id}.mat`
- Reshape EEG data using `eeg_maptable.mat` → **12x14 grid** (line 209, 248)
- Load pre-trained ConvDip model from `./model/sample/real_model/net_params_best.pkl` (line 265-266)
- Run inference → **1984-dimensional** source prediction
- Save result to `{path}/result/Test_EEG_{task_id}.mat`

**Hard-coded**:
- Map directory: `'./data/eeg_maptable.mat'` (line 209)
- Model directory: `'./model/sample/real_model'` (line 212)
- Input grid size: **12x14** (102 channels after mapping)
- Output size: **1984 sources**
- Task IDs: Only accepts `['LA', 'RA', 'LV', 'RV']` (line 234-236)

#### 3.4 `get_stc(file)`
**What it does**:
- Read raw .fif file
- Bad channel: `'MEG 2443'` (line 92)
- Find events, create epochs for **event_id=1** (LA)
- Compute data covariance (0.01–0.25 s) and noise covariance (baseline)
- **Load forward solution**: `'./data/meg-fwd.fif'` (line 124)
- Create LCMV beamformer filters
- Apply filters to evoked data → return SourceEstimate (stc)

**Hard-coded**:
- Forward solution path: `./data/meg-fwd.fif` (MEG-specific, fsaverage)
- Event ID: 1 (LA)
- Assumes **MEG data** (picks meg, eog)
- Source space: **1984 vertices** (from forward solution)

#### 3.5 `brain3d(file, uploadId, s_pred, directory, request, hemi)`
**What it does**:
- Call `get_stc(file)` to get template stc structure
- Replace `stc.data` with ConvDip prediction `s_pred`
- Load MNE sample dataset subjects_dir (fsaverage brain)
- Visualize on **fsaverage** brain surface
- Generate **11 PNG views**: medial, rostral, caudal, dorsal, ventral, frontal, parietal, axial, sagittal, coronal, lateral
- Upload each PNG to Cloudinary
- POST to Node backend `/patients/upload` with:
  - `patientId`, `uploadId`, `figUrl`, `matUrl`, `images`, `metadata`, `summary`, `hotspots`

**Hard-coded**:
- Subject: **fsaverage** (from MNE sample dataset)
- Source space: **1984 vertices** (from MEG forward solution)
- 11 fixed view angles

#### 3.6 `compute_localization_summary(stc_or_data, n_top=3)`
**What it does** (PHASE 5):
- Takes 1984-dim activation vector or stc
- Load forward solution to get source positions
- Normalize activation to [0, 1]
- Find top N activated sources
- Map to brain regions using heuristic coordinate-based logic
- Generate summary string and hotspots list

**Heuristic Region Mapping** (line 573-614):
- `_estimate_region_from_coords(x, y, z)`:
  - Uses simple if/else rules based on MNI coordinates
  - **Not anatomically precise** (no atlas parcellation)
  - Regions: temporal, frontal, parietal, occipital, central

**Hard-coded**:
- Forward solution: `./data/meg-fwd.fif`
- Assumes 1984 sources

---

## Key Dataset Assumptions

### Sample Audvis Dataset (Current)
- **Type**: MEG (magnetoencephalography)
- **Channels**: ~102 MEG gradiometers + magnetometers + 60 EEG + EOG
- **Events**: Trigger channel "STI 014"
- **Event codes**:
  - 1 = LA (left auditory)
  - 2 = RA (right auditory)
  - 3 = LV (left visual)
  - 4 = RV (right visual)
- **Sampling rate**: 600 Hz (resampled to 480 Hz)
- **Task**: Auditory/visual evoked potentials
- **Forward model**: MEG-specific, 1984 dipole sources on fsaverage cortical surface

### Expected Epilepsy ECoG Dataset Differences
- **Type**: ECoG (electrocorticography) - invasive electrodes on cortex surface
- **Channels**: Varies (typically 64-128 ECoG grid electrodes)
- **Events**: Annotations (e.g., "seizure onset", "spike", "discharge")
- **Event codes**: NOT trigger-based, uses MNE Annotations
- **Sampling rate**: Varies (often 512 Hz, 1024 Hz, or higher)
- **Task**: Spontaneous seizure activity (not evoked responses)
- **Forward model**: Patient-specific electrode placement (no generic forward solution)

---

## Critical Incompatibilities

1. **Event Detection**:
   - Current: `mne.find_events(raw, stim_channel="STI 014")`
   - Epilepsy: Must use `raw.annotations` to find seizure markers

2. **Forward Solution**:
   - Current: Generic MEG forward model (`meg-fwd.fif`, 1984 sources)
   - Epilepsy: ECoG has no forward model; electrodes are directly on cortex
   - ConvDip may not apply directly to ECoG grid layouts

3. **Channel Types**:
   - Current: Expects MEG + EEG channels
   - Epilepsy: ECoG channels (may be labeled as 'ecog' or 'eeg' depending on dataset)

4. **Event Structure**:
   - Current: Discrete event codes (1, 2, 3, 4)
   - Epilepsy: Continuous annotations with onset/duration

5. **Localization Paradigm**:
   - Current: Distributed source imaging (MEG → cortical surface)
   - Epilepsy: Direct electrode recordings (no inverse problem)

---

## Output Contract (must preserve for Node backend)

All modes must return:
```json
{
  "patientId": "string",
  "uploadId": "string",
  "figUrl": "cloudinary_url",
  "matUrl": "cloudinary_url",
  "images": ["array", "of", "11", "brain", "view", "urls"],
  "metadata": {
    "modelVersion": "string",
    "mneVersion": "string"
  },
  "summary": "string (e.g., 'Strongest activity in left temporal...')",
  "hotspots": [
    {
      "region": "string",
      "hemisphere": "L or R",
      "confidence": 0.0-1.0,
      "coordinates": [x, y, z]
    }
  ]
}
```

---

## Next Steps

1. **Explore epilepsy ECoG dataset** on disk
2. **Design two-mode strategy** (DEMO vs EPILEPSY_ECOG)
3. **Implement mode parameter** in brain_visualizer.py
4. **Create EPILEPSY_ECOG processing path**:
   - Use annotations instead of events
   - Compute simple electrode-based activity map
   - Skip ConvDip if incompatible
   - Map electrodes to approximate regions
   - Generate compatible output for Node
5. **Preserve DEMO mode** exactly as-is
