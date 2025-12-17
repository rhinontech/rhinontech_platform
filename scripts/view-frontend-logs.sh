#!/bin/bash

# Rhinon Tech - View Frontend Logs

cd "$(dirname "$0")/rhinon"

echo "📋 Viewing Rhinon Frontend logs (Ctrl+C to exit)..."
echo ""

if [ -f rhinon.log ]; then
    tail -f rhinon.log
else
    echo "❌ Log file not found. Is the frontend running?"
fi
