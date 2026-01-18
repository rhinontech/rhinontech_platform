output "instance_id" {
  value = aws_instance.this.id
}

output "instance_public_ip" {
  value = aws_eip.this.public_ip
  description = "Elastic IP address of the instance"
}

output "elastic_ip" {
  value = aws_eip.this.public_ip
  description = "Elastic IP address"
}

output "elastic_ip_allocation_id" {
  value = aws_eip.this.id
  description = "Elastic IP allocation ID"
}
