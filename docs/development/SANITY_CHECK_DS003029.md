# Sanity Check Guide for OpenNeuro ds003029 Setup

This document provides exact commands to verify that the OpenNeuro ds003029 (Fragility dataset) setup is working correctly.

---

## Prerequisites

Before running these checks, make sure you have:
- Python 3.11+
- Conda environment setup
- `openneuro-py` installed (recommended)

---

## STEP 1: Install/Update Conda Environment

### Option A: Create fresh environment (recommended)

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

# Remove old environment if it exists
conda env remove --name brain

# Create new environment with python-dotenv included
conda env create -f environment.yml

# Activate environment
conda activate brain
```

### Option B: Update existing environment

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

conda activate brain
pip install python-dotenv==1.0.0
```

### Verify python-dotenv is installed

```bash
conda activate brain
python -c "import dotenv; print('✓ python-dotenv installed:', dotenv.__version__)"
```

**Expected output:**
```
✓ python-dotenv installed: 1.0.0
```

---

## STEP 2: Install openneuro-py (Recommended Method)

```bash
conda activate brain
pip install openneuro-py
```

### Verify installation

```bash
python -c "import openneuro; print('✓ openneuro-py installed')"
```

**Expected output:**
```
✓ openneuro-py installed
```

---

## STEP 3: Download the Full ds003029 Dataset

**WARNING:** This will download the ENTIRE dataset (~10-50 GB). This may take 30-60 minutes depending on your internet speed.

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

# Download full dataset with openneuro-py
python3 download_fragility_ds003029.py
```

### Alternative: Download subset for testing (faster)

If you want to test with a smaller subset first:

```bash
# This will download metadata and first 3 subjects
# (Still requires openneuro-py, but much faster)
python3 download_fragility_ds003029.py --subjects 3
```

**Expected output:**
```
================================================================================
OpenNeuro ds003029 Downloader for EpiCareHub
================================================================================
Dataset: ds003029
Target directory: .../datasets/fragility_ds003029
================================================================================

ℹ️  Tool availability:
   openneuro-py: ✅ Yes
   datalad:      ❌ No

✅ Using openneuro-py (recommended)

📥 Downloading ds003029 with openneuro-py...
   Target: .../datasets/fragility_ds003029
   Downloading full dataset (this may take a while)...

✅ Download complete!

================================================================================
Download Complete!
================================================================================

Dataset location: .../datasets/fragility_ds003029

Next steps:
  1. Verify the download:
     python3 fragility_dataset.py
...
```

---

## STEP 4: Verify Dataset with fragility_dataset.py

```bash
python3 fragility_dataset.py
```

**Expected output:**
```
================================================================================
OpenNeuro ds003029: Network Fragility in Epilepsy
================================================================================
Name: Network Fragility in Epilepsy
BIDS Version: 1.0.2
DOI: 10.18112/openneuro.ds003029.v1.0.0
Location: .../datasets/fragility_ds003029
================================================================================

Available subjects: 35

  sub-jh101:
    ses-clinical01: 2 recording(s)
      - task-monitor_run-01
      - task-monitor_run-02

  sub-jh102:
    ses-clinical01: 1 recording(s)
      - task-monitor_run-01

  sub-pt01:
    ses-clinical01: 3 recording(s)
      - task-monitor_run-01
      - task-monitor_run-02
      - task-monitor_run-03

  [... more subjects ...]

================================================================================
Example: Loading first recording
================================================================================

Recording: sub-jh101/ses-clinical01/monitor/01

Files:
  ✓ ieeg_file: .../sub-jh101_ses-clinical01_task-monitor_run-01_ieeg.edf
  ✓ electrodes_file: .../sub-jh101_ses-clinical01_electrodes.tsv
  ✓ channels_file: .../sub-jh101_ses-clinical01_channels.tsv
  ✓ events_file: .../sub-jh101_ses-clinical01_task-monitor_run-01_events.tsv
  ✓ ieeg_json: .../sub-jh101_ses-clinical01_task-monitor_run-01_ieeg.json

Loading with MNE...
✓ Loaded: sub-jh101_ses-clinical01_task-monitor_run-01_ieeg.edf
  Channels: 128
  Duration: 300.00s
  Sampling rate: 1024.0 Hz
```

**SUCCESS CRITERIA:**
- ✅ Shows "Available subjects: 35" (or the number of subjects you downloaded)
- ✅ Lists real subject IDs like `sub-jh101`, `sub-pt01` (NOT `sub-RID0031`)
- ✅ Shows recording files with ✓ marks
- ✅ Successfully loads a recording with MNE

---

## STEP 5: Test Python API (List Subjects)

```bash
python3 -c "
from fragility_dataset import FragilityDataset

dataset = FragilityDataset()

if not dataset.exists():
    print('❌ ERROR: Dataset not found!')
    exit(1)

subjects = dataset.list_subjects()
print(f'✓ Found {len(subjects)} subjects')
print(f'✓ First 5 subjects: {subjects[:5]}')

# Verify they are REAL subject IDs (not sub-RID0031)
if any('RID' in s for s in subjects):
    print('❌ ERROR: Found hardcoded subject IDs (sub-RID0031)!')
    exit(1)

print('✓ All subject IDs are real (discovered from filesystem)')
"
```

**Expected output:**
```
✓ Found 35 subjects
✓ First 5 subjects: ['sub-jh101', 'sub-jh102', 'sub-jh103', 'sub-jh104', 'sub-jh105']
✓ All subject IDs are real (discovered from filesystem)
```

---

## STEP 6: Test Loading a Real Recording

```bash
python3 -c "
from fragility_dataset import FragilityDataset

dataset = FragilityDataset()

# Get all recordings
all_recordings = dataset.get_all_recordings()

if not all_recordings:
    print('❌ ERROR: No recordings found!')
    exit(1)

print(f'✓ Found {len(all_recordings)} total recordings')

# Load first recording
first = all_recordings[0]
print(f'\\n✓ Loading: {first[\"subject\"]}/{first[\"session\"]}/{first[\"task\"]}/{first[\"run\"]}')

raw = dataset.load_recording(
    subject=first['subject'],
    session=first['session'],
    task=first['task'],
    run=int(first['run']) if first['run'] else None
)

if raw is None:
    print('❌ ERROR: Failed to load recording!')
    exit(1)

print(f'✓ SUCCESS: Loaded {len(raw.ch_names)} channels, {raw.times[-1]:.2f}s duration')
"
```

**Expected output:**
```
✓ Found 150 total recordings

✓ Loading: sub-jh101/ses-clinical01/monitor/01
✓ Loaded: sub-jh101_ses-clinical01_task-monitor_run-01_ieeg.edf
  Channels: 128
  Duration: 300.00s
  Sampling rate: 1024.0 Hz
✓ SUCCESS: Loaded 128 channels, 300.00s duration
```

---

## STEP 7: Test EPILEPSY_ECOG Pipeline (Full Integration)

```bash
# Make sure you have a .env file with Cloudinary credentials
cp .env.example .env
# Edit .env and add your Cloudinary credentials

# Run the pipeline on a real recording
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file datasets/fragility_ds003029/sub-jh101/ses-clinical01/ieeg/sub-jh101_ses-clinical01_task-monitor_run-01_ieeg.edf \
  --patientId TEST_PATIENT_001 \
  --uploadId fragility-test-001 \
  --historic False
```

**Expected output:**
```
[PIPELINE] Detected mode: EPILEPSY_ECOG
[EPILEPSY_ECOG] ===== EPILEPSY ECOG PROCESSING PIPELINE =====
[EPILEPSY_ECOG] Loading file: .../sub-jh101_ses-clinical01_task-monitor_run-01_ieeg.edf
[EPILEPSY_ECOG] Loaded 128 channels, 300.00s duration, 1024.0 Hz sampling rate
[EPILEPSY_ECOG] Applying band-pass filter: 1-30 Hz
[EPILEPSY_ECOG] Resampling to 500 Hz
[EPILEPSY_ECOG] Using annotation: onset 0.00s, duration 10.00s
[EPILEPSY_ECOG] Computing electrode activity (RMS)...
[EPILEPSY_ECOG] Top 5 active channels:
  1. LA1: 1.000
  2. LA2: 0.876
  3. LH1: 0.753
  4. LH2: 0.642
  5. RA1: 0.589
[EPILEPSY_ECOG] Loaded 86 electrode positions from: .../sub-jh101_ses-clinical01_electrodes.tsv
[EPILEPSY_ECOG] Electrode 'LA1' mapped to: Left Frontal (coords: -45.2, 12.3, 28.7)
[EPILEPSY_ECOG] Electrode 'LA2' mapped to: Left Temporal (coords: -52.1, -8.4, 15.2)
[EPILEPSY_ECOG] Summary: Strongest activity in left temporal (1.00), next: left frontal (0.88), left hippocampus (0.75)
[EPILEPSY_ECOG] ✓ Successfully uploaded activity plot to Cloudinary
[EPILEPSY_ECOG] ✓ Node backend callback successful!
[EPILEPSY_ECOG] ===== PIPELINE COMPLETE =====
```

**SUCCESS CRITERIA:**
- ✅ Mode detected as EPILEPSY_ECOG (NOT DEMO)
- ✅ File loads successfully
- ✅ Electrode positions found and loaded
- ✅ Activity computed and top channels shown
- ✅ Summary generated
- ✅ Cloudinary upload succeeds (or gracefully fails without crashing)
- ✅ Node backend callback succeeds

---

## Common Issues and Solutions

### Issue: `openneuro-py not installed`

**Solution:**
```bash
conda activate brain
pip install openneuro-py
```

### Issue: `ModuleNotFoundError: No module named 'dotenv'`

**Solution:**
```bash
conda activate brain
pip install python-dotenv==1.0.0
```

Or recreate environment:
```bash
conda env remove --name brain
conda env create -f environment.yml
conda activate brain
```

### Issue: Download returns 404 errors

**Cause:** This was the OLD behavior with hardcoded subject IDs.

**Solution:** Make sure you're using the UPDATED `download_fragility_ds003029.py` that uses `openneuro-py`.

### Issue: `FragilityDataset` reports 0 subjects

**Cause:** Dataset not downloaded yet, or in wrong location.

**Solution:**
1. Verify dataset exists:
   ```bash
   ls -la datasets/fragility_ds003029/
   ```
2. You should see `participants.tsv` and `sub-*` directories
3. If not, re-run the download script

### Issue: Cannot load .edf file

**Solution:**
```bash
conda activate brain
pip install mne==1.6.1
```

### Issue: Cloudinary upload fails (413 Request Entity Too Large)

**Expected Behavior:** Pipeline should NOT crash. It will print a warning and continue.

**Output:**
```
[EPILEPSY_ECOG] WARNING: Cloudinary upload failed: HTTP 413
[EPILEPSY_ECOG] ✓ Node backend callback successful!
```

The summary and hotspots will still be saved even if images fail to upload.

---

## Summary

If all 7 steps complete successfully, your ds003029 setup is working correctly:

✅ **STEP 1:** Environment installed with python-dotenv
✅ **STEP 2:** openneuro-py installed
✅ **STEP 3:** Full dataset downloaded (or subset for testing)
✅ **STEP 4:** fragility_dataset.py shows real subjects (sub-jh101, sub-pt01, etc.)
✅ **STEP 5:** Python API lists subjects correctly
✅ **STEP 6:** Can load recordings with MNE
✅ **STEP 7:** EPILEPSY_ECOG pipeline runs successfully

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `download_fragility_ds003029.py` | Download script (uses openneuro-py) |
| `fragility_dataset.py` | Helper module for accessing dataset |
| `brain_visualizer.py` | Main pipeline (detects EPILEPSY_ECOG mode) |
| `helper.py` | Processing functions (includes `process_epilepsy_ecog()`) |
| `environment.yml` | Conda environment (includes python-dotenv) |
| `datasets/fragility_ds003029/` | Downloaded dataset location |
| `datasets/fragility_ds003029/participants.tsv` | List of real subject IDs |

---

**Last Updated:** December 9, 2025
