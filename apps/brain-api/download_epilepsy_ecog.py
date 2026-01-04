import mne
from pathlib import Path

ecog_path = mne.datasets.epilepsy_ecog.data_path()
print(f"Epilepsy ECoG dataset downloaded to: {ecog_path}")

# Show typical contents
p = Path(ecog_path)
print("\nDirectory tree (one level):")
for item in p.iterdir():
    print(" -", item.name)


