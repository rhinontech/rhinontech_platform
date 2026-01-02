variable "environment" { type = string }
variable "email_bucket_name" { type = string }
variable "rt_server_url" { type = string }
variable "api_key" {
  type      = string
  sensitive = true
}
