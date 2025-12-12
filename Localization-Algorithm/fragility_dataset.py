"""
fragility_dataset.py

# ⚠️ DEPRECATION NOTICE:
# This helper is deprecated and kept only for reference.
# ds003029 is NOT used for 3D brain visualization because it lacks electrode coordinates
# in the public BIDS release. We now use the Boran et al. Human MTL Units WM dataset instead.
# See: DATASET_SELECTION_NOTES.md

Helper module for accessing OpenNeuro ds003029 (Fragility epilepsy dataset).

Provides a simple Python API to:
- List available subjects and sessions
- Get file paths for recordings, electrodes, events
- Load data with MNE

USAGE:

    from fragility_dataset import FragilityDataset

    # Initialize
    dataset = FragilityDataset()

    # List subjects (discovers all sub-* directories automatically)
    subjects = dataset.list_subjects()
    print(f"Available subjects: {subjects}")
    # Example: ['sub-jh101', 'sub-jh102', 'sub-pt01', 'sub-umf001', ...]

    # List sessions for a subject
    sessions = dataset.list_sessions("sub-jh101")
    print(f"Sessions: {sessions}")

    # Get all recordings across all subjects
    all_recordings = dataset.get_all_recordings()
    print(f"Total recordings: {len(all_recordings)}")

    # Get recording info for a specific subject/session
    recording = dataset.get_recording(
        subject="sub-jh101",
        session=sessions[0] if sessions else "ses-clinical01",
        task=None,  # Will use first available task
        run=None    # Will use first available run
    )

    if recording:
        print(f"iEEG file: {recording['ieeg_file']}")
        print(f"Electrodes: {recording['electrodes_file']}")
        print(f"Events: {recording['events_file']}")

    # Load with MNE
    raw = dataset.load_recording(
        subject="sub-jh101",
        session=sessions[0] if sessions else "ses-clinical01"
    )

    if raw:
        print(f"Loaded {len(raw.ch_names)} channels")
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import glob


class FragilityDataset:
    """
    Interface for accessing OpenNeuro ds003029 (Network Fragility in Epilepsy).

    Provides methods to list subjects, sessions, and load recordings.
    """

    def __init__(self, dataset_root: Optional[Path] = None):
        """
        Initialize dataset interface.

        Args:
            dataset_root: Path to dataset root (default: ./datasets/fragility_ds003029)
        """
        if dataset_root is None:
            # Default to datasets/fragility_ds003029 relative to this script
            script_dir = Path(__file__).parent
            dataset_root = script_dir / "datasets" / "fragility_ds003029"

        self.root = Path(dataset_root)

        if not self.root.exists():
            print(f"⚠️  WARNING: Dataset not found at {self.root}")
            print(f"   Run: python3 download_fragility_ds003029.py")

    def exists(self) -> bool:
        """Check if dataset directory exists."""
        return self.root.exists() and (self.root / "dataset_description.json").exists()

    def list_subjects(self) -> List[str]:
        """
        List all available subjects by scanning the dataset directory.

        DISCOVERY-BASED: Scans the actual filesystem instead of hardcoding subject IDs.
        This ensures we find subjects like sub-jh101, sub-pt01, etc. (the REAL IDs in ds003029).

        Returns:
            List of subject IDs (e.g., ["sub-jh101", "sub-jh102", "sub-pt01", ...])
        """
        if not self.root.exists():
            return []

        subjects = []
        for item in self.root.iterdir():
            # Look for directories starting with "sub-"
            if item.is_dir() and item.name.startswith("sub-"):
                subjects.append(item.name)

        return sorted(subjects)

    def list_sessions(self, subject: str) -> List[str]:
        """
        List all available sessions for a subject.

        Args:
            subject: Subject ID (e.g., "sub-jh101")

        Returns:
            List of session IDs (e.g., ["ses-clinical01", "ses-research01"])
        """
        subject_dir = self.root / subject

        if not subject_dir.exists():
            return []

        sessions = []
        for item in subject_dir.iterdir():
            if item.is_dir() and item.name.startswith("ses-"):
                sessions.append(item.name)

        return sorted(sessions)

    def list_recordings(
        self,
        subject: str,
        session: str
    ) -> List[Dict[str, str]]:
        """
        List all recordings in a session.

        Args:
            subject: Subject ID
            session: Session ID

        Returns:
            List of dicts with recording metadata:
            [
                {
                    "subject": "sub-jh101",
                    "session": "ses-clinical01",
                    "task": "task-name",
                    "run": "01",
                    "ieeg_file": "/path/to/file.edf",
                    "base_name": "sub-jh101_ses-clinical01_task-name_run-01"
                },
                ...
            ]
        """
        ieeg_dir = self.root / subject / session / "ieeg"

        if not ieeg_dir.exists():
            return []

        recordings = []

        # Find all iEEG files (EDF or VHDR)
        # Find all iEEG files (EDF or BrainVision VHDR format, as per BIDS-iEEG spec)
        ieeg_files = list(ieeg_dir.glob("*_ieeg.edf")) + list(ieeg_dir.glob("*_ieeg.vhdr"))

        for ieeg_file in ieeg_files:
            # Parse BIDS filename
            # Example: sub-jh101_ses-clinical01_task-rest_run-01_ieeg.edf
            base_name = ieeg_file.stem  # Remove .edf/.vhdr

            parts = base_name.split("_")
            task = None
            run = None

            for part in parts:
                if part.startswith("task-"):
                    task = part.replace("task-", "")
                elif part.startswith("run-"):
                    run = part.replace("run-", "")

            recordings.append({
                "subject": subject,
                "session": session,
                "task": task,
                "run": run,
                "ieeg_file": str(ieeg_file),
                "base_name": base_name
            })

        return sorted(recordings, key=lambda x: (x["task"] or "", x["run"] or ""))

    def get_recording(
        self,
        subject: str,
        session: str,
        task: Optional[str] = None,
        run: Optional[int] = None
    ) -> Optional[Dict[str, Optional[Path]]]:
        """
        Get file paths for a specific recording.

        Args:
            subject: Subject ID (e.g., "sub-jh101", "sub-pt01")
            session: Session ID (e.g., "ses-clinical01", "ses-research01")
            task: Task name (e.g., "rest") - optional, will use first available
            run: Run number (e.g., 1) - optional, will use first available

        Returns:
            Dict with file paths:
            {
                "ieeg_file": Path or None,
                "electrodes_file": Path or None,
                "channels_file": Path or None,
                "events_file": Path or None,
                "ieeg_json": Path or None,
                "coordsystem_json": Path or None,
            }
            Returns None if recording not found.
        """
        ieeg_dir = self.root / subject / session / "ieeg"

        if not ieeg_dir.exists():
            return None

        # Find all recordings
        recordings = self.list_recordings(subject, session)

        if not recordings:
            return None

        # Filter by task and run if specified
        if task is not None:
            recordings = [r for r in recordings if r["task"] == task]

        if run is not None:
            run_str = f"{run:02d}"
            recordings = [r for r in recordings if r["run"] == run_str]

        if not recordings:
            return None

        # Use first matching recording
        recording = recordings[0]
        base_name = recording["base_name"]
        ieeg_file = Path(recording["ieeg_file"])

        # Build file paths
        result = {
            "ieeg_file": ieeg_file if ieeg_file.exists() else None,
            "electrodes_file": None,
            "channels_file": None,
            "events_file": None,
            "ieeg_json": None,
            "coordsystem_json": None,
        }

        # Look for sidecar files
        # Events file (recording-specific)
        events_file = ieeg_dir / f"{base_name}_events.tsv"
        if events_file.exists():
            result["events_file"] = events_file

        # iEEG JSON (recording-specific)
        ieeg_json = ieeg_dir / f"{base_name}_ieeg.json"
        if ieeg_json.exists():
            result["ieeg_json"] = ieeg_json

        # Electrodes file (session-level, may have space suffix)
        electrodes_patterns = [
            f"{subject}_{session}_electrodes.tsv",
            f"{subject}_{session}_space-*_electrodes.tsv",
        ]

        for pattern in electrodes_patterns:
            matches = list(ieeg_dir.glob(pattern))
            if matches:
                result["electrodes_file"] = matches[0]
                break

        # Channels file (session-level)
        channels_file = ieeg_dir / f"{subject}_{session}_channels.tsv"
        if channels_file.exists():
            result["channels_file"] = channels_file

        # Coordsystem JSON (session-level)
        coordsystem_json = ieeg_dir / f"{subject}_{session}_coordsystem.json"
        if coordsystem_json.exists():
            result["coordsystem_json"] = coordsystem_json

        return result

    def load_recording(
        self,
        subject: str,
        session: str,
        task: Optional[str] = None,
        run: Optional[int] = None,
        preload: bool = True
    ):
        """
        Load a recording with MNE.

        Args:
            subject: Subject ID
            session: Session ID
            task: Task name (optional)
            run: Run number (optional)
            preload: Whether to preload data into memory

        Returns:
            MNE Raw object, or None if not found
        """
        try:
            import mne
        except ImportError:
            print("⚠️  MNE not available. Install with: pip install mne")
            return None

        recording = self.get_recording(subject, session, task, run)

        if recording is None or recording["ieeg_file"] is None:
            print(f"⚠️  Recording not found: {subject}/{session}")
            return None

        ieeg_file = recording["ieeg_file"]

        try:
            # Determine file format
            if str(ieeg_file).endswith(".edf"):
                raw = mne.io.read_raw_edf(ieeg_file, preload=preload, verbose=False)
            elif str(ieeg_file).endswith(".vhdr"):
                raw = mne.io.read_raw_brainvision(ieeg_file, preload=preload, verbose=False)
            else:
                print(f"⚠️  Unsupported file format: {ieeg_file}")
                return None

            print(f"✓ Loaded: {ieeg_file.name}")
            print(f"  Channels: {len(raw.ch_names)}")
            print(f"  Duration: {raw.times[-1]:.2f}s")
            print(f"  Sampling rate: {raw.info['sfreq']} Hz")

            return raw

        except Exception as e:
            print(f"⚠️  Error loading {ieeg_file}: {e}")
            return None

    def get_dataset_info(self) -> Optional[Dict]:
        """
        Get dataset description metadata.

        Returns:
            Dict with dataset info, or None if not found
        """
        desc_file = self.root / "dataset_description.json"

        if not desc_file.exists():
            return None

        with open(desc_file, 'r') as f:
            return json.load(f)

    def print_summary(self):
        """Print a summary of the dataset."""
        print("=" * 80)
        print("OpenNeuro ds003029: Network Fragility in Epilepsy")
        print("=" * 80)

        if not self.exists():
            print(f"⚠️  Dataset not found at: {self.root}")
            print(f"   Run: python3 download_fragility_ds003029.py")
            return

        # Dataset info
        info = self.get_dataset_info()
        if info:
            print(f"Name: {info.get('Name', 'N/A')}")
            print(f"BIDS Version: {info.get('BIDSVersion', 'N/A')}")
            print(f"DOI: {info.get('DatasetDOI', 'N/A')}")
        print(f"Location: {self.root}")
        print("=" * 80)

        # List subjects and sessions
        subjects = self.list_subjects()
        print(f"\nAvailable subjects: {len(subjects)}")

        for subject in subjects:
            sessions = self.list_sessions(subject)
            print(f"\n  {subject}:")

            for session in sessions:
                recordings = self.list_recordings(subject, session)
                print(f"    {session}: {len(recordings)} recording(s)")

                for rec in recordings:
                    task = rec["task"] or "unknown"
                    run = rec["run"] or "?"
                    print(f"      - task-{task}_run-{run}")

        print("\n" + "=" * 80)

    def get_all_recordings(self) -> List[Dict]:
        """
        Get a flat list of all available recordings across all subjects/sessions.

        Returns:
            List of recording dicts with metadata
        """
        all_recordings = []

        for subject in self.list_subjects():
            for session in self.list_sessions(subject):
                recordings = self.list_recordings(subject, session)
                all_recordings.extend(recordings)

        return all_recordings


# Convenience function
def get_dataset(dataset_root: Optional[Path] = None) -> FragilityDataset:
    """
    Get a FragilityDataset instance.

    Args:
        dataset_root: Optional custom dataset root path

    Returns:
        FragilityDataset instance
    """
    return FragilityDataset(dataset_root)


# Example usage when run as script
if __name__ == "__main__":
    print("\nFragility Dataset Helper - Example Usage\n")

    dataset = FragilityDataset()

    # Check if dataset exists
    if not dataset.exists():
        print("⚠️  Dataset not downloaded yet.")
        print("   Run: python3 download_fragility_ds003029.py\n")
        exit(1)

    # Print summary
    dataset.print_summary()

    # Example: Load first available recording
    all_recordings = dataset.get_all_recordings()

    if all_recordings:
        print("\n" + "=" * 80)
        print("Example: Loading first recording")
        print("=" * 80)

        first = all_recordings[0]
        print(f"\nRecording: {first['subject']}/{first['session']}/{first['task']}/{first['run']}")

        recording_info = dataset.get_recording(
            subject=first['subject'],
            session=first['session'],
            task=first['task'],
            run=int(first['run']) if first['run'] else None
        )

        if recording_info:
            print(f"\nFiles:")
            for key, path in recording_info.items():
                status = "✓" if path and Path(path).exists() else "✗"
                print(f"  {status} {key}: {path}")

            # Try to load with MNE
            print(f"\nLoading with MNE...")
            raw = dataset.load_recording(
                subject=first['subject'],
                session=first['session'],
                task=first['task'],
                run=int(first['run']) if first['run'] else None
            )

    print()
