#!/bin/bash

# Rhinon Tech - Restart All Services

echo "🔄 Restarting Complete Rhinon Tech Platform..."
echo "=============================================="
echo ""

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Stop all services
./stop-all.sh

echo ""
echo "⏳ Waiting 5 seconds before restart..."
sleep 5

# Start all services
./start-all.sh
