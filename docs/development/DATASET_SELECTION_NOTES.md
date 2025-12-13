# Dataset Selection for 3D Brain Visualization

## Executive Summary

**Decision**: Switching from `ds003029` (OpenNeuro "fragility") to **Boran et al. Human MTL Units WM dataset** for 3D brain electrode visualization.

**Reason**: ds003029 does not include electrode coordinates in the public BIDS release, making it unsuitable for the 3D brain visualization feature.

---

## Dataset Comparison

### ds003029 "fragility" (OpenNeuro)

**Repository**: https://openneuro.org/datasets/ds003029
**Location**: `Localization-Algorithm/datasets/fragility_ds003029/`

**Pros**:
- Good quality seizure iEEG time-series data
- BIDS-formatted
- Suitable for signal processing experiments

**Cons**:
- ❌ **No electrode coordinates in public release**
- No `*_electrodes.tsv` files
- No coordinate system information
- Cannot generate accurate 3D brain views

**Verification**:
```bash
find datasets/fragility_ds003029 -name "*electrodes.tsv"
# Returns: (no results)
```

**Status**: **Deprecated for 3D visualization**. Kept only for non-3D signal processing experiments.

---

### Human MTL Units WM Dataset (Boran et al. 2019)

**Full Name**: Dataset of human medial temporal lobe neurons, scalp and intracranial EEG during a verbal working memory task

**Repository**: https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM
**DOI**: 10.12751/g-node.d76994
**Location**: `Localization-Algorithm/datasets/human_mtl_units_wm/`

**Pros**:
- ✅ **Includes MNI coordinates for all intracranial electrodes**
- ✅ **Includes anatomical labels for electrodes**
- Simultaneous scalp EEG + iEEG + single-unit recordings
- 9 epilepsy patients
- Working memory task data
- Well-documented NIX/HDF5 format

**Cons**:
- Large file sizes (~391 MB per session)
- NIX format requires HDF5 navigation (not BIDS)
- Requires git-annex or manual download of large files

**Status**: **Active for 3D brain visualization**.

**Reference**: Boran E, Fedele T, Klaver P, Hilfiker P, Stieglitz L, Grunwald T, Sarnthein J. *Persistent hippocampal neural firing and hippocampal-cortical coupling predict verbal working memory load.* Sci Adv 2019;5(3):eaav3687. http://doi.org/10.1126/sciadv.aav3687

---

## Dataset Structure: Human MTL Units WM

### Directory Layout
```
datasets/human_mtl_units_wm/
├── README.md
├── NIX_File_Structure.pdf
├── Subject_Characteristics.pdf
├── code_MATLAB/
│   └── Load_Data_Example_Script.m
└── data_nix/
    ├── Data_Subject_01_Session_01.h5  (391 MB)
    ├── Data_Subject_01_Session_02.h5
    ├── Data_Subject_02_Session_01.h5
    └── ... (37 session files total)
```

### HDF5/NIX File Structure

Each session file contains:
- **iEEG data**: Multi-trial depth electrode recordings
- **Scalp EEG data**: Simultaneous 19-channel scalp EEG
- **Spike times**: Single-unit recordings from MTL
- **Task metadata**: Sternberg working memory task info
- **Electrode information**: **MNI coordinates and labels**

---

## Electrode Coordinate Access

### HDF5 Paths

Based on exploration of `Data_Subject_01_Session_01.h5`:

#### 1. **MNI Coordinates**

**Path**:
```
/data/Data_Subject_01_Session_01/groups/iEEG electrode information/data_arrays/[UUID]/data
```

**Details**:
- Shape: `(N_electrodes, 3)` where N = 48 for Subject 1
- Dtype: `float64`
- Units: millimeters (MNI space)
- Example values (first 5 electrodes):
  ```
  [[-25.20, -12.88, -14.79],
   [-30.49, -12.12, -14.97],
   [-36.70, -11.77, -16.08],
   [-41.90, -10.40, -17.07],
   [-47.16,  -9.48, -18.04]]
  ```

**UUID**: `99ca4959-5892-4a76-b308-15b408467648` (for Subject 1 Session 1)
- Note: UUID varies per session; use group name `'iEEG electrode information'` to navigate

#### 2. **Electrode Labels**

**Path**:
```
/data/Data_Subject_01_Session_01/groups/iEEG data/data_arrays/[any_trial]/dimensions/1/labels
```

**Details**:
- Shape: `(N_electrodes,)`
- Dtype: `object` (byte strings)
- Example labels (first 10):
  ```
  ['mAHL1', 'mAHL2', 'mAHL3', 'mAHL4', 'mAHL5',
   'mAHL6', 'mAHL7', 'mAHL8', 'mAL1', 'mAL2', ...]
  ```

**Electrode Naming Convention**:
- `mAHL` = medial anterior hippocampus left
- `mAL` = medial amygdala left
- `mPHL` = medial posterior hippocampus left
- Similar for right hemisphere (e.g., `mAHR`, `mAR`)

#### 3. **Manual Entry Flag** (Optional)

**Path**:
```
/data/Data_Subject_01_Session_01/groups/iEEG electrode information/data_arrays/[UUID]/data
```

**UUID**: `e2ff5012-ad57-48e9-9fa7-ae779cb1f315`
- Shape: `(N_electrodes, 1)`
- Dtype: `bool`
- Indicates whether anatomical label was manually verified (all `False` for Subject 1)

---

## Python Access Code

### Using h5py

```python
import h5py
import numpy as np

def load_electrode_coords_and_labels(h5_file_path):
    """
    Load MNI coordinates and electrode labels from Human MTL Units WM dataset.

    Args:
        h5_file_path: Path to .h5 file (e.g., "Data_Subject_01_Session_01.h5")

    Returns:
        tuple: (coordinates, labels)
            coordinates: ndarray of shape (N, 3) with MNI x, y, z in mm
            labels: list of str with electrode names
    """
    with h5py.File(h5_file_path, 'r') as f:
        # Navigate to block
        session_name = list(f['data'].keys())[0]  # e.g., 'Data_Subject_01_Session_01'
        block = f['data'][session_name]

        # Get MNI coordinates
        elec_info = block['groups']['iEEG electrode information']
        data_arrays = elec_info['data_arrays']

        # Find coordinate array (shape N x 3)
        coords = None
        for key, arr in data_arrays.items():
            if 'data' in arr:
                data = arr['data'][()]
                if len(data.shape) == 2 and data.shape[1] == 3:
                    coords = data
                    break

        # Get electrode labels
        ieeg_data = block['groups']['iEEG data']
        first_trial_key = list(ieeg_data['data_arrays'].keys())[0]
        labels_ds = ieeg_data['data_arrays'][first_trial_key]['dimensions']['1']['labels']
        labels = [lbl.decode() if isinstance(lbl, bytes) else lbl for lbl in labels_ds[()]]

        return coords, labels

# Example usage
coords, labels = load_electrode_coords_and_labels('datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5')
print(f"Loaded {len(labels)} electrodes")
print(f"First electrode: {labels[0]} at {coords[0]}")
```

**Output**:
```
Loaded 48 electrodes
First electrode: mAHL1 at [-25.19908493 -12.87539213 -14.7916941 ]
```

---

## Integration Strategy

### Current Pipeline (EPILEPSY_ECOG)

The existing `process_epilepsy_ecog()` function in `helper.py` expects:
- BIDS-formatted dataset with `*electrodes.tsv`
- Function `load_electrode_positions_from_bids()` parses TSV

### Required Changes (Next Prompt)

1. **Create new loader**: `load_electrode_positions_from_human_mtl()`
   - Read HDF5 file
   - Extract MNI coordinates and labels
   - Return same format as BIDS loader

2. **Add mode detection**:
   - Check if file is `.h5` (Human MTL) vs `.vhdr`/`.edf` (ds003029)
   - Route to appropriate electrode loader

3. **Update `generate_ecog_brain_snapshots()`**:
   - Accept coordinates + labels directly
   - No dependency on file structure
   - Use MNI coordinates for MNE montage creation

4. **Minimal changes to pipeline**:
   - Keep existing hotspot detection logic
   - Keep existing MNE rendering code
   - Only swap coordinate source

---

## Testing Plan

1. **Single-subject test**:
   ```bash
   python3 brain_visualizer.py \
     --file "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
     --patientId <test-id> \
     --uploadId human-mtl-s01-sess01 \
     --historic False
   ```

2. **Verify outputs**:
   - Hotspots computed on 48-channel iEEG
   - Brain views generated with correct MNI electrode positions
   - Cloudinary upload successful
   - Node backend stores `brainViews` dict

3. **Frontend verification**:
   - "3D Images Ready (2)" badge appears
   - Brain view page shows left/right lateral images
   - Electrode labels match hotspot channels

---

## Migration Notes

- **Do NOT delete ds003029** yet; keep for reference and non-3D experiments
- Mark ds003029 helpers as deprecated but don't remove
- Create separate helper functions for Human MTL dataset
- Update documentation to reflect active vs deprecated datasets

---

## Dataset Download Instructions

### For Future Users

To download Human MTL Units WM dataset:

#### Method 1: Using git clone (fastest for structure exploration)
```bash
cd Localization-Algorithm/datasets
mkdir human_mtl_units_wm
cd human_mtl_units_wm
git clone https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM.git .
```

This downloads metadata and placeholders (~1 MB).

#### Method 2: Download specific session files via web browser
1. Visit: https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM
2. Navigate to `data_nix/`
3. Click on desired session file (e.g., `Data_Subject_01_Session_01.h5`)
4. Click "Download" button (391 MB per file)

#### Method 3: Using git-annex (requires installation)
```bash
# After git clone:
git annex get data_nix/Data_Subject_01_Session_01.h5
git annex unlock data_nix/Data_Subject_01_Session_01.h5
```

---

## Exploratory Script

**Location**: `Localization-Algorithm/explore_human_mtl_dataset.py`

**Usage**:
```bash
python3 explore_human_mtl_dataset.py [path/to/file.h5]
```

**Purpose**:
- Navigate HDF5 structure
- Identify electrode coordinate datasets
- Validate MNI coordinates
- Extract electrode labels

---

**Last Updated**: December 2024
**Status**: ✅ Dataset downloaded and validated
**Next Step**: Integrate into EPILEPSY_ECOG pipeline
