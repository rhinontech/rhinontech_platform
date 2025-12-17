# 🧱 Terraform Proof of Concept (POC) Plan

**Company:** Rhinon Tech
**Goal:** Validate Terraform as the Infrastructure as Code (IaC) solution for managing Rhinon Tech’s AWS infrastructure in a scalable, repeatable, and secure way.

---

## 🎯 POC Objectives

The POC should demonstrate that Terraform can:

1. Provision AWS infrastructure **from scratch using code**
2. Support **multi-service architecture** (RTSERVER, BACKENDAI)
3. Enable **environment isolation** (dev vs prod-ready)
4. Integrate cleanly with **existing Jenkins CI/CD**
5. Be safely version-controlled and reproducible

---

## 🧩 Scope of the POC (Strict)

### ✅ IN SCOPE

The POC should provision the following:

1. **AWS Networking (Minimal but Correct)**

   * VPC
   * Public Subnet
   * Internet Gateway
   * Route Table

2. **Compute**

   * 1 EC2 instance for `rtserver`
   * 1 EC2 instance for `backendai`
   * Amazon Linux 2 / Ubuntu

3. **Database**

   * PostgreSQL RDS (single instance)
   * Publicly accessible (POC only)

4. **Security**

   * Security Groups for EC2 and RDS
   * SSH access restricted by IP
   * App ports explicitly defined

5. **DNS (Optional but Preferred)**

   * Route53 record
   * Example:

     * `api-dev.rhinon.tech`
     * `ai-dev.rhinon.tech`

6. **Terraform State Management**

   * Remote backend using S3
   * State locking using DynamoDB

---

### ❌ OUT OF SCOPE (For This POC)

* Auto Scaling Groups
* Load Balancers
* Redis / ElastiCache
* ECS / EKS
* Docker orchestration
* Blue-Green deployments
* Production hardening

---

## 🗂️ Recommended Repository Structure

```
infra/
├── modules/
│   ├── vpc/
│   ├── ec2/
│   ├── rds/
│   └── security-groups/
├── envs/
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── backend.tf
├── providers.tf
└── README.md
```

---

## 🔧 Terraform Modules – Expectations

### 1️⃣ VPC Module

**Resources:**

* aws_vpc
* aws_subnet
* aws_internet_gateway
* aws_route_table
* aws_route_table_association

**Output:**

* vpc_id
* subnet_id

---

### 2️⃣ EC2 Module

**Resources:**

* aws_instance

**Instances:**

* rtserver-dev
* backendai-dev

**Requirements:**

* Instance tags (Name, Environment, Service)
* SSH key pair input
* User-data support (future-ready)

---

### 3️⃣ RDS Module

**Resources:**

* aws_db_instance
* aws_db_subnet_group

**Config:**

* Engine: PostgreSQL
* Single AZ
* Backup retention: minimal

---

### 4️⃣ Security Groups Module

**Rules:**

* EC2:

  * SSH (22) – limited IP
  * HTTP (80)
  * HTTPS (443)
  * App ports:

    * 3000 (RTSERVER)
    * 5002 (BACKENDAI)

* RDS:

  * PostgreSQL (5432) only from EC2 SG

---

## 🌍 Environment Strategy

### Environment: `dev`

The **dev environment** should be cost-efficient but architecturally aligned with production.

**Dev Infrastructure Design (Final):**

* **EC2-1: app-dev**

  * Runs **RTSERVER (Node.js)**
  * Runs **BACKENDAI (FastAPI/Python)**
  * Both services are logically separated (ports, env files, process managers)

* **EC2-2: web-dev**

  * Runs **RHINON Next.js Dashboard**
  * Runs **Nginx** as reverse proxy

**Routing via Nginx (web-dev):**

* `app-dev.rhinon.tech` → Next.js (port 4000)
* `api-dev.rhinon.tech` → RTSERVER on `app-dev` (port 3000)
* `ai-dev.rhinon.tech` → BACKENDAI on `app-dev` (port 5002)

**Key Principles for Dev:**

* No dev and prod service sharing
* Logical separation even when services run on the same EC2
* Ready-to-split design for future scaling

Terraform Workspace:

```bash
terraform workspace new dev
terraform workspace select dev
```

---

## 🔐 State & Backend Configuration

### Backend Requirements

* S3 bucket for Terraform state
* DynamoDB table for state locking

```hcl
backend "s3" {
  bucket         = "rhinon-terraform-state"
  key            = "dev/terraform.tfstate"
  region         = "ap-south-1"
  dynamodb_table = "terraform-locks"
  encrypt        = true
}
```

---

## 🔄 Jenkins Integration (POC Level)

### Jenkins Responsibilities

* Run Terraform in **plan mode** on PR
* Run Terraform apply only on `main` branch

### Required Jenkins Steps

1. Checkout infra repo
2. Inject AWS credentials (IAM role or secrets)
3. Run:

```bash
terraform init
terraform validate
terraform plan
```

(Optional apply step for demo only)

---

## 🧪 Validation Checklist (POC Success Criteria)

The POC is successful if:

* [ ] `terraform init` completes without errors
* [ ] `terraform plan` shows **2 EC2 instances for dev**

  * `app-dev` (rtserver + backendai)
  * `web-dev` (Next.js + Nginx)
* [ ] `terraform apply` provisions AWS infra successfully
* [ ] `app-dev` EC2 can run both services on separate ports
* [ ] `web-dev` can reach `app-dev` over private networking
* [ ] Dev URLs resolve correctly:

  * `app-dev.rhinon.tech`
  * `api-dev.rhinon.tech`
  * `ai-dev.rhinon.tech`
* [ ] Infra can be destroyed using `terraform destroy` without leftovers

---

## 📦 Deliverables from DevOps Engineer

1. Git repository with Terraform code
2. README with:

   * Setup instructions
   * Environment usage
3. Screenshots or logs of successful apply
4. Short summary:

   * What worked
   * What needs improvement
   * Production readiness gaps

---

## 🚀 Next Steps After POC

If POC is approved:

* Introduce Load Balancers
* Add Redis (ElastiCache)
* Multi-AZ RDS
* Environment parity (staging/prod)
* ECS or EKS migration

---

## 📌 Notes

* POC should prioritize **clarity over complexity**
* Code readability and structure matter
* Security best practices should be followed even in POC

---

**Owner:** DevOps Team
**Reviewer:** Engineering Lead (Rhinon Tech)
