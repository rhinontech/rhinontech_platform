output "dkim_tokens" {
  value = aws_ses_domain_dkim.this.dkim_tokens
}

output "email_bucket_name" {
  value = aws_s3_bucket.emails.id
}
