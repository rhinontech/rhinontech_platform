# Rhinon Tech Platform - Copilot Instructions

Welcome to the Rhinon Tech Platform! This guide will help you understand our codebase and be productive quickly.

## Architecture Overview

Our platform is a microservices-based architecture orchestrated with Docker. The main components are:

-   `rhinon/`: The **Next.js frontend**. This is the main web application. Key folders are `src/app`, `src/components`, and `src/lib`.
-   `rtserver/`: The core **Express.js backend API**. It handles business logic, user management, and database interactions. Look into `routes/`, `controllers/`, and `models/` when adding new API features.
-   `backendai/`: A **FastAPI (Python) microservice** for all AI-related tasks. It integrates with external services like Google Gemini. The main logic is in `controller/` and `services/`.
-   `rhinonbot-sdk/`: A **TypeScript SDK** for integrating the Rhinon chatbot into other applications.
-   `infra/`: Contains **Terraform** code for our AWS infrastructure. Changes here affect deployment environments.
-   `nginx/`: Nginx configurations for our reverse proxy in beta and production.

Services communicate over a Docker network. The frontend (`rhinon`) calls `rtserver` and `backendai`. `rtserver` can also call `backendai`.

## Getting Started & Development Workflow

The easiest way to get the development environment running is to use the top-level scripts.

1.  **One-time Setup**: Run `./setup.sh` to create necessary `.env` files.
2.  **Start all services**: Run `./start-all.sh`. This will start the frontend, backend, and AI services with hot-reloading enabled.
    -   Frontend: `http://localhost:4000`
    -   RT Server: `http://localhost:3000`
    -   AI Server: `http://localhost:5002`
3.  **View logs**: Use `./view-logs.sh` for backend services and `./view-frontend-logs.sh` for the Next.js app.
4.  **Stop all services**: Run `./stop-all.sh`.

Alternatively, you can use the `Makefile` (`make up`, `make down`) or `docker-compose up` for more control over the backend services.

## Common Development Patterns

### Adding a new API Endpoint to `rtserver`

1.  **Route**: Add a new route in the appropriate file in `rtserver/routes/`.
2.  **Controller**: Implement the request handler in `rtserver/controllers/`.
3.  **Service**: Place the core business logic in a new or existing service in `rtserver/services/`.
4.  **Model**: If you need to interact with the database, you might need a new Sequelize model in `rtserver/models/`. Remember to create a migration in `rtserver/migrations/` if you change the schema.

### Adding a new AI feature to `backendai`

1.  **Route**: Define a new endpoint in `backendai/routes/`.
2.  **Controller**: Create a controller function in `backendai/controller/`.
3.  **Service**: Implement the AI logic (e.g., calling Gemini) in `backendai/services/`.

## Important Files

-   `docker-compose.yml`: Defines the local development services.
-   `Makefile`: Provides convenient shortcuts for Docker and dependency management.
-   `PROJECT_OVERVIEW.md`: A detailed document explaining the entire project architecture, deployment, and infrastructure. Refer to this for a deeper understanding.
-   `scripts/`: Contains the core orchestration scripts for starting, stopping, and managing the application stack.
