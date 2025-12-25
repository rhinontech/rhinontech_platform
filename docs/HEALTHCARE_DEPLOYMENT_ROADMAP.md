# 🏥 Healthcare POC - AWS Deployment Roadmap

**Project:** Rhinon Tech → Healthcare Industry POC  
**Target Domains:**
- Frontend: `health.rhinontech.com`
- API Server: `api-health.rhinontech.com`  
- AI Backend: `ai-health.rhinontech.com`

**Date:** December 20, 2025

---

## 📋 Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Missing Terraform Resources](#2-missing-terraform-resources)
3. [Infrastructure Setup](#3-infrastructure-setup)
4. [Environment Configuration](#4-environment-configuration)
5. [Docker & Container Strategy](#5-docker--container-strategy)
6. [Nginx Configuration](#6-nginx-configuration)
7. [SSL/TLS Setup](#7-ssltls-setup)
8. [Deployment Pipeline](#8-deployment-pipeline)
9. [Step-by-Step Deployment Guide](#9-step-by-step-deployment-guide)
10. [Post-Deployment Checklist](#10-post-deployment-checklist)

---

## 1. Current State Analysis

### ✅ What's Ready

| Component | Status | Notes |
|-----------|--------|-------|
| VPC Module | ✅ Complete | Networking, subnets, IGW |
| EC2 Module | ✅ Complete | Basic instance provisioning |
| RDS Module | ✅ Complete | PostgreSQL 15.4 |
| Security Groups | ✅ Complete | EC2 & RDS SGs |
| Dockerfiles | ✅ Complete | rtserver, backendai |
| docker-compose.yml | ✅ Complete | Dev setup with Redis |
| Backend.tf | ✅ Complete | S3 state management |

### ❌ What's Missing

| Component | Status | Priority |
|-----------|--------|----------|
| S3 Module | ❌ Empty | HIGH - File storage |
| ECR Module | ❌ Empty | HIGH - Docker registry |
| IAM Module | ❌ Empty | HIGH - Permissions |
| Secrets Manager | ❌ Empty | HIGH - Credentials |
| CloudWatch Module | ❌ Empty | MEDIUM - Monitoring |
| Route53 Records | ❌ Missing | HIGH - DNS |
| ACM Certificate | ❌ Missing | HIGH - SSL |
| ALB/ELB | ❌ Missing | MEDIUM - Load balancer |
| Prod Environment | ❌ Missing | HIGH - Production config |
| Next.js Dockerfile | ❌ Missing | HIGH - Frontend container |

---

## 2. Missing Terraform Resources

### 2.1 S3 Module (Required)

Create `infra/modules/s3/main.tf`:

```hcl
# S3 bucket for application assets (uploads, files)
resource "aws_s3_bucket" "app_bucket" {
  bucket = "${var.environment}-${var.project_name}-assets"

  tags = {
    Name        = "${var.environment}-${var.project_name}-assets"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_versioning" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = var.cors_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "app_bucket" {
  bucket = aws_s3_bucket.app_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### 2.2 ECR Module (Required for Docker)

Create `infra/modules/ecr/main.tf`:

```hcl
resource "aws_ecr_repository" "rtserver" {
  name                 = "${var.environment}-rtserver"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-rtserver"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "backendai" {
  name                 = "${var.environment}-backendai"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-backendai"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "rhinon" {
  name                 = "${var.environment}-rhinon"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.environment}-rhinon"
    Environment = var.environment
  }
}

# Lifecycle policy to clean up old images
resource "aws_ecr_lifecycle_policy" "cleanup" {
  for_each   = toset(["rtserver", "backendai", "rhinon"])
  repository = aws_ecr_repository[each.key].name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}
```

### 2.3 IAM Module (Required)

Create `infra/modules/iam/main.tf`:

```hcl
# EC2 Instance Profile for accessing ECR, S3, Secrets
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "secrets_read" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
```

### 2.4 Secrets Manager Module

Create `infra/modules/secrets/main.tf`:

```hcl
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${var.environment}/${var.project_name}/app-secrets"
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    JWT_SECRET           = var.jwt_secret
    DB_PASSWORD          = var.db_password
    OPENAI_API_KEY       = var.openai_api_key
    RAZORPAY_KEY_SECRET  = var.razorpay_key_secret
    AWS_ACCESS_KEY_ID    = var.aws_access_key
    AWS_SECRET_ACCESS_KEY = var.aws_secret_key
  })
}
```

### 2.5 Route53 Module (DNS)

Create `infra/modules/route53/main.tf`:

```hcl
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# Frontend: health.rhinontech.com
resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.frontend_subdomain
  type    = "A"
  ttl     = 300
  records = [var.web_server_ip]
}

# API: api-health.rhinontech.com
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.api_subdomain
  type    = "A"
  ttl     = 300
  records = [var.app_server_ip]
}

# AI Backend: ai-health.rhinontech.com
resource "aws_route53_record" "ai" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.ai_subdomain
  type    = "A"
  ttl     = 300
  records = [var.app_server_ip]
}
```

### 2.6 ACM Certificate

Create `infra/modules/acm/main.tf`:

```hcl
resource "aws_acm_certificate" "main" {
  domain_name               = "*.rhinontech.com"
  subject_alternative_names = ["rhinontech.com"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

---

## 3. Infrastructure Setup

### 3.1 Production Environment Structure

Create `infra/envs/prod/` directory with:

```
infra/envs/prod/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
└── versions.tf
```

### 3.2 Production Main.tf

```hcl
# infra/envs/prod/main.tf

module "vpc" {
  source              = "../../modules/vpc"
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  availability_zones  = var.availability_zones
  environment         = var.environment
}

module "security_groups" {
  source          = "../../modules/security-groups"
  vpc_id          = module.vpc.vpc_id
  environment     = var.environment
  ssh_allowed_ips = var.ssh_allowed_ips
}

module "iam" {
  source      = "../../modules/iam"
  environment = var.environment
}

module "ecr" {
  source      = "../../modules/ecr"
  environment = var.environment
}

module "s3" {
  source       = "../../modules/s3"
  environment  = var.environment
  project_name = "healthcare-poc"
  cors_origins = [
    "https://health.rhinontech.com",
    "https://api-health.rhinontech.com"
  ]
}

module "secrets" {
  source               = "../../modules/secrets"
  environment          = var.environment
  project_name         = "healthcare-poc"
  jwt_secret           = var.jwt_secret
  db_password          = var.db_password
  openai_api_key       = var.openai_api_key
  razorpay_key_secret  = var.razorpay_key_secret
  aws_access_key       = var.aws_access_key
  aws_secret_key       = var.aws_secret_key
}

# App Server (rtserver + backendai)
module "app_server" {
  source                 = "../../modules/ec2"
  name                   = "app-prod"
  ami_id                 = var.ami_id
  instance_type          = "t3.medium"  # Production size
  subnet_id              = module.vpc.public_subnet_ids[0]
  key_name               = var.key_name
  vpc_security_group_ids = [module.security_groups.ec2_sg_id]
  iam_instance_profile   = module.iam.ec2_instance_profile_name
  environment            = var.environment
  service_tag            = "app-server"
  user_data              = file("${path.module}/scripts/app-server-init.sh")
}

# Web Server (Next.js + Nginx)
module "web_server" {
  source                 = "../../modules/ec2"
  name                   = "web-prod"
  ami_id                 = var.ami_id
  instance_type          = "t3.small"
  subnet_id              = module.vpc.public_subnet_ids[0]
  key_name               = var.key_name
  vpc_security_group_ids = [module.security_groups.ec2_sg_id]
  iam_instance_profile   = module.iam.ec2_instance_profile_name
  environment            = var.environment
  service_tag            = "web-server"
  user_data              = file("${path.module}/scripts/web-server-init.sh")
}

module "rds" {
  source                 = "../../modules/rds"
  environment            = var.environment
  subnet_ids             = module.vpc.public_subnet_ids
  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  db_instance_class      = "db.t3.small"  # Production size
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
}

module "route53" {
  source             = "../../modules/route53"
  domain_name        = "rhinontech.com"
  frontend_subdomain = "health"
  api_subdomain      = "api-health"
  ai_subdomain       = "ai-health"
  web_server_ip      = module.web_server.public_ip
  app_server_ip      = module.app_server.public_ip
}

module "acm" {
  source      = "../../modules/acm"
  environment = var.environment
}
```

### 3.3 Production terraform.tfvars

```hcl
# infra/envs/prod/terraform.tfvars

aws_region          = "ap-south-1"
environment         = "prod"
vpc_cidr            = "10.1.0.0/16"
public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
availability_zones  = ["ap-south-1a", "ap-south-1b"]
ssh_allowed_ips     = ["YOUR_OFFICE_IP/32"]  # Restrict SSH!

ami_id              = "ami-0f5ee92e2d63afc18"  # Ubuntu 22.04
instance_type       = "t3.medium"
key_name            = "rhinon-prod-key"

db_instance_class   = "db.t3.small"
db_name             = "healthcaredb"
db_username         = "healthadmin"
# db_password - Set via TF_VAR_db_password or secrets

# Domain configuration
domain_name         = "rhinontech.com"
```

---

## 4. Environment Configuration

### 4.1 Production Environment Files

#### `.env.prod` (Root level - for docker-compose)

```bash
# ========================================
# HEALTHCARE POC - PRODUCTION ENVIRONMENT
# ========================================

# General
NODE_ENV=production
ENVIRONMENT=prod

# ========== RTSERVER ==========
PORT=3000

# JWT
JWT_SECRET=${JWT_SECRET}

# PostgreSQL (RDS)
DB_HOST=${RDS_ENDPOINT}
DB_PORT=5432
DB_NAME=healthcaredb
DB_USERNAME=healthadmin
DB_PASSWORD=${DB_PASSWORD}
DB_SCHEMA=public

# CRM Database (same RDS, different DB)
CRM_DB_HOST=${RDS_ENDPOINT}
CRM_DB_PORT=5432
CRM_DB_NAME=healthcare-crm
CRM_DB_USERNAME=healthadmin
CRM_DB_PASSWORD=${DB_PASSWORD}

# AWS
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=ap-south-1
S3_BUCKET_NAME=prod-healthcare-poc-assets
S3_FOLDER_NAME=uploads

# MongoDB (for KB, SEO)
MONGO_URI=${MONGO_URI}
MONGO_URI_KB=${MONGO_URI_KB}
MONGO_URI_CB=${MONGO_URI_CB}

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=${EMAIL_USER}
EMAIL_PASSWORD=${EMAIL_PASSWORD}
EMAIL_DOMAIN=health.rhinontech.com

# Razorpay
RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}

# Frontend URL
FRONT_END_URL=https://health.rhinontech.com

# Google OAuth
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# Outlook OAuth
CLIENT_ID=${OUTLOOK_CLIENT_ID}
CLIENT_SECRET=${OUTLOOK_CLIENT_SECRET}

# ========== BACKENDAI ==========
OPENAI_API_KEY=${OPENAI_API_KEY}
GOOGLE_API_KEY=${GOOGLE_API_KEY}

# Logger
LOGGER_FILE=./logs/app_server.log
LOGGER_LEVEL=logging.INFO
LOGGER_FORMAT=%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s

# S3 Base URL
S3_BASE_URL=https://prod-healthcare-poc-assets.s3.ap-south-1.amazonaws.com

# ========== REDIS ==========
REDIS_HOST=redis
REDIS_PORT=6379
```

#### `rhinon/.env.prod` (Next.js Frontend)

```bash
# ========================================
# RHINON FRONTEND - PRODUCTION
# ========================================

# API URLs
NEXT_PUBLIC_API_URL=https://api-health.rhinontech.com/api
NEXT_PUBLIC_SOCKET_URL=https://api-health.rhinontech.com
NEXT_PUBLIC_API_AI_URL=https://ai-health.rhinontech.com

# Base URL
NEXT_PUBLIC_BASE_URL=https://health.rhinontech.com

# Google OAuth
NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID=${GOOGLE_CLIENT_ID}
NEXT_PUBLIC_GOOGLE_SECRET_KEY=${GOOGLE_CLIENT_SECRET}
NEXT_PUBLIC_GOOGLE_SCOPE="https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/gmail.send"

# Microsoft OAuth
NEXT_PUBLIC_OUTLOOK_CLIENT_ID=${OUTLOOK_CLIENT_ID}

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
NEXT_PUBLIC_PAYMENT_GATEWAY_URL="https://checkout.razorpay.com/v1/checkout.js"
```

### 4.2 Environment Variables Management Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECRETS MANAGEMENT FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   LOCAL DEV              →    AWS SECRETS MANAGER   →   EC2     │
│   .env.local                  prod/healthcare/secrets    Docker │
│                                                                 │
│   ┌──────────────┐           ┌──────────────────┐              │
│   │ .env.dev     │           │ AWS Secrets      │              │
│   │ .env.prod    │    →      │ Manager          │     →        │
│   │ (templates)  │           │                  │              │
│   └──────────────┘           └──────────────────┘              │
│                                      │                          │
│                                      ▼                          │
│                              ┌──────────────────┐              │
│                              │ EC2 User Data    │              │
│                              │ Script fetches   │              │
│                              │ secrets on boot  │              │
│                              └──────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Docker & Container Strategy

### 5.1 Missing Dockerfile - rhinon (Next.js)

Create `rhinon/Dockerfile`:

```dockerfile
# rhinon/Dockerfile

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_API_AI_URL
ARG NEXT_PUBLIC_BASE_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_API_AI_URL=$NEXT_PUBLIC_API_AI_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 5.2 Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  rtserver:
    image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/prod-rtserver:${TAG:-latest}
    container_name: rtserver-prod
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.prod
    depends_on:
      - redis
    networks:
      - healthcare-network
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "${AWS_REGION}"
        awslogs-group: "/healthcare/rtserver"
        awslogs-stream-prefix: "prod"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backendai:
    image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/prod-backendai:${TAG:-latest}
    container_name: backendai-prod
    restart: always
    ports:
      - "5002:5002"
    env_file:
      - .env.prod
    depends_on:
      - redis
    networks:
      - healthcare-network
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "${AWS_REGION}"
        awslogs-group: "/healthcare/backendai"
        awslogs-stream-prefix: "prod"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: redis-prod
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - healthcare-network
    command: redis-server --appendonly yes

networks:
  healthcare-network:
    driver: bridge

volumes:
  redis-data:
```

### 5.3 Web Server Docker Compose

Create `docker-compose.web.yml`:

```yaml
# docker-compose.web.yml (for web-prod EC2)
version: '3.8'

services:
  rhinon:
    image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/prod-rhinon:${TAG:-latest}
    container_name: rhinon-prod
    restart: always
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    networks:
      - web-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/certbot:/var/www/certbot:ro
    depends_on:
      - rhinon
    networks:
      - web-network

networks:
  web-network:
    driver: bridge
```

---

## 6. Nginx Configuration

### 6.1 Main Nginx Config

Create `nginx/nginx.conf`:

```nginx
# nginx/nginx.conf

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml+rss application/atom+xml image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Upstream definitions
    upstream rhinon_app {
        server rhinon:4000;
        keepalive 32;
    }

    # App server IPs (replace with actual)
    upstream rtserver_api {
        server APP_SERVER_IP:3000;
        keepalive 32;
    }

    upstream backendai_api {
        server APP_SERVER_IP:5002;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name health.rhinontech.com api-health.rhinontech.com ai-health.rhinontech.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Frontend: health.rhinontech.com
    server {
        listen 443 ssl http2;
        server_name health.rhinontech.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # HSTS
        add_header Strict-Transport-Security "max-age=63072000" always;

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://rhinon_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static assets
        location /_next/static {
            proxy_pass http://rhinon_app;
            proxy_cache_valid 60m;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }

    # API: api-health.rhinontech.com
    server {
        listen 443 ssl http2;
        server_name api-health.rhinontech.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # API routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://rtserver_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Socket.IO
        location /socket.io {
            proxy_pass http://rtserver_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400;
        }

        # Health check
        location /health {
            proxy_pass http://rtserver_api/health;
        }
    }

    # AI Backend: ai-health.rhinontech.com
    server {
        listen 443 ssl http2;
        server_name ai-health.rhinontech.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Increase timeouts for AI streaming
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;

        location / {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://backendai_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # SSE support for streaming
            proxy_buffering off;
            proxy_cache off;
        }

        # Health check
        location /health {
            proxy_pass http://backendai_api/health;
        }
    }
}
```

---

## 7. SSL/TLS Setup

### 7.1 Let's Encrypt with Certbot

```bash
# On web-prod EC2 instance

# Install certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get certificates
sudo certbot certonly --nginx \
  -d health.rhinontech.com \
  -d api-health.rhinontech.com \
  -d ai-health.rhinontech.com \
  --email admin@rhinontech.com \
  --agree-tos \
  --non-interactive

# Copy to nginx ssl directory
sudo mkdir -p /opt/healthcare/nginx/ssl
sudo cp /etc/letsencrypt/live/health.rhinontech.com/fullchain.pem /opt/healthcare/nginx/ssl/
sudo cp /etc/letsencrypt/live/health.rhinontech.com/privkey.pem /opt/healthcare/nginx/ssl/

# Setup auto-renewal cron
echo "0 0 * * * certbot renew --quiet && docker exec nginx-prod nginx -s reload" | sudo crontab -
```

---

## 8. Deployment Pipeline

### 8.1 Complete Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   LOCAL MAC                                                                     │
│   ┌─────────────┐                                                               │
│   │ 1. Code     │                                                               │
│   │ 2. Test     │                                                               │
│   │ 3. Build    │                                                               │
│   └──────┬──────┘                                                               │
│          │                                                                      │
│          ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                        AWS ECR (Docker Registry)                         │  │
│   │                                                                          │  │
│   │   prod-rtserver:latest    prod-backendai:latest    prod-rhinon:latest   │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│          │                            │                        │                │
│          │                            │                        │                │
│          ▼                            ▼                        ▼                │
│   ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐ │
│   │     APP-PROD EC2            │  │        WEB-PROD EC2                     │ │
│   │                             │  │                                          │ │
│   │  ┌─────────────────────┐   │  │  ┌─────────────────────────────────┐    │ │
│   │  │ Docker Compose      │   │  │  │ Docker Compose                   │    │ │
│   │  │                     │   │  │  │                                  │    │ │
│   │  │ - rtserver:3000     │   │  │  │ - rhinon:4000                    │    │ │
│   │  │ - backendai:5002    │   │  │  │ - nginx:80,443                   │    │ │
│   │  │ - redis:6379        │   │  │  │                                  │    │ │
│   │  └─────────────────────┘   │  │  └─────────────────────────────────┘    │ │
│   └─────────────────────────────┘  └─────────────────────────────────────────┘ │
│                                                                                 │
│                          ┌─────────────────────┐                               │
│                          │   AWS RDS           │                               │
│                          │   PostgreSQL        │                               │
│                          │   healthcaredb      │                               │
│                          └─────────────────────┘                               │
│                                                                                 │
│   DNS (Route53):                                                                │
│   health.rhinontech.com      →  WEB-PROD EC2 (Nginx)                           │
│   api-health.rhinontech.com  →  WEB-PROD EC2 (Nginx) → APP-PROD:3000           │
│   ai-health.rhinontech.com   →  WEB-PROD EC2 (Nginx) → APP-PROD:5002           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Deployment Scripts

Create `scripts/deploy-prod.sh`:

```bash
#!/bin/bash
# scripts/deploy-prod.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="YOUR_AWS_ACCOUNT_ID"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
TAG="${1:-latest}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Healthcare POC - Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Login to ECR
echo -e "\n${YELLOW}[1/6] Logging into AWS ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Step 2: Build images
echo -e "\n${YELLOW}[2/6] Building Docker images...${NC}"

echo "Building rtserver..."
docker build -t ${ECR_REGISTRY}/prod-rtserver:${TAG} ./rtserver

echo "Building backendai..."
docker build -t ${ECR_REGISTRY}/prod-backendai:${TAG} ./backendai

echo "Building rhinon..."
docker build -t ${ECR_REGISTRY}/prod-rhinon:${TAG} \
  --build-arg NEXT_PUBLIC_API_URL=https://api-health.rhinontech.com/api \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api-health.rhinontech.com \
  --build-arg NEXT_PUBLIC_API_AI_URL=https://ai-health.rhinontech.com \
  --build-arg NEXT_PUBLIC_BASE_URL=https://health.rhinontech.com \
  ./rhinon

# Step 3: Push images
echo -e "\n${YELLOW}[3/6] Pushing images to ECR...${NC}"
docker push ${ECR_REGISTRY}/prod-rtserver:${TAG}
docker push ${ECR_REGISTRY}/prod-backendai:${TAG}
docker push ${ECR_REGISTRY}/prod-rhinon:${TAG}

# Step 4: Deploy to App Server
echo -e "\n${YELLOW}[4/6] Deploying to app-prod EC2...${NC}"
ssh -i ~/.ssh/rhinon-prod-key.pem ubuntu@APP_SERVER_IP << 'EOF'
  cd /opt/healthcare
  
  # Login to ECR
  aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ECR_REGISTRY
  
  # Pull latest images
  docker-compose -f docker-compose.prod.yml pull
  
  # Restart services with zero downtime
  docker-compose -f docker-compose.prod.yml up -d --no-deps --build rtserver
  docker-compose -f docker-compose.prod.yml up -d --no-deps --build backendai
  
  # Health check
  sleep 10
  curl -f http://localhost:3000/health || exit 1
  curl -f http://localhost:5002/health || exit 1
  
  echo "App server deployment complete!"
EOF

# Step 5: Deploy to Web Server
echo -e "\n${YELLOW}[5/6] Deploying to web-prod EC2...${NC}"
ssh -i ~/.ssh/rhinon-prod-key.pem ubuntu@WEB_SERVER_IP << 'EOF'
  cd /opt/healthcare
  
  # Login to ECR
  aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ECR_REGISTRY
  
  # Pull latest images
  docker-compose -f docker-compose.web.yml pull
  
  # Restart services
  docker-compose -f docker-compose.web.yml up -d --no-deps rhinon
  
  # Reload nginx
  docker exec nginx-prod nginx -s reload
  
  # Health check
  sleep 10
  curl -f http://localhost:4000 || exit 1
  
  echo "Web server deployment complete!"
EOF

# Step 6: Verify
echo -e "\n${YELLOW}[6/6] Verifying deployment...${NC}"
echo "Checking health endpoints..."
curl -f https://health.rhinontech.com || echo "Frontend check failed"
curl -f https://api-health.rhinontech.com/health || echo "API check failed"
curl -f https://ai-health.rhinontech.com/health || echo "AI check failed"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Frontend:  https://health.rhinontech.com"
echo -e "API:       https://api-health.rhinontech.com"
echo -e "AI:        https://ai-health.rhinontech.com"
```

---

## 9. Step-by-Step Deployment Guide

### Phase 1: Prerequisites (Your Mac)

```bash
# 1. Install required tools
brew install terraform awscli docker

# 2. Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-south-1
# - Default output: json

# 3. Verify AWS access
aws sts get-caller-identity

# 4. Create SSH key pair for EC2
ssh-keygen -t rsa -b 4096 -f ~/.ssh/rhinon-prod-key
aws ec2 import-key-pair \
  --key-name "rhinon-prod-key" \
  --public-key-material fileb://~/.ssh/rhinon-prod-key.pub \
  --region ap-south-1
```

### Phase 2: Create S3 Backend for Terraform State

```bash
# Create S3 bucket for Terraform state (one-time setup)
aws s3api create-bucket \
  --bucket rhinon-terraform-state \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket rhinon-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Phase 3: Create Missing Terraform Modules

```bash
cd /path/to/rhinontech_platform/infra

# Create S3 module files
mkdir -p modules/s3
# Copy S3 module code from Section 2.1

# Create ECR module files
mkdir -p modules/ecr
# Copy ECR module code from Section 2.2

# Create IAM module files
mkdir -p modules/iam
# Copy IAM module code from Section 2.3

# Create Secrets module files
mkdir -p modules/secrets
# Copy Secrets module code from Section 2.4

# Create Route53 module files
mkdir -p modules/route53
# Copy Route53 module code from Section 2.5

# Create ACM module files
mkdir -p modules/acm
# Copy ACM module code from Section 2.6

# Create production environment
mkdir -p envs/prod/scripts
# Copy production config from Section 3.2-3.3
```

### Phase 4: Provision Infrastructure

```bash
cd infra/envs/prod

# Initialize Terraform
terraform init

# Review the plan
terraform plan -out=tfplan

# Apply (creates all infrastructure)
terraform apply tfplan

# Note the outputs:
# - app_server_ip
# - web_server_ip
# - rds_endpoint
# - ecr_repository_urls
```

### Phase 5: Setup EC2 Instances

#### 5.1 App Server Setup

```bash
# SSH to app server
ssh -i ~/.ssh/rhinon-prod-key.pem ubuntu@APP_SERVER_IP

# Run as root
sudo su -

# Install Docker
apt update
apt install -y docker.io docker-compose-v2 awscli
systemctl enable docker
systemctl start docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Create app directory
mkdir -p /opt/healthcare
cd /opt/healthcare

# Create docker-compose.prod.yml (from Section 5.2)
nano docker-compose.prod.yml

# Create .env.prod (from Section 4.1)
nano .env.prod

# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Pull and start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

#### 5.2 Web Server Setup

```bash
# SSH to web server
ssh -i ~/.ssh/rhinon-prod-key.pem ubuntu@WEB_SERVER_IP

# Run as root
sudo su -

# Install Docker
apt update
apt install -y docker.io docker-compose-v2 awscli nginx certbot python3-certbot-nginx
systemctl enable docker
systemctl start docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Create app directory
mkdir -p /opt/healthcare/nginx/ssl
cd /opt/healthcare

# Create docker-compose.web.yml (from Section 5.3)
nano docker-compose.web.yml

# Create nginx config (from Section 6.1)
nano nginx/nginx.conf

# Get SSL certificates (after DNS is configured)
certbot certonly --nginx \
  -d health.rhinontech.com \
  -d api-health.rhinontech.com \
  -d ai-health.rhinontech.com

# Copy certificates
cp /etc/letsencrypt/live/health.rhinontech.com/fullchain.pem /opt/healthcare/nginx/ssl/
cp /etc/letsencrypt/live/health.rhinontech.com/privkey.pem /opt/healthcare/nginx/ssl/

# Update nginx.conf with actual APP_SERVER_IP
sed -i 's/APP_SERVER_IP/ACTUAL_IP/g' nginx/nginx.conf

# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Pull and start services
docker compose -f docker-compose.web.yml up -d

# Check status
docker compose -f docker-compose.web.yml ps
docker compose -f docker-compose.web.yml logs -f
```

### Phase 6: Build and Push Docker Images

```bash
# From your Mac, in project root
cd /path/to/rhinontech_platform

# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com

# Build and push rtserver
cd rtserver
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/prod-rtserver:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/prod-rtserver:latest

# Build and push backendai
cd ../backendai
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/prod-backendai:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/prod-backendai:latest

# Build and push rhinon
cd ../rhinon
docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/prod-rhinon:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api-health.rhinontech.com/api \
  --build-arg NEXT_PUBLIC_SOCKET_URL=https://api-health.rhinontech.com \
  --build-arg NEXT_PUBLIC_API_AI_URL=https://ai-health.rhinontech.com \
  --build-arg NEXT_PUBLIC_BASE_URL=https://health.rhinontech.com \
  .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/prod-rhinon:latest
```

### Phase 7: Database Setup

```bash
# Connect to RDS
psql -h RDS_ENDPOINT -U healthadmin -d postgres

# Create databases
CREATE DATABASE healthcaredb;
CREATE DATABASE "healthcare-crm";

# Exit psql
\q

# Run migrations (from your Mac or app-server)
cd rtserver

# Main database migrations
npx sequelize-cli --options-path .sequelizerc.main db:migrate

# CRM database migrations
npx sequelize-cli --options-path .sequelizerc.crm db:migrate
```

### Phase 8: Final Verification

```bash
# Check all services are running
curl -f https://health.rhinontech.com
curl -f https://api-health.rhinontech.com/health
curl -f https://ai-health.rhinontech.com/health

# Test Socket.IO connection
# Open browser console on health.rhinontech.com:
# io.connect('https://api-health.rhinontech.com')

# Check logs
ssh -i ~/.ssh/rhinon-prod-key.pem ubuntu@APP_SERVER_IP "docker logs rtserver-prod"
ssh -i ~/.ssh/rhinon-prod-key.pem ubuntu@WEB_SERVER_IP "docker logs nginx-prod"
```

---

## 10. Post-Deployment Checklist

### ✅ Infrastructure Verification

- [ ] VPC created with proper CIDR
- [ ] Public subnets in multiple AZs
- [ ] Internet Gateway attached
- [ ] Security groups properly configured
- [ ] RDS accessible from EC2 only
- [ ] SSH restricted to office IP

### ✅ Application Verification

- [ ] Frontend loads at health.rhinontech.com
- [ ] API responds at api-health.rhinontech.com
- [ ] AI backend responds at ai-health.rhinontech.com
- [ ] Socket.IO connections work
- [ ] SSL certificates valid
- [ ] User authentication works
- [ ] File uploads work (S3)
- [ ] AI chatbot responds

### ✅ Security Verification

- [ ] HTTPS enforced (HTTP redirects)
- [ ] HSTS headers present
- [ ] Rate limiting active
- [ ] JWT tokens working
- [ ] Secrets not in code
- [ ] Security groups minimal

### ✅ Monitoring Setup

- [ ] CloudWatch log groups created
- [ ] Container logs forwarding
- [ ] Health check alarms configured
- [ ] Error rate monitoring
- [ ] CPU/Memory alerts

### ✅ Backup & Recovery

- [ ] RDS automated backups enabled
- [ ] S3 versioning enabled
- [ ] Terraform state backed up
- [ ] Recovery procedure documented

---

## 📊 Cost Estimation (Monthly)

| Resource | Type | Est. Cost |
|----------|------|-----------|
| EC2 App Server | t3.medium | $30 |
| EC2 Web Server | t3.small | $15 |
| RDS PostgreSQL | db.t3.small | $25 |
| S3 Storage | ~10GB | $2 |
| Data Transfer | ~50GB | $5 |
| Route53 | Hosted Zone | $0.50 |
| ECR Storage | ~5GB | $0.50 |
| **Total** | | **~$78/month** |

---

## 🚨 Troubleshooting

### Common Issues

1. **Cannot connect to RDS**
   - Check security group allows EC2 SG
   - Verify RDS is publicly accessible (for POC)

2. **ECR login fails**
   - Check IAM role attached to EC2
   - Run `aws sts get-caller-identity`

3. **Nginx 502 Bad Gateway**
   - Check upstream server is running
   - Verify internal networking

4. **SSL certificate issues**
   - Ensure DNS is pointing to correct IP
   - Run certbot manually

5. **Docker compose fails**
   - Check .env.prod file exists
   - Verify all environment variables set

---

## 📚 References

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [AWS ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [Certbot Documentation](https://certbot.eff.org/docs/)

---

**Author:** AI Assistant  
**Version:** 1.0  
**Last Updated:** December 20, 2025
