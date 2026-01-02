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
  owners = ["099720109477"]
}

resource "tls_private_key" "key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "key" {
  key_name   = var.key_name
  public_key = tls_private_key.key.public_key_openssh
}

resource "local_file" "key" {
  content         = tls_private_key.key.private_key_pem
  filename        = "${path.module}/${var.key_name}.pem"
  file_permission = "0400"
}

module "server" {
  source                 = "../../modules/ec2"
  name                   = "rhinon-platform-${var.environment}"
  ami_id                 = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  root_volume_size       = 30
  subnet_id              = module.vpc.public_subnet_ids[0]
  key_name               = aws_key_pair.key.key_name
  vpc_security_group_ids = [module.security_groups.ec2_sg_id]
  environment            = var.environment
  service_tag            = "platform"
  user_data              = file("${path.module}/../../modules/ec2/user_data.sh")
}

module "rds" {
  source                 = "../../modules/rds"
  environment            = var.environment
  subnet_ids             = module.vpc.public_subnet_ids
  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
}

module "assets_bucket" {
  source      = "../../modules/s3"
  bucket_name = "rhinon-${var.environment}-assets-${var.domain_prefix}"
  environment = var.environment
}

module "email_lambda" {
  source            = "../../modules/lambda-email"
  environment       = var.environment
  email_bucket_name = module.ses.email_bucket_name
  rt_server_url     = var.rt_server_url
  api_key           = var.api_key
}

module "ses" {
  source              = "../../modules/ses"
  domain              = var.domain
  domain_prefix       = var.domain_prefix
  environment         = var.environment
  lambda_function_arn = module.email_lambda.lambda_function_arn
}
