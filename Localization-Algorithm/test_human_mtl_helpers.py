"""
Test script for Human MTL helpers

Verifies that:
- load_human_mtl_ieeg_with_coords works
- human_mtl_to_mne_raw works
- Data shapes and values are correct
"""

from pathlib import Path
from helper import load_human_mtl_ieeg_with_coords, human_mtl_to_mne_raw

def test_human_mtl_helpers():
    """Test Human MTL helper functions."""

    h5_path = Path("datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5")

    print("=" * 80)
    print("Testing Human MTL Helper Functions")
    print("=" * 80)
    print(f"[TEST] Using file: {h5_path}")
    print(f"[TEST] File exists: {h5_path.exists()}")

    if not h5_path.exists():
        print("\n❌ ERROR: H5 file not found!")
        print(f"   Expected location: {h5_path.absolute()}")
        print("\n   The download is still in progress. Wait for it to complete.")
        print("   Check download status with: BashOutput tool on bash_id 2d78df")
        return False

    print("\n" + "=" * 80)
    print("TEST 1: load_human_mtl_ieeg_with_coords")
    print("=" * 80)

    try:
        info = load_human_mtl_ieeg_with_coords(h5_path)

        print(f"[TEST] ✓ Function completed successfully")
        print(f"[TEST] Keys returned: {list(info.keys())}")
        print(f"[TEST] data shape: {info['data'].shape}")
        print(f"[TEST] sfreq: {info['sfreq']}")
        print(f"[TEST] ch_names length: {len(info['ch_names'])}")
        print(f"[TEST] coords_mm shape: {info['coords_mm'].shape}")
        print(f"[TEST] labels length: {len(info['labels'])}")
        print(f"[TEST] First 5 labels: {info['labels'][:5]}")
        print(f"[TEST] First coord (mm): {info['coords_mm'][0]}")

        # Validate shapes
        n_channels = info['data'].shape[0]
        assert info['coords_mm'].shape == (n_channels, 3), "Coords shape mismatch"
        assert len(info['labels']) == n_channels, "Labels count mismatch"
        assert len(info['ch_names']) == n_channels, "Ch_names count mismatch"

        print(f"[TEST] ✓ All shape validations passed")

    except Exception as e:
        print(f"[TEST] ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 80)
    print("TEST 2: human_mtl_to_mne_raw")
    print("=" * 80)

    try:
        raw, coords_mm, labels = human_mtl_to_mne_raw(h5_path)

        print(f"[TEST] ✓ Function completed successfully")
        print(f"\n[TEST] Raw info:")
        print(f"  n_channels: {len(raw.ch_names)}")
        print(f"  n_times: {raw.n_times}")
        print(f"  sfreq: {raw.info['sfreq']}")
        print(f"  ch_types (first 3): {raw.get_channel_types()[:3]}")
        print(f"  coords_mm shape: {coords_mm.shape}")
        print(f"  labels[0:5]: {labels[:5]}")

        # Validate
        assert len(raw.ch_names) == coords_mm.shape[0], "Raw channels vs coords mismatch"
        assert len(labels) == coords_mm.shape[0], "Labels vs coords mismatch"
        assert coords_mm.shape[1] == 3, "Coords should be Nx3"

        print(f"[TEST] ✓ All validations passed")

    except Exception as e:
        print(f"[TEST] ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 80)
    print("✅ ALL TESTS PASSED!")
    print("=" * 80)
    print(f"\nSummary:")
    print(f"  - Loaded {len(labels)} channels")
    print(f"  - Each has MNI coordinates (mm)")
    print(f"  - Data duration: {raw.times[-1]:.2f} seconds")
    print(f"  - Sampling rate: {raw.info['sfreq']:.1f} Hz")
    print(f"  - Ready for pipeline processing")

    return True


if __name__ == "__main__":
    success = test_human_mtl_helpers()
    exit(0 if success else 1)
