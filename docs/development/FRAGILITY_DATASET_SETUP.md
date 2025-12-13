# OpenNeuro ds003029 (Fragility) Setup Guide

> ## ⚠️ DEPRECATION WARNING
>
> **Note**: This dataset does **NOT** include electrode coordinates in the public BIDS release, so it is **not used for 3D brain visualization**. We keep it only for signal-processing experiments.
>
> **For 3D brain visualization**, use the **Boran et al. Human MTL Units WM dataset** instead:
> - Repository: https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM
> - Documentation: `DATASET_SELECTION_NOTES.md`
> - Includes: MNI electrode coordinates + anatomical labels

## Overview

This guide explains how to download and use the **OpenNeuro ds003029** (Network Fragility in Epilepsy) dataset with EpiCareHub.

**Dataset Info**:
- **Name**: Network Fragility in Epilepsy
- **Source**: https://openneuro.org/datasets/ds003029
- **DOI**: 10.18112/openneuro.ds003029.v1.0.0
- **Modality**: Intracranial EEG (iEEG/ECoG/sEEG)
- **Format**: BIDS-compliant, EDF files
- **Subjects**: 36 subjects (sub-jh101-sub-jh108, sub-pt01-sub-pt17, sub-umf001-sub-umf005, sub-ummc001-sub-ummc009)
- **Size**: ~2-5 GB (full dataset)

---

## Quick Start

### 1. Install openneuro-py

```bash
# Make sure your conda environment is activated
conda activate brain

# Install openneuro-py
pip install openneuro-py
```

### 2. Download the Full Dataset

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

# Download the complete dataset (recommended)
python3 download_fragility_ds003029.py
```

**Expected output**:
```
================================================================================
OpenNeuro ds003029 Downloader for EpiCareHub
================================================================================
Dataset: ds003029
Target directory: .../Localization-Algorithm/datasets/fragility_ds003029
Mode: Full dataset download
================================================================================

ℹ️  Tool availability:
   openneuro-py: ✅ Yes
   datalad:      ❌ No

✅ Using openneuro-py (recommended)

📥 Downloading ds003029 with openneuro-py...
   Target: .../datasets/fragility_ds003029
   Mode: Full dataset download

   ⏱️  This may take 10-30 minutes (dataset is ~2-5 GB)
   ℹ️  The download will discover all subjects automatically
      (sub-jh101, sub-pt01, sub-umf001, etc.)

✅ Download complete!
================================================================================
✅ Download Complete!
================================================================================
```

**Download time**: ~10-30 minutes (depending on internet speed)

**Disk usage**: ~2-5 GB (full dataset with all subjects)

### 3. Verify the Download

```bash
# Use the helper module to verify download
python3 fragility_dataset.py
```

Expected output (example):
```
================================================================================
OpenNeuro ds003029: Network Fragility in Epilepsy
================================================================================
Name: Network Fragility in Epilepsy
BIDS Version: 1.6.0
DOI: 10.18112/openneuro.ds003029.v1.0.0
Location: .../datasets/fragility_ds003029
================================================================================

Available subjects: 36

  sub-jh101:
    ses-clinical01: X recording(s)
      - task-...

  sub-pt01:
    ses-research01: X recording(s)
      - task-...

  (... more subjects ...)

================================================================================
```

Or quickly check the count:
```bash
python3 -c "from fragility_dataset import FragilityDataset; d=FragilityDataset(); print(f'{len(d.list_subjects())} subjects, {len(d.get_all_recordings())} recordings')"
```

---

## Using the Dataset

### Python API

```python
from fragility_dataset import FragilityDataset

# Initialize
dataset = FragilityDataset()

# Check if dataset exists
if not dataset.exists():
    print("Run: python3 download_fragility_ds003029.py")
    exit(1)

# List subjects
subjects = dataset.list_subjects()
print(f"Subjects: {subjects}")

# List sessions for a subject
sessions = dataset.list_sessions("sub-jh101")
print(f"Sessions: {sessions}")

# Get all recordings across all subjects
all_recs = dataset.get_all_recordings()
print(f"Total recordings: {len(all_recs)}")

# Get recording info for a specific subject/session
recording = dataset.get_recording(
    subject="sub-jh101",
    session=sessions[0] if sessions else None,
    task=None,  # Will use first available
    run=None    # Will use first available
)

if recording:
    print(f"iEEG file: {recording['ieeg_file']}")
    print(f"Electrodes: {recording['electrodes_file']}")
    print(f"Events: {recording['events_file']}")

# Load with MNE
raw = dataset.load_recording(
    subject="sub-jh101",
    session=sessions[0] if sessions else None
)

if raw:
    print(f"Loaded {len(raw.ch_names)} channels")
    print(f"Duration: {raw.times[-1]:.2f}s")
    print(f"Sampling rate: {raw.info['sfreq']} Hz")
```

### Direct File Access

```python
from pathlib import Path

dataset_root = Path("datasets/fragility_ds003029")

# Discover subjects automatically
subjects = sorted([d.name for d in dataset_root.iterdir() if d.is_dir() and d.name.startswith('sub-')])
print(f"Found {len(subjects)} subjects: {subjects[:5]}...")

# Example: Get first subject's first session
if subjects:
    subject = subjects[0]  # e.g., "sub-jh101"
    subject_dir = dataset_root / subject
    sessions = sorted([d.name for d in subject_dir.iterdir() if d.is_dir() and d.name.startswith('ses-')])

    if sessions:
        session = sessions[0]
        ieeg_dir = dataset_root / subject / session / "ieeg"

        # List all EDF files
        edf_files = list(ieeg_dir.glob("*_ieeg.edf"))
        print(f"Found {len(edf_files)} recordings")

        # Load first one
        if edf_files:
            import mne
            raw = mne.io.read_raw_edf(edf_files[0], preload=True)
            print(f"Loaded: {edf_files[0].name}")
```

---

## Running EpiCareHub Pipeline

### Step 1: Get File Path

```python
from fragility_dataset import FragilityDataset

dataset = FragilityDataset()

# Get all recordings
all_recs = dataset.get_all_recordings()

if all_recs:
    # Use first recording as example
    first_rec = all_recs[0]
    print(f"Using: {first_rec['subject']}/{first_rec['session']}")
    print(f"File: {first_rec['ieeg_file']}")
else:
    print("No recordings found. Run download first.")
```

### Step 2: Run Pipeline

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

# Example: Use first available recording
# Replace with actual path from Step 1
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "./datasets/fragility_ds003029/sub-jh101/ses-clinical01/ieeg/sub-jh101_ses-clinical01_task-XXX_ieeg.edf" \
  --patientId fragility-jh101 \
  --uploadId fragility-test-001 \
  --historic False
```

**Expected**:
- Pipeline detects `EPILEPSY_ECOG` mode (EDF → EEG-only channels)
- Processes iEEG data (filter, resample, compute activity)
- Generates summary and hotspots
- Uploads to Cloudinary (or falls back gracefully)
- POSTs to Node backend

---

## File Structure

### BIDS Structure

```
datasets/fragility_ds003029/
├── dataset_description.json        # Dataset metadata
├── participants.tsv                # Subject list (36 subjects)
├── participants.json               # Participant metadata
├── README                          # Original dataset README
│
├── sub-jh101/                      # Example subject directory
│   └── ses-clinical01/             # Example session directory
│       └── ieeg/                   # iEEG data directory
│           ├── *_ieeg.edf          # iEEG recording data
│           ├── *_ieeg.json         # Recording metadata
│           ├── *_events.tsv        # Event markers (seizures, etc.)
│           ├── *_electrodes.tsv    # Electrode positions
│           ├── *_channels.tsv      # Channel information
│           └── *_coordsystem.json  # Coordinate system info
│
├── sub-pt01/                       # Another subject
│   └── ses-research01/
│       └── ieeg/
│           └── ...
│
└── (... 34 more subjects ...)
```

### Key Files

| File | Description | Required |
|------|-------------|----------|
| `*_ieeg.edf` | iEEG recording data (EDF format) | ✅ Yes |
| `*_ieeg.json` | Acquisition parameters | Optional |
| `*_electrodes.tsv` | Electrode positions and labels | ⚠️ Important |
| `*_channels.tsv` | Channel names and types | Optional |
| `*_events.tsv` | Event markers (seizure onset, etc.) | ⚠️ Important |
| `*_coordsystem.json` | Coordinate system metadata | Optional |

---

## Download Options

### Default: Full Download (Recommended)

```bash
python3 download_fragility_ds003029.py
```

**Result**: Complete ds003029 dataset (all 36 subjects, all sessions)
**Size**: ~2-5 GB
**Use case**: Full dataset access, comprehensive testing

### Alternative: Use Datalad

For more control over which files to download:
```bash
# Use datalad instead
python3 download_fragility_ds003029.py --use-datalad
```

**Note**: Datalad must be installed:
```bash
conda install -c conda-forge datalad
```

---

## Troubleshooting

### Issue: "Dataset not found"

**Solution**:
```bash
python3 download_fragility_ds003029.py
```

### Issue: "No subjects found"

**Cause**: Dataset not downloaded or openneuro-py failed

**Solution**:
1. Make sure you installed openneuro-py: `pip install openneuro-py`
2. Run the download: `python3 download_fragility_ds003029.py`
3. Check dataset structure: `ls datasets/fragility_ds003029/`
4. You should see directories like: sub-jh101, sub-pt01, etc.

### Issue: "Cannot read EDF file"

**Solution**:
```python
import mne

# Try with verbose output
raw = mne.io.read_raw_edf(file_path, preload=True, verbose=True)

# Check file exists
from pathlib import Path
print(f"File exists: {Path(file_path).exists()}")
```

### Issue: "No electrode positions found"

Some sessions may not have `*_electrodes.tsv`. The pipeline will fall back to using electrode names directly.

### Issue: "Download too slow"

- Reduce number of subjects: `--subjects 1`
- Skip iEEG files: `--skip-ieeg`
- Use a faster internet connection

---

## Dataset Citation

If you use this dataset in research, please cite:

```
Scheid, B.H., Ashourvan, A., Stiso, J., Davis, K.A., Khambhati, A.N., Litt, B., & Bassett, D.S. (2020).
Network fragility in epilepsy: A dataset for machine learning.
OpenNeuro. [Dataset] doi: 10.18112/openneuro.ds003029.v1.0.0
```

**BibTeX**:
```bibtex
@dataset{scheid2020fragility,
  author = {Scheid, Brittany H. and Ashourvan, Arian and Stiso, Jennifer and
            Davis, Kathryn A. and Khambhati, Ankit N. and Litt, Brian and
            Bassett, Danielle S.},
  title = {Network fragility in epilepsy: A dataset for machine learning},
  year = {2020},
  publisher = {OpenNeuro},
  doi = {10.18112/openneuro.ds003029.v1.0.0},
  url = {https://openneuro.org/datasets/ds003029}
}
```

---

## References

- **OpenNeuro**: https://openneuro.org/datasets/ds003029
- **BIDS Specification**: https://bids-specification.readthedocs.io/
- **MNE-Python**: https://mne.tools/stable/index.html
- **Datalad**: https://www.datalad.org/

---

## Summary

**Download**: `python3 download_fragility_ds003029.py`
**Explore**: `python3 fragility_dataset.py`
**Use**: `from fragility_dataset import FragilityDataset`
**Run**: `python3 brain_visualizer.py --file datasets/fragility_ds003029/...`

**Location**: `Localization-Algorithm/datasets/fragility_ds003029/`

**Status**: ✅ Ready for use with EpiCareHub pipeline
