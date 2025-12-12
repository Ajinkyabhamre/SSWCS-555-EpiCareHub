import mne
from pathlib import Path

# Download (or reuse) the MNE sample dataset
sample_path = mne.datasets.sample.data_path()
print(f"Sample dataset downloaded to: {sample_path}")

# Typical interesting FIF files
raw_fif = Path(sample_path) / "MEG" / "sample" / "sample_audvis_raw.fif"
evoked_fif = Path(sample_path) / "MEG" / "sample" / "sample_audvis-ave.fif"

print("\nUseful FIF files for testing:")
print(f"Raw  : {raw_fif}")
print(f"Evoked: {evoked_fif}")

# Optional: verify that they load correctly
print("\nVerifying that MNE can read them...")
raw = mne.io.read_raw_fif(raw_fif, preload=False)
print(f"Loaded RAW: {raw}")
evoked = mne.read_evokeds(evoked_fif, condition='Left Auditory', baseline=(None, 0))
print(f"Loaded EVOKED: {evoked[0]}")
