#!/bin/bash
# EpiCareHub - Stop all services
set -e

echo "🛑 Stopping EpiCareHub services..."
docker compose down

echo "✅ All services stopped"
echo ""
echo "💡 To remove volumes too: docker compose down -v"
