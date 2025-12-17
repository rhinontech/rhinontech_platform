#!/bin/bash

# Rhinon Tech - Initial Setup Script
# Run this once after cloning the repository

echo "🔧 Rhinon Tech - Initial Setup"
echo "=============================================="
echo ""

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# Step 1: Make all scripts executable
echo "📝 Step 1: Making scripts executable..."
chmod +x *.sh
chmod +x rhinon/*.sh 2>/dev/null || true

# Step 2: Check Docker
echo ""
echo "🐳 Step 2: Checking Docker..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "⚠️  Docker not running. Starting Docker Desktop..."
    open -a Docker
    echo "   Waiting for Docker to start (30 seconds)..."
    sleep 30
    
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker started successfully"
    else
        echo "❌ Failed to start Docker. Please start it manually."
        exit 1
    fi
fi

# Step 3: Check .env files
echo ""
echo "📄 Step 3: Checking environment files..."

if [ ! -f "backendai/.env" ]; then
    echo "⚠️  backendai/.env not found"
    if [ -f "backendai/sampleenv.txt" ]; then
        echo "   Creating from sampleenv.txt..."
        cp backendai/sampleenv.txt backendai/.env
        echo "   ⚠️  Please edit backendai/.env with your API keys"
    fi
fi

if [ ! -f "rtserver/.env" ]; then
    echo "⚠️  rtserver/.env not found"
    if [ -f "rtserver/sampleenv.txt" ]; then
        echo "   Creating from sampleenv.txt..."
        cp rtserver/sampleenv.txt rtserver/.env
        echo "   ⚠️  Please edit rtserver/.env with your credentials"
    fi
fi

if [ ! -f "rhinon/.env.local" ]; then
    echo "⚠️  rhinon/.env.local not found"
    echo "   Creating default .env.local..."
    cat > rhinon/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_AI_API_URL=http://localhost:5002
EOF
fi

# Step 4: Check Node.js
echo ""
echo "📦 Step 4: Checking Node.js..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Step 5: Install frontend dependencies
echo ""
echo "📦 Step 5: Installing frontend dependencies..."
cd rhinon
if [ ! -d "node_modules" ]; then
    echo "   Installing npm packages (this may take a few minutes)..."
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Edit environment files with your credentials:"
echo "   - backendai/.env      (API keys)"
echo "   - rtserver/.env       (Database, AWS, etc.)"
echo "   - rhinon/.env.local   (Already configured)"
echo ""
echo "2. Start all services:"
echo "   ./start-all.sh"
echo ""
echo "3. Check service status:"
echo "   ./status.sh"
echo ""
echo "4. View logs:"
echo "   ./view-logs.sh              (Backend)"
echo "   ./view-frontend-logs.sh     (Frontend)"
echo ""
echo "📚 For more info, see DOCKER_SETUP.md"
echo ""
