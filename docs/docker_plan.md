# Docker POC Plan — app-dev (RTServer + BackendAI)

## Objective

Create a clean **Docker-based POC setup** where **RTServer (Node.js)** and **BackendAI (Python/FastAPI)** run together on a **single EC2 instance (`app-dev`)** using **one Docker Compose project**.

This setup must:

* Work **locally** and on **DEV EC2** without changes
* Be **production-ready by design** (easy to split later)
* Use **Redis** as a shared dependency
* Keep services **logically isolated**, even when running together

---

## Current Repository Context

```
rhinontech_platform/
├── backendai/
├── rtserver/
├── infra/
├── rhinon/            # Next.js (separate EC2)
├── rhinonbot-sdk/
├── scripts/
├── docker-compose.yml
└── README.md
```

---

## Target DEV Architecture

### Compute

| EC2     | Purpose          | Services                     |
| ------- | ---------------- | ---------------------------- |
| app-dev | Backend services | rtserver + backendai + redis |
| web-dev | Frontend         | Next.js + Nginx              |

---

## Docker Strategy (DEV)

* **One Docker Compose project** on `app-dev`
* **One container per service** (NOT one process per container)
* Services communicate via **Docker network**
* Environment-based configuration only

### Services

| Service   | Tech    | Port (internal) |
| --------- | ------- | --------------- |
| rtserver  | Node.js | 3000            |
| backendai | FastAPI | 8000            |
| redis     | Redis 7 | 6379            |

---

## Step-by-Step Instructions

### 1. Remove Existing Docker Setup

* Delete any old or unused Dockerfiles
* Remove unused docker-compose files
* Ensure no legacy containers or volumes are referenced

---

### 2. Create Service-Level Dockerfiles

#### rtserver/Dockerfile

* Base: `node:18-alpine`
* Install dependencies
* Expose port `3000`
* Start server using `npm start` or equivalent

#### backendai/Dockerfile

* Base: `python:3.11-slim`
* Install dependencies via `requirements.txt`
* Expose port `8000`
* Start FastAPI using `uvicorn`

---

### 3. Create Root docker-compose.yml (DEV)

Responsibilities:

* Build both services from local folders
* Start Redis
* Create shared Docker network
* Inject environment variables

Example responsibilities (not exact code):

* `rtserver` connects to `backendai` via service name
* Both connect to `redis`

---

### 4. Environment Configuration

Create separate env files:

```
.env.dev
.env.prod (future)
```

Use variables such as:

* BACKENDAI_URL=[http://backendai:8000](http://backendai:8000)
* REDIS_HOST=redis
* NODE_ENV=development

No hardcoded IPs.

---

### 5. Networking Rules

* Services must communicate using **Docker service names**
* No localhost usage between containers
* External exposure only if required (optional in DEV)

---

## Validation Checklist

* [ ] `docker-compose up` works locally
* [ ] rtserver can call backendai
* [ ] Redis is reachable from both services
* [ ] Containers restart cleanly
* [ ] No port conflicts
* [ ] Logs are readable via `docker-compose logs`

---

## Production Readiness (Important)

This setup must be **split-ready**:

### Future PROD

| EC2            | Runs           |
| -------------- | -------------- |
| rtserver-prod  | rtserver only  |
| backendai-prod | backendai only |

Achieved by:

* Reusing same Dockerfiles
* Using separate compose files
* Changing infra, not code

---

## What NOT to Do

* ❌ Do NOT run multiple processes in one container
* ❌ Do NOT hardcode IPs
* ❌ Do NOT mix frontend with backend containers
* ❌ Do NOT create separate repos

---

## Final Outcome

After completion:

* DEV runs on **2 EC2s** cleanly
* Docker setup is **identical locally and on EC2**
* PROD split is **trivial and safe**

This Docker POC is the foundation for scaling Rhinon Tech.
