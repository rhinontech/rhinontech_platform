output "ec2_public_ip" {
  description = "Public IP of the Production Server"
  value       = module.prod_server.public_ip
}

output "bucket_name" {
  description = "Name of the Assets Bucket"
  value       = module.assets_bucket.bucket_id
}
