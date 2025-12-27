environment         = "prod"
vpc_cidr            = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
availability_zones  = ["ap-south-1a", "ap-south-1b"]
ssh_allowed_ips     = ["0.0.0.0/0"] # Lock this down in real prod
# ami_id is now dynamic
instance_type       = "t3.medium"
key_name            = "rhinon-prod-key"
