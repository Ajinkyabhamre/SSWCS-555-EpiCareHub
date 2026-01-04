# Data Directory

This directory contains required data files for the EEG/MEG brain localization pipeline.

## Required Files (Not in Git)

The following large files are **not tracked in git** and must be obtained separately:

### meg-fwd.fif (~21MB)
- MEG forward solution file required for MNE pipeline
- **Production:** Download from shared storage or model registry
- **Development:** Available in team's shared drive or contact maintainer

### real_data/ samples
Sample evoked EEG responses for testing:
- `evoked_eeg_LA.mat`, `evoked_eeg_LV.mat`, `evoked_eeg_RA.mat`, `evoked_eeg_RV.mat`
- **Optional:** Only needed for specific test scenarios

## Files Tracked in Git

- `eeg_maptable.mat` - Small (~1MB) channel mapping table (safe to track)

## Setup Instructions

1. **Local Development:**
   ```bash
   # Option 1: Download from team storage
   # (Contact team lead for access link)

   # Option 2: Use test pipeline without these files
   # The pipeline can work with uploaded .fif/.h5 files directly
   ```

2. **Docker/Production:**
   - Data files are NOT needed in the container at build time
   - Pipeline processes uploaded EEG files on-demand
   - If needed for demos, mount as volume or download at runtime

## Why These Are Not Tracked

- **Size:** meg-fwd.fif is 21MB - too large for git
- **Generated/Derivative:** Sample evoked responses can be regenerated
- **Not Runtime-Critical:** Pipeline works with user-uploaded data files
