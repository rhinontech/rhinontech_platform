variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

provider "aws" {
  region  = var.aws_region
  profile = "rhinon"
}
