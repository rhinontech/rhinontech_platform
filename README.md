# Rhinon Tech Platform - Docker & nohup Setup

Complete Docker and nohup setup for the Rhinon Tech platform with one-command startup.

## 🚀 Quick Start

```bash
# One-time setup
chmod +x setup.sh
./setup.sh

# Start everything
./start-all.sh
```

That's it! All services will start:
- ✅ AI Server (FastAPI) on **http://localhost:5002**
- ✅ RT Server (Express + Socket.IO) on **http://localhost:3000**
- ✅ Frontend (Next.js) on **http://localhost:4000**

---

## 📋 Main Commands

| Command | Description |
|---------|-------------|
| `./setup.sh` | Initial setup (run once) |
| `./start-all.sh` | Start all services |
| `./stop-all.sh` | Stop all services |
| `./restart-all.sh` | Restart all services |
| `./status.sh` | Check service status |
| `./view-logs.sh` | View backend logs |
| `./view-frontend-logs.sh` | View frontend logs |

---

## 📦 What's Included

### Docker Services (Backend)
- **backendai** - FastAPI AI server with Gemini integration
- **rtserver** - Express.js REST API server with Socket.IO for real-time communication

Both services:
- ✅ Auto-restart on failure
- ✅ Hot reload during development
- ✅ Isolated in Docker network
- ✅ Health checks enabled

### nohup Service (Frontend)
- **rhinon** - Next.js web application

Features:
- ✅ Runs in background (doesn't block terminal)
- ✅ Auto-restarts on code changes
- ✅ Logs to file (rhinon.log)
- ✅ Process ID saved for easy management

---

## 🌐 Service URLs

```
Frontend (Next.js):    http://localhost:4000
Backend API (Express): http://localhost:3000  
AI Server (FastAPI):   http://localhost:5002
WebSocket (Socket.IO): ws://localhost:3000

API Docs:
- AI Swagger:  http://localhost:5002/docs
- RT Swagger:  http://localhost:3000/api-docs
```

---

## 🗂️ Project Structure

```
assistant/
├── docker-compose.yml          # Unified Docker config (AI + RT Server)
├── start-all.sh               # Start everything
├── stop-all.sh                # Stop everything  
├── status.sh                  # Check status
├── setup.sh                   # Initial setup
│
├── backendai/                 # FastAPI AI Services
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env
│
├── rtserver/                  # Express Backend
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env
│
└── rhinon/                    # Next.js Frontend
    ├── .env.local
    ├── .rhinon.pid            # Process ID (auto-generated)
    └── rhinon.log             # Logs (auto-generated)
```

---

## 🔧 Environment Setup

### Required Files

Each service needs environment variables:

```bash
backendai/.env          # GOOGLE_API_KEY, OPENAI_API_KEY, etc.
rtserver/.env           # DB credentials, AWS keys, etc.
rhinon/.env.local       # API URLs (auto-created)
```

Run `./setup.sh` to create templates from sample files.

---

## 💻 Usage

### Start Everything
```bash
./start-all.sh
```

### Stop Everything
```bash
./stop-all.sh
```

### Check Status
```bash
./status.sh
```

### View Logs
```bash
# Backend services
./view-logs.sh

# Frontend
./view-frontend-logs.sh

# Or specific service
docker logs rhinon-ai-server -f
docker logs rhinon-rtserver -f
tail -f rhinon/rhinon.log
```

### Restart Services
```bash
# Restart all
./restart-all.sh

# Restart backend only
docker-compose restart

# Restart frontend only
./stop-frontend.sh && ./start-frontend.sh
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000
lsof -i :5002

# Kill and restart
./stop-all.sh
./start-all.sh
```

### Docker Won't Start
```bash
# Manually start Docker
open -a Docker

# Wait for it to be ready
sleep 30

# Try again
./start-all.sh
```

### Frontend Stuck
```bash
# Force stop and clean
./stop-frontend.sh
rm rhinon/.rhinon.pid rhinon/rhinon.log

# Start again
./start-frontend.sh
```

### Complete Reset
```bash
# Nuclear option - stops everything and rebuilds
./stop-all.sh
docker-compose down --volumes
rm rhinon/.rhinon.pid rhinon/rhinon.log
./start-all.sh
```

---

## 🎯 Development Workflow

### Daily Use

```bash
# Morning
./start-all.sh

# Work on your features...
# All services have hot-reload enabled

# Check if something's wrong
./status.sh
./view-logs.sh

# Evening
./stop-all.sh
```

### Working on Specific Service

**AI Server only:**
```bash
cd backendai
docker-compose up
```

**Backend only:**
```bash
cd rtserver  
docker-compose up
```

**Frontend only:**
```bash
cd rhinon
npm run dev
```

---

## ⚡ Performance

**Resource Usage:**
- AI Server: ~500MB RAM
- RT Server: ~200MB RAM
- Frontend: ~300MB RAM
- **Total: ~1GB RAM**

**Startup Time:**
- Docker services: ~15 seconds
- Frontend: ~10 seconds
- **Total: ~25 seconds**

---

## 🔐 Security

- Docker containers isolated in private network
- Backend services don't expose unnecessary ports
- All `.env` files are gitignored
- Frontend runs as regular user (not root)

---

## 📚 Documentation

- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Complete Docker documentation
- [LINKEDIN_AI_AUTOMATION.md](LINKEDIN_AI_AUTOMATION.md) - AI features guide

---

## 🆘 Getting Help

### Check Status
```bash
./status.sh
```

### View Logs
```bash
./view-logs.sh              # Backend
./view-frontend-logs.sh     # Frontend
```

### Health Checks
```bash
# AI Server
curl http://localhost:5002/hello

# RT Server
curl http://localhost:3000

# Frontend
curl http://localhost:4000
```

---

## 📦 Tech Stack

| Component | Technology | Port |
|-----------|-----------|------|
| AI Server | FastAPI (Python) | 5002 |
| Backend | Express (Node.js) | 3000 |
| Real-time | Socket.IO | 3000 |
| Frontend | Next.js (React) | 4000 |
| Container | Docker | - |
| Process Manager | nohup | - |
| Database | PostgreSQL + pgvector | 5432 |
| Cache | Redis | 6379 |
| File Storage | AWS S3 (Presigned URLs) | - |

---

## ✅ Status Check

Verify everything is running:

```bash
# Quick status
./status.sh

# Or manually
docker ps                    # Check Docker containers
cat rhinon/.rhinon.pid       # Check frontend PID
lsof -i :3000,4000,5002      # Check ports
```

Expected output:
```
✅ rhinon-ai-server   Up
✅ rhinon-rtserver    Up  
✅ Frontend (PID: xxxx)
```

---

## 🎉 Features

- ✅ One-command startup for entire platform
- ✅ Auto-restart on failure (Docker services)
- ✅ Hot reload during development
- ✅ Background process management (nohup)
- ✅ Centralized logging
- ✅ Health checks
- ✅ Easy status monitoring
- ✅ Isolated networking
- ✅ Real-time WebSocket communication
- ✅ Secure S3 file access with presigned URLs
- ✅ Production-ready

---

**Last Updated:** February 12, 2026  
**Version:** 2.1.0  
**Status:** ✅ Production Ready
