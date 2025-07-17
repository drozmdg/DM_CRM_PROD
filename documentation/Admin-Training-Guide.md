# DM_CRM Sales Dashboard - Administrator Training Guide

**Document Version:** 1.0  
**Date:** July 17, 2025  
**Application Version:** Production Ready  
**Target Audience:** System Administrators and IT Team  

---

## 📋 Table of Contents

1. [Administrator Overview](#administrator-overview)
2. [System Administration](#system-administration)
3. [User Management](#user-management)
4. [Security Administration](#security-administration)
5. [Data Management](#data-management)
6. [System Monitoring](#system-monitoring)
7. [Backup and Recovery](#backup-and-recovery)
8. [Performance Management](#performance-management)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## 🎯 Administrator Overview

### **Administrator Responsibilities**

As a DM_CRM system administrator, you are responsible for:

- **System Health**: Monitoring application and database performance
- **User Management**: Managing user accounts, roles, and permissions
- **Security**: Implementing and maintaining security policies
- **Data Integrity**: Ensuring data backup, recovery, and consistency
- **Performance**: Optimizing system performance and resource usage
- **Support**: Providing technical support to end users
- **Compliance**: Maintaining audit trails and compliance requirements

### **Administrator Access Levels**

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Super Admin** | Full System | All administrative functions |
| **IT Admin** | Infrastructure | System monitoring, backups, performance |
| **Security Admin** | Security Focus | User management, security policies |
| **Data Admin** | Data Management | Data imports, exports, integrity checks |

### **Key Administrative Tools**

- **Docker Management**: Container orchestration and monitoring
- **Database Administration**: PostgreSQL management and optimization
- **Log Analysis**: System and application log review
- **Performance Monitoring**: Resource usage and optimization
- **Backup Management**: Automated backup and recovery procedures

---

## 🖥️ System Administration

### **System Architecture Overview**

**Production Environment:**
- **Frontend**: React application served by Nginx
- **Backend**: Node.js Express application
- **Database**: PostgreSQL 15 in Docker container
- **Authentication**: JWT-based with Supabase integration
- **Network**: Internal corporate network deployment

**Container Structure:**
```
sales-dashboard-network
├── sales-dashboard-app (Node.js Backend)
├── sales-dashboard-frontend (React/Nginx)
└── sales-dashboard-db-dev (PostgreSQL)
```

### **System Access and Login**

**Administrator Dashboard Access:**
1. **SSH Access**: Connect to the server hosting the application
2. **Docker Access**: Use Docker commands to manage containers
3. **Database Access**: Direct PostgreSQL access for administration
4. **Application Access**: Web interface with admin privileges

**Server Access Commands:**
```bash
# SSH to application server
ssh admin@your-server.company.com

# Navigate to application directory
cd /opt/sales-dashboard

# Check system status
docker compose -f docker-compose.prod.yml ps
./scripts/health-check.sh
```

### **Container Management**

**Essential Docker Commands:**
```bash
# View all containers
docker ps -a

# Check container logs
docker logs sales-dashboard-app --tail 50
docker logs sales-dashboard-db-dev --tail 50

# Start/stop services
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down

# Restart specific service
docker compose -f docker-compose.prod.yml restart app

# Update containers
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

**Container Health Monitoring:**
```bash
# Check container resource usage
docker stats

# Inspect container configuration
docker inspect sales-dashboard-app

# Check container networks
docker network ls
docker network inspect sales-dashboard-dev-network
```

### **Environment Configuration**

**Critical Environment Variables (`/opt/sales-dashboard/server/.env`):**
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@sales-dashboard-db-dev:5432/sales_dashboard_dev
DB_HOST=sales-dashboard-db-dev
DB_PORT=5432
DB_NAME=sales_dashboard_dev
DB_USER=postgres
DB_PASSWORD=secure_password

# JWT Authentication (84+ characters required)
JWT_SECRET=your_84_character_production_jwt_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173

# Supabase Authentication
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Configuration Validation:**
```bash
# Check environment file exists
ls -la /opt/sales-dashboard/server/.env

# Validate JWT secret length
JWT_LENGTH=$(grep "JWT_SECRET=" /opt/sales-dashboard/server/.env | cut -d'=' -f2 | wc -c)
echo "JWT Secret Length: $JWT_LENGTH (minimum: 84)"

# Test database connection
docker exec sales-dashboard-db-dev pg_isready -U postgres
```

---

## 👥 User Management

### **User Account Administration**

**User Roles and Permissions:**
- **Admin**: Full system access, user management, configuration
- **Manager**: Customer and process management, reporting
- **User**: Standard access to customers, processes, documents
- **Viewer**: Read-only access to system data

### **Creating User Accounts**

**Via API (Recommended):**
```bash
# Create new user account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email": "newuser@company.com",
    "password": "SecurePassword123!",
    "role": "user",
    "name": "New User"
  }'
```

**Via Database (Advanced):**
```sql
-- Connect to database
docker exec -it sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

-- Create user (password should be hashed)
INSERT INTO users (email, password_hash, role, name, active, created_at) 
VALUES ('user@company.com', 'hashed_password', 'user', 'User Name', true, NOW());

-- Check user was created
SELECT id, email, role, active FROM users WHERE email = 'user@company.com';
```

### **User Role Management**

**Updating User Roles:**
```sql
-- Update user role
UPDATE users 
SET role = 'manager', updated_at = NOW() 
WHERE email = 'user@company.com';

-- View user roles
SELECT email, role, active, created_at FROM users ORDER BY created_at DESC;
```

**Deactivating Users:**
```sql
-- Deactivate user account
UPDATE users 
SET active = false, updated_at = NOW() 
WHERE email = 'user@company.com';

-- Reactivate user account
UPDATE users 
SET active = true, updated_at = NOW() 
WHERE email = 'user@company.com';
```

### **Password Management**

**Force Password Reset:**
```sql
-- Force password reset for user
UPDATE users 
SET password_reset_required = true, updated_at = NOW() 
WHERE email = 'user@company.com';

-- Reset failed login attempts
UPDATE users 
SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() 
WHERE email = 'user@company.com';
```

**Password Security Policies:**
- Minimum 8 characters
- Must include uppercase, lowercase, and numbers
- Special characters recommended
- Password history maintained (prevents reuse)
- Account lockout after 5 failed attempts

---

## 🔐 Security Administration

### **Authentication Security**

**JWT Token Management:**
```bash
# Check JWT configuration
grep "JWT_" /opt/sales-dashboard/server/.env

# Rotate JWT secret (requires application restart)
NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" /opt/sales-dashboard/server/.env
docker compose -f docker-compose.prod.yml restart app
```

**Authentication Monitoring:**
```bash
# Check recent authentication events
docker logs --since 24h sales-dashboard-app | grep -i auth

# Monitor failed login attempts
docker logs --since 1h sales-dashboard-app | grep -i "authentication.*fail"

# Check for suspicious activity
docker logs --since 1h sales-dashboard-app | grep -E "(brute|attack|suspicious)"
```

### **Access Control**

**Role-Based Access Control (RBAC):**
```sql
-- View role definitions
SELECT * FROM roles ORDER BY name;

-- View user role assignments
SELECT u.email, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email;

-- Add role to user
INSERT INTO user_roles (user_id, role_id) 
VALUES (
  (SELECT id FROM users WHERE email = 'user@company.com'),
  (SELECT id FROM roles WHERE name = 'manager')
);
```

**Session Management:**
```sql
-- View active sessions
SELECT 
  u.email,
  s.created_at,
  s.last_activity,
  s.ip_address
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.active = true
ORDER BY s.last_activity DESC;

-- Terminate user sessions
UPDATE user_sessions 
SET active = false, updated_at = NOW() 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.com');
```

### **Security Monitoring**

**Security Event Monitoring:**
```bash
# Run security monitoring script
/opt/scripts/monitor-security.sh

# Check for security alerts
tail -f /var/log/sales-dashboard/security-alerts.log

# Review authentication failures
grep "authentication.*fail" /var/log/sales-dashboard/*.log | tail -20
```

**Security Audit Checklist:**
- [ ] Review user accounts and permissions monthly
- [ ] Monitor failed login attempts daily
- [ ] Check for unauthorized access attempts
- [ ] Validate JWT token expiration settings
- [ ] Review database access logs
- [ ] Check for suspicious API usage patterns
- [ ] Verify backup security and encryption
- [ ] Audit file upload and download activities

---

## 💾 Data Management

### **Database Administration**

**Database Connection and Management:**
```bash
# Connect to database
docker exec -it sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

# Check database status
docker exec sales-dashboard-db-dev pg_isready -U postgres

# View database size
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT pg_size_pretty(pg_database_size('sales_dashboard_dev')) as database_size;"
```

**Database Maintenance:**
```sql
-- Database maintenance commands
VACUUM ANALYZE;  -- Clean up and update statistics
REINDEX DATABASE sales_dashboard_dev;  -- Rebuild indexes

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor database performance
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### **Data Import and Export**

**Data Export Procedures:**
```bash
# Complete database backup
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev > backup_$(date +%Y%m%d).sql

# Table-specific exports
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev -t customers > customers_backup.sql
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev -t processes > processes_backup.sql

# Data-only export (no schema)
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev --data-only > data_backup.sql
```

**Data Import Procedures:**
```bash
# Import complete database
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev < backup.sql

# Import specific table
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev < customers_backup.sql

# Import CSV data
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
COPY customers(name, email, phone, industry) 
FROM '/tmp/customers.csv' 
DELIMITER ',' CSV HEADER;"
```

### **Data Integrity Checks**

**Regular Data Validation:**
```sql
-- Check for orphaned records
SELECT 'Contacts without customers' as issue, COUNT(*) as count
FROM contacts c 
LEFT JOIN customers cu ON c.customer_id = cu.id 
WHERE cu.id IS NULL

UNION ALL

SELECT 'Processes without customers' as issue, COUNT(*) as count
FROM processes p 
LEFT JOIN customers cu ON p.customer_id = cu.id 
WHERE cu.id IS NULL;

-- Check data consistency
SELECT 
  'Total customers' as metric, 
  COUNT(*) as value 
FROM customers 
WHERE active = true

UNION ALL

SELECT 
  'Total processes' as metric, 
  COUNT(*) as value 
FROM processes

UNION ALL

SELECT 
  'Total documents' as metric, 
  COUNT(*) as value 
FROM documents;
```

---

## 📊 System Monitoring

### **Performance Monitoring**

**System Resource Monitoring:**
```bash
# System resource usage
htop  # Interactive process viewer
df -h  # Disk usage
free -h  # Memory usage

# Container resource monitoring
docker stats --no-stream

# Application performance
/opt/scripts/monitor-api-performance.sh
```

**Database Performance Monitoring:**
```bash
# Database performance script
/opt/scripts/monitor-database-performance.sh

# Connection monitoring
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity 
WHERE datname = 'sales_dashboard_dev';"
```

### **Application Monitoring**

**Health Check Monitoring:**
```bash
# Run comprehensive health check
/opt/scripts/health-check.sh

# API endpoint monitoring
curl -s http://localhost:3000/api/health | jq '.'

# Application log monitoring
tail -f /var/log/sales-dashboard/application.log | grep ERROR
```

**Log Analysis:**
```bash
# Application error analysis
docker logs --since 24h sales-dashboard-app | grep -E "(ERROR|Exception)" | tail -20

# Database error analysis
docker logs --since 24h sales-dashboard-db-dev | grep -E "(ERROR|FATAL)" | tail -10

# Performance analysis
docker logs --since 1h sales-dashboard-app | grep -i "slow" | tail -10
```

### **Automated Monitoring Setup**

**Monitoring Scripts Cron Jobs:**
```bash
# Edit cron jobs for monitoring
crontab -e

# Add monitoring jobs
*/5 * * * * /opt/scripts/health-check.sh > /dev/null 2>&1
*/10 * * * * /opt/scripts/monitor-api-performance.sh > /dev/null 2>&1
0 */6 * * * /opt/scripts/monitor-database-performance.sh > /dev/null 2>&1
0 8 * * * /opt/scripts/daily-health-check.sh
```

**Alert Configuration:**
```bash
# Configure performance alerts
/opt/scripts/alerts/performance-alerts.sh

# Configure security alerts
/opt/scripts/alerts/security-alerts.sh

# View alert logs
tail -f /var/log/sales-dashboard/alerts.log
```

---

## 💾 Backup and Recovery

### **Backup Procedures**

**Automated Daily Backups:**
```bash
# Daily backup script (runs via cron at 2 AM)
/opt/scripts/daily-backup.sh

# Manual backup execution
cd /opt/sales-dashboard
./scripts/daily-backup.sh

# Verify backup integrity
ls -la /opt/backups/sales-dashboard/
gunzip -t /opt/backups/sales-dashboard/database_$(date +%Y%m%d)*.sql.gz
```

**Backup Verification:**
```bash
# Check backup files
ls -la /opt/backups/sales-dashboard/ | tail -10

# Verify backup integrity
for backup in /opt/backups/sales-dashboard/database_*.sql.gz; do
  echo "Checking $backup..."
  gunzip -t "$backup" && echo "✅ Valid" || echo "❌ Corrupted"
done

# Check backup size trends
du -h /opt/backups/sales-dashboard/database_*.sql.gz | sort -k2
```

### **Recovery Procedures**

**Database Recovery Process:**
```bash
# 1. Stop application services
docker compose -f docker-compose.prod.yml stop app frontend

# 2. Create safety backup
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev > \
  "/opt/backups/sales-dashboard/safety_backup_$(date +%Y%m%d_%H%M%S).sql"

# 3. Restore from backup
BACKUP_FILE="/opt/backups/sales-dashboard/database_20250715_020000.sql.gz"
gunzip -c "$BACKUP_FILE" | \
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

# 4. Restart services
docker compose -f docker-compose.prod.yml start app frontend

# 5. Verify recovery
curl -s http://localhost:3000/api/health
```

**Point-in-Time Recovery:**
```bash
# Recovery to specific backup
/opt/scripts/recover-database.sh 20250715_020000

# Emergency complete system recovery
/opt/scripts/emergency-recovery.sh 20250715_020000
```

### **Backup Monitoring**

**Backup Health Checks:**
```bash
# Check backup freshness
LATEST_BACKUP=$(ls -t /opt/backups/sales-dashboard/database_*.sql.gz | head -1)
BACKUP_AGE=$(stat -c %Y "$LATEST_BACKUP")
CURRENT_TIME=$(date +%s)
AGE_HOURS=$(( (CURRENT_TIME - BACKUP_AGE) / 3600 ))

if [ $AGE_HOURS -gt 48 ]; then
  echo "⚠️ Backup is $AGE_HOURS hours old (threshold: 48 hours)"
else
  echo "✅ Backup is current ($AGE_HOURS hours old)"
fi
```

---

## ⚡ Performance Management

### **Performance Optimization**

**Database Performance Tuning:**
```sql
-- Analyze query performance
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time,
  stddev_exec_time
FROM pg_stat_statements 
WHERE calls > 100 
ORDER BY mean_exec_time DESC 
LIMIT 20;

-- Index usage analysis
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;

-- Table statistics update
ANALYZE;
```

**Application Performance Tuning:**
```bash
# Monitor API response times
for endpoint in "/api/health" "/api/customers" "/api/processes"; do
  echo -n "$endpoint: "
  curl -s -w "%{time_total}s\n" -o /dev/null http://localhost:3000$endpoint
done

# Container resource optimization
docker update --memory="1g" --cpus="1.0" sales-dashboard-app

# Check for memory leaks
docker stats --no-stream | grep sales-dashboard
```

### **Capacity Planning**

**Resource Usage Trends:**
```bash
# Disk usage trends
df -h / && echo "--- Historical growth ---"
du -h /opt/sales-dashboard/
du -h /opt/backups/sales-dashboard/

# Memory usage analysis
free -h && echo "--- Container memory ---"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Database growth analysis
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_live_tuples(c.oid) as live_tuples
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

---

## 🔧 Troubleshooting

### **Common Administrative Issues**

**Application Won't Start:**
```bash
# Diagnostic steps
docker ps -a | grep sales-dashboard
docker logs sales-dashboard-app --tail 50

# Common fixes
docker compose -f docker-compose.prod.yml restart
docker system prune -f
```

**Database Connection Issues:**
```bash
# Check database status
docker exec sales-dashboard-db-dev pg_isready -U postgres

# Test connectivity
docker exec sales-dashboard-app nc -zv sales-dashboard-db-dev 5432

# Reset connections
docker restart sales-dashboard-db-dev
sleep 30
docker restart sales-dashboard-app
```

**Performance Issues:**
```bash
# Resource analysis
docker stats --no-stream
df -h
free -h

# Database performance
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
  pid,
  state,
  query_start,
  substring(query, 1, 50) as query
FROM pg_stat_activity 
WHERE datname = 'sales_dashboard_dev' 
AND state = 'active';"
```

### **Log Analysis**

**Critical Log Locations:**
```bash
# Application logs
docker logs sales-dashboard-app
tail -f /var/log/sales-dashboard/application.log

# Database logs
docker logs sales-dashboard-db-dev
tail -f /var/log/sales-dashboard/database.log

# System logs
tail -f /var/log/sales-dashboard/system.log
journalctl -u docker.service -f
```

**Log Analysis Commands:**
```bash
# Error pattern analysis
docker logs --since 24h sales-dashboard-app | grep -E "(ERROR|Exception|FATAL)" | sort | uniq -c

# Performance pattern analysis
docker logs --since 1h sales-dashboard-app | grep -i "slow\|timeout\|performance" | tail -10

# Security pattern analysis
docker logs --since 24h sales-dashboard-app | grep -E "(auth|login|fail|unauthorized)" | tail -20
```

---

## 🛡️ Security Best Practices

### **Administrative Security**

**Access Control:**
- Use strong, unique passwords for all administrative accounts
- Enable two-factor authentication where possible
- Limit administrative access to necessary personnel only
- Regularly review and audit administrative access logs
- Use SSH key-based authentication for server access

**System Hardening:**
```bash
# Update system packages regularly
apt update && apt upgrade -y

# Configure firewall rules
ufw enable
ufw allow 22/tcp  # SSH
ufw allow 3000/tcp  # Application
ufw allow 5173/tcp  # Frontend

# Secure Docker daemon
systemctl enable docker
usermod -aG docker admin  # Add admin user to docker group
```

### **Data Protection**

**Encryption and Security:**
- Ensure backups are stored securely
- Use encrypted communication channels
- Regularly rotate JWT secrets
- Monitor for data access anomalies
- Implement data retention policies

**Compliance Monitoring:**
```bash
# Generate security audit report
/opt/scripts/monthly-security-audit.sh

# Review user access patterns
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
  u.email,
  COUNT(al.id) as login_count,
  MAX(al.created_at) as last_login
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id AND al.action = 'login'
WHERE u.active = true
GROUP BY u.id, u.email
ORDER BY login_count DESC;"
```

### **Incident Response**

**Security Incident Checklist:**
1. **Immediate Response:**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team

2. **Analysis:**
   - Review access logs
   - Identify scope of incident
   - Document timeline

3. **Containment:**
   - Block malicious access
   - Reset compromised credentials
   - Apply security patches

4. **Recovery:**
   - Restore from clean backups
   - Verify system integrity
   - Monitor for reoccurrence

5. **Documentation:**
   - Document incident details
   - Update security procedures
   - Conduct post-incident review

---

*This administrator training guide provides comprehensive information for managing the DM_CRM Sales Dashboard in production. Regular review and updates ensure effective system administration and security.*