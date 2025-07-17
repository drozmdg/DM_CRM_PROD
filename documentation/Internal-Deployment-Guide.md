# DM_CRM Sales Dashboard - Internal Deployment Guide

**Document Version:** 1.0  
**Date:** July 17, 2025  
**Deployment Type:** Internal Network PostgreSQL Production  
**Status:** ✅ PRODUCTION READY  

---

## 🎯 Overview

This guide provides comprehensive instructions for deploying and maintaining the DM_CRM Sales Dashboard in an internal corporate network environment using Docker containers and PostgreSQL database.

### **Deployment Architecture**
- **Application Stack:** React frontend + Node.js backend
- **Database:** PostgreSQL 15 (Docker container)
- **Authentication:** JWT-based authentication with Supabase integration
- **Security:** Corporate firewall protected environment
- **Monitoring:** Basic container and application monitoring

---

## 📋 Prerequisites

### **System Requirements**
- **Operating System:** Linux (Ubuntu 20.04+ recommended)
- **Docker:** Version 20.10+ with Docker Compose
- **Memory:** Minimum 8GB RAM (16GB recommended)
- **Storage:** 50GB available disk space
- **Network:** Internal corporate network with firewall protection

### **Required Access**
- Administrative access to deployment server
- Corporate network access for internal users
- SMTP server access for notifications (optional)
- Backup storage access for data protection

---

## 🚀 Quick Start Deployment

### **1. Environment Setup**

```bash
# Clone the repository
git clone [repository-url]
cd SalesDashboard

# Create environment configuration
cp server/.env.example server/.env
```

### **2. Configure Environment Variables**

Edit `server/.env` with production values:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sales_dashboard_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales_dashboard_dev
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Authentication
JWT_SECRET=your_84_character_production_jwt_secret_key_here_minimum_32_characters_required
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Supabase Configuration (for authentication)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### **3. Database Deployment**

```bash
# Start PostgreSQL container
docker compose -f docker-compose.prod.yml up -d db

# Wait for database to be ready
sleep 30

# Run database migrations
npm run db:migrate

# Verify database setup
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "SELECT COUNT(*) FROM customers;"
```

### **4. Application Deployment**

```bash
# Build and start all services
npm run build
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
curl http://localhost:3000/api/health
curl http://localhost:5173
```

---

## 🐳 Docker Container Management

### **Container Architecture**

The deployment consists of the following containers:

1. **sales-dashboard-app** - Node.js backend application
2. **sales-dashboard-frontend** - Nginx serving React frontend
3. **sales-dashboard-db-dev** - PostgreSQL 15 database
4. **sales-dashboard-network** - Internal Docker network

### **Container Commands**

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# View container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f [service-name]

# Restart specific service
docker compose -f docker-compose.prod.yml restart [service-name]

# Scale services (if needed)
docker compose -f docker-compose.prod.yml up -d --scale app=2
```

### **Health Check Verification**

```bash
# Check all container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test application endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/customers
curl http://localhost:5173

# Database health check
docker exec sales-dashboard-db-dev pg_isready -U postgres
```

---

## 🔧 Configuration Management

### **Environment Configuration**

**Development vs Production Settings:**

| Setting | Development | Production |
|---------|-------------|------------|
| NODE_ENV | development | production |
| Database | Supabase | PostgreSQL Container |
| Logging | Console | File + Console |
| Error Handling | Detailed | Sanitized |
| CORS | Permissive | Restricted |

### **Security Configuration**

**Authentication Settings:**
```bash
# JWT Configuration
JWT_SECRET=minimum_84_characters_for_production_security
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Password Requirements
PASSWORD_MIN_LENGTH=8
REQUIRE_SPECIAL_CHARS=true
REQUIRE_NUMBERS=true
```

**Security Headers:**
```bash
# Helmet.js security headers
HELMET_ENABLED=true
HSTS_ENABLED=true
CSP_ENABLED=true
```

### **Database Configuration**

**Connection Settings:**
```bash
# PostgreSQL Configuration
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=10000
DB_QUERY_TIMEOUT=60000
```

**Backup Configuration:**
```bash
# Automatic backup settings
BACKUP_ENABLED=true
BACKUP_FREQUENCY=daily
BACKUP_RETENTION_DAYS=30
BACKUP_LOCATION=/opt/backups/sales-dashboard
```

---

## 📊 Monitoring and Logging

### **Application Monitoring**

**Health Check Endpoints:**
```bash
# Application health
GET /api/health
Response: {"status": "healthy", "timestamp": "2025-07-17T00:00:00.000Z"}

# Database health
GET /api/health/database
Response: {"status": "connected", "tables": 15, "last_check": "2025-07-17T00:00:00.000Z"}

# Authentication health
GET /api/health/auth
Response: {"status": "active", "provider": "supabase", "last_check": "2025-07-17T00:00:00.000Z"}
```

**Performance Monitoring:**
```bash
# Container resource usage
docker stats sales-dashboard-app sales-dashboard-db-dev

# Database performance
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"
```

### **Log Management**

**Log Locations:**
```bash
# Application logs
docker logs sales-dashboard-app

# Database logs
docker logs sales-dashboard-db-dev

# Nginx logs (frontend)
docker logs sales-dashboard-frontend

# System logs
/var/log/sales-dashboard/
```

**Log Rotation Configuration:**
```bash
# Configure logrotate for application logs
sudo cat > /etc/logrotate.d/sales-dashboard << EOF
/var/log/sales-dashboard/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 docker docker
}
EOF
```

---

## 🔐 Security Management

### **Authentication & Authorization**

**User Management:**
```bash
# Create admin user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'

# Reset user password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@company.com"}'
```

**Role-Based Access Control:**
```sql
-- View user roles
SELECT u.email, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id;

-- Update user role
UPDATE user_roles 
SET role_id = (SELECT id FROM roles WHERE name = 'manager') 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.com');
```

### **Data Protection**

**Database Security:**
```bash
# Regular security audit
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';"

# Review sensitive data access
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%email%' OR column_name LIKE '%phone%';"
```

**Audit Logging:**
```bash
# View authentication logs
docker logs sales-dashboard-app | grep "AUTH"

# View database access logs
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT * FROM pg_stat_activity 
WHERE state = 'active' AND backend_type = 'client backend';"
```

---

## 💾 Backup and Recovery

### **Automated Backup Procedures**

**Database Backup Script:**
```bash
#!/bin/bash
# /opt/scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/sales-dashboard"
DB_CONTAINER="sales-dashboard-db-dev"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database backup
docker exec "$DB_CONTAINER" pg_dump -U postgres -d sales_dashboard_dev > "$BACKUP_DIR/database_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/database_$DATE.sql"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "database_*.sql.gz" -mtime +30 -delete

echo "Backup completed: database_$DATE.sql.gz"
```

**Application Backup Script:**
```bash
#!/bin/bash
# /opt/scripts/backup-application.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/sales-dashboard"
APP_DIR="/opt/sales-dashboard"

# Backup application configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  "$APP_DIR/server/.env" \
  "$APP_DIR/docker-compose.prod.yml" \
  "$APP_DIR/nginx.conf"

echo "Configuration backup completed: config_$DATE.tar.gz"
```

### **Recovery Procedures**

**Database Recovery:**
```bash
# Stop application
docker compose -f docker-compose.prod.yml down app

# Restore database from backup
gunzip -c /opt/backups/sales-dashboard/database_YYYYMMDD_HHMMSS.sql.gz | \
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

# Restart application
docker compose -f docker-compose.prod.yml up -d
```

**Disaster Recovery:**
```bash
# Complete system recovery
cd /opt/sales-dashboard

# Restore configuration
tar -xzf /opt/backups/sales-dashboard/config_YYYYMMDD_HHMMSS.tar.gz

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Restore database (if needed)
gunzip -c /opt/backups/sales-dashboard/database_YYYYMMDD_HHMMSS.sql.gz | \
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev
```

---

## 🔧 Maintenance Procedures

### **Regular Maintenance Tasks**

**Daily Tasks:**
```bash
# Check system health
./scripts/health-check.sh

# Review application logs
docker logs --since 24h sales-dashboard-app | grep ERROR

# Monitor disk usage
df -h /opt/sales-dashboard
df -h /opt/backups
```

**Weekly Tasks:**
```bash
# Update container images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Database maintenance
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "VACUUM ANALYZE;"

# Clean up old logs
docker system prune -f
```

**Monthly Tasks:**
```bash
# Security audit
./scripts/security-audit.sh

# Performance review
./scripts/performance-report.sh

# Backup verification
./scripts/verify-backups.sh
```

### **Performance Optimization**

**Database Optimization:**
```sql
-- Analyze query performance
SELECT query, mean_exec_time, calls, total_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 20;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan ASC;

-- Update table statistics
ANALYZE;
```

**Container Optimization:**
```bash
# Monitor resource usage
docker stats --no-stream

# Optimize container resources
docker update --memory="1g" --cpus="1.0" sales-dashboard-app

# Clean up unused resources
docker system prune -a -f --volumes
```

---

## 🚨 Troubleshooting Guide

### **Common Issues**

**Application Won't Start:**
```bash
# Check environment variables
docker exec sales-dashboard-app env | grep NODE_ENV

# Check database connectivity
docker exec sales-dashboard-app npm run db:test

# Review application logs
docker logs sales-dashboard-app --tail 50
```

**Database Connection Issues:**
```bash
# Test database connectivity
docker exec sales-dashboard-db-dev pg_isready -U postgres

# Check database logs
docker logs sales-dashboard-db-dev --tail 50

# Verify database credentials
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "SELECT 1;"
```

**Authentication Problems:**
```bash
# Verify JWT configuration
echo $JWT_SECRET | wc -c  # Should be 84+ characters

# Test authentication endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@company.com", "password": "password"}'

# Check Supabase connectivity
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/auth/v1/settings"
```

### **Performance Issues**

**Slow Database Queries:**
```sql
-- Identify slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;
```

**High Memory Usage:**
```bash
# Check container memory usage
docker stats --no-stream sales-dashboard-app

# Analyze memory leaks
docker exec sales-dashboard-app npm run memory-profile

# Restart container if needed
docker compose -f docker-compose.prod.yml restart app
```

---

## 📞 Support and Escalation

### **Contact Information**

**Technical Support:**
- **Level 1:** Internal IT Team
- **Level 2:** Development Team
- **Level 3:** Senior Developer/DevOps Engineer

**Emergency Contacts:**
- **Production Issues:** [Emergency Phone/Email]
- **Security Incidents:** [Security Team Contact]
- **Database Issues:** [Database Administrator]

### **Escalation Procedures**

**Severity Levels:**
- **Critical (P1):** Complete system outage - Immediate response
- **High (P2):** Major functionality impacted - 4 hour response
- **Medium (P3):** Minor functionality issues - 24 hour response
- **Low (P4):** Enhancement requests - 72 hour response

**Documentation Requirements:**
- Error messages and logs
- Steps to reproduce issue
- Impact assessment
- Attempted resolution steps

---

## 📋 Appendices

### **Appendix A: Port Configuration**

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React development server |
| Backend | 3000 | Node.js API server |
| Database | 5432 | PostgreSQL database |
| Nginx | 80/443 | Production web server |

### **Appendix B: File Locations**

| Component | Location |
|-----------|----------|
| Application Code | `/opt/sales-dashboard/` |
| Configuration | `/opt/sales-dashboard/server/.env` |
| Logs | `/var/log/sales-dashboard/` |
| Backups | `/opt/backups/sales-dashboard/` |
| Scripts | `/opt/scripts/` |

### **Appendix C: Network Configuration**

**Internal Network Access:**
- Application accessible via corporate network
- Database accessible only from application containers
- No external internet access required for operation
- Corporate firewall provides additional security layer

**Required Network Ports:**
- Inbound: 80, 443, 3000, 5173 (internal network only)
- Outbound: 443 (for Supabase authentication, if needed)

---

*This deployment guide provides comprehensive instructions for internal network deployment of the DM_CRM Sales Dashboard. For additional support or questions, contact the development team or refer to the troubleshooting section.*