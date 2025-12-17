#!/bin/bash

# Rhinon Tech - View Logs Script

cd "$(dirname "$0")"

echo "📋 Viewing logs for all services (Ctrl+C to exit)..."
echo ""

docker-compose logs -f
