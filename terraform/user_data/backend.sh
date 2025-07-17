#!/bin/bash
# Backend Application Server User Data Script
# DM_CRM Sales Dashboard - Production Infrastructure

set -e

# Variables from Terraform
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
DOCKER_IMAGE="${docker_image}"
DATABASE_URL="${database_url}"
JWT_SECRET="${jwt_secret}"
NODE_ENV="${node_env}"
APP_PORT="${app_port}"
JWT_EXPIRES_IN="${jwt_expires_in}"
JWT_REFRESH_EXPIRES_IN="${jwt_refresh_expires_in}"

# Logging
exec > >(tee /var/log/user-data.log) 2>&1
echo "=== Backend Server Initialization - $(date) ==="

# Update system
yum update -y

# Install essential packages
yum install -y \
    docker \
    awscli \
    amazon-cloudwatch-agent \
    htop \
    nano \
    curl \
    wget \
    jq \
    unzip

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start and enable Docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Configure Docker daemon for production
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "awslogs",
  "log-opts": {
    "awslogs-region": "us-east-1",
    "awslogs-group": "/aws/ec2/docker"
  },
  "storage-driver": "overlay2",
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

# Restart Docker with new configuration
systemctl restart docker

# Create application directory
mkdir -p /opt/dm-crm
chown ec2-user:ec2-user /opt/dm-crm

# Create environment configuration
cat > /opt/dm-crm/.env << EOF
# Production Environment Configuration
NODE_ENV=${NODE_ENV}
PORT=${APP_PORT}

# Database Configuration
DATABASE_URL=${DATABASE_URL}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN}

# Application Configuration
PROJECT_NAME=${PROJECT_NAME}
ENVIRONMENT=${ENVIRONMENT}

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Performance
CLUSTER_MODE=true
CLUSTER_WORKERS=auto
EOF

# Secure environment file
chown ec2-user:ec2-user /opt/dm-crm/.env
chmod 600 /opt/dm-crm/.env

# Create Docker Compose file for backend
cat > /opt/dm-crm/docker-compose.yml << EOF
version: '3.8'

services:
  backend:
    image: ${DOCKER_IMAGE}
    container_name: dm-crm-backend
    restart: unless-stopped
    ports:
      - "${APP_PORT}:${APP_PORT}"
    env_file:
      - .env
    environment:
      - NODE_ENV=${NODE_ENV}
      - PORT=${APP_PORT}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${APP_PORT}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "us-east-1"
        awslogs-group: "/aws/ec2/dm-crm-backend"
        awslogs-stream: "${ENVIRONMENT}-backend"
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

networks:
  app-network:
    driver: bridge

volumes:
  logs:
  uploads:
EOF

# Create logs directory
mkdir -p /opt/dm-crm/logs
mkdir -p /opt/dm-crm/uploads
chown -R ec2-user:ec2-user /opt/dm-crm/logs /opt/dm-crm/uploads

# Create startup script
cat > /opt/dm-crm/start-backend.sh << 'EOF'
#!/bin/bash
# Backend startup script

set -e

cd /opt/dm-crm

echo "=== Starting DM CRM Backend - $(date) ==="

# Check Docker is running
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    sudo systemctl start docker
    sleep 10
fi

# Pull latest image
echo "Pulling latest Docker image..."
docker pull "${DOCKER_IMAGE}" || {
    echo "Failed to pull image, using cached version"
}

# Start the application
echo "Starting backend application..."
docker-compose up -d

# Wait for application to be ready
echo "Waiting for application to be ready..."
sleep 30

# Health check
echo "Performing health check..."
for i in {1..10}; do
    if curl -f http://localhost:${APP_PORT}/api/health; then
        echo "✅ Backend application is healthy"
        break
    else
        echo "⏳ Waiting for application... attempt $i/10"
        sleep 10
    fi
done

# Display status
echo "Backend application status:"
docker-compose ps

echo "✅ Backend startup complete - $(date)"
EOF

chmod +x /opt/dm-crm/start-backend.sh

# Create health check script
cat > /opt/dm-crm/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for monitoring

HEALTH_URL="http://localhost:${APP_PORT}/api/health"
LOG_FILE="/opt/dm-crm/logs/health-check.log"

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Perform health check
if curl -f -s "$HEALTH_URL" > /dev/null; then
    log "✅ Health check passed"
    exit 0
else
    log "❌ Health check failed"
    
    # Try to restart if unhealthy
    log "🔄 Attempting to restart application"
    cd /opt/dm-crm
    docker-compose restart backend
    
    exit 1
fi
EOF

chmod +x /opt/dm-crm/health-check.sh

# Create monitoring script
cat > /opt/dm-crm/monitor-backend.sh << 'EOF'
#!/bin/bash
# Backend monitoring script

echo "=== Backend Monitoring Report - $(date) ==="
echo ""

cd /opt/dm-crm

echo "🐳 Docker Status:"
docker --version
systemctl status docker --no-pager -l

echo ""
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "📊 Container Stats:"
docker stats --no-stream dm-crm-backend || echo "Container not running"

echo ""
echo "💾 Memory Usage:"
free -h

echo ""
echo "💿 Disk Usage:"
df -h

echo ""
echo "🌐 Network Connectivity:"
echo -n "Internet: "
if ping -c 1 google.com &>/dev/null; then
    echo "✅ Connected"
else
    echo "❌ No connection"
fi

echo -n "Database: "
if nc -z $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1) 5432 &>/dev/null; then
    echo "✅ Connected"
else
    echo "❌ No connection"
fi

echo ""
echo "📝 Recent Logs (last 20 lines):"
docker-compose logs --tail=20 backend || echo "No logs available"

echo ""
echo "🏥 Health Status:"
if curl -f http://localhost:${APP_PORT}/api/health &>/dev/null; then
    echo "✅ Application healthy"
else
    echo "❌ Application unhealthy"
fi
EOF

chmod +x /opt/dm-crm/monitor-backend.sh

# Set ownership
chown -R ec2-user:ec2-user /opt/dm-crm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/dm-crm/logs/*.log",
                        "log_group_name": "/aws/ec2/dm-crm-backend",
                        "log_stream_name": "{instance_id}-backend",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/user-data.log",
                        "log_group_name": "/aws/ec2/dm-crm-backend",
                        "log_stream_name": "{instance_id}-userdata",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    },
    "metrics": {
        "append_dimensions": {
            "AutoScalingGroupName": "\${aws:AutoScalingGroupName}",
            "ImageId": "\${aws:ImageId}",
            "InstanceId": "\${aws:InstanceId}",
            "InstanceType": "\${aws:InstanceType}"
        },
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time",
                    "read_bytes",
                    "write_bytes",
                    "reads",
                    "writes"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create systemd service for application
cat > /etc/systemd/system/dm-crm-backend.service << 'EOF'
[Unit]
Description=DM CRM Backend Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/dm-crm/start-backend.sh
ExecStop=/usr/local/bin/docker-compose -f /opt/dm-crm/docker-compose.yml down
WorkingDirectory=/opt/dm-crm
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
EOF

# Set up health check cron job
cat > /etc/cron.d/dm-crm-health << 'EOF'
# DM CRM Backend Health Check
*/5 * * * * ec2-user /opt/dm-crm/health-check.sh
EOF

# Set up log rotation
cat > /etc/logrotate.d/dm-crm-backend << 'EOF'
/opt/dm-crm/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su ec2-user ec2-user
}
EOF

# Configure security updates
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Start the application
echo "Starting DM CRM Backend application..."
systemctl daemon-reload
systemctl enable dm-crm-backend
systemctl start dm-crm-backend

# Verify startup
sleep 60
if systemctl is-active --quiet dm-crm-backend; then
    echo "✅ Backend service started successfully"
    /opt/dm-crm/monitor-backend.sh
else
    echo "❌ Backend service failed to start"
    systemctl status dm-crm-backend
    journalctl -u dm-crm-backend -l
fi

echo "✅ Backend server initialization complete - $(date)"