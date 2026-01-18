resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  key_name               = var.key_name
  vpc_security_group_ids = var.vpc_security_group_ids
  user_data              = var.user_data

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
  }

  tags = {
    Name        = var.name
    Environment = var.environment
    Service     = var.service_tag
  }
}

# Elastic IP for the instance
resource "aws_eip" "this" {
  domain = "vpc"

  tags = {
    Name        = "${var.name}-eip"
    Environment = var.environment
    Service     = var.service_tag
  }
}

# Associate Elastic IP with the instance
resource "aws_eip_association" "this" {
  instance_id   = aws_instance.this.id
  allocation_id = aws_eip.this.id
}
