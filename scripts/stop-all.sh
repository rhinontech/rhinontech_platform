#!/bin/bash

# Rhinon Tech - Stop All Services

echo "🛑 Stopping Complete Rhinon Tech Platform..."
echo "=============================================="
echo ""

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Stop Frontend
echo "🎨 Stopping Frontend..."
./stop-frontend.sh

# Stop Backend Services
echo ""
echo "📦 Stopping Backend Services..."
./stop-servers.sh

echo ""
echo "=============================================="
echo "✅ All services stopped successfully!"
echo "=============================================="
echo ""
