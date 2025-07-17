#!/bin/bash
# Bastion Host User Data Script
# DM_CRM Sales Dashboard - Production Infrastructure

set -e

# Variables from Terraform
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"

# Update system
yum update -y

# Install essential packages
yum install -y \
    wget \
    curl \
    git \
    htop \
    nano \
    postgresql15 \
    postgresql15-contrib \
    docker \
    awscli \
    unzip \
    jq

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Session Manager plugin for secure shell access
yum install -y https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm

# Create directory for scripts and tools
mkdir -p /opt/dm-crm
chown ec2-user:ec2-user /opt/dm-crm

# Create database connection script
cat > /opt/dm-crm/connect-db.sh << 'EOF'
#!/bin/bash
# Database connection helper script

if [ -z "$1" ]; then
    echo "Usage: $0 <database-endpoint>"
    echo "Example: $0 dm-crm-db-production.xyz.us-east-1.rds.amazonaws.com"
    exit 1
fi

DB_ENDPOINT="$1"
DB_PORT="${2:-5432}"
DB_NAME="${3:-sales_dashboard_prod}"
DB_USER="${4:-postgres}"

echo "Connecting to database..."
echo "Endpoint: $DB_ENDPOINT"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Check if database is reachable
if nc -z "$DB_ENDPOINT" "$DB_PORT"; then
    echo "Database is reachable. Connecting..."
    psql -h "$DB_ENDPOINT" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
else
    echo "Error: Cannot reach database at $DB_ENDPOINT:$DB_PORT"
    echo "Please check:"
    echo "1. Database endpoint is correct"
    echo "2. Security groups allow access from this bastion"
    echo "3. Database is running"
    exit 1
fi
EOF

chmod +x /opt/dm-crm/connect-db.sh

# Create application deployment script
cat > /opt/dm-crm/deploy-app.sh << 'EOF'
#!/bin/bash
# Application deployment helper script

set -e

DEPLOYMENT_DIR="/opt/dm-crm/deployment"
BACKUP_DIR="/opt/dm-crm/backups"

# Create directories
mkdir -p "$DEPLOYMENT_DIR"
mkdir -p "$BACKUP_DIR"

echo "=== DM CRM Application Deployment ==="
echo "Timestamp: $(date)"
echo ""

# Check Docker is running
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    sudo systemctl start docker
fi

# Function to backup current deployment
backup_deployment() {
    if [ -d "$DEPLOYMENT_DIR" ] && [ "$(ls -A $DEPLOYMENT_DIR)" ]; then
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        echo "Creating backup: $BACKUP_NAME"
        cp -r "$DEPLOYMENT_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        echo "Backup created in $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# Function to pull latest images
pull_images() {
    echo "Pulling latest Docker images..."
    docker pull ghcr.io/dm-crm/sales-dashboard-backend:latest
    docker pull ghcr.io/dm-crm/sales-dashboard-frontend:latest
    echo "Images pulled successfully"
}

# Function to deploy application
deploy_application() {
    echo "Deploying application..."
    cd "$DEPLOYMENT_DIR"
    
    if [ -f "docker-compose.prod.yml" ]; then
        # Stop current deployment
        docker-compose -f docker-compose.prod.yml down || true
        
        # Start new deployment
        docker-compose -f docker-compose.prod.yml up -d
        
        # Wait for services to be ready
        echo "Waiting for services to start..."
        sleep 30
        
        # Check health
        echo "Checking application health..."
        if curl -f http://localhost/api/health; then
            echo "✅ Application deployed successfully"
        else
            echo "❌ Application health check failed"
            exit 1
        fi
    else
        echo "❌ docker-compose.prod.yml not found in $DEPLOYMENT_DIR"
        exit 1
    fi
}

# Main deployment process
case "${1:-deploy}" in
    "backup")
        backup_deployment
        ;;
    "pull")
        pull_images
        ;;
    "deploy")
        backup_deployment
        pull_images
        deploy_application
        ;;
    "status")
        cd "$DEPLOYMENT_DIR"
        docker-compose -f docker-compose.prod.yml ps
        ;;
    "logs")
        cd "$DEPLOYMENT_DIR"
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "restart")
        cd "$DEPLOYMENT_DIR"
        docker-compose -f docker-compose.prod.yml restart
        ;;
    *)
        echo "Usage: $0 {backup|pull|deploy|status|logs|restart}"
        echo ""
        echo "Commands:"
        echo "  backup  - Create backup of current deployment"
        echo "  pull    - Pull latest Docker images"
        echo "  deploy  - Full deployment (backup + pull + deploy)"
        echo "  status  - Show service status"
        echo "  logs    - Show application logs"
        echo "  restart - Restart services"
        exit 1
        ;;
esac
EOF

chmod +x /opt/dm-crm/deploy-app.sh

# Create system monitoring script
cat > /opt/dm-crm/monitor-system.sh << 'EOF'
#!/bin/bash
# System monitoring script

echo "=== System Monitoring - $(date) ==="
echo ""

echo "🖥️  System Information:"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

echo "💾 Memory Usage:"
free -h
echo ""

echo "💿 Disk Usage:"
df -h | grep -E "(/dev/|Filesystem)"
echo ""

echo "🐳 Docker Status:"
if systemctl is-active --quiet docker; then
    echo "Docker: ✅ Running"
    echo "Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Images:"
    docker images | head -10
else
    echo "Docker: ❌ Not running"
fi
echo ""

echo "🌐 Network Connectivity:"
echo -n "Internet: "
if ping -c 1 google.com &>/dev/null; then
    echo "✅ Connected"
else
    echo "❌ No connection"
fi

echo -n "AWS Metadata: "
if curl -m 5 -s http://169.254.169.254/latest/meta-data/instance-id &>/dev/null; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi
echo ""

echo "📊 Process Information:"
echo "Top 5 processes by CPU:"
ps aux --sort=-%cpu | head -6
echo ""

echo "🔧 Service Status:"
services=("docker" "sshd" "amazon-ssm-agent")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service"; then
        echo "$service: ✅ Active"
    else
        echo "$service: ❌ Inactive"
    fi
done
EOF

chmod +x /opt/dm-crm/monitor-system.sh

# Create log collection script
cat > /opt/dm-crm/collect-logs.sh << 'EOF'
#!/bin/bash
# Log collection script for troubleshooting

LOG_DIR="/opt/dm-crm/logs"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="dm-crm-logs-$TIMESTAMP.tar.gz"

echo "=== Log Collection - $(date) ==="

# Create logs directory
mkdir -p "$LOG_DIR"

# Collect system logs
echo "Collecting system logs..."
journalctl --since "24 hours ago" > "$LOG_DIR/system-journal.log"
cp /var/log/messages "$LOG_DIR/system-messages.log" 2>/dev/null || true
cp /var/log/secure "$LOG_DIR/system-secure.log" 2>/dev/null || true

# Collect Docker logs
echo "Collecting Docker logs..."
docker logs dm-crm-backend > "$LOG_DIR/docker-backend.log" 2>&1 || true
docker logs dm-crm-frontend > "$LOG_DIR/docker-frontend.log" 2>&1 || true
docker logs dm-crm-database > "$LOG_DIR/docker-database.log" 2>&1 || true

# Collect application logs
echo "Collecting application logs..."
find /opt/dm-crm/deployment -name "*.log" -exec cp {} "$LOG_DIR/" \; 2>/dev/null || true

# System information
echo "Collecting system information..."
{
    echo "=== System Information ==="
    uname -a
    echo ""
    echo "=== Memory ==="
    free -h
    echo ""
    echo "=== Disk ==="
    df -h
    echo ""
    echo "=== Docker ==="
    docker ps -a
    echo ""
    echo "=== Network ==="
    netstat -tlnp
} > "$LOG_DIR/system-info.txt"

# Create archive
echo "Creating archive..."
cd "/opt/dm-crm"
tar -czf "$ARCHIVE_NAME" logs/

echo "✅ Log collection complete"
echo "Archive: /opt/dm-crm/$ARCHIVE_NAME"
echo "Size: $(du -h "$ARCHIVE_NAME" | cut -f1)"
EOF

chmod +x /opt/dm-crm/collect-logs.sh

# Set ownership for ec2-user
chown -R ec2-user:ec2-user /opt/dm-crm

# Add scripts to PATH for ec2-user
echo 'export PATH=$PATH:/opt/dm-crm' >> /home/ec2-user/.bashrc

# Create helpful aliases
cat >> /home/ec2-user/.bashrc << 'EOF'

# DM CRM Aliases
alias dm-db='sudo /opt/dm-crm/connect-db.sh'
alias dm-deploy='sudo /opt/dm-crm/deploy-app.sh'
alias dm-monitor='/opt/dm-crm/monitor-system.sh'
alias dm-logs='sudo /opt/dm-crm/collect-logs.sh'
alias dm-status='sudo /opt/dm-crm/deploy-app.sh status'

# Helpful Docker aliases
alias dps='docker ps'
alias dpa='docker ps -a'
alias di='docker images'
alias dc='docker-compose'

echo "Welcome to DM CRM Sales Dashboard Bastion Host"
echo "Available commands:"
echo "  dm-db      - Connect to database"
echo "  dm-deploy  - Deploy application"
echo "  dm-monitor - System monitoring"
echo "  dm-logs    - Collect logs"
echo "  dm-status  - Check service status"
EOF

# Configure SSH for ec2-user
mkdir -p /home/ec2-user/.ssh
chmod 700 /home/ec2-user/.ssh
chown ec2-user:ec2-user /home/ec2-user/.ssh

# Create MOTD
cat > /etc/motd << EOF
================================================================================
    DM CRM Sales Dashboard - Bastion Host
    Environment: ${ENVIRONMENT}
    Project: ${PROJECT_NAME}
================================================================================

This bastion host provides secure access to the production infrastructure.

Available tools:
  - dm-db      : Connect to production database
  - dm-deploy  : Deploy application updates
  - dm-monitor : System monitoring
  - dm-logs    : Collect troubleshooting logs
  - dm-status  : Check service status

Security guidelines:
  ✓ Use this host only for administrative tasks
  ✓ Do not store sensitive data on this host
  ✓ Log all administrative actions
  ✓ Use SSH key authentication only

For support: Contact DevOps Team

================================================================================
EOF

# Configure CloudWatch agent (if needed)
# This would be uncommented in production with proper IAM roles
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
# rpm -U ./amazon-cloudwatch-agent.rpm

# Final system configuration
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p

# Enable automatic security updates
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Configure log rotation
cat > /etc/logrotate.d/dm-crm << 'EOF'
/opt/dm-crm/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF

echo "✅ Bastion host configuration complete"
echo "Host ready for production operations"