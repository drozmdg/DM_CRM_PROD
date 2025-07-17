# DM_CRM Sales Dashboard - Troubleshooting Guide

**Document Version:** 1.0  
**Date:** July 17, 2025  
**Environment:** Internal Docker Production Deployment  
**Target Audience:** IT Support and Operations Teams  

---

## 📋 Table of Contents

1. [Quick Troubleshooting Checklist](#quick-troubleshooting-checklist)
2. [Application Issues](#application-issues)
3. [Database Issues](#database-issues)
4. [Authentication Problems](#authentication-problems)
5. [Performance Issues](#performance-issues)
6. [Container Issues](#container-issues)
7. [Network and Connectivity](#network-and-connectivity)
8. [Security Issues](#security-issues)
9. [Recovery Procedures](#recovery-procedures)
10. [Emergency Contacts](#emergency-contacts)

---

## ⚡ Quick Troubleshooting Checklist

### **First Response (2-3 minutes)**

When users report issues, start with these quick checks:

```bash
# 1. Quick system status
docker ps | grep sales-dashboard

# 2. Basic connectivity test
curl -s http://localhost:3000/api/health
curl -s http://localhost:5173

# 3. Check recent errors
docker logs --tail 20 sales-dashboard-app | grep -i error

# 4. Resource check
df -h / && free -h
```

### **Common Issues Quick Fix**

| Problem | Quick Solution | Time |
|---------|---------------|------|
| "Site won't load" | `docker compose restart` | 2 min |
| "Login not working" | Check database connectivity | 1 min |
| "Slow performance" | Check resource usage | 1 min |
| "Database errors" | Restart database container | 3 min |
| "Container stopped" | Check logs and restart | 2 min |

---

## 🖥️ Application Issues

### **Issue: Application Won't Start**

**Symptoms:**
- Website not accessible on port 3000 or 5173
- "Connection refused" errors
- Container not running

**Diagnosis Steps:**
```bash
# 1. Check container status
docker ps | grep sales-dashboard
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml ps

# 2. Check container logs
docker logs sales-dashboard-app --tail 50

# 3. Check environment configuration
cat /opt/sales-dashboard/server/.env | grep -E "(JWT_SECRET|NODE_ENV|PORT)"

# 4. Check file permissions
ls -la /opt/sales-dashboard/server/.env
```

**Common Causes & Solutions:**

**Missing Environment File:**
```bash
# Check if .env file exists
if [ ! -f "/opt/sales-dashboard/server/.env" ]; then
    echo "Missing .env file - copy from backup or template"
    cp /opt/backups/sales-dashboard/config_*.tar.gz /tmp/
    cd /tmp && tar -xzf config_*.tar.gz
    cp opt/sales-dashboard/server/.env /opt/sales-dashboard/server/
fi
```

**JWT Secret Issues:**
```bash
# Verify JWT secret length (should be 84+ characters)
JWT_LENGTH=$(grep "JWT_SECRET=" /opt/sales-dashboard/server/.env | cut -d'=' -f2 | wc -c)
if [ "$JWT_LENGTH" -lt 84 ]; then
    echo "JWT secret too short: $JWT_LENGTH characters"
    echo "Generate new JWT secret with: openssl rand -base64 64"
fi
```

**Port Conflicts:**
```bash
# Check if ports are already in use
netstat -tulpn | grep -E ":3000|:5173"

# If ports are in use, stop conflicting services or change ports
```

### **Issue: Application Crashes Repeatedly**

**Symptoms:**
- Container keeps restarting
- Application exits with error codes
- Memory or resource exhaustion

**Diagnosis Steps:**
```bash
# 1. Check container restart count
docker ps -a | grep sales-dashboard-app

# 2. Check system resources
free -h
df -h

# 3. Analyze crash logs
docker logs sales-dashboard-app | grep -E "(Error|Exception|FATAL)"

# 4. Check for memory leaks
docker stats --no-stream sales-dashboard-app
```

**Solutions:**

**Memory Issues:**
```bash
# Increase container memory limit
docker update --memory="2g" sales-dashboard-app

# Or restart with more memory in docker-compose.yml
# Add under services.app:
#   deploy:
#     resources:
#       limits:
#         memory: 2g
```

**Database Connection Issues:**
```bash
# Check database connectivity from app container
docker exec sales-dashboard-app npm run db:test

# If connection fails, check database container
docker exec sales-dashboard-db-dev pg_isready -U postgres
```

---

## 💾 Database Issues

### **Issue: Database Connection Failed**

**Symptoms:**
- "Database connection refused" errors
- Application can't start due to DB issues
- "Connection timeout" messages

**Diagnosis Steps:**
```bash
# 1. Check database container status
docker ps | grep sales-dashboard-db-dev

# 2. Test database connectivity
docker exec sales-dashboard-db-dev pg_isready -U postgres

# 3. Check database logs
docker logs sales-dashboard-db-dev --tail 50

# 4. Test connection from application
docker exec sales-dashboard-app psql -h sales-dashboard-db-dev -U postgres -d sales_dashboard_dev -c "SELECT 1"
```

**Common Solutions:**

**Database Container Not Running:**
```bash
# Start database container
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d db

# Wait for startup (30 seconds)
sleep 30

# Verify startup
docker exec sales-dashboard-db-dev pg_isready -U postgres
```

**Connection Configuration Issues:**
```bash
# Check connection parameters in .env
grep -E "(DB_HOST|DB_PORT|DB_USER|DB_PASSWORD)" /opt/sales-dashboard/server/.env

# Test connection with parameters from .env
source /opt/sales-dashboard/server/.env
docker exec sales-dashboard-db-dev psql -h localhost -p 5432 -U postgres -d sales_dashboard_dev -c "SELECT version()"
```

### **Issue: Database Performance Problems**

**Symptoms:**
- Slow query response times
- Application timeouts
- High CPU usage on database container

**Diagnosis Steps:**
```bash
# 1. Check active connections
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname='sales_dashboard_dev' AND state='active';"

# 2. Identify slow queries
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC 
LIMIT 10;" 2>/dev/null || echo "pg_stat_statements not available"

# 3. Check for locks
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT count(*) as blocked_queries 
FROM pg_locks 
WHERE NOT granted;"

# 4. Database size check
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT pg_size_pretty(pg_database_size('sales_dashboard_dev')) as db_size;"
```

**Solutions:**

**Too Many Connections:**
```bash
# Kill idle connections
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'sales_dashboard_dev' 
AND state = 'idle' 
AND query_start < now() - interval '1 hour';"
```

**Database Maintenance:**
```bash
# Run vacuum and analyze
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "VACUUM ANALYZE;"

# Reindex if needed
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "REINDEX DATABASE sales_dashboard_dev;"
```

---

## 🔐 Authentication Problems

### **Issue: Users Cannot Login**

**Symptoms:**
- "Invalid credentials" errors for valid users
- Login page not loading
- Authentication timeouts

**Diagnosis Steps:**
```bash
# 1. Test authentication endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@company.com", "password": "password"}'

# 2. Check authentication logs
docker logs sales-dashboard-app | grep -i auth

# 3. Verify JWT configuration
grep "JWT_SECRET" /opt/sales-dashboard/server/.env

# 4. Test database user table
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "SELECT count(*) FROM users;"
```

**Common Solutions:**

**JWT Secret Issues:**
```bash
# Check JWT secret exists and is long enough
JWT_SECRET=$(grep "JWT_SECRET=" /opt/sales-dashboard/server/.env | cut -d'=' -f2)
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo "JWT secret too short, generating new one..."
    NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" /opt/sales-dashboard/server/.env
    docker compose -f /opt/sales-dashboard/docker-compose.prod.yml restart app
fi
```

**Database Authentication Issues:**
```bash
# Check if users table exists and has data
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT table_name FROM information_schema.tables WHERE table_name = 'users';"

# If users table is empty, you may need to restore from backup or create admin user
```

### **Issue: Authentication Keeps Failing**

**Symptoms:**
- High number of authentication failures
- Possible brute force attack
- Users locked out

**Diagnosis Steps:**
```bash
# 1. Check failure rate
docker logs --since 1h sales-dashboard-app | grep -i "authentication.*fail" | wc -l

# 2. Analyze failure patterns
docker logs --since 1h sales-dashboard-app | grep -i "authentication.*fail" | head -10

# 3. Check for rate limiting
docker logs --since 1h sales-dashboard-app | grep -i "rate.*limit"
```

**Solutions:**

**Temporary Security Lockdown:**
```bash
# If under attack, temporarily block external access
iptables -A INPUT -p tcp --dport 3000 -j DROP
iptables -A INPUT -p tcp --dport 5173 -j DROP

# Review and remove when threat is mitigated
iptables -D INPUT -p tcp --dport 3000 -j DROP
iptables -D INPUT -p tcp --dport 5173 -j DROP
```

---

## ⚡ Performance Issues

### **Issue: Slow Application Response**

**Symptoms:**
- Pages load slowly (>5 seconds)
- API timeouts
- High CPU/memory usage

**Diagnosis Steps:**
```bash
# 1. Test API response times
for endpoint in "/api/health" "/api/customers" "/api/processes"; do
    echo -n "$endpoint: "
    curl -s -w "%{time_total}s\n" -o /dev/null http://localhost:3000$endpoint
done

# 2. Check system resources
top -n 1 -b | head -20
free -h
df -h

# 3. Check container resources
docker stats --no-stream

# 4. Analyze database performance
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 5;" 2>/dev/null
```

**Solutions:**

**High Memory Usage:**
```bash
# Restart containers to clear memory
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml restart

# Monitor memory after restart
watch -n 5 'free -h && echo "---" && docker stats --no-stream'
```

**Slow Database Queries:**
```bash
# Analyze and optimize slow queries
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "VACUUM ANALYZE;"

# Check for missing indexes
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT schemaname, tablename, attname 
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_distinct > 100;"
```

### **Issue: High CPU Usage**

**Symptoms:**
- System sluggish
- High load averages
- Container CPU usage >80%

**Diagnosis Steps:**
```bash
# 1. Identify CPU-intensive processes
top -n 1 -b | head -20

# 2. Check container CPU usage
docker stats --no-stream | grep -E "(CONTAINER|sales-dashboard)"

# 3. Analyze database queries
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT query, calls, total_exec_time 
FROM pg_stat_statements 
ORDER BY total_exec_time DESC 
LIMIT 10;" 2>/dev/null
```

**Solutions:**

**Container Resource Limits:**
```bash
# Set CPU limits for containers
docker update --cpus="1.0" sales-dashboard-app
docker update --cpus="1.0" sales-dashboard-db-dev

# Monitor impact
docker stats --no-stream
```

---

## 🐳 Container Issues

### **Issue: Container Won't Start**

**Symptoms:**
- Container exits immediately
- "Container is unhealthy" status
- Exit codes (125, 126, 127)

**Diagnosis Steps:**
```bash
# 1. Check container exit status
docker ps -a | grep sales-dashboard

# 2. Check container logs
docker logs sales-dashboard-app --tail 50

# 3. Inspect container configuration
docker inspect sales-dashboard-app | grep -A 5 -B 5 "Error"

# 4. Check image integrity
docker images | grep sales-dashboard
```

**Solutions:**

**Image Corruption:**
```bash
# Rebuild containers
cd /opt/sales-dashboard
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

**Volume Issues:**
```bash
# Check volume mounts
docker inspect sales-dashboard-app | grep -A 10 "Mounts"

# Clean up volumes if needed
docker volume ls | grep sales-dashboard
docker volume prune -f
```

### **Issue: Container Resource Exhaustion**

**Symptoms:**
- Out of memory errors
- Container killed by system
- Performance degradation

**Diagnosis Steps:**
```bash
# 1. Check resource usage
docker stats --no-stream

# 2. Check system resources
free -h
df -h

# 3. Check container limits
docker inspect sales-dashboard-app | grep -A 5 "Memory"
```

**Solutions:**

**Increase Resource Limits:**
```bash
# Increase memory limit
docker update --memory="2g" --memory-swap="3g" sales-dashboard-app

# Restart container
docker restart sales-dashboard-app
```

---

## 🌐 Network and Connectivity

### **Issue: Cannot Access Application**

**Symptoms:**
- "Connection refused" from browsers
- Network timeouts
- Cannot reach application URLs

**Diagnosis Steps:**
```bash
# 1. Check if ports are listening
netstat -tulpn | grep -E ":3000|:5173"

# 2. Test local connectivity
curl -v http://localhost:3000/api/health
curl -v http://localhost:5173

# 3. Check firewall rules
iptables -L INPUT | grep -E "(3000|5173)"

# 4. Check container networking
docker network ls | grep sales-dashboard
docker inspect sales-dashboard-dev-network
```

**Solutions:**

**Port Binding Issues:**
```bash
# Check port bindings in docker-compose
grep -A 5 -B 5 "ports:" /opt/sales-dashboard/docker-compose.prod.yml

# Restart with explicit port binding
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml down
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d
```

**Firewall Configuration:**
```bash
# Allow application ports through firewall
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
iptables -A INPUT -p tcp --dport 5173 -j ACCEPT

# Save firewall rules (varies by distribution)
# Ubuntu: iptables-save > /etc/iptables/rules.v4
```

### **Issue: Internal Container Communication**

**Symptoms:**
- Application cannot connect to database
- Service discovery failures
- DNS resolution issues

**Diagnosis Steps:**
```bash
# 1. Check container network connectivity
docker exec sales-dashboard-app ping sales-dashboard-db-dev

# 2. Check DNS resolution
docker exec sales-dashboard-app nslookup sales-dashboard-db-dev

# 3. Test database connectivity from app
docker exec sales-dashboard-app nc -zv sales-dashboard-db-dev 5432
```

**Solutions:**

**Network Recreation:**
```bash
# Recreate container network
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml down
docker network prune -f
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d
```

---

## 🛡️ Security Issues

### **Issue: Suspected Security Breach**

**Symptoms:**
- Unusual authentication patterns
- High number of failed logins
- Suspicious database activity

**Immediate Response:**
```bash
# 1. Isolate system (if confirmed breach)
iptables -A INPUT -p tcp --dport 3000 -j DROP
iptables -A INPUT -p tcp --dport 5173 -j DROP

# 2. Preserve evidence
docker logs sales-dashboard-app > /tmp/security-incident-$(date +%Y%m%d).log
docker logs sales-dashboard-db-dev >> /tmp/security-incident-$(date +%Y%m%d).log

# 3. Analyze recent activity
docker logs --since 24h sales-dashboard-app | grep -E "(auth|login|fail)"

# 4. Force password reset for all users
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
UPDATE users SET password_reset_required = true, updated_at = NOW();"
```

### **Issue: Excessive Failed Login Attempts**

**Symptoms:**
- Brute force attack indicators
- Rate limiting triggers
- Authentication failures spike

**Diagnosis & Response:**
```bash
# 1. Count recent failures
docker logs --since 1h sales-dashboard-app | grep -i "authentication.*fail" | wc -l

# 2. Analyze attack patterns
docker logs --since 1h sales-dashboard-app | grep -i "authentication.*fail" | \
awk '{print $1}' | sort | uniq -c | sort -nr

# 3. Temporary rate limiting
# (This would typically be configured in the application)

# 4. Block suspicious IPs if patterns emerge
# iptables -A INPUT -s SUSPICIOUS_IP -j DROP
```

---

## 🚑 Recovery Procedures

### **Complete System Recovery**

**When to Use:** Total system failure, data corruption, major security incident

```bash
#!/bin/bash
# Emergency Recovery Procedure

echo "=== EMERGENCY RECOVERY PROCEDURE ==="
echo "This will restore the system from the latest backup"
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Recovery cancelled"
    exit 1
fi

# 1. Stop all services
echo "Stopping all services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml down

# 2. Find latest backup
LATEST_BACKUP=$(ls -t /opt/backups/sales-dashboard/database_*.sql.gz | head -1)
echo "Using backup: $LATEST_BACKUP"

# 3. Start database for recovery
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d db
sleep 30

# 4. Restore database
echo "Restoring database..."
gunzip -c "$LATEST_BACKUP" | \
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

# 5. Start all services
echo "Starting all services..."
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml up -d

# 6. Verify recovery
sleep 60
curl -s http://localhost:3000/api/health && echo "Recovery successful" || echo "Recovery verification failed"
```

### **Database-Only Recovery**

**When to Use:** Database corruption, data loss, need to restore specific data

```bash
#!/bin/bash
# Database Recovery Procedure

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Available backups:"
    ls -la /opt/backups/sales-dashboard/database_*.sql.gz | tail -5
    read -p "Enter full backup file path: " BACKUP_FILE
fi

echo "=== DATABASE RECOVERY ==="
echo "Backup file: $BACKUP_FILE"

# 1. Create safety backup
echo "Creating safety backup..."
docker exec sales-dashboard-db-dev pg_dump -U postgres -d sales_dashboard_dev > \
"/opt/backups/sales-dashboard/safety_$(date +%Y%m%d_%H%M%S).sql"

# 2. Stop application
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml stop app frontend

# 3. Restore database
echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | \
docker exec -i sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev

# 4. Restart application
docker compose -f /opt/sales-dashboard/docker-compose.prod.yml start app frontend

echo "Database recovery complete"
```

---

## 📞 Emergency Contacts

### **Escalation Matrix**

| Issue Severity | Response Time | Primary Contact | Escalation |
|---------------|---------------|-----------------|------------|
| **P1 - Critical** | < 15 minutes | IT Operations Lead | Development Team Lead |
| **P2 - High** | < 4 hours | IT Operations | Senior Developer |
| **P3 - Medium** | < 24 hours | IT Support | Team Lead |
| **P4 - Low** | < 72 hours | IT Support | Normal Process |

### **Contact Information**

**IT Operations (24/7):**
- Primary: [Phone] / [Email]
- Secondary: [Phone] / [Email]

**Development Team:**
- Team Lead: [Phone] / [Email]
- Senior Developer: [Phone] / [Email]

**Database Administrator:**
- DBA: [Phone] / [Email]

**Security Team:**
- Security Lead: [Phone] / [Email]

### **Information to Collect Before Calling**

1. **Issue Description:** What is not working?
2. **Error Messages:** Exact error text
3. **Affected Users:** How many users impacted?
4. **Timeline:** When did the issue start?
5. **Recent Changes:** Any recent deployments or changes?
6. **Logs:** Relevant log entries
7. **Attempted Fixes:** What has been tried already?

---

*This troubleshooting guide provides systematic approaches to resolving common issues with the DM_CRM Sales Dashboard. Keep this guide updated with new issues and solutions as they are discovered.*