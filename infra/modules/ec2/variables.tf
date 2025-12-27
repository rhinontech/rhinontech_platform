variable "name" { type = string }
variable "ami_id" { type = string }
variable "instance_type" { type = string }
variable "subnet_id" { type = string }
variable "key_name" { type = string }
variable "vpc_security_group_ids" { type = list(string) }
variable "environment" { type = string }
variable "service_tag" { type = string }
variable "user_data" { 
  type    = string 
  default = "echo 'No user data'"
}
variable "root_volume_size" {
  type    = number
  default = 8
}
