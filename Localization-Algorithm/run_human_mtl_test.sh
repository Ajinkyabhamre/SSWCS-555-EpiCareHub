#!/bin/bash

# Script to run HUMAN_MTL pipeline test with conda environment

set -e

echo "================================"
echo "HUMAN_MTL Pipeline Test"
echo "================================"

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "ERROR: conda not found. Please install conda first."
    exit 1
fi

# Activate conda environment
echo "Activating 'brain' conda environment..."
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate brain

# Check if file exists
H5_FILE="datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5"
if [ ! -f "$H5_FILE" ]; then
    echo "ERROR: H5 file not found at $H5_FILE"
    exit 1
fi

echo "H5 file found: $H5_FILE"
echo "File size: $(ls -lh "$H5_FILE" | awk '{print $5}')"
echo ""

# Run the pipeline
echo "Running HUMAN_MTL pipeline..."
echo "================================"

python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "$H5_FILE" \
  --patientId 69327ccdcefcdacb1eb274de \
  --uploadId human-mtl-s01-sess01 \
  --historic False

echo ""
echo "================================"
echo "Pipeline completed!"
echo "================================"
