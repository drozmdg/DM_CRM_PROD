import json
import boto3
import logging
import os
import psycopg2
import secrets
import string
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function to rotate database and application secrets.
    
    This function:
    1. Generates new secure passwords
    2. Updates database credentials
    3. Updates application secrets
    4. Validates the new credentials
    5. Activates the new secret versions
    """
    
    # Environment variables
    project_name = os.environ.get('PROJECT_NAME', '${project_name}')
    environment = os.environ.get('ENVIRONMENT', '${environment}')
    
    # AWS clients
    secrets_client = boto3.client('secretsmanager')
    rds_client = boto3.client('rds')
    
    try:
        logger.info(f"Starting secret rotation for {project_name} {environment}")
        
        # Rotate database credentials
        db_rotation_result = rotate_database_credentials(
            secrets_client, 
            rds_client, 
            project_name, 
            environment
        )
        
        # Rotate JWT secrets
        jwt_rotation_result = rotate_jwt_secrets(
            secrets_client, 
            project_name, 
            environment
        )
        
        # Rotate application configuration secrets
        app_rotation_result = rotate_app_config_secrets(
            secrets_client, 
            project_name, 
            environment
        )
        
        logger.info("Secret rotation completed successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'SUCCESS',
                'database_rotation': db_rotation_result,
                'jwt_rotation': jwt_rotation_result,
                'app_config_rotation': app_rotation_result
            })
        }
        
    except Exception as e:
        logger.error(f"Secret rotation failed: {str(e)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'FAILED',
                'error': str(e)
            })
        }

def rotate_database_credentials(secrets_client, rds_client, project_name, environment):
    """Rotate database credentials."""
    
    secret_name = f"{project_name}/{environment}/database"
    
    try:
        # Get current secret
        current_secret = secrets_client.get_secret_value(SecretId=secret_name)
        current_data = json.loads(current_secret['SecretString'])
        
        # Generate new password
        new_password = generate_secure_password(16)
        
        # Create new secret version
        new_data = current_data.copy()
        new_data['password'] = new_password
        
        # Test connection with current credentials
        if not test_database_connection(current_data):
            raise Exception("Current database credentials are invalid")
        
        # Update RDS master password
        db_instance_id = f"{project_name}-db-{environment}"
        
        logger.info(f"Updating RDS master password for {db_instance_id}")
        rds_client.modify_db_instance(
            DBInstanceIdentifier=db_instance_id,
            MasterUserPassword=new_password,
            ApplyImmediately=True
        )
        
        # Wait for RDS modification to complete
        wait_for_rds_modification(rds_client, db_instance_id)
        
        # Test connection with new credentials
        if not test_database_connection(new_data):
            raise Exception("New database credentials are invalid")
        
        # Update secret with new password
        secrets_client.put_secret_value(
            SecretId=secret_name,
            SecretString=json.dumps(new_data),
            VersionStage='AWSPENDING'
        )
        
        # Activate new version
        secrets_client.update_secret_version_stage(
            SecretId=secret_name,
            VersionStage='AWSCURRENT',
            MoveToVersionId=secrets_client.describe_secret(SecretId=secret_name)['VersionIdsToStages'].keys().__iter__().__next__()
        )
        
        logger.info("Database credentials rotated successfully")
        return {'status': 'SUCCESS', 'rotated': True}
        
    except Exception as e:
        logger.error(f"Database credential rotation failed: {str(e)}")
        return {'status': 'FAILED', 'error': str(e)}

def rotate_jwt_secrets(secrets_client, project_name, environment):
    """Rotate JWT secrets."""
    
    secret_name = f"{project_name}/{environment}/jwt"
    
    try:
        # Get current secret
        current_secret = secrets_client.get_secret_value(SecretId=secret_name)
        current_data = json.loads(current_secret['SecretString'])
        
        # Generate new JWT secret
        new_jwt_secret = generate_secure_password(64, include_special=True)
        
        # Create new secret version
        new_data = current_data.copy()
        new_data['jwt_secret'] = new_jwt_secret
        
        # Update secret
        secrets_client.put_secret_value(
            SecretId=secret_name,
            SecretString=json.dumps(new_data),
            VersionStage='AWSPENDING'
        )
        
        # Activate new version (JWT rotation requires application restart)
        secrets_client.update_secret_version_stage(
            SecretId=secret_name,
            VersionStage='AWSCURRENT',
            MoveToVersionId=secrets_client.describe_secret(SecretId=secret_name)['VersionIdsToStages'].keys().__iter__().__next__()
        )
        
        logger.info("JWT secrets rotated successfully")
        return {'status': 'SUCCESS', 'rotated': True}
        
    except Exception as e:
        logger.error(f"JWT secret rotation failed: {str(e)}")
        return {'status': 'FAILED', 'error': str(e)}

def rotate_app_config_secrets(secrets_client, project_name, environment):
    """Rotate application configuration secrets."""
    
    secret_name = f"{project_name}/{environment}/app-config"
    
    try:
        # Get current secret
        current_secret = secrets_client.get_secret_value(SecretId=secret_name)
        current_data = json.loads(current_secret['SecretString'])
        
        # Generate new secrets
        new_session_secret = generate_secure_password(64, include_special=True)
        new_encryption_key = generate_secure_password(32, include_special=False)
        
        # Create new secret version
        new_data = current_data.copy()
        new_data['session_secret'] = new_session_secret
        new_data['encryption_key'] = new_encryption_key
        
        # Update secret
        secrets_client.put_secret_value(
            SecretId=secret_name,
            SecretString=json.dumps(new_data),
            VersionStage='AWSPENDING'
        )
        
        # Activate new version
        secrets_client.update_secret_version_stage(
            SecretId=secret_name,
            VersionStage='AWSCURRENT',
            MoveToVersionId=secrets_client.describe_secret(SecretId=secret_name)['VersionIdsToStages'].keys().__iter__().__next__()
        )
        
        logger.info("Application config secrets rotated successfully")
        return {'status': 'SUCCESS', 'rotated': True}
        
    except Exception as e:
        logger.error(f"App config secret rotation failed: {str(e)}")
        return {'status': 'FAILED', 'error': str(e)}

def generate_secure_password(length=16, include_special=True):
    """Generate a secure random password."""
    
    characters = string.ascii_letters + string.digits
    if include_special:
        characters += "!@#$%^&*"
    
    # Ensure password has at least one of each type
    password = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits)
    ]
    
    if include_special:
        password.append(secrets.choice("!@#$%^&*"))
    
    # Fill the rest randomly
    for _ in range(length - len(password)):
        password.append(secrets.choice(characters))
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

def test_database_connection(db_config):
    """Test database connection with given credentials."""
    
    try:
        connection = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            database=db_config['dbname'],
            user=db_config['username'],
            password=db_config['password'],
            connect_timeout=10
        )
        
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return result[0] == 1
        
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        return False

def wait_for_rds_modification(rds_client, db_instance_id, max_wait_time=600):
    """Wait for RDS modification to complete."""
    
    import time
    
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            response = rds_client.describe_db_instances(
                DBInstanceIdentifier=db_instance_id
            )
            
            db_instance = response['DBInstances'][0]
            status = db_instance['DBInstanceStatus']
            
            if status == 'available':
                logger.info(f"RDS instance {db_instance_id} is available")
                return True
            elif status == 'modifying':
                logger.info(f"RDS instance {db_instance_id} is still modifying, waiting...")
                time.sleep(30)
            else:
                logger.warning(f"RDS instance {db_instance_id} status: {status}")
                time.sleep(30)
                
        except Exception as e:
            logger.error(f"Error checking RDS status: {str(e)}")
            time.sleep(30)
    
    raise Exception(f"RDS modification timeout after {max_wait_time} seconds")

def send_notification(message, status):
    """Send notification about rotation status."""
    
    try:
        sns_client = boto3.client('sns')
        topic_arn = os.environ.get('SNS_TOPIC_ARN')
        
        if topic_arn:
            sns_client.publish(
                TopicArn=topic_arn,
                Subject=f"Secret Rotation {status}",
                Message=json.dumps(message, indent=2)
            )
            logger.info(f"Notification sent: {status}")
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