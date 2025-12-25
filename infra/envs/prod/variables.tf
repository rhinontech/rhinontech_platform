variable "environment" {}
variable "vpc_cidr" {}
variable "public_subnet_cidrs" { type = list(string) }
variable "availability_zones" { type = list(string) }
variable "ssh_allowed_ips" { type = list(string) }

variable "instance_type" {}
variable "key_name" {}
