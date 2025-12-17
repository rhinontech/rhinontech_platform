#!/bin/bash

# Rhinon Tech - Stop Frontend Script

echo "🛑 Stopping Rhinon Frontend..."

cd "$(dirname "$0")/rhinon"

if [ -f .rhinon.pid ]; then
    PID=$(cat .rhinon.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✅ Frontend stopped (PID: $PID)"
    else
        echo "⚠️  Process not running"
    fi
    rm .rhinon.pid
else
    echo "⚠️  No PID file found. Trying to kill by port..."
    # Try to kill process on port 4000
    lsof -ti:4000 | xargs kill -9 2>/dev/null && echo "✅ Killed process on port 4000" || echo "⚠️  No process on port 4000"
fi

echo ""
