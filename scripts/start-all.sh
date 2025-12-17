#!/bin/bash

# Rhinon Tech - Start All Services
# This script starts the complete Rhinon Tech platform:
# - AI Server (FastAPI) on port 5002
# - RT Server (Express) on port 3000
# - Frontend (Next.js) on port 4000

echo "🚀 Starting Complete Rhinon Tech Platform..."
echo "=============================================="
echo ""

# Get the script directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Step 1: Start Backend Services (Docker)
echo "📦 Step 1/2: Starting Backend Services (Docker)..."
./start-servers.sh

# Wait for backends to be ready
echo ""
echo "⏳ Waiting for backends to be ready (15 seconds)..."
sleep 15

# Step 2: Start Frontend (nohup)
echo ""
echo "🎨 Step 2/2: Starting Frontend Service..."
./start-frontend.sh

echo ""
echo "=============================================="
echo "✅ Complete Rhinon Tech Platform Started!"
echo "=============================================="
echo ""
echo "🌐 Service URLs:"
echo "  ┌─────────────────────────────────────────┐"
echo "  │  Frontend (Next.js):  http://localhost:4000  │"
echo "  │  Backend (Express):   http://localhost:3000  │"
echo "  │  AI Server (FastAPI): http://localhost:5002  │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "📚 API Documentation:"
echo "  - AI Swagger:  http://localhost:5002/docs"
echo "  - RT Swagger:  http://localhost:3000/api-docs"
echo ""
echo "📋 Quick Commands:"
echo "  - View backend logs:   ./view-logs.sh"
echo "  - View frontend logs:  ./view-frontend-logs.sh"
echo "  - Stop all services:   ./stop-all.sh"
echo ""
