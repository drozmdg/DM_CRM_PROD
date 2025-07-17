# Data Migration Plan and Infrastructure
# DM_CRM Sales Dashboard - Production Infrastructure

# S3 Bucket for migration data staging
resource "aws_s3_bucket" "migration_staging" {
  bucket        = "${var.project_name}-migration-staging-${var.environment}-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
  
  tags = {
    Name        = "${var.project_name}-migration-staging-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "Data Migration Staging"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "migration_staging" {
  bucket = aws_s3_bucket.migration_staging.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.migration.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "migration_staging" {
  bucket = aws_s3_bucket.migration_staging.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "migration_staging" {
  bucket = aws_s3_bucket.migration_staging.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS Key for migration encryption
resource "aws_kms_key" "migration" {
  description             = "KMS key for ${var.project_name} data migration encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Migration Functions"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.migration_lambda_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-migration-kms-key-${var.environment}"
  }
}

resource "aws_kms_alias" "migration" {
  name          = "alias/${var.project_name}-migration-${var.environment}"
  target_key_id = aws_kms_key.migration.key_id
}

# Lambda function for data migration execution
resource "aws_lambda_function" "data_migration" {
  filename         = "data_migration.zip"
  function_name    = "${var.project_name}-data-migration-${var.environment}"
  role            = aws_iam_role.migration_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.data_migration_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 900  # 15 minutes
  memory_size     = 1024
  
  environment {
    variables = {
      SOURCE_DB_SECRET_ARN      = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:supabase-connection"
      TARGET_DB_SECRET_ARN      = aws_secretsmanager_secret.database_credentials.arn
      MIGRATION_BUCKET          = aws_s3_bucket.migration_staging.id
      KMS_KEY_ID               = aws_kms_key.migration.key_id
      REGION                   = var.aws_region
      PROJECT_NAME             = var.project_name
      ENVIRONMENT              = var.environment
      SNS_TOPIC_ARN            = aws_sns_topic.migration_notifications.arn
    }
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.migration_dlq.arn
  }
  
  tags = {
    Name = "${var.project_name}-data-migration-${var.environment}"
  }
}

# Package the migration Lambda function
data "archive_file" "data_migration_zip" {
  type        = "zip"
  output_path = "data_migration.zip"
  
  source {
    content = templatefile("${path.module}/lambda/data_migration.py", {
      project_name = var.project_name
      environment  = var.environment
    })
    filename = "index.py"
  }
  
  source {
    content = file("${path.module}/lambda/migration_utils.py")
    filename = "migration_utils.py"
  }
  
  source {
    content = file("${path.module}/lambda/data_validators.py")
    filename = "data_validators.py"
  }
}

# IAM role for migration Lambda
resource "aws_iam_role" "migration_lambda_role" {
  name = "${var.project_name}-migration-lambda-role-${var.environment}"
  
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
    Name = "${var.project_name}-migration-lambda-role-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "migration_lambda_basic" {
  role       = aws_iam_role.migration_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "migration_lambda_vpc" {
  role       = aws_iam_role.migration_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "migration_lambda_policy" {
  name = "${var.project_name}-migration-lambda-policy-${var.environment}"
  role = aws_iam_role.migration_lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.database_credentials.arn,
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:supabase-connection*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.migration_staging.arn,
          "${aws_s3_bucket.migration_staging.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.migration.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.migration_notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.migration_dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC Configuration for Lambda (to access RDS)
resource "aws_lambda_function" "data_migration_vpc" {
  filename         = "data_migration.zip"
  function_name    = "${var.project_name}-data-migration-vpc-${var.environment}"
  role            = aws_iam_role.migration_lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.data_migration_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 900
  memory_size     = 1024
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.migration_lambda.id]
  }
  
  environment {
    variables = {
      SOURCE_DB_SECRET_ARN      = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:supabase-connection"
      TARGET_DB_SECRET_ARN      = aws_secretsmanager_secret.database_credentials.arn
      MIGRATION_BUCKET          = aws_s3_bucket.migration_staging.id
      KMS_KEY_ID               = aws_kms_key.migration.key_id
      REGION                   = var.aws_region
      PROJECT_NAME             = var.project_name
      ENVIRONMENT              = var.environment
      SNS_TOPIC_ARN            = aws_sns_topic.migration_notifications.arn
    }
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.migration_dlq.arn
  }
  
  tags = {
    Name = "${var.project_name}-data-migration-vpc-${var.environment}"
  }
}

# Security group for migration Lambda
resource "aws_security_group" "migration_lambda" {
  name_prefix = "${var.project_name}-migration-lambda-${var.environment}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for data migration Lambda function"
  
  egress {
    description = "Database access"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }
  
  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "DNS"
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description = "DNS UDP"
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-migration-lambda-sg-${var.environment}"
  }
}

# SNS topic for migration notifications
resource "aws_sns_topic" "migration_notifications" {
  name = "${var.project_name}-migration-notifications-${var.environment}"
  
  tags = {
    Name = "${var.project_name}-migration-notifications-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "migration_email" {
  count = var.migration_notification_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.migration_notifications.arn
  protocol  = "email"
  endpoint  = var.migration_notification_email
}

# SQS Dead Letter Queue for failed migrations
resource "aws_sqs_queue" "migration_dlq" {
  name                       = "${var.project_name}-migration-dlq-${var.environment}"
  message_retention_seconds  = 1209600  # 14 days
  visibility_timeout_seconds = 300
  
  tags = {
    Name = "${var.project_name}-migration-dlq-${var.environment}"
  }
}

# CloudWatch Log Group for migration logs
resource "aws_cloudwatch_log_group" "migration_logs" {
  name              = "/aws/lambda/${var.project_name}-data-migration-${var.environment}"
  retention_in_days = 30
  
  tags = {
    Name = "${var.project_name}-migration-logs-${var.environment}"
  }
}

# Step Functions for migration orchestration
resource "aws_sfn_state_machine" "migration_workflow" {
  name     = "${var.project_name}-migration-workflow-${var.environment}"
  role_arn = aws_iam_role.migration_step_function_role.arn
  
  definition = jsonencode({
    Comment = "Data Migration Workflow for ${var.project_name}"
    StartAt = "PreMigrationValidation"
    States = {
      PreMigrationValidation = {
        Type     = "Task"
        Resource = aws_lambda_function.data_migration_vpc.arn
        Parameters = {
          "action" = "validate_source"
        }
        Next = "CreateBackup"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 6
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.TaskFailed"]
            Next        = "MigrationFailed"
          }
        ]
      }
      CreateBackup = {
        Type     = "Task"
        Resource = aws_lambda_function.data_migration_vpc.arn
        Parameters = {
          "action" = "create_backup"
        }
        Next = "ExecuteMigration"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.TaskFailed"]
            Next        = "MigrationFailed"
          }
        ]
      }
      ExecuteMigration = {
        Type     = "Task"
        Resource = aws_lambda_function.data_migration_vpc.arn
        Parameters = {
          "action" = "execute_migration"
        }
        Next = "ValidateData"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 5
            MaxAttempts     = 2
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.TaskFailed"]
            Next        = "MigrationFailed"
          }
        ]
      }
      ValidateData = {
        Type     = "Task"
        Resource = aws_lambda_function.data_migration_vpc.arn
        Parameters = {
          "action" = "validate_migration"
        }
        Next = "MigrationSuccess"
        Retry = [
          {
            ErrorEquals     = ["Lambda.ServiceException", "Lambda.AWSLambdaException", "Lambda.SdkClientException"]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.TaskFailed"]
            Next        = "MigrationFailed"
          }
        ]
      }
      MigrationSuccess = {
        Type = "Succeed"
      }
      MigrationFailed = {
        Type = "Fail"
      }
    }
  })
  
  tags = {
    Name = "${var.project_name}-migration-workflow-${var.environment}"
  }
}

# IAM role for Step Functions
resource "aws_iam_role" "migration_step_function_role" {
  name = "${var.project_name}-migration-sfn-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-migration-sfn-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "migration_step_function_policy" {
  name = "${var.project_name}-migration-sfn-policy-${var.environment}"
  role = aws_iam_role.migration_step_function_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.data_migration_vpc.arn,
          "${aws_lambda_function.data_migration_vpc.arn}:*"
        ]
      }
    ]
  })
}

# CloudWatch Alarms for migration monitoring
resource "aws_cloudwatch_metric_alarm" "migration_errors" {
  alarm_name          = "${var.project_name}-migration-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors migration Lambda errors"
  
  dimensions = {
    FunctionName = aws_lambda_function.data_migration_vpc.function_name
  }
  
  alarm_actions = [aws_sns_topic.migration_notifications.arn]
  
  tags = {
    Name = "${var.project_name}-migration-errors-${var.environment}"
  }
}

# Outputs for migration infrastructure
output "migration_bucket_name" {
  description = "Name of the migration staging bucket"
  value       = aws_s3_bucket.migration_staging.id
}

output "migration_lambda_function_name" {
  description = "Name of the migration Lambda function"
  value       = aws_lambda_function.data_migration_vpc.function_name
}

output "migration_step_function_arn" {
  description = "ARN of the migration Step Function"
  value       = aws_sfn_state_machine.migration_workflow.arn
}

output "migration_sns_topic_arn" {
  description = "ARN of the migration notifications SNS topic"
  value       = aws_sns_topic.migration_notifications.arn
}