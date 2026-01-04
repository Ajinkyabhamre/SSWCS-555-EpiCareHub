# Model Directory

This directory contains trained model weights and checkpoints for the EEG seizure localization pipeline.

## Structure

```
model/
├── sample/
│   └── real_model/
│       ├── net_params_best.pkl   (~5.5MB - NOT TRACKED)
│       ├── net_params_50.pkl     (~5.5MB - NOT TRACKED)
│       ├── net_params_100.pkl    (~5.5MB - NOT TRACKED)
│       └── Train_loss_all.png    (tracked - small visualization)
```

## Model Weights (Not in Git)

The `.pkl` checkpoint files are **not tracked in git** (each ~5.5MB).

### Why Not Tracked?
- **Size:** 3 files × 5.5MB = ~16MB of binary data
- **Versionability:** Binary model files don't benefit from git versioning
- **Best Practice:** Use model registry (MLflow, Weights & Biases, Hugging Face Hub)

### Where to Get Models

**Option 1: Model Registry (Recommended for Production)**
- Upload to Hugging Face Hub, MLflow, or S3
- Download at runtime or Docker build time

**Option 2: Team Shared Storage (Development)**
- Contact team lead for access to trained weights
- Place in `model/sample/real_model/`

**Option 3: Train From Scratch**
- If training scripts exist, run training pipeline
- Checkpoint will be saved automatically

## Current Pipeline Status

⚠️ **NOTE:** As of Jan 2026, the current pipeline in `brain_visualizer.py` and `brain_api.py` does **NOT** appear to use these model weights for processing. The localization is computed using:
- MNE-Python signal processing
- Electrode activity calculation
- Hotspot detection (statistical thresholding)

If you need the ML model for future features, download the weights and update the pipeline code accordingly.

## Setup Instructions

```bash
# If models are needed:
# 1. Download from shared storage
# 2. Place in model/sample/real_model/
# 3. Verify files:
ls -lh model/sample/real_model/
```
