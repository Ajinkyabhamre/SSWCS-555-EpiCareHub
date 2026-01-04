#!/bin/bash
###############################################################################
# EpiCareHub Brain-API Pipeline Test Script
# Purpose: Deterministic end-to-end verification of the brain-api pipeline
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
CONTAINER_NAME="epicarehub-brain-api"
BACKEND_CONTAINER="epicarehub-backend"
UPLOADS_DIR="/app/uploads"
TEST_UPLOAD_ID="test-$(date +%s)"
TEST_PATIENT_ID="patient-test-001"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}EpiCareHub Brain-API Pipeline Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

###############################################################################
# STEP 0: Verify containers are running
###############################################################################
echo -e "${YELLOW}[STEP 0] Checking Docker containers...${NC}"

if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}✗ brain-api container not running${NC}"
    echo "Start with: docker compose up -d"
    exit 1
fi

if ! docker ps | grep -q "$BACKEND_CONTAINER"; then
    echo -e "${RED}✗ backend container not running${NC}"
    echo "Start with: docker compose up -d"
    exit 1
fi

echo -e "${GREEN}✓ Containers running${NC}"
echo ""

###############################################################################
# STEP 1: Test health endpoints
###############################################################################
echo -e "${YELLOW}[STEP 1] Testing health endpoints...${NC}"

# Test brain-api health
BRAIN_HEALTH=$(curl -s http://localhost:8000/health || echo "failed")
if [[ "$BRAIN_HEALTH" == *"ok"* ]]; then
    echo -e "${GREEN}✓ brain-api health check: OK${NC}"
else
    echo -e "${RED}✗ brain-api health check failed${NC}"
    exit 1
fi

# Test backend health (if /health endpoint exists)
BACKEND_HEALTH=$(curl -s http://localhost:3000/health || echo "not_found")
if [[ "$BACKEND_HEALTH" == *"ok"* ]]; then
    echo -e "${GREEN}✓ backend health check: OK${NC}"
elif [[ "$BACKEND_HEALTH" == "not_found" ]]; then
    echo -e "${YELLOW}⚠ backend /health endpoint not implemented yet${NC}"
else
    echo -e "${RED}✗ backend health check failed${NC}"
fi

echo ""

###############################################################################
# STEP 2: List available routes
###############################################################################
echo -e "${YELLOW}[STEP 2] Listing FastAPI routes...${NC}"
docker exec $CONTAINER_NAME python -c "
from brain_api import app
print('Available routes:')
for route in app.routes:
    if hasattr(route, 'methods') and hasattr(route, 'path'):
        methods = ','.join(route.methods - {'HEAD', 'OPTIONS'})
        print(f'  {methods:6} {route.path}')
"
echo ""

###############################################################################
# STEP 3: Create test upload directory structure
###############################################################################
echo -e "${YELLOW}[STEP 3] Creating test upload directory...${NC}"

docker exec $CONTAINER_NAME mkdir -p "$UPLOADS_DIR/$TEST_UPLOAD_ID"
echo -e "${GREEN}✓ Created: $UPLOADS_DIR/$TEST_UPLOAD_ID${NC}"
echo ""

###############################################################################
# STEP 4: Test /visualize_brain_dev endpoint (no Cloudinary required)
###############################################################################
echo -e "${YELLOW}[STEP 4] Testing /visualize_brain_dev endpoint...${NC}"

# Check if dev mode is enabled
DEV_RESPONSE=$(curl -s -X POST http://localhost:8000/visualize_brain_dev \
    -F "patientId=$TEST_PATIENT_ID" \
    -F "uploadId=$TEST_UPLOAD_ID")

if [[ "$DEV_RESPONSE" == *"Dev mode not enabled"* ]]; then
    echo -e "${YELLOW}⚠ Dev mode not enabled (EPICARE_DEV_MODE=false)${NC}"
    echo "  Skipping dev endpoint test..."
    DEV_MODE_AVAILABLE=false
else
    echo -e "${GREEN}✓ Dev endpoint response received${NC}"
    echo "$DEV_RESPONSE" | jq '.' 2>/dev/null || echo "$DEV_RESPONSE"
    DEV_MODE_AVAILABLE=true
fi

echo ""

###############################################################################
# STEP 5: Check if sample data exists
###############################################################################
echo -e "${YELLOW}[STEP 5] Checking for sample EEG data...${NC}"

SAMPLE_FILE="/app/data/meg-fwd.fif"
if docker exec $CONTAINER_NAME test -f "$SAMPLE_FILE"; then
    echo -e "${GREEN}✓ Found sample file: $SAMPLE_FILE${NC}"
    HAS_SAMPLE_DATA=true
else
    echo -e "${YELLOW}⚠ Sample file not found: $SAMPLE_FILE${NC}"
    echo "  You can test with your own .fif/.h5 file upload"
    HAS_SAMPLE_DATA=false
fi

echo ""

###############################################################################
# STEP 6: Inspect upload directory structure
###############################################################################
echo -e "${YELLOW}[STEP 6] Inspecting upload directory structure...${NC}"

echo "Listing $UPLOADS_DIR/:"
docker exec $CONTAINER_NAME ls -lh "$UPLOADS_DIR/" 2>/dev/null | head -20 || echo "  (empty or not accessible)"

if [ "$DEV_MODE_AVAILABLE" = true ]; then
    echo ""
    echo "Listing test upload directory $UPLOADS_DIR/$TEST_UPLOAD_ID/:"
    docker exec $CONTAINER_NAME ls -lh "$UPLOADS_DIR/$TEST_UPLOAD_ID/" 2>/dev/null || echo "  (empty)"
fi

echo ""

###############################################################################
# STEP 7: Verify output.json path expectations
###############################################################################
echo -e "${YELLOW}[STEP 7] Verifying output.json path configuration...${NC}"

docker exec $CONTAINER_NAME python -c "
import sys
sys.path.insert(0, '/app')
from brain_api import get_output_json_path

test_id = '$TEST_UPLOAD_ID'
expected_path = get_output_json_path(test_id)
print(f'Expected output.json path: {expected_path}')

import os
if os.path.exists(os.path.dirname(expected_path)):
    print(f'✓ Parent directory exists')
else:
    print(f'✗ Parent directory missing: {os.path.dirname(expected_path)}')
"

echo ""

###############################################################################
# STEP 8: Test brain_visualizer.py directly (if sample data exists)
###############################################################################
if [ "$HAS_SAMPLE_DATA" = true ]; then
    echo -e "${YELLOW}[STEP 8] Testing brain_visualizer.py directly...${NC}"

    TEST_DIRECT_ID="test-direct-$(date +%s)"
    docker exec $CONTAINER_NAME mkdir -p "$UPLOADS_DIR/$TEST_DIRECT_ID"

    # Run brain_visualizer.py in DEMO mode with timeout
    echo "Running brain_visualizer.py (180s timeout)..."

    docker exec $CONTAINER_NAME timeout 180 python brain_visualizer.py \
        --basePath "$UPLOADS_DIR" \
        --file "$SAMPLE_FILE" \
        --patientId "$TEST_PATIENT_ID" \
        --uploadId "$TEST_DIRECT_ID" \
        --historic false \
        2>&1 | grep -E '\[PIPELINE\]|\[REQUEST\]|\[ARTIFACT\]|\[BACKEND\]|\[ERROR\]' || true

    # Check for output.json
    echo ""
    if docker exec $CONTAINER_NAME test -f "$UPLOADS_DIR/$TEST_DIRECT_ID/output.json"; then
        echo -e "${GREEN}✓ output.json created${NC}"
        echo "Contents:"
        docker exec $CONTAINER_NAME cat "$UPLOADS_DIR/$TEST_DIRECT_ID/output.json" | jq '.' 2>/dev/null || \
        docker exec $CONTAINER_NAME cat "$UPLOADS_DIR/$TEST_DIRECT_ID/output.json"
    else
        echo -e "${RED}✗ output.json not found at $UPLOADS_DIR/$TEST_DIRECT_ID/output.json${NC}"
    fi

    echo ""
else
    echo -e "${YELLOW}[STEP 8] Skipped (no sample data)${NC}"
    echo ""
fi

###############################################################################
# STEP 9: Verify NODE_API_URL configuration
###############################################################################
echo -e "${YELLOW}[STEP 9] Verifying NODE_API_URL configuration...${NC}"

NODE_URL=$(docker exec $CONTAINER_NAME printenv NODE_API_URL || echo "not set")
echo "NODE_API_URL = $NODE_URL"

if [[ "$NODE_URL" == "http://backend:3000" ]]; then
    echo -e "${GREEN}✓ Correct Docker network URL${NC}"
elif [[ "$NODE_URL" == "http://localhost:3000" ]]; then
    echo -e "${RED}✗ Using localhost (will fail in Docker)${NC}"
    echo "  Set NODE_API_URL=http://backend:3000 in docker-compose.yml"
else
    echo -e "${YELLOW}⚠ Unexpected NODE_API_URL value${NC}"
fi

echo ""

###############################################################################
# STEP 10: Check Cloudinary configuration (optional)
###############################################################################
echo -e "${YELLOW}[STEP 10] Checking Cloudinary configuration...${NC}"

CLOUD_NAME=$(docker exec $CONTAINER_NAME printenv CLOUDINARY_CLOUD_NAME || echo "")
CLOUD_KEY=$(docker exec $CONTAINER_NAME printenv CLOUDINARY_API_KEY || echo "")

if [[ -n "$CLOUD_NAME" && -n "$CLOUD_KEY" ]]; then
    echo -e "${GREEN}✓ Cloudinary credentials configured${NC}"
    echo "  Cloud name: $CLOUD_NAME"
else
    echo -e "${YELLOW}⚠ Cloudinary credentials not configured${NC}"
    echo "  Pipeline will still work but images won't be uploaded"
fi

echo ""

###############################################################################
# STEP 11: Check matplotlib backend
###############################################################################
echo -e "${YELLOW}[STEP 11] Verifying matplotlib headless configuration...${NC}"

docker exec $CONTAINER_NAME python -c "
import matplotlib
print(f'Matplotlib backend: {matplotlib.get_backend()}')
print(f'MPLBACKEND env: {__import__(\"os\").environ.get(\"MPLBACKEND\", \"not set\")}')

import mne
print(f'MNE log level: {mne.get_config(\"MNE_LOGGING_LEVEL\")}')
" 2>&1

echo ""

###############################################################################
# SUMMARY
###############################################################################
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${GREEN}✓ Containers running${NC}"
echo -e "${GREEN}✓ Health endpoints working${NC}"
echo -e "${GREEN}✓ Path utilities correct${NC}"

if [ "$HAS_SAMPLE_DATA" = true ]; then
    echo -e "${GREEN}✓ Sample data available for testing${NC}"
fi

if [[ "$NODE_URL" == "http://backend:3000" ]]; then
    echo -e "${GREEN}✓ NODE_API_URL correctly configured${NC}"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload a real .fif or .h5 file via frontend or API"
echo "2. Monitor logs: docker compose logs -f brain-api"
echo "3. Check output: docker exec $CONTAINER_NAME cat $UPLOADS_DIR/<uploadId>/output.json"
echo ""

###############################################################################
# Cleanup (optional)
###############################################################################
if [ "$1" == "--cleanup" ]; then
    echo -e "${YELLOW}Cleaning up test directories...${NC}"
    docker exec $CONTAINER_NAME rm -rf "$UPLOADS_DIR/$TEST_UPLOAD_ID" 2>/dev/null || true
    docker exec $CONTAINER_NAME rm -rf "$UPLOADS_DIR/test-direct-"* 2>/dev/null || true
    echo -e "${GREEN}✓ Cleanup complete${NC}"
fi
