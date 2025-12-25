.PHONY: help init install build up start stop restart down logs clean shell-api shell-frontend

# Valid values: [dev, prod]
ENV ?= dev

help:
	@echo "Rhinon Tech Platform Makefile"
	@echo "============================="
	@echo "Targets:"
	@echo "  init           - create local .env from .env.example"
	@echo "  install        - install dependencies for all services"
	@echo "  build          - build all docker images"
	@echo "  up             - start all services in detached mode (builds if needed)"
	@echo "  start          - alias for 'up'"
	@echo "  stop           - stop all services"
	@echo "  restart        - restart all services"
	@echo "  down           - stop and remove containers, networks"
	@echo "  logs           - view logs (follow)"
	@echo "  clean          - remove containers, networks, and volumes"
	@echo "  shell-api      - open shell in backend (rtserver)"
	@echo "  shell-frontend - open shell in frontend (rhinon)"

init:
	@cp -n .env.example .env 2>/dev/null || true
	@echo "Environment initialized."

install:
	@echo "Installing dependencies for rhinon..."
	@cd rhinon && npm install
	@echo "Installing dependencies for rtserver..."
	@cd rtserver && npm install
	@echo "Installing dependencies for rhinonbot-sdk..."
	@cd rhinonbot-sdk && npm install
	@# backendai uses python/pip, usually done inside docker or venv
	@echo "Dependencies installed."

build:
	@echo "Building Docker images..."
	docker-compose build

up:
	@echo "Starting services (DEV)..."
	docker-compose up --build -d
	@echo "Services started:"
	@echo "  Frontend: http://localhost:4000"
	@echo "  Backend:  http://localhost:3000"
	@echo "  AI:       http://localhost:5002"

prod:
	@echo "Starting services (PROD)..."
	docker-compose -f docker-compose.prod.yml up --build -d
	@echo "Production services started."

start: up

stop:
	docker-compose stop

restart: down up

down:
	docker-compose down

logs:
	docker-compose logs -f --tail=200

clean:
	docker-compose down -v
	docker-compose rm -f

shell-api:
	docker-compose exec rtserver sh

shell-frontend:
	docker-compose exec rhinon sh
