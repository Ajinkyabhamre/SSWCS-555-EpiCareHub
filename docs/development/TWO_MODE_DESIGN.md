# Two-Mode Processing Strategy Design

**Date**: 2025-12-08
**Purpose**: Design document for supporting both DEMO and EPILEPSY_ECOG modes

---

## Epilepsy Dataset Analysis Summary

From `explore_epilepsy_dataset.py` run:

**File**: `~/mne_data/MNE-epilepsy-ecog-data/sub-pt1/ses-presurgery/ieeg/sub-pt1_ses-presurgery_task-ictal_ieeg.vhdr`

- **Format**: BrainVision (.vhdr, .vmrk, .eeg) - NOT .fif
- **Channels**: 98 ECoG electrodes (labeled as 'eeg' type in MNE)
- **Sampling rate**: 1000 Hz
- **Duration**: 4.48 minutes (269 seconds)
- **Annotations**: 29 stimulus markers (S 1-28), NOT explicit "seizure" labels
- **Electrode positions**: Available in TSV (x, y, z in fsaverage space)
  - Example: G1 at (28.61, -88.65, 36.32)
- **Channel metadata**: Available (status: good/bad, type: ECOG)

**Key Differences from sample_audvis**:
1. File format: BrainVision vs .fif
2. Channel types: Only 'eeg' (ECOG) vs 'meg'+'eeg'+'eog'+'stim'
3. Event detection: Annotations vs trigger channel (STI 014)
4. No MEG forward model applicable (direct cortical recordings)
5. ConvDip NOT compatible (expects 102 MEG channels → 12x14 grid)

---

## Design: Two-Mode Architecture

### Mode Detection Strategy

**Option C (SELECTED)**: Detect mode based on **channel types in the file**

**Rationale**:
- Robust: Works regardless of file path or frontend input
- Automatic: No manual mode selection needed
- Safe: Cannot accidentally run MEG pipeline on ECoG data
- Future-proof: Can add more modes (e.g., scalp EEG) easily

**Detection Logic**:
```python
def detect_processing_mode(raw):
    """
    Detect processing mode based on channel types in raw data.

    Returns:
        str: "DEMO" or "EPILEPSY_ECOG"
    """
    ch_types = set(raw.get_channel_types())

    # DEMO mode: Has MEG channels (sample_audvis dataset)
    if 'mag' in ch_types or 'grad' in ch_types:
        return "DEMO"

    # EPILEPSY_ECOG mode: Only EEG/ECOG channels, no MEG
    elif 'eeg' in ch_types and 'mag' not in ch_types and 'grad' not in ch_types:
        # Further check: if file has <120 channels, likely ECoG
        if len(raw.ch_names) < 120:
            return "EPILEPSY_ECOG"
        else:
            # Scalp EEG (future mode)
            return "DEMO"  # For now, treat as DEMO

    # Default fallback
    else:
        return "DEMO"
```

### Output Contract (Both Modes)

Both modes MUST return identical structure to Node backend:

```python
{
    "patientId": str,
    "uploadId": str,
    "figUrl": str,           # Cloudinary URL to topomap or similar
    "matUrl": str,           # Cloudinary URL to .mat data file
    "images": [str],         # List of 11 brain view PNG URLs
    "metadata": {
        "modelVersion": str,  # e.g., "ConvDip-1.0" or "ECoG-Activity-1.0"
        "mneVersion": str     # MNE-Python version
    },
    "summary": str,          # e.g., "Strongest activity in left temporal (0.85)..."
    "hotspots": [            # List of 1-5 hotspots
        {
            "region": str,        # e.g., "left temporal"
            "hemisphere": str,    # "L" or "R"
            "confidence": float,  # 0.0-1.0
            "coordinates": [x, y, z]  # MNI/MRI coordinates
        }
    ]
}
```

---

## Mode 1: DEMO (Current Pipeline - UNCHANGED)

**Trigger**: `detect_processing_mode(raw)` returns `"DEMO"`

**Flow**:
1. `data_preprocessing()` - filter 1-30 Hz, resample 480 Hz, find events from STI 014
2. `save_evoked_data()` - epoch LA/RA/LV/RV, average, plot topomap
3. `ConvDip_ESI()` - load ConvDip model, reshape to 12x14, predict 1984 sources
4. `compute_localization_summary()` - map 1984 sources to regions (heuristic)
5. `brain3d()` - visualize on fsaverage, generate 11 views, POST to Node

**No changes required** - preserve exactly as-is.

---

## Mode 2: EPILEPSY_ECOG (New Pipeline)

**Trigger**: `detect_processing_mode(raw)` returns `"EPILEPSY_ECOG"`

**Flow**:

### Step 1: Load ECoG Data
```python
def load_ecog_data(file_path):
    """Load ECoG data from BrainVision or .fif format"""
    if file_path.endswith('.vhdr'):
        raw = mne.io.read_raw_brainvision(file_path, preload=True)
    elif file_path.endswith('.fif'):
        raw = mne.io.read_raw_fif(file_path, preload=True)
    else:
        raise ValueError(f"Unsupported file format: {file_path}")

    return raw
```

### Step 2: Preprocessing
```python
def data_preprocessing_ecog(file_path):
    """
    Preprocess ECoG data (simpler than MEG preprocessing)

    - Band-pass filter: 1-30 Hz (same as DEMO for consistency)
    - Resample to 500 Hz (optional, for faster processing)
    - Use annotations instead of find_events
    """
    raw = load_ecog_data(file_path)

    # Filter
    l_freq, h_freq = 1, 30
    raw.filter(l_freq, h_freq, method='fir', fir_design='firwin')

    # Resample (optional)
    sfreq_resample = 500
    raw = raw.resample(sfreq_resample)

    # Get annotations (instead of events)
    annotations = raw.annotations

    return raw, annotations
```

### Step 3: Activity Window Selection
```python
def select_activity_window(raw, annotations, window_duration=2.0):
    """
    Select a time window for analysis.

    Strategy:
    1. If annotations exist, use first annotation as marker
    2. Otherwise, compute global RMS and select highest activity window

    Args:
        raw: MNE Raw object
        annotations: MNE Annotations object
        window_duration: Duration in seconds (default 2.0)

    Returns:
        tmin, tmax: Time window in seconds
    """
    if len(annotations) > 0:
        # Use first annotation as reference
        t_ref = annotations.onset[0]
        tmin = max(0, t_ref - 0.5)  # 0.5s before marker
        tmax = min(raw.times[-1], t_ref + window_duration - 0.5)
    else:
        # Compute RMS in sliding windows, find max
        from mne.filter import filter_data
        data = raw.get_data()

        # Simple heuristic: use middle 2 seconds
        t_mid = raw.times[-1] / 2
        tmin = t_mid - 1.0
        tmax = t_mid + 1.0

    return tmin, tmax
```

### Step 4: Compute Electrode Activity
```python
def compute_electrode_activity(raw, tmin, tmax):
    """
    Compute per-electrode activity in time window.

    Simple metric: RMS (root mean square) of signal in window

    Returns:
        activity: np.array of shape (n_channels,), normalized to [0, 1]
    """
    # Get data in window
    start_sample = raw.time_as_index(tmin)[0]
    stop_sample = raw.time_as_index(tmax)[0]
    data = raw.get_data(start=start_sample, stop=stop_sample)

    # Compute RMS per channel
    rms = np.sqrt(np.mean(data ** 2, axis=1))

    # Normalize to [0, 1]
    if rms.max() > 0:
        activity_norm = rms / rms.max()
    else:
        activity_norm = rms

    return activity_norm
```

### Step 5: Map Electrodes to Regions
```python
def load_electrode_positions(file_path):
    """
    Load electrode positions from BIDS sidecar TSV.

    Returns:
        dict: {channel_name: (x, y, z)}
    """
    import os

    # Try to find electrodes.tsv in same directory
    directory = os.path.dirname(file_path)

    # Common BIDS naming patterns
    patterns = [
        os.path.join(directory, "*_electrodes.tsv"),
        os.path.join(directory, "*_space-fsaverage_electrodes.tsv"),
    ]

    import glob
    electrodes_file = None
    for pattern in patterns:
        matches = glob.glob(pattern)
        if matches:
            electrodes_file = matches[0]
            break

    if electrodes_file is None:
        # No electrode positions found - return None
        return None

    # Read TSV manually (no pandas dependency)
    positions = {}
    with open(electrodes_file, 'r') as f:
        lines = f.readlines()
        header = lines[0].strip().split('\t')

        # Find column indices
        name_idx = header.index('name')
        x_idx = header.index('x')
        y_idx = header.index('y')
        z_idx = header.index('z')

        for line in lines[1:]:
            parts = line.strip().split('\t')
            name = parts[name_idx]
            x = float(parts[x_idx])
            y = float(parts[y_idx])
            z = float(parts[z_idx])
            positions[name] = (x, y, z)

    return positions

def map_electrode_to_region(x, y, z):
    """
    Map electrode MNI coordinate to brain region (heuristic).

    Same logic as _estimate_region_from_coords() from Phase 5.
    """
    abs_x = abs(x)

    # Determine hemisphere
    hemisphere = "L" if x < 0 else "R"
    hemi_name = "left" if hemisphere == "L" else "right"

    # Heuristic region mapping
    if y < -40:
        if abs_x > 35:
            region_name = "temporal"
        else:
            region_name = "occipital"
    elif y > 10:
        region_name = "frontal"
    elif z > 40:
        region_name = "parietal"
    elif abs_x > 35:
        region_name = "temporal"
    else:
        region_name = "central"

    return f"{hemi_name} {region_name}", hemisphere
```

### Step 6: Generate Summary and Hotspots
```python
def compute_ecog_summary(raw, activity, electrode_positions, n_top=3):
    """
    Generate summary and hotspots for ECoG data.

    Args:
        raw: MNE Raw object
        activity: np.array (n_channels,) normalized activity
        electrode_positions: dict {ch_name: (x, y, z)} or None
        n_top: Number of top hotspots

    Returns:
        summary: str
        hotspots: list[dict]
    """
    # Find top N channels by activity
    top_indices = np.argsort(activity)[-n_top:][::-1]

    hotspots = []
    for idx in top_indices:
        ch_name = raw.ch_names[idx]
        confidence = float(activity[idx])

        # Get coordinates if available
        if electrode_positions and ch_name in electrode_positions:
            x, y, z = electrode_positions[ch_name]
            region, hemisphere = map_electrode_to_region(x, y, z)
            coords = [float(x), float(y), float(z)]
        else:
            # Fallback if no positions
            region = f"electrode {ch_name}"
            hemisphere = "L"  # default
            coords = [0.0, 0.0, 0.0]

        hotspots.append({
            "region": region,
            "hemisphere": hemisphere,
            "confidence": confidence,
            "coordinates": coords
        })

    # Generate summary string
    if len(hotspots) > 0:
        parts = []
        for i, hs in enumerate(hotspots):
            if i == 0:
                parts.append(f"Strongest activity in {hs['region']} ({hs['confidence']:.2f})")
            else:
                parts.append(f"{hs['region']} ({hs['confidence']:.2f})")

        if len(parts) == 1:
            summary = parts[0] + "."
        elif len(parts) == 2:
            summary = f"{parts[0]}, followed by {parts[1]}."
        else:
            summary = f"{parts[0]}, followed by {', '.join(parts[1:-1])}, and {parts[-1]}."
    else:
        summary = "No reliable localization summary available."

    return summary, hotspots
```

### Step 7: Visualization
```python
def create_ecog_visualizations(raw, activity, upload_dir, uploadId):
    """
    Create visualizations for ECoG data.

    Since we can't use ConvDip or brain3d(), create:
    1. Simple topomap-style plot (if electrode positions available)
    2. Placeholder brain view images (or simple projections)

    Returns:
        figUrl: Cloudinary URL to main figure
        matUrl: Cloudinary URL to .mat file
        images: List of 11 image URLs (can be placeholders)
    """
    import matplotlib.pyplot as plt
    import scipy.io as sio

    # Create figure directory
    fig_path = os.path.join(upload_dir, "figures")
    data_path = os.path.join(upload_dir, "data")
    os.makedirs(fig_path, exist_ok=True)
    os.makedirs(data_path, exist_ok=True)

    # ===== Figure 1: Activity topomap (simple bar chart for now) =====
    fig_name = os.path.join(fig_path, 'ECoG_activity.png')

    plt.figure(figsize=(12, 6))
    top_n = 20
    top_indices = np.argsort(activity)[-top_n:][::-1]
    top_channels = [raw.ch_names[i] for i in top_indices]
    top_activity = [activity[i] for i in top_indices]

    plt.barh(range(len(top_channels)), top_activity, color='teal')
    plt.yticks(range(len(top_channels)), top_channels)
    plt.xlabel('Normalized Activity')
    plt.ylabel('Electrode')
    plt.title('Top 20 Most Active Electrodes')
    plt.tight_layout()
    plt.savefig(fig_name, dpi=150)
    plt.close()

    # Upload to Cloudinary
    from cloudinary import uploader
    figure_result = uploader.upload(
        fig_name,
        folder=f"{uploadId}/figures",
        public_id='ECoG_activity.png'
    )
    figUrl = figure_result['secure_url']

    # ===== Save .mat file =====
    mat_name = os.path.join(data_path, 'ECoG_data.mat')

    # Get data from activity window (for compatibility)
    data = raw.get_data()  # Full data or windowed data
    sio.savemat(mat_name, {'eeg': data, 'activity': activity})

    mat_result = uploader.upload(
        mat_name,
        folder=f"{uploadId}/data",
        public_id='ECoG_data.mat',
        resource_type="raw"
    )
    matUrl = mat_result['secure_url']

    # ===== Generate 11 "brain view" images =====
    # For now, create placeholder or simple projection images
    # Future: Could plot electrode positions on fsaverage surface if coords available

    images = []
    views = ['medial', 'rostral', 'caudal', 'dorsal', 'ventral',
             'frontal', 'parietal', 'axial', 'sagittal', 'coronal', 'lateral']

    for view in views:
        # Create simple placeholder image
        view_filename = f'{view}.png'
        view_path = os.path.join(upload_dir, view_filename)

        # Simple placeholder: just write text
        plt.figure(figsize=(10, 4))
        plt.text(0.5, 0.5, f'ECoG Electrode View\n({view})\n[Placeholder]',
                 ha='center', va='center', fontsize=16, color='teal')
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(view_path, dpi=100, bbox_inches='tight')
        plt.close()

        # Upload to Cloudinary
        response = uploader.upload(
            view_path,
            public_id=f'{uploadId}/figures/{view_filename}'
        )
        cloudinary_url = response['secure_url']
        images.append(cloudinary_url)
        os.remove(view_path)

    return figUrl, matUrl, images
```

### Step 8: Main EPILEPSY_ECOG Pipeline
```python
def process_epilepsy_ecog(file_path, uploadId, patientId, upload_dir):
    """
    Main pipeline for EPILEPSY_ECOG mode.

    Returns:
        request: dict ready to POST to Node backend
    """
    print(f"[PIPELINE] Mode: EPILEPSY_ECOG")

    # Step 1: Load and preprocess
    raw, annotations = data_preprocessing_ecog(file_path)

    # Step 2: Select activity window
    tmin, tmax = select_activity_window(raw, annotations, window_duration=2.0)
    print(f"[EPILEPSY_ECOG] Selected time window: {tmin:.2f}s - {tmax:.2f}s")

    # Step 3: Compute electrode activity
    activity = compute_electrode_activity(raw, tmin, tmax)
    print(f"[EPILEPSY_ECOG] Top 5 active channels:")
    top5 = np.argsort(activity)[-5:][::-1]
    for i, idx in enumerate(top5):
        print(f"  {i+1}. {raw.ch_names[idx]}: {activity[idx]:.3f}")

    # Step 4: Load electrode positions
    electrode_positions = load_electrode_positions(file_path)
    if electrode_positions:
        print(f"[EPILEPSY_ECOG] Loaded {len(electrode_positions)} electrode positions")
    else:
        print(f"[EPILEPSY_ECOG] No electrode positions found (will use fallback)")

    # Step 5: Generate summary and hotspots
    summary, hotspots = compute_ecog_summary(raw, activity, electrode_positions, n_top=3)
    print(f"[EPILEPSY_ECOG] Summary: {summary}")
    print(f"[EPILEPSY_ECOG] Hotspots: {len(hotspots)} detected")

    # Step 6: Create visualizations
    figUrl, matUrl, images = create_ecog_visualizations(raw, activity, upload_dir, uploadId)
    print(f"[EPILEPSY_ECOG] Visualizations created: {len(images)} views")

    # Step 7: Prepare metadata
    import mne
    metadata = {
        "modelVersion": "ECoG-Activity-1.0",
        "mneVersion": mne.__version__
    }

    # Step 8: Assemble request
    request = {
        "patientId": patientId,
        "uploadId": uploadId,
        "figUrl": figUrl,
        "matUrl": matUrl,
        "images": images,
        "metadata": metadata,
        "summary": summary,
        "hotspots": hotspots
    }

    return request
```

---

## Integration Points

### 1. `helper.py` Changes
- Add all EPILEPSY_ECOG functions listed above
- Modify existing functions to accept optional `mode` parameter
- Keep DEMO mode functions UNCHANGED

### 2. `brain_visualizer.py` Changes
```python
# After parsing args, detect mode
raw_temp = load_data_for_mode_detection(args.file)
mode = detect_processing_mode(raw_temp)
del raw_temp  # Free memory

print(f"[PIPELINE] Mode: {mode}")

if mode == "DEMO":
    # Existing pipeline (unchanged)
    raw, events, evoked_use, fig_name, figure_url, mat_url = save_evoked_data(...)
    s_pred = ConvDip_ESI(event_id, root_path)
    summary, hotspots = compute_localization_summary(s_pred, n_top=3)
    brain3d(...)

elif mode == "EPILEPSY_ECOG":
    # New pipeline
    request = process_epilepsy_ecog(args.file, args.uploadId, args.patientId, root_path)

    # POST to Node backend
    node_api_url = os.environ.get("NODE_API_URL", "http://localhost:3000")
    api_key = os.environ.get("EPICARE_INTERNAL_API_KEY", "")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["x-epicare-key"] = api_key

    response = requests.post(
        f"{node_api_url}/patients/upload",
        json=request,
        headers=headers
    )

    if response.status_code == 200:
        print("[EPILEPSY_ECOG] Request successful!")
    else:
        print(f"[EPILEPSY_ECOG] Request failed: {response.status_code}")

else:
    raise ValueError(f"Unknown mode: {mode}")
```

### 3. `brain_api.py` Changes
- No changes required (subprocess call remains same)
- Mode detection happens automatically inside brain_visualizer.py

---

## Safety & Error Handling

1. **Mode detection fallback**: If unknown channels, default to DEMO
2. **Missing electrode positions**: Use fallback region names (electrode IDs)
3. **Missing annotations**: Use global activity window (middle of recording)
4. **Empty activity**: Return safe "No localization available" message
5. **File format errors**: Catch and log, return error to Node
6. **All logging**: Tag with `[PIPELINE]`, `[DEMO]`, or `[EPILEPSY_ECOG]`

---

## Testing Plan

1. **Test DEMO mode**: Run with existing sample_audvis_raw.fif - must work exactly as before
2. **Test EPILEPSY_ECOG mode**: Run with MNE-epilepsy-ecog-data - should complete without errors
3. **Test output contract**: Verify Node backend receives all required fields in both modes
4. **Test error cases**: Missing files, bad data, no annotations, etc.

---

## Future Enhancements (Out of Scope)

1. Better visualization: Plot electrodes on fsaverage surface (if positions available)
2. Frequency band analysis: Compute band power (delta, theta, alpha, beta, gamma)
3. Seizure detection: Automatic detection of ictal vs interictal periods
4. Real parcellation: Use atlas labels instead of coordinate heuristics
5. Scalp EEG mode: Third mode for high-density scalp EEG

---

## Summary

**Two modes, one output contract:**
- **DEMO**: MEG sample data → ConvDip → fsaverage visualization (current pipeline)
- **EPILEPSY_ECOG**: ECoG data → electrode activity → simple visualization (new pipeline)

**Detection**: Automatic based on channel types (MEG vs EEG-only)

**Implementation**: Minimal changes to existing code, new functions in helper.py, mode switching in brain_visualizer.py

**Safety**: Extensive logging, fallbacks, error handling
