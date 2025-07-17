# DM_CRM Sales Dashboard - Monitoring Procedures

**Document Version:** 1.0  
**Date:** July 17, 2025  
**Environment:** Internal Docker Production Deployment  
**Target Audience:** IT Operations and Development Teams  

---

## 📋 Table of Contents

1. [Monitoring Overview](#monitoring-overview)
2. [System Health Monitoring](#system-health-monitoring)
3. [Application Performance Monitoring](#application-performance-monitoring)
4. [Database Monitoring](#database-monitoring)
5. [Security Monitoring](#security-monitoring)
6. [Alert Configuration](#alert-configuration)
7. [Dashboards and Reporting](#dashboards-and-reporting)
8. [Automated Monitoring Scripts](#automated-monitoring-scripts)

---

## 🎯 Monitoring Overview

### **Monitoring Architecture**

The DM_CRM Sales Dashboard monitoring system provides comprehensive visibility into:

- **Infrastructure Health:** Docker containers, system resources
- **Application Performance:** API response times, user sessions
- **Database Performance:** Query performance, connection health
- **Security:** Authentication events, access patterns
- **Business Metrics:** User activity, system usage

### **Monitoring Stack**

- **Container Monitoring:** Docker native tools, container stats
- **Application Monitoring:** Custom health checks, API endpoint monitoring
- **Database Monitoring:** PostgreSQL performance views, query analysis
- **Log Management:** Docker logs, structured logging
- **Alerting:** Script-based alerts, log-based notifications

### **Key Performance Indicators (KPIs)**

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time | < 500ms | > 2000ms |
| Database Query Time | < 100ms | > 1000ms |
| System Uptime | 99.5% | < 95% |
| Container Memory Usage | < 80% | > 95% |
| Disk Space | < 80% | > 90% |
| Failed Authentication Rate | < 1% | > 5% |

---

## 🖥️ System Health Monitoring

### **Container Health Monitoring**

**Real-time Container Status:**
```bash
#!/bin/bash
# Container Health Monitor
# Location: /opt/scripts/monitor-containers.sh

echo "=== Container Health Status - $(date) ==="

# Get container status with health information
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Size}}"

echo -e "\n=== Detailed Container Stats ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

echo -e "\n=== Container Health Checks ==="
for container in sales-dashboard-app sales-dashboard-db-dev sales-dashboard-frontend; do
    if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
        echo "✅ $container: Running"
        
        # Check container logs for errors
        error_count=$(docker logs --since 1h "$container" 2>&1 | grep -i error | wc -l)
        if [ "$error_count" -gt 0 ]; then
            echo "⚠️  $container: $error_count errors in last hour"
        fi
    else
        echo "❌ $container: Not running"
    fi
done
```

**Container Resource Monitoring:**
```bash
#!/bin/bash
# Container Resource Monitor
# Location: /opt/scripts/monitor-resources.sh

# Function to check resource thresholds
check_resource_threshold() {
    local container=$1
    local metric=$2
    local value=$3
    local threshold=$4
    local unit=$5
    
    if (( $(echo "$value > $threshold" | bc -l) )); then
        echo "⚠️  ALERT: $container $metric is ${value}${unit} (threshold: ${threshold}${unit})"
        return 1
    else
        echo "✅ $container $metric: ${value}${unit}"
        return 0
    fi
}

echo "=== Resource Threshold Monitoring ==="

# Get container stats
docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemPerc}}" | while IFS=',' read -r container cpu_perc mem_perc; do
    # Remove % symbol for comparison
    cpu_value=${cpu_perc%\%}
    mem_value=${mem_perc%\%}
    
    echo "--- $container ---"
    check_resource_threshold "$container" "CPU" "$cpu_value" "80" "%"
    check_resource_threshold "$container" "Memory" "$mem_value" "80" "%"
done
```

### **System Resource Monitoring**

**System Health Check:**
```bash
#!/bin/bash
# System Health Monitor
# Location: /opt/scripts/monitor-system.sh

echo "=== System Health Monitoring - $(date) ==="

# 1. Memory Usage
echo "📊 Memory Usage:"
free -h | grep -E "(Mem|Swap)"
memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
if (( $(echo "$memory_usage > 85" | bc -l) )); then
    echo "⚠️  HIGH MEMORY USAGE: ${memory_usage}%"
fi

# 2. Disk Usage
echo -e "\n💾 Disk Usage:"
df -h | grep -E "(/$|/opt)"
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 85 ]; then
    echo "⚠️  HIGH DISK USAGE: ${disk_usage}%"
fi

# 3. CPU Load
echo -e "\n⚡ CPU Load:"
uptime
load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
cpu_cores=$(nproc)
load_threshold=$(echo "$cpu_cores * 0.8" | bc)
if (( $(echo "$load_avg > $load_threshold" | bc -l) )); then
    echo "⚠️  HIGH CPU LOAD: $load_avg (threshold: $load_threshold)"
fi

# 4. Network Connectivity
echo -e "\n🌐 Network Connectivity:"
# Test internal network connectivity
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    echo "✅ Internal API connectivity: OK"
else
    echo "❌ Internal API connectivity: FAILED"
fi

# 5. Docker System Status
echo -e "\n🐳 Docker System Status:"
docker system df
```

---

## 📊 Application Performance Monitoring

### **API Performance Monitoring**

**Response Time Monitoring:**
```bash
#!/bin/bash
# API Performance Monitor
# Location: /opt/scripts/monitor-api-performance.sh

echo "=== API Performance Monitoring - $(date) ==="

# Define endpoints to monitor
endpoints=(
    "/api/health"
    "/api/customers"
    "/api/processes"
    "/api/services"
    "/api/documents"
    "/api/timeline"
)

# Function to test endpoint performance
test_endpoint() {
    local endpoint=$1
    local url="http://localhost:3000$endpoint"
    
    # Measure response time and status
    response=$(curl -s -o /dev/null -w "%{time_total},%{http_code}" "$url")
    response_time=$(echo "$response" | cut -d',' -f1)
    status_code=$(echo "$response" | cut -d',' -f2)
    
    # Convert to milliseconds
    response_ms=$(echo "$response_time * 1000" | bc)
    
    echo -n "$endpoint: ${response_ms}ms (HTTP $status_code) "
    
    # Check thresholds
    if [ "$status_code" != "200" ]; then
        echo "❌ HTTP ERROR"
        return 1
    elif (( $(echo "$response_time > 2.0" | bc -l) )); then
        echo "❌ SLOW"
        return 1
    elif (( $(echo "$response_time > 0.5" | bc -l) )); then
        echo "⚠️  WARNING"
        return 0
    else
        echo "✅ OK"
        return 0
    fi
}

# Test all endpoints
echo "🔍 Testing API Endpoints:"
failed_endpoints=0
for endpoint in "${endpoints[@]}"; do
    if ! test_endpoint "$endpoint"; then
        ((failed_endpoints++))
    fi
done

echo -e "\n📋 Summary:"
echo "Total endpoints: ${#endpoints[@]}"
echo "Failed endpoints: $failed_endpoints"

if [ "$failed_endpoints" -gt 0 ]; then
    echo "⚠️  API performance issues detected"
    exit 1
else
    echo "✅ All API endpoints performing normally"
    exit 0
fi
```

**User Session Monitoring:**
```bash
#!/bin/bash
# User Session Monitor
# Location: /opt/scripts/monitor-sessions.sh

echo "=== User Session Monitoring - $(date) ==="

# Count active sessions (approximate based on recent API calls)
echo "📊 Active Sessions Analysis:"

# Analyze application logs for session activity
session_activity=$(docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -E "(GET|POST|PUT|DELETE)" | \
grep -v "/api/health" | \
wc -l)

echo "API requests (last hour): $session_activity"

# Estimate concurrent users based on unique IP patterns
unique_sessions=$(docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -E "\"(GET|POST|PUT|DELETE)" | \
awk '{print $1}' | sort | uniq | wc -l)

echo "Estimated unique sessions: $unique_sessions"

# Check for authentication events
auth_success=$(docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -i "authentication.*success" | wc -l)

auth_failed=$(docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -i "authentication.*fail" | wc -l)

echo "Successful logins (last hour): $auth_success"
echo "Failed logins (last hour): $auth_failed"

# Calculate failure rate
if [ $((auth_success + auth_failed)) -gt 0 ]; then
    failure_rate=$(echo "scale=2; $auth_failed * 100 / ($auth_success + $auth_failed)" | bc)
    echo "Authentication failure rate: ${failure_rate}%"
    
    if (( $(echo "$failure_rate > 5" | bc -l) )); then
        echo "⚠️  HIGH AUTHENTICATION FAILURE RATE"
    fi
fi
```

---

## 💾 Database Monitoring

### **Database Performance Monitoring**

**Query Performance Monitor:**
```bash
#!/bin/bash
# Database Performance Monitor
# Location: /opt/scripts/monitor-database-performance.sh

echo "=== Database Performance Monitoring - $(date) ==="

# 1. Connection Status
echo "🔗 Database Connection Status:"
if docker exec sales-dashboard-db-dev pg_isready -U postgres; then
    echo "✅ Database is ready"
else
    echo "❌ Database connection failed"
    exit 1
fi

# 2. Active Connections
echo -e "\n📊 Active Connections:"
connection_count=$(docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -t -c "
SELECT count(*) FROM pg_stat_activity WHERE datname='sales_dashboard_dev' AND state='active';" | xargs)
echo "Active connections: $connection_count"

# 3. Query Performance Analysis
echo -e "\n⚡ Query Performance (Top 10 Slowest):"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
    substring(query, 1, 60) as query_snippet,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;" 2>/dev/null || echo "pg_stat_statements not available"

# 4. Database Size and Growth
echo -e "\n📈 Database Size:"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
    pg_size_pretty(pg_database_size('sales_dashboard_dev')) as database_size,
    pg_size_pretty(pg_total_relation_size('customers')) as customers_table_size,
    pg_size_pretty(pg_total_relation_size('processes')) as processes_table_size;"

# 5. Lock Analysis
echo -e "\n🔒 Lock Analysis:"
lock_count=$(docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -t -c "
SELECT count(*) FROM pg_locks WHERE NOT granted;" | xargs)
echo "Blocked queries: $lock_count"

if [ "$lock_count" -gt 0 ]; then
    echo "⚠️  Database locks detected"
    docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
    SELECT 
        blocked_locks.pid AS blocked_pid,
        blocked_activity.usename AS blocked_user,
        blocking_locks.pid AS blocking_pid,
        blocking_activity.usename AS blocking_user,
        blocked_activity.query AS blocked_statement
    FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
    WHERE NOT blocked_locks.granted;"
fi
```

**Database Health Check:**
```bash
#!/bin/bash
# Database Health Check
# Location: /opt/scripts/monitor-database-health.sh

echo "=== Database Health Check - $(date) ==="

# 1. Basic connectivity test
echo "🔍 Testing database connectivity..."
if ! docker exec sales-dashboard-db-dev pg_isready -U postgres; then
    echo "❌ Database connectivity failed"
    exit 1
fi

# 2. Check database statistics
echo -e "\n📊 Database Statistics:"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC 
LIMIT 10;"

# 3. Check for table bloat
echo -e "\n🗜️  Table Bloat Analysis:"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# 4. Check backup status
echo -e "\n💾 Backup Status:"
latest_backup=$(ls -t /opt/backups/sales-dashboard/database_*.sql.gz 2>/dev/null | head -1)
if [ -n "$latest_backup" ]; then
    backup_age=$(stat -c %Y "$latest_backup")
    current_time=$(date +%s)
    age_hours=$(( (current_time - backup_age) / 3600 ))
    echo "Latest backup: $latest_backup ($age_hours hours ago)"
    
    if [ "$age_hours" -gt 48 ]; then
        echo "⚠️  Backup is older than 48 hours"
    fi
else
    echo "❌ No recent backups found"
fi
```

---

## 🔐 Security Monitoring

### **Authentication Monitoring**

**Security Event Monitor:**
```bash
#!/bin/bash
# Security Event Monitor
# Location: /opt/scripts/monitor-security.sh

echo "=== Security Monitoring - $(date) ==="

# 1. Authentication Event Analysis
echo "🔐 Authentication Events (Last 24 Hours):"

# Count successful logins
success_logins=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | \
grep -i "authentication.*success" | wc -l)

# Count failed logins
failed_logins=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | \
grep -i "authentication.*fail" | wc -l)

# Count password reset attempts
password_resets=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | \
grep -i "password.*reset" | wc -l)

echo "Successful logins: $success_logins"
echo "Failed logins: $failed_logins"
echo "Password resets: $password_resets"

# Calculate and check failure rate
if [ $((success_logins + failed_logins)) -gt 0 ]; then
    failure_rate=$(echo "scale=2; $failed_logins * 100 / ($success_logins + $failed_logins)" | bc)
    echo "Failure rate: ${failure_rate}%"
    
    if (( $(echo "$failure_rate > 10" | bc -l) )); then
        echo "⚠️  HIGH FAILURE RATE - Possible brute force attack"
    fi
fi

# 2. Recent Failed Login Attempts
echo -e "\n🚨 Recent Failed Login Attempts:"
docker logs --since 24h sales-dashboard-app 2>/dev/null | \
grep -i "authentication.*fail" | tail -5

# 3. Suspicious Activity Detection
echo -e "\n🔍 Suspicious Activity Detection:"

# Check for rapid authentication attempts (more than 10 in 5 minutes)
recent_attempts=$(docker logs --since 5m sales-dashboard-app 2>/dev/null | \
grep -i "authentication" | wc -l)

if [ "$recent_attempts" -gt 10 ]; then
    echo "⚠️  High authentication activity: $recent_attempts attempts in last 5 minutes"
fi

# Check for error patterns that might indicate attacks
sql_injection_attempts=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | \
grep -i -E "(union|select|drop|insert).*error" | wc -l)

if [ "$sql_injection_attempts" -gt 0 ]; then
    echo "⚠️  Potential SQL injection attempts: $sql_injection_attempts"
fi

# 4. User Activity Patterns
echo -e "\n👥 User Activity Analysis:"
active_users=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | \
grep -i "authentication.*success" | \
awk '{print $NF}' | sort | uniq | wc -l)

echo "Unique users logged in (24h): $active_users"
```

### **Access Pattern Analysis**

**Unusual Access Pattern Monitor:**
```bash
#!/bin/bash
# Access Pattern Monitor
# Location: /opt/scripts/monitor-access-patterns.sh

echo "=== Access Pattern Analysis - $(date) ==="

# 1. Endpoint Access Frequency
echo "📊 API Endpoint Access Frequency (Last Hour):"
docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -E "\"(GET|POST|PUT|DELETE)" | \
awk '{print $7}' | \
sort | uniq -c | sort -nr | head -10

# 2. Unusual Request Patterns
echo -e "\n🔍 Unusual Request Pattern Detection:"

# Check for unusually high request rates
request_count=$(docker logs --since 5m sales-dashboard-app 2>/dev/null | \
grep -E "\"(GET|POST|PUT|DELETE)" | wc -l)

echo "Requests in last 5 minutes: $request_count"

if [ "$request_count" -gt 500 ]; then
    echo "⚠️  HIGH REQUEST RATE - Possible DoS attack or bot activity"
fi

# 3. Error Rate Analysis
echo -e "\n📈 Error Rate Analysis:"
total_requests=$(docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -E "\"(GET|POST|PUT|DELETE)" | wc -l)

error_requests=$(docker logs --since 1h sales-dashboard-app 2>/dev/null | \
grep -E "\" [45][0-9][0-9] " | wc -l)

if [ "$total_requests" -gt 0 ]; then
    error_rate=$(echo "scale=2; $error_requests * 100 / $total_requests" | bc)
    echo "Error rate (last hour): ${error_rate}%"
    
    if (( $(echo "$error_rate > 10" | bc -l) )); then
        echo "⚠️  HIGH ERROR RATE - Check application health"
    fi
fi

# 4. Database Security Check
echo -e "\n🛡️  Database Security Status:"
docker exec sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev -c "
SELECT 
    usename,
    application_name,
    client_addr,
    state,
    query_start
FROM pg_stat_activity 
WHERE datname = 'sales_dashboard_dev' 
AND state = 'active';"
```

---

## 🚨 Alert Configuration

### **Threshold-Based Alerts**

**Performance Alert Script:**
```bash
#!/bin/bash
# Performance Alert Script
# Location: /opt/scripts/alerts/performance-alerts.sh

ALERT_LOG="/var/log/sales-dashboard/alerts.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to send alert
send_alert() {
    local severity=$1
    local message=$2
    local alert_id="ALERT_$(date +%s)"
    
    echo "[$TIMESTAMP] [$severity] $alert_id: $message" | tee -a "$ALERT_LOG"
    
    # Send notification (customize based on your notification system)
    # Examples:
    # - Send email: echo "$message" | mail -s "$severity Alert" admin@company.com
    # - Send to Slack: curl -X POST -H 'Content-type: application/json' --data '{"text":"'$message'"}' $SLACK_WEBHOOK
    # - Log to syslog: logger -p user.crit "$severity Alert: $message"
    
    case "$severity" in
        "CRITICAL")
            logger -p user.crit "DM_CRM CRITICAL: $message"
            ;;
        "WARNING")
            logger -p user.warning "DM_CRM WARNING: $message"
            ;;
        "INFO")
            logger -p user.info "DM_CRM INFO: $message"
            ;;
    esac
}

# Check API response times
check_api_performance() {
    response_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:3000/api/health)
    response_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time > 5.0" | bc -l) )); then
        send_alert "CRITICAL" "API response time is ${response_ms}ms (threshold: 5000ms)"
    elif (( $(echo "$response_time > 2.0" | bc -l) )); then
        send_alert "WARNING" "API response time is ${response_ms}ms (threshold: 2000ms)"
    fi
}

# Check memory usage
check_memory_usage() {
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    
    if (( $(echo "$memory_usage > 95" | bc -l) )); then
        send_alert "CRITICAL" "Memory usage is ${memory_usage}% (threshold: 95%)"
    elif (( $(echo "$memory_usage > 85" | bc -l) )); then
        send_alert "WARNING" "Memory usage is ${memory_usage}% (threshold: 85%)"
    fi
}

# Check disk usage
check_disk_usage() {
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 90 ]; then
        send_alert "CRITICAL" "Disk usage is ${disk_usage}% (threshold: 90%)"
    elif [ "$disk_usage" -gt 80 ]; then
        send_alert "WARNING" "Disk usage is ${disk_usage}% (threshold: 80%)"
    fi
}

# Check container health
check_container_health() {
    containers=("sales-dashboard-app" "sales-dashboard-db-dev")
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "{{.Names}}" | grep -q "^$container$"; then
            send_alert "CRITICAL" "Container $container is not running"
        fi
    done
}

# Run all checks
check_api_performance
check_memory_usage
check_disk_usage
check_container_health
```

### **Security Alert Script**

```bash
#!/bin/bash
# Security Alert Script
# Location: /opt/scripts/alerts/security-alerts.sh

ALERT_LOG="/var/log/sales-dashboard/security-alerts.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to send security alert
send_security_alert() {
    local severity=$1
    local message=$2
    local alert_id="SEC_ALERT_$(date +%s)"
    
    echo "[$TIMESTAMP] [$severity] $alert_id: $message" | tee -a "$ALERT_LOG"
    logger -p user.alert "DM_CRM SECURITY $severity: $message"
}

# Check authentication failure rate
check_auth_failures() {
    # Count failures in last 10 minutes
    failed_logins=$(docker logs --since 10m sales-dashboard-app 2>/dev/null | \
    grep -i "authentication.*fail" | wc -l)
    
    if [ "$failed_logins" -gt 20 ]; then
        send_security_alert "CRITICAL" "High authentication failure rate: $failed_logins failures in 10 minutes"
    elif [ "$failed_logins" -gt 10 ]; then
        send_security_alert "WARNING" "Elevated authentication failures: $failed_logins failures in 10 minutes"
    fi
}

# Check for potential SQL injection
check_sql_injection() {
    sql_patterns=$(docker logs --since 10m sales-dashboard-app 2>/dev/null | \
    grep -i -E "(union|select|drop|insert|update|delete).*error" | wc -l)
    
    if [ "$sql_patterns" -gt 0 ]; then
        send_security_alert "WARNING" "Potential SQL injection attempts detected: $sql_patterns patterns"
    fi
}

# Check for unusual request rates
check_request_rate() {
    request_count=$(docker logs --since 5m sales-dashboard-app 2>/dev/null | \
    grep -E "\"(GET|POST|PUT|DELETE)" | wc -l)
    
    if [ "$request_count" -gt 1000 ]; then
        send_security_alert "WARNING" "High request rate detected: $request_count requests in 5 minutes"
    fi
}

# Run security checks
check_auth_failures
check_sql_injection
check_request_rate
```

---

## 📈 Dashboards and Reporting

### **Daily System Report**

```bash
#!/bin/bash
# Daily System Report Generator
# Location: /opt/scripts/reports/daily-report.sh

REPORT_DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/var/log/sales-dashboard/reports/daily-report-$REPORT_DATE.html"

# Create report directory
mkdir -p "/var/log/sales-dashboard/reports"

# Generate HTML report
cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>DM_CRM Daily Report - $REPORT_DATE</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 5px; border-left: 3px solid #007cba; }
        .warning { border-left-color: #ff9900; }
        .critical { border-left-color: #ff0000; }
        .good { border-left-color: #00cc00; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>DM_CRM Sales Dashboard - Daily Report</h1>
        <p>Report Date: $REPORT_DATE</p>
        <p>Generated: $(date)</p>
    </div>
EOF

# System Health Section
echo "<h2>System Health</h2>" >> "$REPORT_FILE"

# Container status
echo "<div class='metric good'>" >> "$REPORT_FILE"
echo "<h3>Container Status</h3>" >> "$REPORT_FILE"
echo "<pre>" >> "$REPORT_FILE"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$REPORT_FILE"
echo "</pre>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# Resource usage
memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

metric_class="good"
if (( $(echo "$memory_usage > 85" | bc -l) )) || [ "$disk_usage" -gt 85 ]; then
    metric_class="warning"
fi

echo "<div class='metric $metric_class'>" >> "$REPORT_FILE"
echo "<h3>Resource Usage</h3>" >> "$REPORT_FILE"
echo "<p>Memory Usage: ${memory_usage}%</p>" >> "$REPORT_FILE"
echo "<p>Disk Usage: ${disk_usage}%</p>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# Performance metrics
echo "<h2>Performance Metrics</h2>" >> "$REPORT_FILE"

# API response times
echo "<div class='metric'>" >> "$REPORT_FILE"
echo "<h3>API Response Times (Last 24 Hours)</h3>" >> "$REPORT_FILE"
echo "<table>" >> "$REPORT_FILE"
echo "<tr><th>Endpoint</th><th>Response Time</th><th>Status</th></tr>" >> "$REPORT_FILE"

endpoints=("/api/health" "/api/customers" "/api/processes")
for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{time_total},%{http_code}" "http://localhost:3000$endpoint")
    response_time=$(echo "$response" | cut -d',' -f1)
    status_code=$(echo "$response" | cut -d',' -f2)
    response_ms=$(echo "$response_time * 1000" | bc)
    
    echo "<tr><td>$endpoint</td><td>${response_ms}ms</td><td>$status_code</td></tr>" >> "$REPORT_FILE"
done

echo "</table>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# Security section
echo "<h2>Security Summary</h2>" >> "$REPORT_FILE"

# Authentication metrics
success_logins=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | grep -i "authentication.*success" | wc -l)
failed_logins=$(docker logs --since 24h sales-dashboard-app 2>/dev/null | grep -i "authentication.*fail" | wc -l)

echo "<div class='metric'>" >> "$REPORT_FILE"
echo "<h3>Authentication Events (24 Hours)</h3>" >> "$REPORT_FILE"
echo "<p>Successful Logins: $success_logins</p>" >> "$REPORT_FILE"
echo "<p>Failed Logins: $failed_logins</p>" >> "$REPORT_FILE"
echo "</div>" >> "$REPORT_FILE"

# Close HTML
echo "</body></html>" >> "$REPORT_FILE"

echo "Daily report generated: $REPORT_FILE"
```

---

## 🤖 Automated Monitoring Scripts

### **Continuous Monitoring Daemon**

```bash
#!/bin/bash
# Continuous Monitoring Daemon
# Location: /opt/scripts/monitoring-daemon.sh
# Usage: Run as systemd service or background process

MONITOR_INTERVAL=60  # Check every 60 seconds
LOG_FILE="/var/log/sales-dashboard/monitoring.log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Monitoring daemon started"

while true; do
    # Run health check
    if /opt/scripts/health-check.sh > /dev/null 2>&1; then
        log_message "Health check: PASSED"
    else
        log_message "Health check: FAILED"
        /opt/scripts/alerts/performance-alerts.sh
    fi
    
    # Run performance monitoring
    /opt/scripts/monitor-api-performance.sh > /dev/null 2>&1
    
    # Run security monitoring
    /opt/scripts/alerts/security-alerts.sh > /dev/null 2>&1
    
    # Sleep until next check
    sleep $MONITOR_INTERVAL
done
```

### **Monitoring Service Configuration**

**Systemd Service File:**
```ini
# /etc/systemd/system/dm-crm-monitor.service
[Unit]
Description=DM_CRM Sales Dashboard Monitoring Service
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=root
ExecStart=/opt/scripts/monitoring-daemon.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Cron Jobs for Scheduled Tasks:**
```bash
# /etc/cron.d/dm-crm-monitoring

# Daily health check at 8 AM
0 8 * * * root /opt/scripts/daily-health-check.sh

# Daily backup at 2 AM
0 2 * * * root /opt/scripts/daily-backup.sh

# Weekly maintenance on Sundays at 3 AM
0 3 * * 0 root /opt/scripts/weekly-maintenance.sh

# Performance alerts every 5 minutes
*/5 * * * * root /opt/scripts/alerts/performance-alerts.sh

# Security alerts every 2 minutes
*/2 * * * * root /opt/scripts/alerts/security-alerts.sh

# Daily report generation at 7 AM
0 7 * * * root /opt/scripts/reports/daily-report.sh
```

---

*These monitoring procedures provide comprehensive visibility into the DM_CRM Sales Dashboard system health, performance, and security. Regular review and updates ensure effective monitoring coverage.*