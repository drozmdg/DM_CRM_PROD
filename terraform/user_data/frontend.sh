#!/bin/bash
# Frontend Web Server User Data Script
# DM_CRM Sales Dashboard - Production Infrastructure

set -e

# Variables from Terraform
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
DOCKER_IMAGE="${docker_image}"
BACKEND_ENDPOINT="${backend_endpoint}"
APP_PORT="${app_port}"

# Logging
exec > >(tee /var/log/user-data.log) 2>&1
echo "=== Frontend Server Initialization - $(date) ==="

# Update system
yum update -y

# Install essential packages
yum install -y \
    docker \
    nginx \
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
  "max-concurrent-uploads": 3
}
EOF

# Restart Docker with new configuration
systemctl restart docker

# Create application directory
mkdir -p /opt/dm-crm
chown ec2-user:ec2-user /opt/dm-crm

# Create Nginx configuration
cat > /etc/nginx/conf.d/dm-crm.conf << EOF
# DM CRM Frontend Configuration
upstream backend {
    server backend:${APP_PORT};
    keepalive 32;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=web:10m rate=20r/s;

# Main server block
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Client max body size for file uploads
    client_max_body_size 10M;
    
    # Timeouts
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    send_timeout 60s;
    
    # API routes (proxy to backend)
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Health check endpoint
    location /health {
        limit_req zone=api burst=10 nodelay;
        
        proxy_pass http://backend/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        access_log off;
    }
    
    # Static files (served by Nginx)
    location / {
        limit_req zone=web burst=50 nodelay;
        
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
        
        # Security for sensitive files
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
    
    # Nginx status for monitoring
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        root /usr/share/nginx/html;
        internal;
    }
    
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
EOF

# Remove default Nginx configuration
rm -f /etc/nginx/conf.d/default.conf

# Create environment configuration for frontend container
cat > /opt/dm-crm/.env << EOF
# Frontend Environment Configuration
NODE_ENV=${ENVIRONMENT}
REACT_APP_API_URL=/api
REACT_APP_PROJECT_NAME=${PROJECT_NAME}
REACT_APP_ENVIRONMENT=${ENVIRONMENT}
EOF

# Create Docker Compose file for frontend
cat > /opt/dm-crm/docker-compose.yml << EOF
version: '3.8'

services:
  frontend:
    image: ${DOCKER_IMAGE}
    container_name: dm-crm-frontend
    restart: unless-stopped
    volumes:
      - frontend-assets:/usr/share/nginx/html
    networks:
      - app-network
    environment:
      - NODE_ENV=${ENVIRONMENT}
      - REACT_APP_API_URL=/api
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "us-east-1"
        awslogs-group: "/aws/ec2/dm-crm-frontend"
        awslogs-stream: "${ENVIRONMENT}-frontend"
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  backend:
    image: nginx:alpine
    container_name: dm-crm-backend-proxy
    restart: unless-stopped
    ports:
      - "${APP_PORT}:${APP_PORT}"
    volumes:
      - ./backend-proxy.conf:/etc/nginx/conf.d/default.conf
    networks:
      - app-network
    depends_on:
      - frontend
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "us-east-1"
        awslogs-group: "/aws/ec2/dm-crm-frontend"
        awslogs-stream: "${ENVIRONMENT}-backend-proxy"

networks:
  app-network:
    driver: bridge

volumes:
  frontend-assets:
EOF

# Create backend proxy configuration
cat > /opt/dm-crm/backend-proxy.conf << EOF
server {
    listen ${APP_PORT};
    server_name _;
    
    location / {
        proxy_pass http://${BACKEND_ENDPOINT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Create startup script
cat > /opt/dm-crm/start-frontend.sh << 'EOF'
#!/bin/bash
# Frontend startup script

set -e

cd /opt/dm-crm

echo "=== Starting DM CRM Frontend - $(date) ==="

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

# Start the frontend container
echo "Starting frontend container..."
docker-compose up -d frontend

# Wait for container to extract static files
echo "Waiting for static files extraction..."
sleep 30

# Copy static files from container to host
echo "Copying static files..."
mkdir -p /var/www/html
docker cp dm-crm-frontend:/usr/share/nginx/html/. /var/www/html/

# Start Nginx
echo "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Display status
echo "Frontend application status:"
docker-compose ps
sudo systemctl status nginx --no-pager

echo "✅ Frontend startup complete - $(date)"
EOF

chmod +x /opt/dm-crm/start-frontend.sh

# Create health check script
cat > /opt/dm-crm/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for frontend

HEALTH_URL="http://localhost/health"
LOG_FILE="/opt/dm-crm/logs/health-check.log"

# Create logs directory
mkdir -p /opt/dm-crm/logs

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Perform health check
if curl -f -s "$HEALTH_URL" > /dev/null; then
    log "✅ Frontend health check passed"
    exit 0
else
    log "❌ Frontend health check failed"
    
    # Check if Nginx is running
    if ! systemctl is-active --quiet nginx; then
        log "🔄 Nginx not running, attempting to restart"
        sudo systemctl restart nginx
    fi
    
    # Check if container is running
    if ! docker ps | grep -q dm-crm-frontend; then
        log "🔄 Frontend container not running, attempting to restart"
        cd /opt/dm-crm
        docker-compose restart frontend
        sleep 30
        # Re-copy static files
        docker cp dm-crm-frontend:/usr/share/nginx/html/. /var/www/html/
    fi
    
    exit 1
fi
EOF

chmod +x /opt/dm-crm/health-check.sh

# Create monitoring script
cat > /opt/dm-crm/monitor-frontend.sh << 'EOF'
#!/bin/bash
# Frontend monitoring script

echo "=== Frontend Monitoring Report - $(date) ==="
echo ""

cd /opt/dm-crm

echo "🐳 Docker Status:"
docker --version
systemctl status docker --no-pager -l

echo ""
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "🌐 Nginx Status:"
systemctl status nginx --no-pager

echo ""
echo "📊 Container Stats:"
docker stats --no-stream dm-crm-frontend || echo "Container not running"

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

echo -n "Backend: "
if curl -f -s http://${BACKEND_ENDPOINT}/api/health &>/dev/null; then
    echo "✅ Connected"
else
    echo "❌ No connection"
fi

echo ""
echo "📝 Recent Logs (last 20 lines):"
docker-compose logs --tail=20 frontend || echo "No logs available"

echo ""
echo "🏥 Health Status:"
if curl -f http://localhost/health &>/dev/null; then
    echo "✅ Frontend healthy"
else
    echo "❌ Frontend unhealthy"
fi

echo ""
echo "📊 Nginx Stats:"
curl -s http://localhost/nginx_status || echo "Nginx stats not available"
EOF

chmod +x /opt/dm-crm/monitor-frontend.sh

# Set ownership
chown -R ec2-user:ec2-user /opt/dm-crm

# Configure CloudWatch agent (same as backend but for frontend)
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
                        "log_group_name": "/aws/ec2/dm-crm-frontend",
                        "log_stream_name": "{instance_id}-frontend",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/dm-crm-frontend",
                        "log_stream_name": "{instance_id}-nginx-access",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/ec2/dm-crm-frontend",
                        "log_stream_name": "{instance_id}-nginx-error",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/user-data.log",
                        "log_group_name": "/aws/ec2/dm-crm-frontend",
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
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create systemd service for frontend
cat > /etc/systemd/system/dm-crm-frontend.service << 'EOF'
[Unit]
Description=DM CRM Frontend Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/dm-crm/start-frontend.sh
ExecStop=/bin/bash -c 'cd /opt/dm-crm && /usr/local/bin/docker-compose down && sudo systemctl stop nginx'
WorkingDirectory=/opt/dm-crm
User=root

[Install]
WantedBy=multi-user.target
EOF

# Set up health check cron job
cat > /etc/cron.d/dm-crm-frontend-health << 'EOF'
# DM CRM Frontend Health Check
*/5 * * * * ec2-user /opt/dm-crm/health-check.sh
EOF

# Set up log rotation
cat > /etc/logrotate.d/dm-crm-frontend << 'EOF'
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

/var/log/nginx/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Configure security updates
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Create web root directory
mkdir -p /var/www/html
chown -R nginx:nginx /var/www/html

# Start the application
echo "Starting DM CRM Frontend application..."
systemctl daemon-reload
systemctl enable dm-crm-frontend
systemctl start dm-crm-frontend

# Verify startup
sleep 60
if systemctl is-active --quiet dm-crm-frontend && systemctl is-active --quiet nginx; then
    echo "✅ Frontend service started successfully"
    /opt/dm-crm/monitor-frontend.sh
else
    echo "❌ Frontend service failed to start"
    systemctl status dm-crm-frontend
    systemctl status nginx
    journalctl -u dm-crm-frontend -l
fi

echo "✅ Frontend server initialization complete - $(date)"