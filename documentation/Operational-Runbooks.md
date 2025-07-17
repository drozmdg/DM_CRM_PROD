# DM_CRM Sales Dashboard - Operational Runbooks

**Document Version:** 1.0  
**Date:** July 17, 2025  
**Environment:** Internal Docker Production Deployment  
**Target Audience:** IT Operations Team  

---

## 📋 Table of Contents

1. [Daily Operations](#daily-operations)
2. [Startup and Shutdown Procedures](#startup-and-shutdown-procedures)
3. [Monitoring and Health Checks](#monitoring-and-health-checks)
4. [Backup and Recovery](#backup-and-recovery)
5. [Incident Response](#incident-response)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Emergency Procedures](#emergency-procedures)

---

## 🌅 Daily Operations

### **Morning Health Check Routine**

**Frequency:** Daily at 8:00 AM  
**Duration:** 10-15 minutes  
**Responsibility:** IT Operations Team  

```bash
#!/bin/bash
# Daily Health Check Script
# Location: /opt/scripts/daily-health-check.sh

echo "=== DM_CRM Daily Health Check - $(date) ==="

# 1. Check container status
echo "1. Checking container status..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml ps

# 2. Test application endpoints
echo "2. Testing application endpoints..."
curl -s http://localhost:3000/api/health || echo "❌ Backend health check failed"
curl -s http://localhost:5173 | grep -q "DM_CRM" && echo "✅ Frontend accessible" || echo "❌ Frontend check failed"

# 3. Database connectivity
echo "3. Testing database connectivity..."
docker exec sales-dashboard-db-dev pg_isready -U postgres && echo "✅ Database responsive" || echo "❌ Database check failed"

# 4. Resource usage check
echo "4. Checking resource usage..."
docker stats --no-stream | head -5

# 5. Disk space check
echo "5. Checking disk space..."
df -h / | tail -1
df -h /opt/backups | tail -1

# 6. Check for recent errors
echo "6. Checking for recent errors..."
docker logs --since 24h sales-dashboard-app | grep -i error | tail -5

echo "=== Health Check Complete ==="
```

### **Log Review Procedures**

**Application Error Monitoring:**
```bash
# Check for application errors in last 24 hours
docker logs --since 24h sales-dashboard-app | grep -E "(ERROR|FATAL|Exception)" | tail -20

# Check for database errors
docker logs --since 24h sales-dashboard-db-dev | grep -E "(ERROR|FATAL)" | tail -10

# Check authentication failures
docker logs --since 24h sales-dashboard-app | grep -i "auth.*fail" | tail -10
```

**Performance Monitoring:**
```bash
# Monitor response times
docker exec sales-dashboard-app npm run performance-check

# Database performance
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 500 
ORDER BY mean_exec_time DESC 
LIMIT 10;"
```

---

## 🚀 Startup and Shutdown Procedures

### **System Startup Procedure**

**Use Case:** Server reboot, maintenance completion, disaster recovery  
**Estimated Time:** 5-10 minutes  

```bash
#!/bin/bash
# System Startup Script
# Location: /opt/scripts/startup-system.sh

echo "=== Starting DM_CRM Sales Dashboard ==="

# 1. Navigate to application directory
cd /opt/sales-dashboard

# 2. Check environment configuration
echo "1. Verifying environment configuration..."
if [ ! -f "server/.env" ]; then
    echo "❌ Environment file not found!"
    exit 1
fi

# 3. Start database first
echo "2. Starting database..."
docker compose -f docker-compose.prod.yml up -d db
sleep 30  # Wait for database initialization

# 4. Verify database is ready
echo "3. Verifying database readiness..."
timeout 60 bash -c 'until docker exec sales-dashboard-db-dev pg_isready -U postgres; do sleep 2; done'

# 5. Start application services
echo "4. Starting application services..."
docker compose -f docker-compose.prod.yml up -d

# 6. Wait for services to be ready
echo "5. Waiting for services to be ready..."
sleep 45

# 7. Verify all services are running
echo "6. Verifying service status..."
docker compose -f docker-compose.prod.yml ps

# 8. Health check
echo "7. Performing health check..."
./scripts/health-check.sh

echo "=== Startup Complete ==="
```

### **System Shutdown Procedure**

**Use Case:** Planned maintenance, server shutdown  
**Estimated Time:** 2-5 minutes  

```bash
#!/bin/bash
# System Shutdown Script
# Location: /opt/scripts/shutdown-system.sh

echo "=== Shutting Down DM_CRM Sales Dashboard ==="

# 1. Notify users (if notification system exists)
echo "1. Notifying active users..."
# curl -X POST http://localhost:3000/api/admin/notify-maintenance

# 2. Wait for active sessions to complete
echo "2. Waiting for active sessions to complete..."
sleep 30

# 3. Stop application services gracefully
echo "3. Stopping application services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml stop app frontend

# 4. Wait for connections to close
echo "4. Waiting for database connections to close..."
sleep 15

# 5. Stop database
echo "5. Stopping database..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml stop db

# 6. Verify all containers are stopped
echo "6. Verifying shutdown..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml ps

echo "=== Shutdown Complete ==="
```

---

## 📊 Monitoring and Health Checks

### **Automated Health Check Script**

```bash
#!/bin/bash
# Comprehensive Health Check Script
# Location: /opt/scripts/health-check.sh

HEALTH_STATUS=0
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=== DM_CRM Health Check - $TIMESTAMP ==="

# Function to log health check results
log_health() {
    echo "$TIMESTAMP - $1" >> /var/log/sales-dashboard/health.log
    echo "$1"
}

# 1. Container Health Check
check_containers() {
    echo "🐳 Checking Docker containers..."
    
    CONTAINERS=("sales-dashboard-app" "sales-dashboard-db-dev" "sales-dashboard-frontend")
    
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
            log_health "✅ Container $container is running"
        else
            log_health "❌ Container $container is not running"
            HEALTH_STATUS=1
        fi
    done
}

# 2. Application Health Check
check_application() {
    echo "🔍 Checking application health..."
    
    # Backend health
    if curl -s -f http://localhost:3000/api/health > /dev/null; then
        log_health "✅ Backend API is responding"
    else
        log_health "❌ Backend API is not responding"
        HEALTH_STATUS=1
    fi
    
    # Frontend health
    if curl -s http://localhost:5173 | grep -q "DM_CRM"; then
        log_health "✅ Frontend is accessible"
    else
        log_health "❌ Frontend is not accessible"
        HEALTH_STATUS=1
    fi
}

# 3. Database Health Check
check_database() {
    echo "💾 Checking database health..."
    
    # Database connectivity
    if docker exec sales-dashboard-db-dev pg_isready -U postgres > /dev/null 2>&1; then
        log_health "✅ Database is responsive"
        
        # Check database size and connections
        DB_SIZE=$(docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -t -c "SELECT pg_size_pretty(pg_database_size('sales_dashboard_dev'));" | xargs)
        DB_CONNECTIONS=$(docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='sales_dashboard_dev';" | xargs)
        
        log_health "📊 Database size: $DB_SIZE, Active connections: $DB_CONNECTIONS"
    else
        log_health "❌ Database is not responsive"
        HEALTH_STATUS=1
    fi
}

# 4. Resource Usage Check
check_resources() {
    echo "📈 Checking resource usage..."
    
    # Memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log_health "📊 Memory usage: ${MEMORY_USAGE}%"
    
    # Disk usage
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    log_health "📊 Disk usage: ${DISK_USAGE}%"
    
    if [ "$DISK_USAGE" -gt 85 ]; then
        log_health "⚠️  High disk usage detected: ${DISK_USAGE}%"
        HEALTH_STATUS=1
    fi
    
    # Container resource usage
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -4
}

# 5. Security Check
check_security() {
    echo "🔐 Checking security status..."
    
    # Check for failed login attempts
    FAILED_LOGINS=$(docker logs --since 1h sales-dashboard-app | grep -c "authentication failed" || echo "0")
    log_health "🔒 Failed login attempts (last hour): $FAILED_LOGINS"
    
    if [ "$FAILED_LOGINS" -gt 10 ]; then
        log_health "⚠️  High number of failed login attempts detected"
        HEALTH_STATUS=1
    fi
}

# Execute all checks
check_containers
check_application
check_database
check_resources
check_security

# Overall health status
if [ $HEALTH_STATUS -eq 0 ]; then
    log_health "🎉 Overall health status: HEALTHY"
    exit 0
else
    log_health "🚨 Overall health status: UNHEALTHY"
    exit 1
fi
```

### **Performance Monitoring Script**

```bash
#!/bin/bash
# Performance Monitoring Script
# Location: /opt/scripts/performance-monitor.sh

echo "=== Performance Monitoring Report - $(date) ==="

# Database performance
echo "📊 Database Performance:"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 5;"

# Container resource usage
echo "🐳 Container Resource Usage:"
docker stats --no-stream

# Response time check
echo "⏱️  API Response Times:"
for endpoint in "/api/health" "/api/customers" "/api/processes"; do
    response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000$endpoint)
    echo "  $endpoint: ${response_time}s"
done
```

---

## 💾 Backup and Recovery

### **Daily Backup Procedure**

```bash
#!/bin/bash
# Daily Backup Script
# Location: /opt/scripts/daily-backup.sh
# Schedule: Daily at 2:00 AM via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/sales-dashboard"
APP_DIR="/opt/sales-dashboard"

echo "=== Starting Daily Backup - $DATE ==="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Database backup
echo "1. Creating database backup..."
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev > "$BACKUP_DIR/database_$DATE.sql"

if [ $? -eq 0 ]; then
    gzip "$BACKUP_DIR/database_$DATE.sql"
    echo "✅ Database backup completed: database_$DATE.sql.gz"
else
    echo "❌ Database backup failed"
    exit 1
fi

# 2. Configuration backup
echo "2. Creating configuration backup..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    "$APP_DIR/server/.env" \
    "$APP_DIR/docker-compose.prod.yml" \
    "$APP_DIR/nginx.conf" 2>/dev/null

echo "✅ Configuration backup completed: config_$DATE.tar.gz"

# 3. Application logs backup
echo "3. Backing up application logs..."
docker logs sales-dashboard-app > "$BACKUP_DIR/app_logs_$DATE.log"
docker logs sales-dashboard-db-dev > "$BACKUP_DIR/db_logs_$DATE.log"
gzip "$BACKUP_DIR"/*logs_$DATE.log

echo "✅ Log backup completed"

# 4. Cleanup old backups (keep 30 days)
echo "4. Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

# 5. Backup verification
echo "5. Verifying backup integrity..."
if [ -f "$BACKUP_DIR/database_$DATE.sql.gz" ]; then
    gunzip -t "$BACKUP_DIR/database_$DATE.sql.gz"
    if [ $? -eq 0 ]; then
        echo "✅ Database backup integrity verified"
    else
        echo "❌ Database backup integrity check failed"
        exit 1
    fi
fi

echo "=== Daily Backup Complete - $DATE ==="
```

### **Recovery Procedures**

**Database Recovery:**
```bash
#!/bin/bash
# Database Recovery Script
# Location: /opt/scripts/recover-database.sh
# Usage: ./recover-database.sh BACKUP_DATE

BACKUP_DATE=$1
BACKUP_DIR="/opt/backups/sales-dashboard"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 BACKUP_DATE (format: YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "=== Starting Database Recovery - $BACKUP_DATE ==="

# 1. Stop application
echo "1. Stopping application services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml stop app frontend

# 2. Create current database backup
echo "2. Creating safety backup of current database..."
SAFETY_DATE=$(date +%Y%m%d_%H%M%S)
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev > "$BACKUP_DIR/safety_backup_$SAFETY_DATE.sql"

# 3. Drop and recreate database
echo "3. Recreating database..."
docker exec sales-dashboard-db-dev psql -U postgres -c "DROP DATABASE IF EXISTS sales_dashboard_dev;"
docker exec sales-dashboard-db-dev psql -U postgres -c "CREATE DATABASE sales_dashboard_dev;"

# 4. Restore from backup
echo "4. Restoring database from backup..."
if [ -f "$BACKUP_DIR/database_$BACKUP_DATE.sql.gz" ]; then
    gunzip -c "$BACKUP_DIR/database_$BACKUP_DATE.sql.gz" | \
    docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev
else
    echo "❌ Backup file not found: database_$BACKUP_DATE.sql.gz"
    exit 1
fi

# 5. Verify recovery
echo "5. Verifying database recovery..."
RECORD_COUNT=$(docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -t -c "SELECT COUNT(*) FROM customers;" | xargs)
echo "Customer records restored: $RECORD_COUNT"

# 6. Restart application
echo "6. Restarting application services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d

echo "=== Database Recovery Complete ==="
```

---

## 🚨 Incident Response

### **Critical Incident Response (P1)**

**Definition:** Complete system outage, data corruption, security breach  
**Response Time:** Immediate (< 15 minutes)  

```bash
#!/bin/bash
# Critical Incident Response Script
# Location: /opt/scripts/critical-incident-response.sh

INCIDENT_ID="INC_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/var/log/sales-dashboard/incidents/$INCIDENT_ID.log"

echo "=== CRITICAL INCIDENT RESPONSE - $INCIDENT_ID ===" | tee -a "$LOG_FILE"

# 1. Immediate assessment
echo "1. Performing immediate system assessment..." | tee -a "$LOG_FILE"
./scripts/health-check.sh >> "$LOG_FILE" 2>&1

# 2. Collect diagnostic information
echo "2. Collecting diagnostic information..." | tee -a "$LOG_FILE"
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml ps >> "$LOG_FILE"
docker logs --tail 50 sales-dashboard-app >> "$LOG_FILE" 2>&1
docker logs --tail 50 sales-dashboard-db-dev >> "$LOG_FILE" 2>&1

# 3. Attempt automatic recovery
echo "3. Attempting automatic recovery..." | tee -a "$LOG_FILE"
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml restart

# 4. Wait and recheck
sleep 60
echo "4. Post-recovery health check..." | tee -a "$LOG_FILE"
./scripts/health-check.sh >> "$LOG_FILE" 2>&1

# 5. Notify stakeholders
echo "5. Notifying stakeholders..." | tee -a "$LOG_FILE"
# Send notification (email, Slack, etc.)

echo "=== INCIDENT RESPONSE COMPLETE - $INCIDENT_ID ===" | tee -a "$LOG_FILE"
```

### **Performance Issue Response (P2)**

**Definition:** Slow response times, high resource usage  
**Response Time:** < 4 hours  

```bash
#!/bin/bash
# Performance Issue Response Script
# Location: /opt/scripts/performance-incident-response.sh

echo "=== Performance Issue Investigation ==="

# 1. Resource usage analysis
echo "1. Analyzing resource usage..."
docker stats --no-stream

# 2. Database performance analysis
echo "2. Analyzing database performance..."
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT query, mean_exec_time, calls, total_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY total_exec_time DESC 
LIMIT 10;"

# 3. Application performance analysis
echo "3. Checking application response times..."
for endpoint in "/api/health" "/api/customers" "/api/processes"; do
    response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000$endpoint)
    echo "  $endpoint: ${response_time}s"
done

# 4. Log analysis for errors
echo "4. Analyzing recent errors..."
docker logs --since 1h sales-dashboard-app | grep -E "(ERROR|Exception)" | tail -10

# 5. Recommend actions
echo "5. Recommended actions:"
echo "  - Review slow database queries"
echo "  - Consider container resource limits"
echo "  - Check for memory leaks"
echo "  - Analyze application bottlenecks"
```

---

## 🔧 Maintenance Procedures

### **Weekly Maintenance Routine**

```bash
#!/bin/bash
# Weekly Maintenance Script
# Location: /opt/scripts/weekly-maintenance.sh
# Schedule: Sundays at 3:00 AM

echo "=== Weekly Maintenance - $(date) ==="

# 1. Update container images
echo "1. Updating container images..."
cd /opt/sales-dashboard
docker compose -f docker-compose.prod.yml pull

# 2. Database maintenance
echo "2. Performing database maintenance..."
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "VACUUM ANALYZE;"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "REINDEX DATABASE sales_dashboard_dev;"

# 3. Clean up system resources
echo "3. Cleaning up system resources..."
docker system prune -f
docker volume prune -f

# 4. Rotate logs
echo "4. Rotating logs..."
logrotate /etc/logrotate.d/sales-dashboard

# 5. Security updates
echo "5. Checking for security updates..."
apt list --upgradable | grep -i security

# 6. Backup verification
echo "6. Verifying recent backups..."
ls -la /opt/backups/sales-dashboard/ | tail -7

# 7. Performance report
echo "7. Generating performance report..."
./scripts/performance-monitor.sh > "/var/log/sales-dashboard/performance_$(date +%Y%m%d).log"

echo "=== Weekly Maintenance Complete ==="
```

### **Monthly Security Audit**

```bash
#!/bin/bash
# Monthly Security Audit Script
# Location: /opt/scripts/monthly-security-audit.sh

echo "=== Monthly Security Audit - $(date) ==="

# 1. Container security scan
echo "1. Scanning container security..."
docker scan sales-dashboard-app || echo "Docker scan not available"

# 2. Check for security updates
echo "2. Checking for security updates..."
apt list --upgradable | grep -i security

# 3. Review authentication logs
echo "3. Reviewing authentication logs..."
docker logs --since 720h sales-dashboard-app | grep -E "(auth|login)" | grep -i fail | tail -20

# 4. Database security check
echo "4. Checking database security..."
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';"

# 5. File permission audit
echo "5. Auditing file permissions..."
find /opt/sales-dashboard -type f -name "*.env" -exec ls -la {} \;

# 6. Network security check
echo "6. Checking network security..."
netstat -tulpn | grep :5432
netstat -tulpn | grep :3000

echo "=== Security Audit Complete ==="
```

---

## 🚑 Emergency Procedures

### **Complete System Recovery**

**Scenario:** Total system failure, corruption, or security incident  

```bash
#!/bin/bash
# Emergency System Recovery Script
# Location: /opt/scripts/emergency-recovery.sh

echo "=== EMERGENCY SYSTEM RECOVERY ==="
echo "WARNING: This will restore the system from backup!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Recovery cancelled"
    exit 1
fi

BACKUP_DATE=$1
if [ -z "$BACKUP_DATE" ]; then
    echo "Latest available backups:"
    ls -la /opt/backups/sales-dashboard/database_*.sql.gz | tail -5
    read -p "Enter backup date (YYYYMMDD_HHMMSS): " BACKUP_DATE
fi

echo "=== Starting Emergency Recovery ==="

# 1. Stop all services
echo "1. Stopping all services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml down

# 2. Backup current state (if possible)
echo "2. Creating emergency backup of current state..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d db
sleep 30
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev > "/opt/backups/sales-dashboard/emergency_backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml down

# 3. Clean up containers and volumes
echo "3. Cleaning up containers and volumes..."
docker system prune -a -f --volumes

# 4. Restore configuration
echo "4. Restoring configuration..."
if [ -f "/opt/backups/sales-dashboard/config_$BACKUP_DATE.tar.gz" ]; then
    cd /opt/sales-dashboard
    tar -xzf "/opt/backups/sales-dashboard/config_$BACKUP_DATE.tar.gz" --strip-components=3
fi

# 5. Restart database
echo "5. Restarting database..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d db
sleep 30

# 6. Restore database
echo "6. Restoring database..."
gunzip -c "/opt/backups/sales-dashboard/database_$BACKUP_DATE.sql.gz" | \
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

# 7. Start all services
echo "7. Starting all services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d

# 8. Verify recovery
echo "8. Verifying recovery..."
sleep 60
./scripts/health-check.sh

echo "=== Emergency Recovery Complete ==="
```

### **Security Incident Response**

```bash
#!/bin/bash
# Security Incident Response Script
# Location: /opt/scripts/security-incident-response.sh

INCIDENT_TYPE=$1
INCIDENT_ID="SEC_$(date +%Y%m%d_%H%M%S)"

echo "=== SECURITY INCIDENT RESPONSE - $INCIDENT_ID ==="

case "$INCIDENT_TYPE" in
    "breach")
        echo "1. Isolating system..."
        # Disable external access
        iptables -A INPUT -p tcp --dport 3000 -j DROP
        iptables -A INPUT -p tcp --dport 5173 -j DROP
        
        echo "2. Preserving evidence..."
        # Capture logs
        docker logs sales-dashboard-app > "/var/log/sales-dashboard/security/$INCIDENT_ID-app.log"
        docker logs sales-dashboard-db-dev > "/var/log/sales-dashboard/security/$INCIDENT_ID-db.log"
        ;;
    
    "malware")
        echo "1. Stopping services..."
        docker compose -f /opt/sales-dashboard/docker-compose.prod.yml down
        
        echo "2. Scanning system..."
        # Run malware scan
        clamscan -r /opt/sales-dashboard
        ;;
    
    "unauthorized-access")
        echo "1. Reviewing access logs..."
        docker logs sales-dashboard-app | grep -E "(auth|login)" | grep -i fail
        
        echo "2. Forcing password reset for all users..."
        # Force password reset in database
        docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
        UPDATE users SET password_reset_required = true, updated_at = NOW();"
        ;;
esac

echo "=== Security incident response complete ==="
echo "Incident ID: $INCIDENT_ID"
echo "Next steps: Contact security team and document incident"
```

---

## 📞 Contact Information and Escalation

### **On-Call Contacts**

**Primary On-Call (IT Operations):**
- Name: [Primary IT Contact]
- Phone: [Phone Number]
- Email: [Email Address]
- Hours: 24/7

**Secondary On-Call (Development Team):**
- Name: [Development Team Lead]
- Phone: [Phone Number]
- Email: [Email Address]
- Hours: Business hours + emergency escalation

**Database Administrator:**
- Name: [DBA Contact]
- Phone: [Phone Number]
- Email: [Email Address]
- Specialization: PostgreSQL, backup recovery

### **Escalation Matrix**

| Severity | Response Time | Contact | Escalation |
|----------|---------------|---------|------------|
| P1 - Critical | < 15 minutes | Primary On-Call | After 30 min: Secondary + Management |
| P2 - High | < 4 hours | Primary On-Call | After 8 hours: Secondary |
| P3 - Medium | < 24 hours | IT Operations | After 48 hours: Team Lead |
| P4 - Low | < 72 hours | IT Operations | Normal business process |

---

*These operational runbooks provide comprehensive procedures for managing the DM_CRM Sales Dashboard in production. Regular review and updates should be performed to ensure accuracy and effectiveness.*