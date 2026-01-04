"""
download_fragility_ds003029.py

# ⚠️ DEPRECATION NOTICE:
# This helper is deprecated and kept only for reference.
# ds003029 is NOT used for 3D brain visualization because it lacks electrode coordinates
# in the public BIDS release. We now use the Boran et al. Human MTL Units WM dataset instead.
# See: DATASET_SELECTION_NOTES.md

OpenNeuro ds003029: Network Fragility in Epilepsy
https://openneuro.org/datasets/ds003029

Downloads the full OpenNeuro ds003029 dataset using openneuro-py.

WHAT WENT WRONG BEFORE:
- Tried to download non-existent subjects like "sub-RID0031" → all 404 errors
- participants.tsv shows real subjects: sub-jh101, sub-jh102, sub-pt01, sub-umf001, etc.

FIX:
- Use openneuro-py to download the complete dataset (it handles discovery automatically)
- No more hardcoded/guessed subject IDs
- Dataset structure is discovered from the actual BIDS structure

USAGE:
    # Install openneuro-py first (REQUIRED)
    pip install openneuro-py

    # Download the full dataset (default - recommended)
    python3 download_fragility_ds003029.py

    # Alternative: use datalad (if installed)
    python3 download_fragility_ds003029.py --use-datalad

REQUIREMENTS:
- openneuro-py (recommended): pip install openneuro-py
- OR datalad: conda install -c conda-forge datalad

NOTE: The full dataset is ~2-5 GB. Download may take 10-30 minutes depending on connection.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import List, Optional
import argparse


# Target directory
SCRIPT_DIR = Path(__file__).parent
DATASET_DIR = SCRIPT_DIR / "datasets" / "fragility_ds003029"

# OpenNeuro dataset ID
DATASET_ID = "ds003029"


def check_openneuro_py():
    """Check if openneuro-py is installed."""
    try:
        import openneuro
        return True
    except ImportError:
        return False


def check_datalad():
    """Check if datalad is installed."""
    try:
        result = subprocess.run(
            ["datalad", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def download_with_openneuro_py(dataset_dir: Path):
    """
    Download the full ds003029 dataset using openneuro-py.

    This downloads ALL subjects and sessions from the dataset. The openneuro-py
    library handles discovering the BIDS structure automatically.

    Args:
        dataset_dir: Target directory
    """
    try:
        from openneuro import download
    except ImportError:
        print("\n❌ Error: openneuro-py not installed")
        print("\nInstall with:")
        print("  pip install openneuro-py")
        print("\nThen run this script again.")
        sys.exit(1)

    print(f"\n📥 Downloading ds003029 with openneuro-py...")
    print(f"   Target: {dataset_dir}")
    print(f"   Mode: Full dataset download")
    print(f"\n   ⏱️  This may take 10-30 minutes (dataset is ~2-5 GB)")
    print(f"   ℹ️  The download will discover all subjects automatically")
    print(f"      (sub-jh101, sub-pt01, sub-umf001, etc.)")

    dataset_dir.mkdir(parents=True, exist_ok=True)

    try:
        download(
            dataset=DATASET_ID,
            target_dir=str(dataset_dir),
        )
        print(f"\n✅ Download complete!")
    except Exception as e:
        print(f"\n❌ Error during download: {e}")
        print("\nIf you see SSL or connection errors, try:")
        print("  - Check your internet connection")
        print("  - Try again (downloads can resume)")
        print("  - Use datalad: python3 download_fragility_ds003029.py --use-datalad")
        sys.exit(1)


def download_with_datalad(dataset_dir: Path):
    """
    Download using datalad.

    Args:
        dataset_dir: Target directory
    """
    print(f"\n📥 Downloading ds003029 with datalad...")
    print(f"   Target: {dataset_dir}")

    # Create parent directory
    dataset_dir.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Clone the dataset
        if not dataset_dir.exists():
            print(f"\n   Cloning dataset...")
            result = subprocess.run(
                [
                    "datalad", "install",
                    "-s", f"https://github.com/OpenNeuroDatasets/{DATASET_ID}",
                    str(dataset_dir)
                ],
                check=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)

        # Get all data
        print(f"\n   Downloading all files...")
        os.chdir(dataset_dir)
        result = subprocess.run(
            ["datalad", "get", "."],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)

        print(f"\n✅ Download complete!")

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error: {e}")
        print(f"   stdout: {e.stdout}")
        print(f"   stderr: {e.stderr}")
        sys.exit(1)




def main():
    """Main download function."""
    parser = argparse.ArgumentParser(
        description="Download OpenNeuro ds003029 (full dataset) for EpiCareHub",
        epilog="Requires: pip install openneuro-py"
    )
    parser.add_argument(
        "--use-datalad",
        action="store_true",
        help="Use datalad instead of openneuro-py"
    )
    parser.add_argument(
        "--dataset-dir",
        type=str,
        default=str(DATASET_DIR),
        help=f"Target directory (default: {DATASET_DIR})"
    )

    args = parser.parse_args()

    print("=" * 80)
    print("OpenNeuro ds003029 Downloader for EpiCareHub")
    print("=" * 80)
    print(f"Dataset: {DATASET_ID}")
    print(f"Target directory: {args.dataset_dir}")
    print(f"Mode: Full dataset download")
    print("=" * 80)

    dataset_dir = Path(args.dataset_dir)

    # Check which tool to use
    has_openneuro_py = check_openneuro_py()
    has_datalad = check_datalad()

    print(f"\nℹ️  Tool availability:")
    print(f"   openneuro-py: {'✅ Yes' if has_openneuro_py else '❌ No'}")
    print(f"   datalad:      {'✅ Yes' if has_datalad else '❌ No'}")

    # Download based on available tools
    if args.use_datalad:
        if not has_datalad:
            print("\n❌ Error: --use-datalad specified but datalad is not installed")
            print("\nInstall with:")
            print("  conda install -c conda-forge datalad")
            sys.exit(1)
        download_with_datalad(dataset_dir)

    elif has_openneuro_py:
        # Best method: use openneuro-py
        print("\n✅ Using openneuro-py (recommended)")
        download_with_openneuro_py(dataset_dir)

    elif has_datalad:
        # Alternative: use datalad
        print("\n✅ Using datalad")
        download_with_datalad(dataset_dir)

    else:
        # No tools available
        print("\n❌ Error: No download tools available")
        print("\nPlease install openneuro-py:")
        print("  pip install openneuro-py")
        print("\nOr install datalad:")
        print("  conda install -c conda-forge datalad")
        print("\nThen run this script again.")
        sys.exit(1)

    print("\n" + "=" * 80)
    print("✅ Download Complete!")
    print("=" * 80)
    print(f"\nDataset location: {dataset_dir}")
    print("\nNext steps:")
    print("  1. Verify the download:")
    print(f"     python3 fragility_dataset.py")
    print("\n  2. List available recordings:")
    print("     python3 -c 'from fragility_dataset import FragilityDataset; d=FragilityDataset(); print(len(d.get_all_recordings()), \"recordings found\")'")
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
