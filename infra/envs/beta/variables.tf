variable "environment" {}
variable "vpc_cidr" {}
variable "public_subnet_cidrs" { type = list(string) }
variable "availability_zones" { type = list(string) }
variable "ssh_allowed_ips" { type = list(string) }
variable "instance_type" {}
variable "key_name" {}
variable "db_name" {}
variable "db_username" {}
variable "db_password" { sensitive = true }
variable "domain" {}
variable "domain_prefix" {}
variable "rt_server_url" {}
variable "api_key" { sensitive = true }
