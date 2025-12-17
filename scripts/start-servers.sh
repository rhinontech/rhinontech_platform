#!/bin/bash

# Rhinon Tech - Unified Server Startup Script
# This script starts both AI server and RT server using Docker

echo "🚀 Starting Rhinon Tech Backend Services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "Opening Docker..."
    open -a Docker
    echo "Waiting for Docker to start (30 seconds)..."
    sleep 30
fi

# Navigate to the assistant directory
cd "$(dirname "$0")"

echo "📦 Building and starting Docker containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
echo "----------------------------------------"
docker-compose ps

echo ""
echo "✅ Backend services started successfully!"
echo ""
echo "🌐 Service URLs:"
echo "  - AI Server (FastAPI):    http://localhost:5002"
echo "  - RT Server (Express):    http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - AI Swagger:  http://localhost:5002/docs"
echo "  - RT Swagger:  http://localhost:3000/api-docs"
echo ""
echo "📋 Useful Commands:"
echo "  - View logs:        docker-compose logs -f"
echo "  - Stop servers:     docker-compose down"
echo "  - Restart servers:  docker-compose restart"
echo ""
