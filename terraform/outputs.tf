# Outputs for DM_CRM Sales Dashboard Infrastructure
# Production Deployment - Phase 4

# Network Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "ID of the app security group"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "bastion_security_group_id" {
  description = "ID of the bastion security group"
  value       = aws_security_group.bastion.id
}

# Load Balancer Outputs
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_hosted_zone_id" {
  description = "Canonical hosted zone ID of the Load Balancer"
  value       = aws_lb.main.zone_id
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_db_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "rds_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

# Bastion Host Outputs
output "bastion_instance_id" {
  description = "ID of the bastion host instance"
  value       = aws_instance.bastion.id
}

output "bastion_public_ip" {
  description = "Public IP of the bastion host"
  value       = aws_eip.bastion.public_ip
}

output "bastion_private_ip" {
  description = "Private IP of the bastion host"
  value       = aws_instance.bastion.private_ip
}

output "bastion_public_dns" {
  description = "Public DNS of the bastion host"
  value       = aws_eip.bastion.public_dns
}

# S3 Bucket Outputs
output "alb_logs_bucket_id" {
  description = "ID of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "ARN of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.arn
}

# IAM Role Outputs
output "rds_enhanced_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring role"
  value       = var.db_monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

# Connection Information
output "database_url" {
  description = "Database connection URL (for application configuration)"
  value       = "postgresql://${aws_db_instance.main.username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "ssh_bastion_command" {
  description = "SSH command to connect to bastion host"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.bastion.public_ip}"
}

output "ssh_tunnel_command" {
  description = "SSH tunnel command for database access"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem -L 5432:${aws_db_instance.main.endpoint}:5432 ec2-user@${aws_eip.bastion.public_ip}"
}

# Application URLs
output "application_urls" {
  description = "Application access URLs"
  value = {
    http  = "http://${aws_lb.main.dns_name}"
    https = "https://${aws_lb.main.dns_name}"
  }
}

# Health Check URLs
output "health_check_urls" {
  description = "Health check endpoints"
  value = {
    alb_health = "http://${aws_lb.main.dns_name}/health"
    api_health = "http://${aws_lb.main.dns_name}/api/health"
  }
}

# Monitoring Information
output "monitoring_endpoints" {
  description = "Monitoring and logging endpoints"
  value = {
    cloudwatch_log_group = "/aws/rds/instance/${aws_db_instance.main.id}/postgresql"
    alb_access_logs     = aws_s3_bucket.alb_logs.id
  }
}

# Security Information
output "security_groups" {
  description = "Security group information"
  value = {
    alb      = aws_security_group.alb.id
    web      = aws_security_group.web.id
    app      = aws_security_group.app.id
    database = aws_security_group.database.id
    bastion  = aws_security_group.bastion.id
  }
}

# Resource Tags
output "common_tags" {
  description = "Common tags applied to resources"
  value = {
    Environment = var.environment
    Project     = "DM_CRM_Sales_Dashboard"
    ManagedBy   = "Terraform"
    Owner       = var.owner
  }
}

# Deployment Information
output "deployment_info" {
  description = "Deployment configuration information"
  value = {
    vpc_cidr           = var.vpc_cidr
    public_subnets     = var.public_subnet_cidrs
    private_subnets    = var.private_subnet_cidrs
    database_engine    = "postgres"
    database_version   = var.postgres_version
    instance_class     = var.db_instance_class
    backup_retention   = var.db_backup_retention
    multi_az          = var.enable_multi_az
  }
}

# Cost Information
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown (USD)"
  value = {
    note = "Costs are estimates based on us-east-1 pricing and may vary"
    rds_instance = "~$15-25/month (db.t3.micro)"
    ec2_bastion  = "~$8-10/month (t3.micro)"
    alb          = "~$16-20/month (basic usage)"
    nat_gateway  = "~$45-50/month (per gateway)"
    s3_storage   = "~$1-5/month (depending on logs volume)"
    data_transfer = "~$5-15/month (depending on usage)"
    total_estimate = "~$90-125/month for basic production setup"
  }
}