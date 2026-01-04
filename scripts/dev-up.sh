#!/bin/bash
# EpiCareHub - Start all services for local development
set -e

echo "🚀 Starting EpiCareHub services..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "💡 Create .env from the environment variables table in README.md"
    exit 1
fi

# Start services
echo "📦 Starting Docker Compose services..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

echo ""
echo "✅ Services started!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   Brain API: http://localhost:8000"
echo ""
echo "📊 Check status: docker compose ps"
echo "📋 View logs:    docker compose logs -f"
echo "🛑 Stop all:     ./scripts/dev-down.sh"
