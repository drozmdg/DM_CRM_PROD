#!/bin/bash

# Automated Database Backup Script
# Run this script via cron for regular backups

set -e

# Configuration
BACKUP_DIR="/mnt/d/Vault/User_Projects/Work/SalesDashboard/database/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DB_NAME="sales_dashboard_dev"
DB_USER="postgres"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating backup at $TIMESTAMP..."
docker exec sales-dashboard-db-dev pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump"

# Verify backup
if [ -f "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump" ]; then
    echo "✅ Backup created successfully: auto-backup-$TIMESTAMP.dump"
    
    # Get backup size
    BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump")
    echo "📊 Backup size: $BACKUP_SIZE bytes"
    
    # Verify backup integrity by copying to container first
    docker cp "$BACKUP_DIR/auto-backup-$TIMESTAMP.dump" sales-dashboard-db-dev:/tmp/verify-backup.dump
    docker exec sales-dashboard-db-dev pg_restore --list /tmp/verify-backup.dump > /dev/null
    docker exec sales-dashboard-db-dev rm -f /tmp/verify-backup.dump
    echo "✅ Backup integrity verified"
else
    echo "❌ Backup creation failed"
    exit 1
fi

# Clean up old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "auto-backup-*.dump" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "backup-*.dump" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup process completed"
