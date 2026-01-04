"""
Explore the MNE epilepsy ECoG dataset structure
This script analyzes the dataset to understand its differences from sample_audvis
"""

import os
import mne
import numpy as np

# Path to the epilepsy dataset
dataset_path = os.path.expanduser("~/mne_data/MNE-epilepsy-ecog-data")
vhdr_file = os.path.join(
    dataset_path,
    "sub-pt1/ses-presurgery/ieeg/sub-pt1_ses-presurgery_task-ictal_ieeg.vhdr"
)

print("=" * 80)
print("EPILEPSY ECOG DATASET EXPLORATION")
print("=" * 80)
print(f"\nLoading file: {vhdr_file}")

# Load the raw data (BrainVision format, not .fif)
raw = mne.io.read_raw_brainvision(vhdr_file, preload=True)

print("\n" + "=" * 80)
print("RAW DATA INFO")
print("=" * 80)
print(raw.info)

print("\n" + "=" * 80)
print("CHANNEL INFORMATION")
print("=" * 80)
print(f"Total channels: {len(raw.ch_names)}")
print(f"Channel types: {set(raw.get_channel_types())}")
print(f"Sampling rate: {raw.info['sfreq']} Hz")
print(f"Duration: {raw.times[-1]:.2f} seconds ({raw.times[-1]/60:.2f} minutes)")

# Count channel types
from collections import Counter
ch_type_counts = Counter(raw.get_channel_types())
print(f"\nChannel type breakdown:")
for ch_type, count in ch_type_counts.items():
    print(f"  {ch_type}: {count}")

print(f"\nFirst 20 channel names:")
for i, ch_name in enumerate(raw.ch_names[:20]):
    print(f"  {i+1}. {ch_name} ({raw.get_channel_types()[i]})")

print("\n" + "=" * 80)
print("ANNOTATIONS (EVENTS)")
print("=" * 80)
print(f"Total annotations: {len(raw.annotations)}")

if len(raw.annotations) > 0:
    print(f"\nAnnotation descriptions (unique): {set(raw.annotations.description)}")
    print(f"\nFirst 10 annotations:")
    for i, (onset, duration, desc) in enumerate(zip(
        raw.annotations.onset[:10],
        raw.annotations.duration[:10],
        raw.annotations.description[:10]
    )):
        print(f"  {i+1}. {desc:20s} | onset: {onset:7.2f}s | duration: {duration:6.2f}s")

    # Find seizure-related annotations
    seizure_annotations = [
        desc for desc in raw.annotations.description
        if 'seizure' in desc.lower() or 'ictal' in desc.lower() or 'onset' in desc.lower()
    ]
    if seizure_annotations:
        print(f"\nSeizure-related annotations found: {set(seizure_annotations)}")
    else:
        print("\nNo explicit 'seizure' annotations found. All annotations:")
        for desc in set(raw.annotations.description):
            print(f"  - {desc}")
else:
    print("No annotations found in this dataset")

print("\n" + "=" * 80)
print("DATA COMPARISON: EPILEPSY vs SAMPLE_AUDVIS")
print("=" * 80)

comparison = """
| Feature              | sample_audvis_raw.fif       | MNE-epilepsy-ecog-data          |
|----------------------|-----------------------------|---------------------------------|
| File format          | .fif                        | .vhdr (BrainVision)             |
| Modality             | MEG + EEG                   | iEEG/ECoG (invasive)            |
| Channel count        | ~300 (MEG+EEG+EOG)          | {} channels                     |
| Channel types        | meg, eeg, eog, stim         | {}                              |
| Sampling rate        | 600 Hz                      | {} Hz                           |
| Duration             | ~5 min (experiment)         | {:.2f} min (seizure recording)  |
| Event structure      | Trigger channel (STI 014)   | Annotations (text markers)      |
| Event types          | LA, RA, LV, RV (codes 1-4)  | {}                              |
| Task                 | Evoked potentials           | Spontaneous seizure             |
| Forward model        | meg-fwd.fif (1984 sources)  | N/A (direct cortical recording) |
| Localization         | Inverse problem (MEG→src)   | Direct electrode positions      |
""".format(
    len(raw.ch_names),
    ', '.join(set(raw.get_channel_types())),
    raw.info['sfreq'],
    raw.times[-1] / 60,
    ', '.join(set(raw.annotations.description)) if len(raw.annotations) > 0 else 'None'
)

print(comparison)

print("\n" + "=" * 80)
print("ELECTRODE POSITIONS")
print("=" * 80)

# Check if electrode positions are available
if raw.info['dig'] is not None:
    print("Digitization points available: Yes")
    print(f"Number of digitization points: {len(raw.info['dig'])}")
else:
    print("Digitization points available: No")

# Try to load electrode positions from BIDS sidecar
electrodes_file = os.path.join(
    dataset_path,
    "sub-pt1/ses-presurgery/ieeg/sub-pt1_ses-presurgery_space-fsaverage_electrodes.tsv"
)

if os.path.exists(electrodes_file):
    print(f"\nElectrode positions file found: {electrodes_file}")
    import pandas as pd
    electrodes_df = pd.read_csv(electrodes_file, sep='\t')
    print(f"\nElectrode positions (first 10):")
    print(electrodes_df.head(10))
    print(f"\nColumns: {list(electrodes_df.columns)}")
else:
    print("No electrode positions file found")

print("\n" + "=" * 80)
print("SAMPLE DATA SNIPPET")
print("=" * 80)

# Get data from first channel for first second
data, times = raw.get_data(picks=[0], start=0, stop=int(raw.info['sfreq']), return_times=True)
print(f"\nFirst channel ({raw.ch_names[0]}) - first 1 second:")
print(f"  Min: {data.min():.2e}")
print(f"  Max: {data.max():.2e}")
print(f"  Mean: {data.mean():.2e}")
print(f"  Std: {data.std():.2e}")

print("\n" + "=" * 80)
print("SUMMARY FOR PIPELINE ADAPTATION")
print("=" * 80)

summary = f"""
Key differences that require pipeline changes:

1. **File Format**: Must use mne.io.read_raw_brainvision() instead of read_raw_fif()

2. **Event Detection**:
   - Current: mne.find_events(raw, stim_channel="STI 014")
   - New: Use raw.annotations to find seizure markers
   - Annotations: {', '.join(set(raw.annotations.description)) if len(raw.annotations) > 0 else 'None'}

3. **Channel Types**:
   - Current: Expects 'meg', 'eeg', 'eog'
   - New: Only '{', '.join(set(raw.get_channel_types()))}'
   - Must skip MEG-specific processing

4. **ConvDip Compatibility**:
   - ConvDip expects 102-channel MEG/EEG → 12x14 grid
   - This dataset has {len(raw.ch_names)} channels (different layout)
   - **Cannot use ConvDip directly** → need alternative localization

5. **Forward Model**:
   - Current: Uses meg-fwd.fif (1984 sources)
   - New: ECoG electrodes ARE the sources (no inverse problem)
   - **Cannot use get_stc() or brain3d() as-is**

6. **Localization Strategy**:
   - Compute per-electrode activity during seizure window
   - Map electrode positions to brain regions (use electrode TSV)
   - Generate hotspots from most active electrodes

7. **Visualization**:
   - Cannot use fsaverage surface with MEG sources
   - Options:
     - Plot electrode positions on fsaverage (if coords available)
     - Generate simple topographic plots
     - Create placeholder images matching output contract
"""

print(summary)

print("\n" + "=" * 80)
print("EXPLORATION COMPLETE")
print("=" * 80)
