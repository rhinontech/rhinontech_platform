resource "aws_ses_domain_identity" "this" {
  domain = var.domain
}

resource "aws_ses_domain_dkim" "this" {
  domain = aws_ses_domain_identity.this.domain
}

resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "rhinon-${var.environment}-rules-v2"
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

resource "aws_s3_bucket" "emails" {
  bucket = "${var.environment}-rhinon-emails-${var.domain_prefix}"
}

resource "aws_s3_bucket_policy" "ses_store_emails" {
  bucket = aws_s3_bucket.emails.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSESPutObject"
        Effect    = "Allow"
        Principal = { Service = "ses.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.emails.arn}/*"
      }
    ]
  })
}

resource "aws_ses_receipt_rule" "store" {
  name          = "store-to-s3"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  recipients    = [var.domain]
  enabled       = true
  scan_enabled  = true

  s3_action {
    bucket_name = aws_s3_bucket.emails.bucket
    position    = 1
  }

  lambda_action {
    function_arn = var.lambda_function_arn
    invocation_type = "Event"
    position = 2
  }
}
