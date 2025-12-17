#!/bin/bash

# Rhinon Tech - Start Frontend (Next.js) with nohup
# This script starts the rhinon frontend app in background

echo "🚀 Starting Rhinon Frontend (Next.js)..."
echo ""

# Navigate to rhinon directory
cd "$(dirname "$0")/rhinon"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill existing process if running
if [ -f .rhinon.pid ]; then
    OLD_PID=$(cat .rhinon.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "🛑 Stopping existing Rhinon frontend (PID: $OLD_PID)..."
        kill $OLD_PID
        sleep 2
    fi
    rm .rhinon.pid
fi

# Start the app with nohup
echo "🔄 Starting Next.js server in background..."
nohup npm run dev > rhinon.log 2>&1 &

# Save the PID
echo $! > .rhinon.pid

echo ""
echo "✅ Rhinon Frontend started successfully!"
echo ""
echo "🌐 Frontend URL:  http://localhost:4000"
echo "📋 Log file:      rhinon/rhinon.log"
echo "🆔 Process ID:    $(cat .rhinon.pid)"
echo ""
echo "📋 Useful Commands:"
echo "  - View logs:     tail -f rhinon/rhinon.log"
echo "  - Stop frontend: ./stop-frontend.sh"
echo ""
