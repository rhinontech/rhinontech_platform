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

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# Generate a secure private key
resource "tls_private_key" "prod_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create the Key Pair in AWS
resource "aws_key_pair" "prod_key" {
  key_name   = var.key_name
  public_key = tls_private_key.prod_key.public_key_openssh
}

# Save the private key locally
resource "local_file" "prod_key" {
  content         = tls_private_key.prod_key.private_key_pem
  filename        = "${path.module}/${var.key_name}.pem"
  file_permission = "0400"
}

module "prod_server" {
  source                 = "../../modules/ec2"
  name                   = "rhinon-platform-prod"
  ami_id                 = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  root_volume_size       = 30
  subnet_id              = module.vpc.public_subnet_ids[0]
  key_name               = aws_key_pair.prod_key.key_name # Implicit dependency
  vpc_security_group_ids = [module.security_groups.ec2_sg_id]
  environment            = var.environment
  service_tag            = "platform"
  user_data              = file("${path.module}/../../modules/ec2/user_data.sh")
}

module "assets_bucket" {
  source      = "../../modules/s3"
  bucket_name = "rhinon-prod-assets-v2-${var.environment}"
  environment = var.environment
}
