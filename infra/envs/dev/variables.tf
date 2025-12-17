variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "Public Subnet CIDRs"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability Zones"
  type        = list(string)
}

variable "ssh_allowed_ips" {
  description = "IPs allowed to SSH"
  type        = list(string)
}

variable "ami_id" {
  description = "AMI ID for EC2"
  type        = string
}

variable "instance_type" {
  description = "Instance type"
  type        = string
}

variable "key_name" {
  description = "SSH Key Name"
  type        = string
}

variable "db_instance_class" {
  description = "RDS Instance Class"
  type        = string
}

variable "db_name" {
  description = "DB Name"
  type        = string
}

variable "db_username" {
  description = "DB Username"
  type        = string
}

variable "db_password" {
  description = "DB Password"
  type        = string
  sensitive   = true
}
