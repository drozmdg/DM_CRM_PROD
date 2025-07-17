# AWS Secrets Manager Configuration
# DM_CRM Sales Dashboard - Production Infrastructure

# Database credentials secret
resource "aws_secretsmanager_secret" "database_credentials" {
  name                    = "${var.project_name}/${var.environment}/database"
  description             = "Database credentials for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = {
    Name        = "${var.project_name}-db-credentials-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "Database"
  }
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# JWT secrets
resource "aws_secretsmanager_secret" "jwt_secrets" {
  name                    = "${var.project_name}/${var.environment}/jwt"
  description             = "JWT secrets for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = {
    Name        = "${var.project_name}-jwt-secrets-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "Application"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secrets" {
  secret_id = aws_secretsmanager_secret.jwt_secrets.id
  secret_string = jsonencode({
    jwt_secret             = var.jwt_secret
    jwt_expires_in         = var.jwt_expires_in
    jwt_refresh_expires_in = var.jwt_refresh_expires_in
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Application configuration secrets
resource "aws_secretsmanager_secret" "app_config" {
  name                    = "${var.project_name}/${var.environment}/app-config"
  description             = "Application configuration secrets for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = {
    Name        = "${var.project_name}-app-config-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "Application"
  }
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    node_env           = var.node_env
    cors_origin        = var.cors_origin
    rate_limit_window  = var.rate_limit_window_ms
    rate_limit_max     = var.rate_limit_max_requests
    session_secret     = random_password.session_secret.result
    encryption_key     = random_password.encryption_key.result
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Third-party API keys (example structure)
resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "${var.project_name}/${var.environment}/api-keys"
  description             = "Third-party API keys for ${var.project_name} ${var.environment}"
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  tags = {
    Name        = "${var.project_name}-api-keys-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "Integration"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    aws_access_key_id     = ""  # To be populated manually
    aws_secret_access_key = ""  # To be populated manually
    sendgrid_api_key      = ""  # To be populated manually
    stripe_secret_key     = ""  # To be populated manually
    google_oauth_secret   = ""  # To be populated manually
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Random passwords for secrets
resource "random_password" "session_secret" {
  length  = 64
  special = true
}

resource "random_password" "encryption_key" {
  length  = 32
  special = false
}

# IAM role for applications to access secrets
resource "aws_iam_role" "secrets_access_role" {
  name = "${var.project_name}-secrets-access-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-secrets-access-role-${var.environment}"
  }
}

resource "aws_iam_role_policy" "secrets_access_policy" {
  name = "${var.project_name}-secrets-access-policy-${var.environment}"
  role = aws_iam_role.secrets_access_role.id
  
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
          aws_secretsmanager_secret.jwt_secrets.arn,
          aws_secretsmanager_secret.app_config.arn,
          aws_secretsmanager_secret.api_keys.arn
        ]
      }
    ]
  })
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "secrets_access_profile" {
  name = "${var.project_name}-secrets-access-profile-${var.environment}"
  role = aws_iam_role.secrets_access_role.name
  
  tags = {
    Name = "${var.project_name}-secrets-access-profile-${var.environment}"
  }
}

# KMS key for secrets encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for ${var.project_name} secrets encryption"
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
        Sid    = "Allow Secrets Manager"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
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
    Name = "${var.project_name}-secrets-kms-key-${var.environment}"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project_name}-secrets-${var.environment}"
  target_key_id = aws_kms_key.secrets.key_id
}

# Update secrets with KMS encryption
resource "aws_secretsmanager_secret" "database_credentials_encrypted" {
  name                    = "${var.project_name}/${var.environment}/database-encrypted"
  description             = "Encrypted database credentials for ${var.project_name} ${var.environment}"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = var.environment == "production" ? 30 : 0
  
  replica {
    region     = var.backup_region
    kms_key_id = aws_kms_key.secrets.arn
  }
  
  tags = {
    Name        = "${var.project_name}-db-credentials-encrypted-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "Database"
    Encrypted   = "true"
  }
}

# Lambda function for secret rotation
resource "aws_lambda_function" "secret_rotation" {
  filename         = "secret_rotation.zip"
  function_name    = "${var.project_name}-secret-rotation-${var.environment}"
  role            = aws_iam_role.lambda_rotation_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.secret_rotation_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 300
  
  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.aws_region}.amazonaws.com"
      RDS_ENDPOINT            = aws_db_instance.main.endpoint
    }
  }
  
  tags = {
    Name = "${var.project_name}-secret-rotation-${var.environment}"
  }
}

data "archive_file" "secret_rotation_zip" {
  type        = "zip"
  output_path = "secret_rotation.zip"
  
  source {
    content = templatefile("${path.module}/lambda/secret_rotation.py", {
      project_name = var.project_name
      environment  = var.environment
    })
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_rotation_role" {
  name = "${var.project_name}-lambda-rotation-role-${var.environment}"
  
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
    Name = "${var.project_name}-lambda-rotation-role-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_rotation_basic" {
  role       = aws_iam_role.lambda_rotation_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_rotation_policy" {
  name = "${var.project_name}-lambda-rotation-policy-${var.environment}"
  role = aws_iam_role.lambda_rotation_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = [
          aws_secretsmanager_secret.database_credentials.arn,
          aws_secretsmanager_secret.jwt_secrets.arn,
          "${aws_secretsmanager_secret.database_credentials.arn}*",
          "${aws_secretsmanager_secret.jwt_secrets.arn}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance"
        ]
        Resource = aws_db_instance.main.arn
      }
    ]
  })
}

# CloudWatch alarms for secret access monitoring
resource "aws_cloudwatch_metric_alarm" "secret_access_failures" {
  alarm_name          = "${var.project_name}-secret-access-failures-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors secret access failures"
  
  dimensions = {
    FunctionName = aws_lambda_function.secret_rotation.function_name
  }
  
  alarm_actions = [aws_sns_topic.security_alerts.arn]
  
  tags = {
    Name = "${var.project_name}-secret-access-failures-${var.environment}"
  }
}

# EventBridge rule for secret rotation schedule
resource "aws_cloudwatch_event_rule" "secret_rotation_schedule" {
  name                = "${var.project_name}-secret-rotation-schedule-${var.environment}"
  description         = "Trigger secret rotation"
  schedule_expression = "rate(30 days)"  # Rotate every 30 days
  
  tags = {
    Name = "${var.project_name}-secret-rotation-schedule-${var.environment}"
  }
}

resource "aws_cloudwatch_event_target" "secret_rotation_lambda" {
  rule      = aws_cloudwatch_event_rule.secret_rotation_schedule.name
  target_id = "SecretRotationLambdaTarget"
  arn       = aws_lambda_function.secret_rotation.arn
}

resource "aws_lambda_permission" "allow_eventbridge_rotation" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.secret_rotation_schedule.arn
}