output "db_endpoint" {
  description = "The connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_username" {
  description = "The master username for the database"
  value       = aws_db_instance.main.username
}
