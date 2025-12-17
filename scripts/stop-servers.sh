#!/bin/bash

# Rhinon Tech - Stop Backend Services Script

echo "🛑 Stopping Rhinon Tech Backend Services..."

cd "$(dirname "$0")"

docker-compose down

echo ""
echo "✅ Backend services stopped successfully!"
echo ""
