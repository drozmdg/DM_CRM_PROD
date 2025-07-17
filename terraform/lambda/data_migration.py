#!/usr/bin/env python3
"""
Data Migration Lambda Function
DM_CRM Sales Dashboard - Production Infrastructure

This function handles data migration from Supabase to AWS RDS PostgreSQL
with comprehensive validation, backup, and monitoring.
"""

import json
import boto3
import logging
import os
import traceback
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import psycopg2
import psycopg2.extras
from botocore.exceptions import ClientError

# Import custom modules
from migration_utils import MigrationUtils
from data_validators import DataValidators

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
secrets_client = boto3.client('secretsmanager')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
rds_client = boto3.client('rds')

# Environment variables
PROJECT_NAME = os.environ.get('PROJECT_NAME', '${project_name}')
ENVIRONMENT = os.environ.get('ENVIRONMENT', '${environment}')
SOURCE_DB_SECRET_ARN = os.environ.get('SOURCE_DB_SECRET_ARN')
TARGET_DB_SECRET_ARN = os.environ.get('TARGET_DB_SECRET_ARN')
MIGRATION_BUCKET = os.environ.get('MIGRATION_BUCKET')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

class DataMigrationError(Exception):
    """Custom exception for data migration errors"""
    pass

class DatabaseConnection:
    """Database connection manager with proper cleanup"""
    
    def __init__(self, connection_config: Dict[str, str]):
        self.config = connection_config
        self.connection = None
        
    def __enter__(self):
        try:
            self.connection = psycopg2.connect(
                host=self.config['host'],
                port=self.config['port'],
                database=self.config['dbname'],
                user=self.config['username'],
                password=self.config['password'],
                connect_timeout=30,
                application_name=f"{PROJECT_NAME}-migration"
            )
            self.connection.autocommit = False
            return self.connection
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise DataMigrationError(f"Database connection failed: {str(e)}")
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.connection:
            if exc_type is None:
                self.connection.commit()
            else:
                self.connection.rollback()
            self.connection.close()

def handler(event, context):
    """
    Main Lambda handler for data migration operations.
    
    Supports different actions:
    - validate_source: Validate source database connectivity and data
    - create_backup: Create backup of target database before migration
    - execute_migration: Execute the actual data migration
    - validate_migration: Validate migrated data integrity
    """
    
    migration_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    action = event.get('action', 'execute_migration')
    
    logger.info(f"Starting migration action: {action} with ID: {migration_id}")
    
    try:
        # Initialize migration utilities
        utils = MigrationUtils(
            s3_client=s3_client,
            bucket_name=MIGRATION_BUCKET,
            kms_key_id=KMS_KEY_ID,
            migration_id=migration_id
        )
        
        validators = DataValidators()
        
        # Execute the requested action
        if action == 'validate_source':
            result = validate_source_database(utils, validators)
        elif action == 'create_backup':
            result = create_database_backup(utils)
        elif action == 'execute_migration':
            result = execute_data_migration(utils, validators, migration_id)
        elif action == 'validate_migration':
            result = validate_migration_results(utils, validators)
        else:
            raise DataMigrationError(f"Unknown action: {action}")
        
        # Send success notification
        send_notification(
            f"Migration {action} completed successfully",
            f"Migration ID: {migration_id}\nDetails: {json.dumps(result, indent=2)}",
            "SUCCESS"
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'SUCCESS',
                'action': action,
                'migration_id': migration_id,
                'result': result,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }
        
    except Exception as e:
        error_message = f"Migration {action} failed: {str(e)}"
        logger.error(f"{error_message}\n{traceback.format_exc()}")
        
        # Send failure notification
        send_notification(
            f"Migration {action} failed",
            f"Migration ID: {migration_id}\nError: {error_message}\nTraceback: {traceback.format_exc()}",
            "FAILURE"
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'FAILED',
                'action': action,
                'migration_id': migration_id,
                'error': error_message,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }

def get_database_credentials(secret_arn: str) -> Dict[str, str]:
    """Retrieve database credentials from AWS Secrets Manager"""
    
    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        credentials = json.loads(response['SecretString'])
        
        # Validate required fields
        required_fields = ['host', 'port', 'dbname', 'username', 'password']
        for field in required_fields:
            if field not in credentials:
                raise DataMigrationError(f"Missing required credential field: {field}")
        
        return credentials
    
    except ClientError as e:
        logger.error(f"Failed to retrieve credentials from {secret_arn}: {e}")
        raise DataMigrationError(f"Failed to retrieve database credentials: {e}")

def validate_source_database(utils: MigrationUtils, validators: DataValidators) -> Dict[str, Any]:
    """Validate source database connectivity and data integrity"""
    
    logger.info("Starting source database validation")
    
    source_creds = get_database_credentials(SOURCE_DB_SECRET_ARN)
    
    validation_results = {
        'connectivity': False,
        'table_counts': {},
        'data_integrity': {},
        'migration_readiness': False
    }
    
    with DatabaseConnection(source_creds) as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Test connectivity
        cursor.execute("SELECT version()")
        db_version = cursor.fetchone()[0]
        validation_results['connectivity'] = True
        validation_results['database_version'] = db_version
        logger.info(f"Source database connected: {db_version}")
        
        # Get table counts
        tables_to_migrate = [
            'customers', 'processes', 'services', 'documents', 'timeline', 
            'contacts', 'teams', 'users', 'user_roles', 'roles'
        ]
        
        for table in tables_to_migrate:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                validation_results['table_counts'][table] = count
                logger.info(f"Table {table}: {count} records")
            except psycopg2.Error as e:
                logger.warning(f"Could not count table {table}: {e}")
                validation_results['table_counts'][table] = -1
        
        # Data integrity checks
        validation_results['data_integrity'] = validators.validate_source_data_integrity(cursor)
        
        # Check migration readiness
        total_records = sum(count for count in validation_results['table_counts'].values() if count > 0)
        validation_results['total_records'] = total_records
        validation_results['migration_readiness'] = (
            validation_results['connectivity'] and 
            total_records > 0 and
            all(check['passed'] for check in validation_results['data_integrity'].values())
        )
    
    # Store validation results in S3
    utils.store_migration_artifact('source_validation.json', validation_results)
    
    logger.info("Source database validation completed")
    return validation_results

def create_database_backup(utils: MigrationUtils) -> Dict[str, Any]:
    """Create backup of target database before migration"""
    
    logger.info("Starting database backup creation")
    
    target_creds = get_database_credentials(TARGET_DB_SECRET_ARN)
    
    backup_results = {
        'backup_created': False,
        'backup_location': None,
        'backup_size': 0,
        'tables_backed_up': []
    }
    
    with DatabaseConnection(target_creds) as conn:
        cursor = conn.cursor()
        
        # Get list of existing tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        backup_results['tables_backed_up'] = existing_tables
        
        # Create backup data for each table
        backup_data = {}
        for table in existing_tables:
            try:
                cursor.execute(f"SELECT * FROM {table}")
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                
                backup_data[table] = {
                    'columns': columns,
                    'data': [dict(zip(columns, row)) for row in rows]
                }
                
                logger.info(f"Backed up table {table}: {len(rows)} records")
                
            except psycopg2.Error as e:
                logger.warning(f"Could not backup table {table}: {e}")
        
        backup_results['backup_created'] = len(backup_data) > 0
    
    # Store backup in S3
    if backup_results['backup_created']:
        backup_key = f"database_backup_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        utils.store_migration_artifact(backup_key, backup_data)
        backup_results['backup_location'] = f"s3://{MIGRATION_BUCKET}/{utils.get_migration_prefix()}/{backup_key}"
    
    logger.info("Database backup creation completed")
    return backup_results

def execute_data_migration(utils: MigrationUtils, validators: DataValidators, migration_id: str) -> Dict[str, Any]:
    """Execute the main data migration from source to target"""
    
    logger.info("Starting data migration execution")
    
    source_creds = get_database_credentials(SOURCE_DB_SECRET_ARN)
    target_creds = get_database_credentials(TARGET_DB_SECRET_ARN)
    
    migration_results = {
        'migration_started': datetime.now(timezone.utc).isoformat(),
        'tables_migrated': {},
        'total_records_migrated': 0,
        'migration_completed': False,
        'errors': []
    }
    
    # Tables in migration order (respecting foreign key dependencies)
    migration_order = [
        'users',
        'roles', 
        'user_roles',
        'customers',
        'contacts',
        'teams',
        'services',
        'processes',
        'documents',
        'timeline'
    ]
    
    try:
        with DatabaseConnection(source_creds) as source_conn, \
             DatabaseConnection(target_creds) as target_conn:
            
            source_cursor = source_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            target_cursor = target_conn.cursor()
            
            for table in migration_order:
                try:
                    logger.info(f"Migrating table: {table}")
                    
                    # Get source data
                    source_cursor.execute(f"SELECT * FROM {table}")
                    source_data = source_cursor.fetchall()
                    
                    if not source_data:
                        logger.info(f"Table {table} is empty, skipping")
                        migration_results['tables_migrated'][table] = 0
                        continue
                    
                    # Get column names
                    columns = [desc[0] for desc in source_cursor.description]
                    
                    # Clear target table
                    target_cursor.execute(f"TRUNCATE TABLE {table} CASCADE")
                    
                    # Insert data
                    insert_query = f"""
                        INSERT INTO {table} ({', '.join(columns)}) 
                        VALUES ({', '.join(['%s'] * len(columns))})
                    """
                    
                    # Convert DictRow to tuple for insertion
                    insert_data = [tuple(row[col] for col in columns) for row in source_data]
                    
                    target_cursor.executemany(insert_query, insert_data)
                    
                    records_migrated = len(insert_data)
                    migration_results['tables_migrated'][table] = records_migrated
                    migration_results['total_records_migrated'] += records_migrated
                    
                    logger.info(f"Successfully migrated {records_migrated} records from {table}")
                    
                except psycopg2.Error as e:
                    error_msg = f"Failed to migrate table {table}: {str(e)}"
                    logger.error(error_msg)
                    migration_results['errors'].append(error_msg)
                    # Continue with other tables
            
            # Commit transaction
            target_conn.commit()
            migration_results['migration_completed'] = len(migration_results['errors']) == 0
            migration_results['migration_finished'] = datetime.now(timezone.utc).isoformat()
    
    except Exception as e:
        error_msg = f"Migration execution failed: {str(e)}"
        logger.error(error_msg)
        migration_results['errors'].append(error_msg)
        migration_results['migration_completed'] = False
    
    # Store migration results in S3
    utils.store_migration_artifact('migration_results.json', migration_results)
    
    logger.info("Data migration execution completed")
    return migration_results

def validate_migration_results(utils: MigrationUtils, validators: DataValidators) -> Dict[str, Any]:
    """Validate the migrated data integrity and completeness"""
    
    logger.info("Starting migration validation")
    
    source_creds = get_database_credentials(SOURCE_DB_SECRET_ARN)
    target_creds = get_database_credentials(TARGET_DB_SECRET_ARN)
    
    validation_results = {
        'validation_started': datetime.now(timezone.utc).isoformat(),
        'table_comparisons': {},
        'data_integrity_checks': {},
        'validation_passed': False,
        'discrepancies': []
    }
    
    with DatabaseConnection(source_creds) as source_conn, \
         DatabaseConnection(target_creds) as target_conn:
        
        source_cursor = source_conn.cursor()
        target_cursor = target_conn.cursor()
        
        # Compare record counts
        tables_to_validate = [
            'customers', 'processes', 'services', 'documents', 
            'timeline', 'contacts', 'teams', 'users', 'user_roles', 'roles'
        ]
        
        for table in tables_to_validate:
            try:
                source_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                source_count = source_cursor.fetchone()[0]
                
                target_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                target_count = target_cursor.fetchone()[0]
                
                validation_results['table_comparisons'][table] = {
                    'source_count': source_count,
                    'target_count': target_count,
                    'match': source_count == target_count
                }
                
                if source_count != target_count:
                    discrepancy = f"Table {table}: source={source_count}, target={target_count}"
                    validation_results['discrepancies'].append(discrepancy)
                    logger.warning(discrepancy)
                
            except psycopg2.Error as e:
                error_msg = f"Could not validate table {table}: {str(e)}"
                logger.error(error_msg)
                validation_results['discrepancies'].append(error_msg)
        
        # Data integrity checks on target
        validation_results['data_integrity_checks'] = validators.validate_target_data_integrity(target_cursor)
    
    # Overall validation result
    validation_results['validation_passed'] = (
        len(validation_results['discrepancies']) == 0 and
        all(check['passed'] for check in validation_results['data_integrity_checks'].values())
    )
    
    validation_results['validation_finished'] = datetime.now(timezone.utc).isoformat()
    
    # Store validation results in S3
    utils.store_migration_artifact('validation_results.json', validation_results)
    
    logger.info("Migration validation completed")
    return validation_results

def send_notification(subject: str, message: str, status: str):
    """Send notification via SNS"""
    
    try:
        if SNS_TOPIC_ARN:
            enhanced_message = f"""
Migration Status: {status}
Project: {PROJECT_NAME}
Environment: {ENVIRONMENT}
Timestamp: {datetime.now(timezone.utc).isoformat()}

{message}
"""
            
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"[{PROJECT_NAME}] {subject}",
                Message=enhanced_message
            )
            
            logger.info(f"Notification sent: {subject}")
        else:
            logger.warning("SNS topic not configured, skipping notification")
    
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")

# Entry point for testing
if __name__ == "__main__":
    # Test event
    test_event = {
        "action": "validate_source"
    }
    test_context = {}
    
    result = handler(test_event, test_context)
    print(json.dumps(result, indent=2))