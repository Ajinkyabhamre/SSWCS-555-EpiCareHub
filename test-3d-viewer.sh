#!/bin/bash
# Quick 3D Viewer Testing Script
# Tests optimized brain viewer with different patients

set -e

DATASET_PATH="datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5"
BASE_PATH="./uploads"

echo "=========================================="
echo "3D Brain Viewer Testing Script"
echo "=========================================="
echo ""

# Check if conda environment exists
if ! conda env list | grep -q "brain"; then
    echo "❌ Error: 'brain' conda environment not found"
    echo "Please create it first: conda create -n brain python=3.9"
    exit 1
fi

# Check if dataset exists
if [ ! -f "$DATASET_PATH" ]; then
    echo "❌ Error: Dataset not found at $DATASET_PATH"
    exit 1
fi

echo "Select test scenario:"
echo ""
echo "1) Test 1: Original patient (baseline)"
echo "   Patient: 69327ccfcefcdacb1eb274e3"
echo "   Upload:  human-mtl-webgl-test"
echo ""
echo "2) Test 2: New patient (enter custom ID)"
echo "   Patient: <you provide>"
echo "   Upload:  test-subject01-study1"
echo ""
echo "3) Test 3: Multiple studies (same patient, different upload)"
echo "   Patient: <you provide>"
echo "   Upload:  test-subject01-study2"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        PATIENT_ID="69327ccfcefcdacb1eb274e3"
        UPLOAD_ID="human-mtl-webgl-test"
        echo ""
        echo "✓ Testing with original patient"
        ;;
    2)
        echo ""
        read -p "Enter patient ID: " PATIENT_ID
        UPLOAD_ID="test-subject01-study1"
        echo "✓ Testing with new patient: $PATIENT_ID"
        ;;
    3)
        echo ""
        read -p "Enter patient ID (same as Test 2): " PATIENT_ID
        UPLOAD_ID="test-subject01-study2"
        echo "✓ Testing multiple studies for patient: $PATIENT_ID"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Running Python pipeline..."
echo "=========================================="
echo "Patient ID: $PATIENT_ID"
echo "Upload ID:  $UPLOAD_ID"
echo "Dataset:    $DATASET_PATH"
echo ""

# Activate conda and run pipeline
conda run -n brain python3 brain_visualizer.py \
    --basePath "$BASE_PATH" \
    --file "$DATASET_PATH" \
    --patientId "$PATIENT_ID" \
    --uploadId "$UPLOAD_ID" \
    --historic False

echo ""
echo "=========================================="
echo "✅ Pipeline complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Ensure Backend is running:"
echo "   cd Backend && npm start"
echo ""
echo "2. Ensure Frontend is running:"
echo "   cd Frontend && npm run dev"
echo ""
echo "3. Open in browser:"
echo "   http://localhost:5173/patient/$PATIENT_ID/brain/$UPLOAD_ID"
echo ""
echo "4. Click 'Interactive 3D (beta)' tab"
echo ""
echo "5. Verify:"
echo "   ✓ Brain loads at perfect zoom (no scrolling needed)"
echo "   ✓ Electrodes are small bumps on surface"
echo "   ✓ Hotspots are red but not oversized"
echo "   ✓ Smooth rotation/zoom/pan (no stutter)"
echo "   ✓ Hover tooltips work"
echo "   ✓ Click selection persists"
echo "   ✓ Reset to Fit returns to perfect framing"
echo ""
echo "6. Check browser console for expected logs:"
echo "   [3D] Mesh loaded"
echo "   [3D] Brain bounding box computed - radius: X.XX"
echo "   [3D] Overlay loaded"
echo "   [3D] Hotspot mapping done: X electrodes, Y hotspots"
echo "   [3D] Camera auto-fit complete - distance: X.XX"
echo ""
echo "=========================================="
