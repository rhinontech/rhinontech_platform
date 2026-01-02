output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "ec2_public_ip" {
  value = module.server.instance_public_ip
}

output "ses_dkim_tokens" {
  value = module.ses.dkim_tokens
}

output "assets_bucket_name" {
  value = module.assets_bucket.bucket_name
}

output "email_bucket_name" {
  value = module.ses.email_bucket_name
}
