output "vpc_id" {
  value = module.vpc.vpc_id
}

output "app_server_public_ip" {
  value = module.app_server.public_ip
}

output "web_server_public_ip" {
  value = module.web_server.public_ip
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}
