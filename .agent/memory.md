# Agent Memory

## Server Infrastructure Details

### Beta Environment
- **Instance Name:** rhinon-platform-beta
- **Instance ID:** i-0edfddde4446d19f1
- **Public IP:** 43.205.61.2
- **Public DNS:** ec2-43-205-61-2.ap-south-1.compute.amazonaws.com
- **Region:** ap-south-1a
- **Instance Type:** t3.medium
- **Key Pair Name:** rhinon-v2-beta-key
- **PEM File Path:** `infra/envs/beta/rhinon-v2-beta-key.pem`

### Production Environment
- **Instance Name:** rhinon-platform-prod
- **Instance ID:** i-0bee2f9b38bc77ebf
- **Public IP:** 3.109.82.112
- **Public DNS:** ec2-3-109-82-112.ap-south-1.compute.amazonaws.com
- **Region:** ap-south-1a
- **Instance Type:** t3.medium
- **Key Pair Name:** rhinon-v2-prod-key
- **PEM File Path:** `infra/envs/prod/rhinon-v2-prod-key.pem`

## Deployment Workflow

- **Repository:** rhinontech_platform
- **Beta Environment:**
  - **Branch:** `beta`
  - **Workflow:** Pull latest changes from `beta` branch.
- **Production Environment:**
  - **Branch:** `main`
  - **Workflow:** Pull latest changes from `main` branch.
