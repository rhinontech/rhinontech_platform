variable "ami_id" {
  description = "AMI ID for the instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID where instance will be placed"
  type        = string
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
}

variable "vpc_security_group_ids" {
  description = "List of Security Group IDs"
  type        = list(string)
}

variable "name" {
  description = "Name tag for the instance"
  type        = string
}

variable "environment" {
  description = "Environment tag"
  type        = string
}

variable "service_tag" {
  description = "Service tag"
  type        = string
}
