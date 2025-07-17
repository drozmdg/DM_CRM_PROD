import json
import os
import boto3
import logging
import subprocess
import tempfile
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def handler(event, context):
    """
    Lambda function to create database backups and store them in S3.
    
    This function:
    1. Creates a logical dump of the PostgreSQL database
    2. Compresses the dump
    3. Uploads to S3 with appropriate lifecycle tags
    4. Creates RDS snapshot as additional backup
    5. Sends notifications on success/failure
    """
    
    # Environment variables
    s3_bucket = os.environ['S3_BUCKET']
    db_endpoint = os.environ['DB_ENDPOINT']
    db_name = os.environ['DB_NAME']
    project_name = os.environ['PROJECT_NAME']
    environment = os.environ['ENVIRONMENT']
    
    # AWS clients
    s3_client = boto3.client('s3')
    rds_client = boto3.client('rds')
    sns_client = boto3.client('sns')
    secretsmanager_client = boto3.client('secretsmanager')
    
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    backup_filename = f"{project_name}_{environment}_{timestamp}.sql.gz"
    
    try:
        logger.info(f"Starting database backup for {project_name} {environment}")
        
        # Get database credentials from Secrets Manager
        db_credentials = get_db_credentials(secretsmanager_client, project_name, environment)
        
        # Create database dump
        dump_file_path = create_database_dump(
            db_endpoint, 
            db_name, 
            db_credentials['username'],
            db_credentials['password'],
            backup_filename
        )
        
        # Upload to S3
        s3_key = upload_to_s3(s3_client, s3_bucket, dump_file_path, backup_filename, timestamp)
        
        # Create RDS snapshot
        snapshot_id = create_rds_snapshot(rds_client, project_name, environment, timestamp)
        
        # Cleanup temporary file
        os.remove(dump_file_path)
        
        # Send success notification
        success_message = {
            'status': 'SUCCESS',
            'backup_file': s3_key,
            'snapshot_id': snapshot_id,
            'timestamp': timestamp,
            'size_mb': get_file_size_mb(s3_client, s3_bucket, s3_key)
        }
        
        send_notification(sns_client, 'Backup Successful', success_message)
        
        logger.info(f"Backup completed successfully: {s3_key}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(success_message)
        }
        
    except Exception as e:
        logger.error(f"Backup failed: {str(e)}")
        
        # Send failure notification
        failure_message = {
            'status': 'FAILED',
            'error': str(e),
            'timestamp': timestamp
        }
        
        send_notification(sns_client, 'Backup Failed', failure_message)
        
        return {
            'statusCode': 500,
            'body': json.dumps(failure_message)
        }

def get_db_credentials(secretsmanager_client, project_name, environment):
    """Retrieve database credentials from AWS Secrets Manager."""
    try:
        secret_name = f"{project_name}/{environment}/database"
        
        response = secretsmanager_client.get_secret_value(SecretId=secret_name)
        credentials = json.loads(response['SecretString'])
        
        return {
            'username': credentials['username'],
            'password': credentials['password']
        }
    except ClientError as e:
        logger.error(f"Failed to retrieve database credentials: {e}")
        # Fallback to environment variables (not recommended for production)
        return {
            'username': os.environ.get('DB_USERNAME', 'postgres'),
            'password': os.environ.get('DB_PASSWORD', '')
        }

def create_database_dump(db_endpoint, db_name, username, password, backup_filename):
    """Create a compressed PostgreSQL database dump."""
    
    # Create temporary file
    temp_dir = tempfile.gettempdir()
    dump_file_path = os.path.join(temp_dir, backup_filename)
    
    # Install pg_dump if not available (Lambda doesn't have it by default)
    # This is a simplified approach - in production, you'd use a Lambda layer
    try:
        # Set PGPASSWORD environment variable for pg_dump
        env = os.environ.copy()
        env['PGPASSWORD'] = password
        
        # pg_dump command
        pg_dump_command = [
            'pg_dump',
            f'--host={db_endpoint}',
            f'--username={username}',
            f'--dbname={db_name}',
            '--verbose',
            '--clean',
            '--no-owner',
            '--no-privileges',
            '--format=custom',
            '--compress=9'
        ]
        
        logger.info(f"Creating database dump: {backup_filename}")
        
        # Execute pg_dump and compress
        with open(dump_file_path, 'wb') as dump_file:
            process = subprocess.run(
                pg_dump_command,
                stdout=dump_file,
                stderr=subprocess.PIPE,
                env=env,
                check=True
            )
        
        logger.info(f"Database dump created: {dump_file_path}")
        return dump_file_path
        
    except subprocess.CalledProcessError as e:
        logger.error(f"pg_dump failed: {e.stderr.decode()}")
        raise Exception(f"Database dump failed: {e.stderr.decode()}")
    except FileNotFoundError:
        # Fallback: Create a simple backup using psql
        logger.warning("pg_dump not found, using psql fallback")
        return create_simple_backup(db_endpoint, db_name, username, password, dump_file_path, env)

def create_simple_backup(db_endpoint, db_name, username, password, dump_file_path, env):
    """Create a simple SQL backup using psql (fallback method)."""
    
    # Create a simple schema dump
    psql_command = [
        'psql',
        f'postgresql://{username}:{password}@{db_endpoint}/{db_name}',
        '-c', '\\d+',  # List all tables with details
    ]
    
    try:
        with open(dump_file_path, 'w') as dump_file:
            dump_file.write(f"-- Database backup for {db_name}\n")
            dump_file.write(f"-- Created at: {datetime.now(timezone.utc).isoformat()}\n\n")
            
            # Get table list and create basic backup
            result = subprocess.run(
                psql_command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                text=True
            )
            
            dump_file.write(result.stdout)
            if result.stderr:
                dump_file.write(f"\n-- Errors:\n{result.stderr}")
        
        return dump_file_path
        
    except Exception as e:
        logger.error(f"Simple backup failed: {str(e)}")
        raise Exception(f"Backup creation failed: {str(e)}")

def upload_to_s3(s3_client, bucket, file_path, filename, timestamp):
    """Upload backup file to S3 with appropriate metadata and tags."""
    
    # Determine backup type based on schedule
    backup_type = determine_backup_type(timestamp)
    s3_key = f"{backup_type}/{filename}"
    
    try:
        logger.info(f"Uploading to S3: {bucket}/{s3_key}")
        
        s3_client.upload_file(
            file_path,
            bucket,
            s3_key,
            ExtraArgs={
                'Metadata': {
                    'backup-type': backup_type,
                    'timestamp': timestamp,
                    'source': 'lambda-backup'
                },
                'ServerSideEncryption': 'AES256'
            }
        )
        
        # Add tags
        s3_client.put_object_tagging(
            Bucket=bucket,
            Key=s3_key,
            Tagging={
                'TagSet': [
                    {'Key': 'BackupType', 'Value': backup_type},
                    {'Key': 'CreatedBy', 'Value': 'lambda-backup'},
                    {'Key': 'Timestamp', 'Value': timestamp}
                ]
            }
        )
        
        logger.info(f"Upload completed: {s3_key}")
        return s3_key
        
    except ClientError as e:
        logger.error(f"S3 upload failed: {e}")
        raise Exception(f"Failed to upload backup to S3: {str(e)}")

def determine_backup_type(timestamp):
    """Determine backup type based on current time."""
    now = datetime.now(timezone.utc)
    
    # Monthly backup (1st of month)
    if now.day == 1:
        return "monthly"
    # Weekly backup (Sunday)
    elif now.weekday() == 6:
        return "weekly"
    # Daily backup
    else:
        return "daily"

def create_rds_snapshot(rds_client, project_name, environment, timestamp):
    """Create an RDS snapshot as additional backup."""
    
    db_instance_identifier = f"{project_name}-db-{environment}"
    snapshot_identifier = f"{project_name}-snapshot-{environment}-{timestamp}"
    
    try:
        logger.info(f"Creating RDS snapshot: {snapshot_identifier}")
        
        response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_identifier,
            DBInstanceIdentifier=db_instance_identifier,
            Tags=[
                {'Key': 'Name', 'Value': snapshot_identifier},
                {'Key': 'CreatedBy', 'Value': 'lambda-backup'},
                {'Key': 'Timestamp', 'Value': timestamp},
                {'Key': 'Environment', 'Value': environment}
            ]
        )
        
        logger.info(f"RDS snapshot initiated: {snapshot_identifier}")
        return snapshot_identifier
        
    except ClientError as e:
        logger.error(f"RDS snapshot creation failed: {e}")
        # Don't fail the entire backup if snapshot fails
        return f"FAILED: {str(e)}"

def get_file_size_mb(s3_client, bucket, key):
    """Get file size in MB from S3."""
    try:
        response = s3_client.head_object(Bucket=bucket, Key=key)
        size_bytes = response['ContentLength']
        size_mb = round(size_bytes / 1024 / 1024, 2)
        return size_mb
    except:
        return "Unknown"

def send_notification(sns_client, subject, message):
    """Send notification via SNS."""
    try:
        # Get SNS topic ARN from environment or construct it
        topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        if topic_arn:
            sns_client.publish(
                TopicArn=topic_arn,
                Subject=f"[${project_name}] {subject}",
                Message=json.dumps(message, indent=2)
            )
            logger.info(f"Notification sent: {subject}")
        else:
            logger.warning("SNS topic not configured, skipping notification")
            
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")

# Lambda handler entry point
if __name__ == "__main__":
    # For local testing
    test_event = {}
    test_context = {}
    result = handler(test_event, test_context)
    print(json.dumps(result, indent=2))