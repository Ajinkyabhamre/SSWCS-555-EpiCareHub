"""
Unified EEG/iEEG Preprocessing Layer
====================================

This module provides a unified preprocessing pipeline for all input signal types:
- .fif (EEG/MEG)
- .edf (clinical EEG/iEEG)
- .vhdr (BrainVision ECoG/Epilepsy)
- ds003029 EDF (large multi-center epilepsy dataset)

The preprocessing pipeline includes:
1. Format detection and loading
2. Band-pass filtering (1-40 Hz)
3. Resampling to 250 or 500 Hz
4. Automatic seizure window selection
5. Graceful fallback to middle window

Author: EpiCareHub Team
Date: 2024
"""

import os
import mne
import numpy as np
from typing import Dict, Optional, Tuple


def detect_format(filepath: str) -> str:
    """
    Detect format by file extension.

    Args:
        filepath: Path to the input file

    Returns:
        str: Format type ('fif', 'edf', 'vhdr')

    Raises:
        ValueError: If format is not supported
    """
    ext = os.path.splitext(filepath)[1].lower()

    if ext == '.fif':
        return 'fif'
    elif ext == '.edf':
        return 'edf'
    elif ext == '.vhdr':
        return 'vhdr'
    else:
        raise ValueError(f"[PREPROCESS] Unsupported file format: {ext}")


def load_raw_data(filepath: str, format_type: str) -> mne.io.Raw:
    """
    Load raw data using correct MNE loader based on format.

    Args:
        filepath: Path to the input file
        format_type: Format type ('fif', 'edf', 'vhdr')

    Returns:
        mne.io.Raw: Raw data object

    Raises:
        RuntimeError: If loading fails
    """
    print(f"[PREPROCESS] Loading {format_type} file: {filepath}")

    try:
        if format_type == 'fif':
            raw = mne.io.read_raw_fif(filepath, preload=True, verbose=False)
        elif format_type == 'edf':
            raw = mne.io.read_raw_edf(filepath, preload=True, verbose=False)
        elif format_type == 'vhdr':
            raw = mne.io.read_raw_brainvision(filepath, preload=True, verbose=False)
        else:
            raise ValueError(f"[PREPROCESS] Unknown format type: {format_type}")

        print(f"[PREPROCESS] Loaded {len(raw.ch_names)} channels, duration: {raw.times[-1]:.2f}s")
        return raw

    except Exception as e:
        raise RuntimeError(f"[PREPROCESS] Failed to load file: {str(e)}")


def apply_bandpass_filter(raw: mne.io.Raw, l_freq: float = 1.0, h_freq: float = 40.0) -> mne.io.Raw:
    """
    Apply band-pass filter to raw data.

    Args:
        raw: MNE Raw object
        l_freq: Low frequency cutoff (default: 1 Hz)
        h_freq: High frequency cutoff (default: 40 Hz)

    Returns:
        mne.io.Raw: Filtered raw data
    """
    print(f"[PREPROCESS] Applying band-pass filter: {l_freq}-{h_freq} Hz")

    try:
        raw.filter(l_freq, h_freq, method='fir', fir_design='firwin', verbose=False)
        print(f"[PREPROCESS] Filter applied successfully")
        return raw
    except Exception as e:
        print(f"[PREPROCESS] Warning: Filter failed ({e}), continuing without filtering")
        return raw


def resample_data(raw: mne.io.Raw, target_sfreq: Optional[int] = None) -> mne.io.Raw:
    """
    Resample data to target sampling frequency.

    Auto-selects 250 Hz or 500 Hz based on original sampling rate:
    - If original < 400 Hz: resample to 250 Hz
    - If original >= 400 Hz: resample to 500 Hz

    Args:
        raw: MNE Raw object
        target_sfreq: Target sampling frequency (optional, auto-selected if None)

    Returns:
        mne.io.Raw: Resampled raw data
    """
    original_sfreq = raw.info['sfreq']

    if target_sfreq is None:
        # Auto-select based on original sampling rate
        if original_sfreq < 400:
            target_sfreq = 250
        else:
            target_sfreq = 500

    if abs(original_sfreq - target_sfreq) < 1:
        print(f"[PREPROCESS] Sampling rate already at target ({target_sfreq} Hz), skipping resampling")
        return raw

    print(f"[PREPROCESS] Resampling from {original_sfreq} Hz to {target_sfreq} Hz")

    try:
        raw = raw.resample(target_sfreq, verbose=False)
        print(f"[PREPROCESS] Resampling successful")
        return raw
    except Exception as e:
        print(f"[PREPROCESS] Warning: Resampling failed ({e}), continuing with original rate")
        return raw


def detect_seizure_window(raw: mne.io.Raw, annotations: mne.Annotations,
                          window_duration: float = 2.0) -> Tuple[float, float]:
    """
    Detect seizure window from annotations or high-amplitude activity.

    Strategy:
    1. If annotations contain 'seizure' or 'sz': use first occurrence
    2. If HFO (high-frequency oscillation) annotations: use first HFO
    3. Otherwise, compute global RMS and select highest activity window
    4. Fallback to middle 2 seconds if all else fails

    Args:
        raw: MNE Raw object
        annotations: MNE Annotations object
        window_duration: Window duration in seconds (default: 2.0)

    Returns:
        tuple: (tmin, tmax) time window in seconds
    """
    print(f"[PREPROCESS] Detecting seizure window (duration: {window_duration}s)")

    # Strategy 1: Check for seizure annotations
    if len(annotations) > 0:
        for i, desc in enumerate(annotations.description):
            desc_lower = desc.lower()
            if 'seizure' in desc_lower or 'sz' in desc_lower:
                t_ref = annotations.onset[i]
                tmin = max(0, t_ref - 0.5)
                tmax = min(raw.times[-1], t_ref + window_duration - 0.5)
                print(f"[PREPROCESS] Found seizure annotation at {t_ref:.2f}s, using window: {tmin:.2f}-{tmax:.2f}s")
                return tmin, tmax

    # Strategy 2: Check for HFO annotations
    if len(annotations) > 0:
        for i, desc in enumerate(annotations.description):
            desc_lower = desc.lower()
            if 'hfo' in desc_lower or 'high' in desc_lower:
                t_ref = annotations.onset[i]
                tmin = max(0, t_ref - 0.5)
                tmax = min(raw.times[-1], t_ref + window_duration - 0.5)
                print(f"[PREPROCESS] Found HFO annotation at {t_ref:.2f}s, using window: {tmin:.2f}-{tmax:.2f}s")
                return tmin, tmax

    # Strategy 3: Find highest activity window using sliding RMS
    try:
        print(f"[PREPROCESS] No seizure/HFO annotations found, searching for high-amplitude window...")
        data = raw.get_data()

        # Compute global RMS per time sample
        rms_per_sample = np.sqrt(np.mean(data ** 2, axis=0))

        # Use sliding window to find highest activity region
        window_samples = int(window_duration * raw.info['sfreq'])

        if len(rms_per_sample) < window_samples:
            # Signal too short, use entire signal
            tmin = 0.0
            tmax = raw.times[-1]
            print(f"[PREPROCESS] Signal too short for window search, using entire signal: {tmin:.2f}-{tmax:.2f}s")
            return tmin, tmax

        # Compute windowed RMS
        windowed_rms = np.convolve(rms_per_sample, np.ones(window_samples) / window_samples, mode='valid')

        # Find peak activity
        peak_idx = np.argmax(windowed_rms)
        tmin = raw.times[peak_idx]
        tmax = min(raw.times[-1], tmin + window_duration)

        print(f"[PREPROCESS] Found high-amplitude window at {tmin:.2f}s (RMS: {windowed_rms[peak_idx]:.2e})")
        return tmin, tmax

    except Exception as e:
        print(f"[PREPROCESS] Warning: Activity detection failed ({e}), using fallback")

    # Strategy 4: Fallback to middle window
    t_mid = raw.times[-1] / 2
    tmin = max(0, t_mid - window_duration / 2)
    tmax = min(raw.times[-1], t_mid + window_duration / 2)
    print(f"[PREPROCESS] Fallback: using middle window {tmin:.2f}-{tmax:.2f}s")
    return tmin, tmax


def extract_data_window(raw: mne.io.Raw, tmin: float, tmax: float) -> np.ndarray:
    """
    Extract data window from raw data.

    Args:
        raw: MNE Raw object
        tmin: Start time in seconds
        tmax: End time in seconds

    Returns:
        np.ndarray: Data window of shape (n_channels, n_samples)
    """
    print(f"[PREPROCESS] Extracting data window: {tmin:.2f}-{tmax:.2f}s")

    try:
        start_sample = raw.time_as_index(tmin)[0]
        stop_sample = raw.time_as_index(tmax)[0]
        data_window = raw.get_data(start=start_sample, stop=stop_sample)

        print(f"[PREPROCESS] Extracted window shape: {data_window.shape}")
        return data_window

    except Exception as e:
        print(f"[PREPROCESS] Error extracting window: {e}")
        # Fallback to first 2 seconds
        return raw.get_data(start=0, stop=int(2 * raw.info['sfreq']))


def load_and_preprocess(filepath: str,
                       l_freq: float = 1.0,
                       h_freq: float = 40.0,
                       target_sfreq: Optional[int] = None,
                       window_duration: float = 2.0) -> Dict:
    """
    Unified preprocessing pipeline for all EEG/iEEG formats.

    This function:
    1. Detects format by extension
    2. Loads using correct MNE loader
    3. Applies band-pass filter (1-40 Hz by default)
    4. Resamples to 250 or 500 Hz automatically
    5. Auto-selects seizure window (or falls back to middle 2 seconds)
    6. Extracts data window
    7. Returns structured output

    Args:
        filepath: Path to the input file (.fif, .edf, .vhdr)
        l_freq: Low frequency cutoff for band-pass filter (default: 1 Hz)
        h_freq: High frequency cutoff for band-pass filter (default: 40 Hz)
        target_sfreq: Target sampling frequency (auto-selected if None)
        window_duration: Duration of data window to extract (default: 2.0s)

    Returns:
        dict: Dictionary containing:
            - raw (mne.io.Raw): Preprocessed raw data object
            - sfreq (float): Sampling frequency
            - ch_names (list): List of channel names
            - data_window (np.ndarray): Extracted data window (n_channels, n_samples)
            - metadata (dict): Metadata including:
                - format (str): File format
                - original_sfreq (float): Original sampling rate
                - n_channels (int): Number of channels
                - duration (float): Total duration in seconds
                - window_tmin (float): Start time of extracted window
                - window_tmax (float): End time of extracted window

    Raises:
        ValueError: If file format is not supported
        RuntimeError: If loading or preprocessing fails

    Example:
        >>> result = load_and_preprocess('sample_audvis_raw.fif')
        >>> raw = result['raw']
        >>> data_window = result['data_window']
        >>> print(f"Loaded {result['metadata']['n_channels']} channels")
    """
    print(f"[PREPROCESS] ===== Starting Unified Preprocessing Pipeline =====")
    print(f"[PREPROCESS] File: {filepath}")

    # Step 1: Detect format
    format_type = detect_format(filepath)
    print(f"[PREPROCESS] Detected format: {format_type}")

    # Step 2: Load raw data
    raw = load_raw_data(filepath, format_type)
    original_sfreq = raw.info['sfreq']

    # Step 3: Apply band-pass filter
    raw = apply_bandpass_filter(raw, l_freq=l_freq, h_freq=h_freq)

    # Step 4: Resample
    raw = resample_data(raw, target_sfreq=target_sfreq)

    # Step 5: Detect seizure window
    annotations = raw.annotations
    tmin, tmax = detect_seizure_window(raw, annotations, window_duration=window_duration)

    # Step 6: Extract data window
    data_window = extract_data_window(raw, tmin, tmax)

    # Step 7: Build output dictionary
    result = {
        'raw': raw,
        'sfreq': raw.info['sfreq'],
        'ch_names': raw.ch_names,
        'data_window': data_window,
        'metadata': {
            'format': format_type,
            'original_sfreq': original_sfreq,
            'n_channels': len(raw.ch_names),
            'duration': raw.times[-1],
            'window_tmin': tmin,
            'window_tmax': tmax,
            'filter_range': f"{l_freq}-{h_freq} Hz",
            'resampled_sfreq': raw.info['sfreq']
        }
    }

    print(f"[PREPROCESS] ===== Preprocessing Complete =====")
    print(f"[PREPROCESS] Output summary:")
    print(f"[PREPROCESS]   - Format: {format_type}")
    print(f"[PREPROCESS]   - Channels: {len(raw.ch_names)}")
    print(f"[PREPROCESS]   - Sampling rate: {raw.info['sfreq']} Hz (original: {original_sfreq} Hz)")
    print(f"[PREPROCESS]   - Data window: {tmin:.2f}-{tmax:.2f}s ({data_window.shape[1]} samples)")
    print(f"[PREPROCESS]   - Filter: {l_freq}-{h_freq} Hz")

    return result


# ============================================================================
# Convenience Functions
# ============================================================================

def preprocess_for_demo_mode(filepath: str) -> Dict:
    """
    Preprocess for DEMO mode (MEG pipeline).
    Uses same settings as original data_preprocessing() function.

    Args:
        filepath: Path to .fif file

    Returns:
        dict: Preprocessing result (same as load_and_preprocess)
    """
    return load_and_preprocess(
        filepath=filepath,
        l_freq=1.0,
        h_freq=30.0,  # DEMO uses 1-30 Hz
        target_sfreq=480,  # DEMO uses 480 Hz
        window_duration=2.0
    )


def preprocess_for_epilepsy_ecog(filepath: str) -> Dict:
    """
    Preprocess for EPILEPSY_ECOG mode (ECoG pipeline).
    Uses same settings as data_preprocessing_ecog() function.

    Args:
        filepath: Path to .vhdr or .edf file

    Returns:
        dict: Preprocessing result (same as load_and_preprocess)
    """
    return load_and_preprocess(
        filepath=filepath,
        l_freq=1.0,
        h_freq=30.0,  # EPILEPSY_ECOG uses 1-30 Hz
        target_sfreq=500,  # EPILEPSY_ECOG uses 500 Hz
        window_duration=2.0
    )
