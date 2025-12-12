import mne

import preprocessing
from helper import (
    compute_multiband_activity,
    compute_epileptic_index,
    extract_hotspots,
)

print("=== QUICK TEST: Tasks C, D, E ===")

# 1. Load MNE sample file (this downloads/uses the small sample dataset from mne)
print("[TASK C] Loading sample_audvis_raw.fif via MNE...")
data_path = mne.datasets.sample.data_path()
raw_fname = data_path / "MEG" / "sample" / "sample_audvis_raw.fif"
print(f"  → Using file: {raw_fname}")

# 2. Preprocess with unified layer
print("[TASK C] Preprocessing with unified loader...")
result = preprocessing.load_and_preprocess(str(raw_fname))

raw = result["raw"]
sfreq = result["sfreq"]
window = result["data_window"]
ch_names = result["ch_names"]
meta = result["metadata"]

print(f"  ✓ Preprocess: {meta['n_channels']} channels, sfreq={sfreq:.1f} Hz")
print(f"  ✓ Window shape: {window.shape} (channels x time)")

# 3. Multi-band activity
print("\n[TASK D] Computing multiband activity...")
multiband = compute_multiband_activity(window, sfreq)
ep_index = compute_epileptic_index(multiband)
print(f"  ✓ Epileptic index: shape={ep_index.shape}, mean={ep_index.mean():.3f}")

# 4. Hotspots
print("\n[TASK D] Extracting hotspots...")
hotspots = extract_hotspots(ep_index, ch_names, n_top=3)

if not hotspots:
    print("  ⚠ No hotspots returned – something is off.")
else:
    print(f"  ✓ Got {len(hotspots)} hotspots:")
    for i, hs in enumerate(hotspots, start=1):
        print(
            f"    {i}. channel={hs.get('channel')}, "
            f"region={hs.get('region')}, "
            f"confidence={hs.get('confidence'):.3f}, "
            f"z={hs.get('z_score', 0):.2f}"
        )

# 5. 3D overlay-style structure (what Brain.jsx will later consume)
overlay_points = [
    {
        "label": hs.get("region") or hs.get("channel"),
        "coord": hs.get("coordinates", [0.0, 0.0, 0.0]),
        "confidence": hs.get("confidence", 0.0),
    }
    for hs in hotspots
]

print("\n[TASK E] 3D overlay points:")
for p in overlay_points:
    print(f"  - {p}")

print("\n✓✓✓ QUICK TEST FINISHED ✓✓✓")
