# Backup and Disaster Recovery Systems
# DM_CRM Sales Dashboard - Production Infrastructure

# S3 Bucket for Backups
resource "aws_s3_bucket" "backups" {
  bucket        = "${var.project_name}-backups-${var.environment}-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
  
  tags = {
    Name = "${var.project_name}-backups-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = var.s3_versioning_enabled ? "Enabled" : "Disabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  rule {
    id     = "backup_lifecycle"
    status = "Enabled"
    
    expiration {
      days = var.backup_retention_days
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 7
    }
    
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
  
  rule {
    id     = "daily_backups"
    status = "Enabled"
    
    filter {
      prefix = "daily/"
    }
    
    expiration {
      days = 30
    }
  }
  
  rule {
    id     = "weekly_backups"
    status = "Enabled"
    
    filter {
      prefix = "weekly/"
    }
    
    expiration {
      days = 90
    }
  }
  
  rule {
    id     = "monthly_backups"
    status = "Enabled"
    
    filter {
      prefix = "monthly/"
    }
    
    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication bucket (optional)
resource "aws_s3_bucket" "backups_replica" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  provider      = aws.replica
  bucket        = "${var.project_name}-backups-replica-${var.environment}-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
  
  tags = {
    Name = "${var.project_name}-backups-replica-${var.environment}"
  }
}

# IAM Role for backup operations
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-backup-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["backup.amazonaws.com", "lambda.amazonaws.com"]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-backup-role-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "backup_service_role" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore_role" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Custom IAM policy for S3 backup access
resource "aws_iam_role_policy" "backup_s3_policy" {
  name = "${var.project_name}-backup-s3-policy-${var.environment}"
  role = aws_iam_role.backup_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetBucketNotification",
          "s3:PutBucketNotification",
          "s3:GetBucketLogging",
          "s3:GetBucketLocation",
          "s3:GetBucketRequestPayment",
          "s3:GetBucketTagging",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketAcl",
          "s3:ListBucket",
          "s3:GetObject",
          "s3:GetObjectAcl",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:PutObjectVersionAcl",
          "s3:DeleteObject",
          "s3:DeleteObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*"
        ]
      }
    ]
  })
}

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-backup-vault-${var.environment}"
  kms_key_arn = aws_kms_key.backup.arn
  
  tags = {
    Name = "${var.project_name}-backup-vault-${var.environment}"
  }
}

# KMS Key for backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for ${var.project_name} backups"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.project_name}-backup-key-${var.environment}"
  }
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project_name}-backup-${var.environment}"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${var.project_name}-backup-plan-${var.environment}"
  
  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)"  # 2 AM daily
    start_window      = 60
    completion_window = 300
    
    recovery_point_tags = {
      BackupType = "Daily"
      Project    = var.project_name
    }
    
    lifecycle {
      cold_storage_after = 30
      delete_after       = 120
    }
  }
  
  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 ? * SUN *)"  # 3 AM every Sunday
    start_window      = 60
    completion_window = 300
    
    recovery_point_tags = {
      BackupType = "Weekly"
      Project    = var.project_name
    }
    
    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }
  }
  
  rule {
    rule_name         = "monthly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 4 1 * ? *)"  # 4 AM on 1st of every month
    start_window      = 60
    completion_window = 300
    
    recovery_point_tags = {
      BackupType = "Monthly"
      Project    = var.project_name
    }
    
    lifecycle {
      delete_after = 2555  # 7 years
    }
  }
  
  tags = {
    Name = "${var.project_name}-backup-plan-${var.environment}"
  }
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-rds-backup-selection-${var.environment}"
  plan_id      = aws_backup_plan.main.id
  
  resources = [
    aws_db_instance.main.arn
  ]
  
  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}

# Lambda function for database dumps
resource "aws_lambda_function" "db_backup" {
  filename         = "db_backup.zip"
  function_name    = "${var.project_name}-db-backup-${var.environment}"
  role            = aws_iam_role.lambda_backup_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.db_backup_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 900  # 15 minutes
  
  environment {
    variables = {
      S3_BUCKET     = aws_s3_bucket.backups.id
      DB_ENDPOINT   = aws_db_instance.main.endpoint
      DB_NAME       = aws_db_instance.main.db_name
      PROJECT_NAME  = var.project_name
      ENVIRONMENT   = var.environment
    }
  }
  
  tags = {
    Name = "${var.project_name}-db-backup-${var.environment}"
  }
}

# Lambda function code
data "archive_file" "db_backup_zip" {
  type        = "zip"
  output_path = "db_backup.zip"
  
  source {
    content = templatefile("${path.module}/lambda/db_backup.py", {
      project_name = var.project_name
      environment  = var.environment
    })
    filename = "index.py"
  }
}

# IAM Role for Lambda backup function
resource "aws_iam_role" "lambda_backup_role" {
  name = "${var.project_name}-lambda-backup-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-lambda-backup-role-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_backup_basic" {
  role       = aws_iam_role.lambda_backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_backup_policy" {
  name = "${var.project_name}-lambda-backup-policy-${var.environment}"
  role = aws_iam_role.lambda_backup_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.backups.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots",
          "rds:CreateDBSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.project_name}/*"
      }
    ]
  })
}

# EventBridge rule for scheduled backups
resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name                = "${var.project_name}-backup-schedule-${var.environment}"
  description         = "Trigger database backup Lambda function"
  schedule_expression = "cron(30 1 * * ? *)"  # 1:30 AM daily
  
  tags = {
    Name = "${var.project_name}-backup-schedule-${var.environment}"
  }
}

resource "aws_cloudwatch_event_target" "backup_lambda" {
  rule      = aws_cloudwatch_event_rule.backup_schedule.name
  target_id = "BackupLambdaTarget"
  arn       = aws_lambda_function.db_backup.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.db_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_schedule.arn
}

# CloudWatch Alarms for backup monitoring
resource "aws_cloudwatch_metric_alarm" "backup_failures" {
  alarm_name          = "${var.project_name}-backup-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors backup failures"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.db_backup.function_name
  }
  
  tags = {
    Name = "${var.project_name}-backup-failures-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "backup_duration" {
  alarm_name          = "${var.project_name}-backup-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "600000"  # 10 minutes in milliseconds
  alarm_description   = "This metric monitors backup duration"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.db_backup.function_name
  }
  
  tags = {
    Name = "${var.project_name}-backup-duration-${var.environment}"
  }
}

# SNS Topic for backup notifications
resource "aws_sns_topic" "backup_notifications" {
  name = "${var.project_name}-backup-notifications-${var.environment}"
  
  tags = {
    Name = "${var.project_name}-backup-notifications-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "backup_email" {
  count = var.backup_notification_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.backup_notifications.arn
  protocol  = "email"
  endpoint  = var.backup_notification_email
}

# CloudWatch Log Group for backup logs
resource "aws_cloudwatch_log_group" "backup_logs" {
  name              = "/aws/lambda/${aws_lambda_function.db_backup.function_name}"
  retention_in_days = 30
  
  tags = {
    Name = "${var.project_name}-backup-logs-${var.environment}"
  }
}

# Disaster Recovery Documentation
resource "local_file" "disaster_recovery_plan" {
  content = templatefile("${path.module}/templates/disaster_recovery_plan.md", {
    project_name         = var.project_name
    environment          = var.environment
    backup_bucket        = aws_s3_bucket.backups.id
    backup_vault         = aws_backup_vault.main.name
    rds_instance         = aws_db_instance.main.identifier
    rto_minutes         = var.rto_minutes
    rpo_minutes         = var.rpo_minutes
  })
  filename = "${path.module}/../docs/disaster_recovery_plan.md"
}