#!/bin/bash

# Rhinon Tech - Check Service Status

echo "📊 Rhinon Tech Platform Status"
echo "=============================================="
echo ""

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Check Docker Services
echo "🐳 Docker Services:"
echo "-------------------"
if docker info > /dev/null 2>&1; then
    docker-compose ps
else
    echo "❌ Docker not running"
fi

echo ""
echo "🎨 Frontend Service:"
echo "-------------------"
cd rhinon
if [ -f .rhinon.pid ]; then
    PID=$(cat .rhinon.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Running (PID: $PID)"
        echo "   URL: http://localhost:4000"
    else
        echo "❌ Not running (stale PID file)"
    fi
else
    # Check if something is on port 4000
    if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Process on port 4000 (no PID file)"
    else
        echo "❌ Not running"
    fi
fi

echo ""
echo "=============================================="
