#!/bin/bash
# fetch-assets.sh - Download optional brain models from CDN
#
# These files are NOT required for normal /visualize_brain operation.
# Only needed for local dev/testing of the 3D WebGL viewer.
#
# Usage:
#   export BRAIN_MODELS_BASE_URL="https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models"
#   ./scripts/fetch-assets.sh

set -e

# CDN base URL (use BRAIN_MODELS_BASE_URL for script, not VITE_*)
CDN_BASE_URL="${BRAIN_MODELS_BASE_URL:-}"

if [ -z "$CDN_BASE_URL" ]; then
  echo "❌ Error: BRAIN_MODELS_BASE_URL environment variable not set"
  echo ""
  echo "Usage:"
  echo "  export BRAIN_MODELS_BASE_URL=\"https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/brain-models\""
  echo "  ./scripts/fetch-assets.sh"
  echo ""
  echo "Or use Cloudinary Raw Upload URL pattern:"
  echo "  https://res.cloudinary.com/{cloud_name}/raw/upload/brain-models/{filename}"
  exit 1
fi

echo "📦 Downloading brain models from CDN..."
echo "   Base URL: $CDN_BASE_URL"
echo ""

# Create target directory
mkdir -p apps/frontend/public/models

# Download brain hemispheres (required for WebGL viewer)
echo "⬇️  Downloading brain_lh.obj (10MB)..."
curl -L -o apps/frontend/public/models/brain_lh.obj "$CDN_BASE_URL/brain_lh.obj"

echo "⬇️  Downloading brain_rh.obj (10MB)..."
curl -L -o apps/frontend/public/models/brain_rh.obj "$CDN_BASE_URL/brain_rh.obj"

echo ""
echo "✅ Done! Brain models downloaded to apps/frontend/public/models/"
echo ""
echo "⚠️  NOTE: These files are optional and NOT required for normal operation."
echo "   The /visualize_brain pipeline generates its own outputs."
