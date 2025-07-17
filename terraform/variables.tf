# Variables for DM_CRM Sales Dashboard Infrastructure
# Production Deployment - Phase 4

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dm-crm-sales-dashboard"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "DevOps Team"
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed to access bastion host"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict this in production
}

# Database Configuration
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "sales_dashboard_prod"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters long."
  }
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "db_backup_retention" {
  description = "Database backup retention period (days)"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Database backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Database maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "db_monitoring_interval" {
  description = "Enhanced monitoring interval (0, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 60
  
  validation {
    condition     = contains([0, 1, 5, 10, 15, 30, 60], var.db_monitoring_interval)
    error_message = "Monitoring interval must be 0, 1, 5, 10, 15, 30, or 60 seconds."
  }
}

# Compute Configuration
variable "bastion_instance_type" {
  description = "EC2 instance type for bastion host"
  type        = string
  default     = "t3.micro"
}

variable "app_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.small"
}

variable "web_instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name for SSH access"
  type        = string
  default     = "dm-crm-keypair"
}

# Auto Scaling Configuration
variable "min_capacity" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

# Application Configuration
variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check path for load balancer"
  type        = string
  default     = "/api/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "healthy_threshold" {
  description = "Number of successful health checks before marking healthy"
  type        = number
  default     = 2
}

variable "unhealthy_threshold" {
  description = "Number of failed health checks before marking unhealthy"
  type        = number
  default     = 3
}

# SSL/TLS Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "salesdashboard.example.com"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

# Monitoring and Logging
variable "log_retention_days" {
  description = "CloudWatch logs retention period (days)"
  type        = number
  default     = 30
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

# Backup and Storage
variable "backup_retention_days" {
  description = "Backup retention period (days)"
  type        = number
  default     = 30
}

variable "s3_versioning_enabled" {
  description = "Enable S3 versioning for backups"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_cost_optimization" {
  description = "Enable cost optimization features"
  type        = bool
  default     = true
}

variable "scheduled_scaling" {
  description = "Enable scheduled scaling for predictable workloads"
  type        = bool
  default     = false
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF for application security"
  type        = bool
  default     = true
}

variable "enable_shield" {
  description = "Enable AWS Shield Advanced for DDoS protection"
  type        = bool
  default     = false
}

variable "enable_config" {
  description = "Enable AWS Config for compliance monitoring"
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for audit logging"
  type        = bool
  default     = true
}

# Application Specific
variable "node_env" {
  description = "Node.js environment"
  type        = string
  default     = "production"
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_expires_in" {
  description = "JWT token expiration time"
  type        = string
  default     = "24h"
}

variable "jwt_refresh_expires_in" {
  description = "JWT refresh token expiration time"
  type        = string
  default     = "7d"
}

# Docker Configuration
variable "docker_image_backend" {
  description = "Docker image for backend application"
  type        = string
  default     = "ghcr.io/dm-crm/sales-dashboard-backend:latest"
}

variable "docker_image_frontend" {
  description = "Docker image for frontend application"
  type        = string
  default     = "ghcr.io/dm-crm/sales-dashboard-frontend:latest"
}

# Scaling Configuration
variable "cpu_target_utilization" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "memory_target_utilization" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

variable "scale_up_cooldown" {
  description = "Scale up cooldown period (seconds)"
  type        = number
  default     = 300
}

variable "scale_down_cooldown" {
  description = "Scale down cooldown period (seconds)"
  type        = number
  default     = 300
}

# Disaster Recovery
variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup replication"
  type        = bool
  default     = false
}

variable "rto_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 60
}

variable "rpo_minutes" {
  description = "Recovery Point Objective in minutes"
  type        = number
  default     = 15
}

# CloudFront Configuration
variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for global content delivery"
  type        = bool
  default     = false
}

# Backup Configuration
variable "backup_notification_email" {
  description = "Email address for backup notifications"
  type        = string
  default     = ""
}

# Security Service Configuration
variable "enable_guardduty" {
  description = "Enable AWS GuardDuty for threat detection"
  type        = bool
  default     = true
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub for centralized security findings"
  type        = bool
  default     = true
}

variable "enable_inspector" {
  description = "Enable AWS Inspector for vulnerability scanning"
  type        = bool
  default     = true
}

variable "security_notification_email" {
  description = "Email address for security notifications"
  type        = string
  default     = ""
}

# VPN Configuration
variable "enable_vpn" {
  description = "Enable AWS Client VPN for secure remote access"
  type        = bool
  default     = true
}

variable "vpn_client_cidr" {
  description = "CIDR block for VPN client IP addresses"
  type        = string
  default     = "172.16.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.vpn_client_cidr, 0))
    error_message = "VPN client CIDR must be a valid IPv4 CIDR block."
  }
}

variable "vpn_max_connections" {
  description = "Maximum number of concurrent VPN connections"
  type        = number
  default     = 10
}

# Missing variables referenced in other files
variable "backup_region" {
  description = "Backup region for cross-region replication"
  type        = string
  default     = "us-west-2"
}

variable "cors_origin" {
  description = "CORS origin for application"
  type        = string
  default     = "https://localhost:5173"
}

variable "rate_limit_window_ms" {
  description = "Rate limiting window in milliseconds"
  type        = number
  default     = 60000
}

variable "rate_limit_max_requests" {
  description = "Maximum requests per rate limit window"
  type        = number
  default     = 100
}

# Data Migration Configuration
variable "migration_notification_email" {
  description = "Email address for migration notifications"
  type        = string
  default     = ""
}