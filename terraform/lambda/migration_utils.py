#!/usr/bin/env python3
"""
Migration Utilities Module
DM_CRM Sales Dashboard - Data Migration Support

Utility functions for data migration operations including S3 storage,
encryption, logging, and common migration tasks.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class MigrationUtils:
    """Utility class for data migration operations"""
    
    def __init__(self, s3_client, bucket_name: str, kms_key_id: str, migration_id: str):
        self.s3_client = s3_client
        self.bucket_name = bucket_name
        self.kms_key_id = kms_key_id
        self.migration_id = migration_id
        self.migration_prefix = f"migrations/{migration_id}"
    
    def get_migration_prefix(self) -> str:
        """Get the S3 prefix for this migration"""
        return self.migration_prefix
    
    def store_migration_artifact(self, key: str, data: Any) -> str:
        """Store migration artifact in S3 with encryption"""
        
        try:
            full_key = f"{self.migration_prefix}/{key}"
            
            # Convert data to JSON if it's not a string
            if isinstance(data, (dict, list)):
                content = json.dumps(data, indent=2, default=str)
            else:
                content = str(data)
            
            # Store in S3 with KMS encryption
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=full_key,
                Body=content.encode('utf-8'),
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=self.kms_key_id,
                ContentType='application/json',
                Metadata={
                    'migration-id': self.migration_id,
                    'created-at': datetime.now(timezone.utc).isoformat(),
                    'content-type': 'migration-artifact'
                }
            )
            
            logger.info(f"Stored migration artifact: s3://{self.bucket_name}/{full_key}")
            return full_key
            
        except ClientError as e:
            logger.error(f"Failed to store migration artifact {key}: {e}")
            raise
    
    def retrieve_migration_artifact(self, key: str) -> Any:
        """Retrieve migration artifact from S3"""
        
        try:
            full_key = f"{self.migration_prefix}/{key}"
            
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=full_key
            )
            
            content = response['Body'].read().decode('utf-8')
            
            # Try to parse as JSON
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return content
                
        except ClientError as e:
            logger.error(f"Failed to retrieve migration artifact {key}: {e}")
            raise
    
    def list_migration_artifacts(self) -> List[str]:
        """List all artifacts for this migration"""
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{self.migration_prefix}/"
            )
            
            if 'Contents' not in response:
                return []
            
            return [obj['Key'] for obj in response['Contents']]
            
        except ClientError as e:
            logger.error(f"Failed to list migration artifacts: {e}")
            raise
    
    def create_migration_report(self, migration_data: Dict[str, Any]) -> str:
        """Create a comprehensive migration report"""
        
        report = {
            'migration_id': self.migration_id,
            'report_generated': datetime.now(timezone.utc).isoformat(),
            'migration_summary': migration_data,
            'artifacts': self.list_migration_artifacts()
        }
        
        # Add detailed statistics
        if 'tables_migrated' in migration_data:
            total_records = sum(migration_data['tables_migrated'].values())
            report['statistics'] = {
                'total_tables': len(migration_data['tables_migrated']),
                'total_records': total_records,
                'tables_with_data': len([t for t, c in migration_data['tables_migrated'].items() if c > 0]),
                'largest_table': max(migration_data['tables_migrated'].items(), key=lambda x: x[1]) if migration_data['tables_migrated'] else None
            }
        
        return self.store_migration_artifact('migration_report.json', report)
    
    def cleanup_old_migrations(self, retention_days: int = 30) -> List[str]:
        """Clean up old migration artifacts"""
        
        try:
            # List all migration prefixes
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="migrations/",
                Delimiter="/"
            )
            
            deleted_migrations = []
            cutoff_date = datetime.now(timezone.utc).timestamp() - (retention_days * 24 * 3600)
            
            if 'CommonPrefixes' in response:
                for prefix_info in response['CommonPrefixes']:
                    prefix = prefix_info['Prefix']
                    
                    # Get objects in this migration
                    objects_response = self.s3_client.list_objects_v2(
                        Bucket=self.bucket_name,
                        Prefix=prefix
                    )
                    
                    if 'Contents' in objects_response:
                        # Check if any object is older than retention period
                        oldest_object = min(objects_response['Contents'], key=lambda x: x['LastModified'])
                        
                        if oldest_object['LastModified'].timestamp() < cutoff_date:
                            # Delete all objects in this migration
                            objects_to_delete = [{'Key': obj['Key']} for obj in objects_response['Contents']]
                            
                            self.s3_client.delete_objects(
                                Bucket=self.bucket_name,
                                Delete={'Objects': objects_to_delete}
                            )
                            
                            deleted_migrations.append(prefix)
                            logger.info(f"Deleted old migration: {prefix}")
            
            return deleted_migrations
            
        except ClientError as e:
            logger.error(f"Failed to cleanup old migrations: {e}")
            raise
    
    @staticmethod
    def format_data_size(size_bytes: int) -> str:
        """Format data size in human-readable format"""
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"
    
    @staticmethod
    def estimate_migration_time(record_count: int, table_count: int) -> Dict[str, Any]:
        """Estimate migration time based on data volume"""
        
        # Base estimates (records per second)
        base_rate = 1000  # Conservative estimate for PostgreSQL
        
        # Factors that affect performance
        complexity_factor = 1.0
        if table_count > 10:
            complexity_factor += 0.2
        if record_count > 100000:
            complexity_factor += 0.3
        
        # Estimated time in seconds
        estimated_seconds = (record_count / base_rate) * complexity_factor
        
        # Add buffer for validation and backup
        total_seconds = estimated_seconds * 1.5
        
        return {
            'estimated_migration_seconds': int(estimated_seconds),
            'estimated_total_seconds': int(total_seconds),
            'estimated_migration_minutes': round(estimated_seconds / 60, 1),
            'estimated_total_minutes': round(total_seconds / 60, 1),
            'factors': {
                'record_count': record_count,
                'table_count': table_count,
                'complexity_factor': complexity_factor,
                'base_rate_per_second': base_rate
            }
        }
    
    def generate_rollback_plan(self, backup_key: str) -> Dict[str, Any]:
        """Generate a rollback plan for the migration"""
        
        rollback_plan = {
            'rollback_id': f"rollback_{self.migration_id}",
            'created': datetime.now(timezone.utc).isoformat(),
            'backup_location': f"s3://{self.bucket_name}/{self.migration_prefix}/{backup_key}",
            'steps': [
                {
                    'step': 1,
                    'action': 'stop_application',
                    'description': 'Stop application services to prevent data changes'
                },
                {
                    'step': 2,
                    'action': 'restore_backup',
                    'description': f'Restore database from backup: {backup_key}'
                },
                {
                    'step': 3,
                    'action': 'validate_restore',
                    'description': 'Validate restored data integrity'
                },
                {
                    'step': 4,
                    'action': 'restart_application',
                    'description': 'Restart application services'
                }
            ],
            'estimated_rollback_time_minutes': 15,
            'contact_information': {
                'notification_topic': 'SNS topic for emergency notifications',
                'escalation_procedure': 'Contact DevOps team immediately'
            }
        }
        
        return self.store_migration_artifact('rollback_plan.json', rollback_plan)
    
    def validate_s3_access(self) -> bool:
        """Validate S3 bucket access and permissions"""
        
        try:
            # Test write access
            test_key = f"{self.migration_prefix}/access_test.txt"
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=test_key,
                Body=b'test',
                ServerSideEncryption='aws:kms',
                SSEKMSKeyId=self.kms_key_id
            )
            
            # Test read access
            self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=test_key
            )
            
            # Test delete access
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=test_key
            )
            
            logger.info("S3 access validation successful")
            return True
            
        except ClientError as e:
            logger.error(f"S3 access validation failed: {e}")
            return False