#!/bin/bash
# EpiCareHub - Rebuild brain-api service (for ML pipeline changes)
set -e

echo "🔨 Rebuilding brain-api service..."

# Stop brain-api
echo "1️⃣ Stopping brain-api..."
docker compose stop brain-api

# Remove old container
echo "2️⃣ Removing old container..."
docker compose rm -f brain-api

# Rebuild with no cache
echo "3️⃣ Building new image (no cache)..."
docker compose build --no-cache brain-api

# Start brain-api
echo "4️⃣ Starting brain-api..."
docker compose up -d brain-api

# Show logs
echo ""
echo "✅ brain-api rebuilt successfully!"
echo ""
echo "📋 Viewing logs (Ctrl+C to exit):"
docker compose logs -f brain-api
