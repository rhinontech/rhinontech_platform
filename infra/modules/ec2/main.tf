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

  credit_specification {
    cpu_credits = "standard"
  }

  tags = {
    Name        = var.name
    Environment = var.environment
    Service     = var.service_tag
  }
}
