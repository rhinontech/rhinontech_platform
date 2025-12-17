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

module "app_server" {
  source                 = "../../modules/ec2"
  name                   = "app-dev"
  ami_id                 = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = module.vpc.public_subnet_ids[0]
  key_name               = var.key_name
  vpc_security_group_ids = [module.security_groups.ec2_sg_id]
  environment            = var.environment
  service_tag            = "app-server"
}

module "web_server" {
  source                 = "../../modules/ec2"
  name                   = "web-dev"
  ami_id                 = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = module.vpc.public_subnet_ids[0] # Put in same or diff subnet
  key_name               = var.key_name
  vpc_security_group_ids = [module.security_groups.ec2_sg_id]
  environment            = var.environment
  service_tag            = "web-server"
}

module "rds" {
  source                 = "../../modules/rds"
  environment            = var.environment
  subnet_ids             = module.vpc.public_subnet_ids
  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  db_instance_class      = var.db_instance_class
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
}
