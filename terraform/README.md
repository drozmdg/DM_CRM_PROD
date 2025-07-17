# DM CRM Sales Dashboard - Production Infrastructure

This directory contains Terraform configuration for deploying the DM CRM Sales Dashboard to AWS production environment.

## 🏗️ Infrastructure Overview

The infrastructure provides a secure, scalable, and highly available environment with:

- **VPC** with public and private subnets across multiple AZs
- **Application Load Balancer** for high availability and SSL termination
- **Auto Scaling Groups** for backend and frontend applications
- **RDS PostgreSQL** database with backup and monitoring
- **Bastion Host** for secure administrative access
- **Security Groups** with least privilege access
- **CloudWatch** monitoring and logging
- **S3** for backup storage and access logs

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.0 installed
3. **AWS CLI** configured with credentials
4. **EC2 Key Pair** created in target region
5. **Domain name** and SSL certificate (for HTTPS)

## 🚀 Quick Start

### 1. Clone and Configure

```bash
# Navigate to terraform directory
cd terraform/

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit variables with your values
nano terraform.tfvars
```

### 2. Initialize Terraform

```bash
# Initialize Terraform backend
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan
```

### 3. Deploy Infrastructure

```bash
# Apply configuration
terraform apply

# Confirm deployment
# Type "yes" when prompted
```

### 4. Access Your Infrastructure

After deployment, Terraform will output important information:

```bash
# View outputs
terraform output

# Get bastion connection command
terraform output ssh_bastion_command

# Get application URL
terraform output application_urls
```

## 🔐 Security Configuration

### Required Security Updates

Before deploying to production, **MUST** update these values in `terraform.tfvars`:

1. **Database Password**
   ```hcl
   db_password = "your-secure-database-password"
   ```

2. **JWT Secret**
   ```hcl
   jwt_secret = "your-secure-jwt-secret-key"
   ```

3. **Admin Access**
   ```hcl
   admin_cidr_blocks = ["your.ip.address/32"]
   ```

4. **SSL Certificate**
   ```hcl
   certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/..."
   ```

5. **Key Pair**
   ```hcl
   key_pair_name = "your-ec2-keypair"
   ```

### Security Best Practices

- ✅ Use strong, unique passwords for database
- ✅ Restrict bastion access to specific IP addresses
- ✅ Enable CloudTrail for audit logging
- ✅ Use HTTPS only in production
- ✅ Regular security updates and patches
- ✅ Monitor CloudWatch for suspicious activity

## 🎯 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region for deployment | `us-east-1` | No |
| `environment` | Environment name | `production` | No |
| `db_password` | Database password | - | **Yes** |
| `jwt_secret` | JWT secret key | - | **Yes** |
| `certificate_arn` | SSL certificate ARN | - | **Yes** |
| `key_pair_name` | EC2 key pair name | - | **Yes** |

### Instance Sizing

**Development/Staging:**
```hcl
db_instance_class = "db.t3.micro"
app_instance_type = "t3.micro"
bastion_instance_type = "t3.micro"
```

**Production (Small):**
```hcl
db_instance_class = "db.t3.small"
app_instance_type = "t3.small"
bastion_instance_type = "t3.micro"
```

**Production (Medium):**
```hcl
db_instance_class = "db.t3.medium"
app_instance_type = "t3.medium"
bastion_instance_type = "t3.small"
```

## 🔧 Operations

### Connecting to Bastion Host

```bash
# SSH to bastion (replace with your key and IP)
ssh -i ~/.ssh/your-key.pem ec2-user@BASTION_IP

# Available commands on bastion:
dm-db        # Connect to database
dm-deploy    # Deploy application
dm-monitor   # System monitoring
dm-logs      # Collect logs
dm-status    # Check service status
```

### Database Access

```bash
# Via bastion host
ssh -i ~/.ssh/your-key.pem ec2-user@BASTION_IP
dm-db your-rds-endpoint

# Via SSH tunnel
ssh -i ~/.ssh/your-key.pem -L 5432:RDS_ENDPOINT:5432 ec2-user@BASTION_IP
psql -h localhost -p 5432 -U postgres -d sales_dashboard_prod
```

### Application Deployment

```bash
# On bastion host
dm-deploy deploy    # Full deployment
dm-deploy status    # Check status
dm-deploy logs      # View logs
dm-deploy restart   # Restart services
```

## 📊 Monitoring

### CloudWatch Dashboards

Access AWS Console → CloudWatch → Dashboards to view:

- **Application Performance**: Response times, error rates
- **Infrastructure Health**: CPU, memory, disk usage
- **Database Metrics**: Connections, queries, performance
- **Load Balancer**: Request count, target health

### Log Groups

- `/aws/rds/instance/dm-crm-db-production/postgresql`
- `/aws/ec2/dm-crm-bastion-production`
- ALB Access Logs in S3 bucket

### Alerting

Configure CloudWatch Alarms for:

- High CPU utilization (>80%)
- High memory usage (>85%)
- Database connection errors
- Application health check failures
- High response times (>5 seconds)

## 💰 Cost Optimization

### Estimated Monthly Costs (US-East-1)

| Service | Configuration | Cost |
|---------|---------------|------|
| RDS | db.t3.micro | $15-25 |
| EC2 | t3.micro bastion | $8-10 |
| ALB | Standard usage | $16-20 |
| NAT Gateway | 2 gateways | $90-100 |
| S3 | Logs storage | $1-5 |
| Data Transfer | Normal usage | $5-15 |
| **Total** | | **$135-175** |

### Cost Reduction Options

1. **Single NAT Gateway** (reduces HA)
   ```hcl
   # Use only one NAT gateway
   nat_gateway_count = 1
   ```

2. **Reserved Instances** (1-3 year commitment)
   - Can save 30-60% on EC2 costs

3. **Spot Instances** (for non-critical workloads)
   - Can save 50-90% but may be interrupted

4. **Scheduled Scaling** (for predictable workloads)
   ```hcl
   scheduled_scaling = true
   ```

## 🔄 Backup and Recovery

### Automated Backups

- **RDS**: Automated daily backups with 7-day retention
- **EBS**: Snapshot lifecycle management
- **S3**: Cross-region replication (optional)

### Disaster Recovery

- **RTO**: 60 minutes (Recovery Time Objective)
- **RPO**: 15 minutes (Recovery Point Objective)
- **Multi-AZ**: Database failover in 1-2 minutes
- **Cross-Region**: Optional for critical workloads

### Manual Backup

```bash
# Database backup
pg_dump -h RDS_ENDPOINT -U postgres sales_dashboard_prod > backup.sql

# Application backup
dm-deploy backup
```

## 🚨 Troubleshooting

### Common Issues

**1. Terraform Apply Fails**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate configuration
terraform validate

# Check required variables
terraform plan
```

**2. Cannot Connect to Bastion**
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Verify key pair
aws ec2 describe-key-pairs --key-names your-keypair
```

**3. Application Not Accessible**
```bash
# Check load balancer health
aws elbv2 describe-target-health --target-group-arn arn:aws:...

# Check security groups
# Verify DNS and SSL certificate
```

**4. Database Connection Issues**
```bash
# Test from bastion
nc -zv RDS_ENDPOINT 5432

# Check security groups
# Verify credentials
```

### Getting Help

1. **Check Logs**
   ```bash
   dm-logs      # On bastion host
   dm-monitor   # System status
   ```

2. **AWS Support**
   - Use AWS Console support center
   - Check AWS Health Dashboard

3. **Community Support**
   - Terraform documentation
   - AWS documentation
   - Stack Overflow

## 🔧 Maintenance

### Regular Tasks

**Weekly:**
- Review CloudWatch metrics and alerts
- Check application logs for errors
- Verify backup completion

**Monthly:**
- Update AMIs and software patches
- Review and optimize costs
- Test disaster recovery procedures

**Quarterly:**
- Security audit and penetration testing
- Performance optimization review
- Capacity planning assessment

### Updates and Patches

```bash
# Update Terraform configuration
terraform plan
terraform apply

# Update application (on bastion)
dm-deploy deploy

# Update bastion host
sudo yum update -y
```

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [PostgreSQL on AWS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

---

## 📞 Support

For infrastructure support and questions:

- **DevOps Team**: devops@company.com
- **Emergency**: Use AWS Support Center
- **Documentation**: Check CLAUDE.md in project root

---

*Last Updated: July 2025*  
*Infrastructure Version: 1.0*  
*Terraform Version: >= 1.0*