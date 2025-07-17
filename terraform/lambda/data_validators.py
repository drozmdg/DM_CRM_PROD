#!/usr/bin/env python3
"""
Data Validators Module
DM_CRM Sales Dashboard - Data Migration Validation

Comprehensive data validation functions for ensuring data integrity
during migration from Supabase to AWS RDS PostgreSQL.
"""

import logging
from typing import Dict, Any, List, Tuple, Optional
import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)

class DataValidators:
    """Data validation utilities for migration integrity checks"""
    
    def __init__(self):
        self.validation_rules = self._define_validation_rules()
    
    def _define_validation_rules(self) -> Dict[str, Dict[str, Any]]:
        """Define validation rules for each table"""
        
        return {
            'users': {
                'required_columns': ['id', 'email', 'created_at'],
                'unique_columns': ['email'],
                'not_null_columns': ['id', 'email'],
                'foreign_keys': [],
                'data_checks': [
                    {'column': 'email', 'check': 'email_format'},
                    {'column': 'created_at', 'check': 'valid_timestamp'}
                ]
            },
            'roles': {
                'required_columns': ['id', 'name'],
                'unique_columns': ['name'],
                'not_null_columns': ['id', 'name'],
                'foreign_keys': [],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'}
                ]
            },
            'user_roles': {
                'required_columns': ['user_id', 'role_id'],
                'unique_columns': [],
                'not_null_columns': ['user_id', 'role_id'],
                'foreign_keys': [
                    {'column': 'user_id', 'references': 'users.id'},
                    {'column': 'role_id', 'references': 'roles.id'}
                ],
                'data_checks': []
            },
            'customers': {
                'required_columns': ['id', 'name', 'created_at'],
                'unique_columns': [],
                'not_null_columns': ['id', 'name'],
                'foreign_keys': [],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'},
                    {'column': 'email', 'check': 'email_format_optional'},
                    {'column': 'created_at', 'check': 'valid_timestamp'}
                ]
            },
            'contacts': {
                'required_columns': ['id', 'name', 'customer_id'],
                'unique_columns': [],
                'not_null_columns': ['id', 'name', 'customer_id'],
                'foreign_keys': [
                    {'column': 'customer_id', 'references': 'customers.id'}
                ],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'},
                    {'column': 'email', 'check': 'email_format_optional'}
                ]
            },
            'teams': {
                'required_columns': ['id', 'name'],
                'unique_columns': [],
                'not_null_columns': ['id', 'name'],
                'foreign_keys': [],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'}
                ]
            },
            'services': {
                'required_columns': ['id', 'name', 'customer_id'],
                'unique_columns': [],
                'not_null_columns': ['id', 'name', 'customer_id'],
                'foreign_keys': [
                    {'column': 'customer_id', 'references': 'customers.id'}
                ],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'},
                    {'column': 'monthly_hours', 'check': 'positive_number_optional'}
                ]
            },
            'processes': {
                'required_columns': ['id', 'name', 'customer_id'],
                'unique_columns': [],
                'not_null_columns': ['id', 'name', 'customer_id'],
                'foreign_keys': [
                    {'column': 'customer_id', 'references': 'customers.id'}
                ],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'},
                    {'column': 'status', 'check': 'valid_process_status'}
                ]
            },
            'documents': {
                'required_columns': ['id', 'name', 'file_path'],
                'unique_columns': [],
                'not_null_columns': ['id', 'name', 'file_path'],
                'foreign_keys': [],
                'data_checks': [
                    {'column': 'name', 'check': 'non_empty_string'},
                    {'column': 'file_path', 'check': 'non_empty_string'},
                    {'column': 'file_size', 'check': 'positive_number_optional'}
                ]
            },
            'timeline': {
                'required_columns': ['id', 'title', 'created_at'],
                'unique_columns': [],
                'not_null_columns': ['id', 'title'],
                'foreign_keys': [],
                'data_checks': [
                    {'column': 'title', 'check': 'non_empty_string'},
                    {'column': 'created_at', 'check': 'valid_timestamp'}
                ]
            }
        }
    
    def validate_source_data_integrity(self, cursor) -> Dict[str, Any]:
        """Validate source database data integrity"""
        
        logger.info("Starting source data integrity validation")
        
        validation_results = {}
        
        for table_name, rules in self.validation_rules.items():
            logger.info(f"Validating table: {table_name}")
            
            try:
                table_results = self._validate_table(cursor, table_name, rules)
                validation_results[table_name] = table_results
                
                if table_results['passed']:
                    logger.info(f"✓ Table {table_name} passed validation")
                else:
                    logger.warning(f"✗ Table {table_name} failed validation: {table_results['errors']}")
                    
            except psycopg2.Error as e:
                error_msg = f"Could not validate table {table_name}: {str(e)}"
                logger.error(error_msg)
                validation_results[table_name] = {
                    'passed': False,
                    'errors': [error_msg],
                    'warnings': [],
                    'record_count': 0
                }
        
        return validation_results
    
    def validate_target_data_integrity(self, cursor) -> Dict[str, Any]:
        """Validate target database data integrity after migration"""
        
        logger.info("Starting target data integrity validation")
        return self.validate_source_data_integrity(cursor)  # Same validation logic
    
    def _validate_table(self, cursor, table_name: str, rules: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a single table according to its rules"""
        
        result = {
            'passed': True,
            'errors': [],
            'warnings': [],
            'record_count': 0
        }
        
        # Check if table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            )
        """, (table_name,))
        
        if not cursor.fetchone()[0]:
            result['errors'].append(f"Table {table_name} does not exist")
            result['passed'] = False
            return result
        
        # Get table record count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        result['record_count'] = cursor.fetchone()[0]
        
        if result['record_count'] == 0:
            result['warnings'].append(f"Table {table_name} is empty")
            return result
        
        # Check required columns exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = %s
        """, (table_name,))
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        for required_col in rules.get('required_columns', []):
            if required_col not in existing_columns:
                result['errors'].append(f"Required column {required_col} missing from {table_name}")
                result['passed'] = False
        
        # Validate not null constraints
        for not_null_col in rules.get('not_null_columns', []):
            if not_null_col in existing_columns:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name} WHERE {not_null_col} IS NULL")
                null_count = cursor.fetchone()[0]
                
                if null_count > 0:
                    result['errors'].append(f"Column {not_null_col} has {null_count} NULL values")
                    result['passed'] = False
        
        # Validate unique constraints
        for unique_col in rules.get('unique_columns', []):
            if unique_col in existing_columns:
                cursor.execute(f"""
                    SELECT {unique_col}, COUNT(*) 
                    FROM {table_name} 
                    WHERE {unique_col} IS NOT NULL 
                    GROUP BY {unique_col} 
                    HAVING COUNT(*) > 1
                """)
                
                duplicates = cursor.fetchall()
                if duplicates:
                    result['errors'].append(f"Column {unique_col} has duplicate values: {len(duplicates)} groups")
                    result['passed'] = False
        
        # Validate foreign key relationships (referential integrity)
        for fk in rules.get('foreign_keys', []):
            column = fk['column']
            reference = fk['references']
            ref_table, ref_column = reference.split('.')
            
            if column in existing_columns:
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} t1 
                    LEFT JOIN {ref_table} t2 ON t1.{column} = t2.{ref_column}
                    WHERE t1.{column} IS NOT NULL 
                    AND t2.{ref_column} IS NULL
                """)
                
                orphaned_count = cursor.fetchone()[0]
                if orphaned_count > 0:
                    result['errors'].append(f"Foreign key {column} has {orphaned_count} orphaned references")
                    result['passed'] = False
        
        # Validate data checks
        for data_check in rules.get('data_checks', []):
            column = data_check['column']
            check_type = data_check['check']
            
            if column in existing_columns:
                check_result = self._perform_data_check(cursor, table_name, column, check_type)
                
                if not check_result['passed']:
                    result['errors'].extend(check_result['errors'])
                    result['passed'] = False
                
                if check_result['warnings']:
                    result['warnings'].extend(check_result['warnings'])
        
        return result
    
    def _perform_data_check(self, cursor, table_name: str, column: str, check_type: str) -> Dict[str, Any]:
        """Perform specific data validation checks"""
        
        result = {
            'passed': True,
            'errors': [],
            'warnings': []
        }
        
        try:
            if check_type == 'email_format':
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column} IS NOT NULL 
                    AND {column} !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{{2,}}$'
                """)
                
                invalid_count = cursor.fetchone()[0]
                if invalid_count > 0:
                    result['errors'].append(f"{invalid_count} invalid email formats in {column}")
                    result['passed'] = False
            
            elif check_type == 'email_format_optional':
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column} IS NOT NULL 
                    AND {column} != ''
                    AND {column} !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{{2,}}$'
                """)
                
                invalid_count = cursor.fetchone()[0]
                if invalid_count > 0:
                    result['warnings'].append(f"{invalid_count} invalid email formats in optional {column}")
            
            elif check_type == 'non_empty_string':
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column} IS NOT NULL 
                    AND TRIM({column}) = ''
                """)
                
                empty_count = cursor.fetchone()[0]
                if empty_count > 0:
                    result['errors'].append(f"{empty_count} empty strings in {column}")
                    result['passed'] = False
            
            elif check_type == 'valid_timestamp':
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column} IS NOT NULL 
                    AND {column} > NOW() + INTERVAL '1 day'
                """)
                
                future_count = cursor.fetchone()[0]
                if future_count > 0:
                    result['warnings'].append(f"{future_count} future timestamps in {column}")
            
            elif check_type == 'positive_number_optional':
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column} IS NOT NULL 
                    AND {column} < 0
                """)
                
                negative_count = cursor.fetchone()[0]
                if negative_count > 0:
                    result['warnings'].append(f"{negative_count} negative values in {column}")
            
            elif check_type == 'valid_process_status':
                valid_statuses = ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']
                
                cursor.execute(f"""
                    SELECT COUNT(*) 
                    FROM {table_name} 
                    WHERE {column} IS NOT NULL 
                    AND {column} NOT IN %s
                """, (tuple(valid_statuses),))
                
                invalid_status_count = cursor.fetchone()[0]
                if invalid_status_count > 0:
                    result['errors'].append(f"{invalid_status_count} invalid status values in {column}")
                    result['passed'] = False
            
        except psycopg2.Error as e:
            result['errors'].append(f"Data check {check_type} failed: {str(e)}")
            result['passed'] = False
        
        return result
    
    def compare_table_schemas(self, source_cursor, target_cursor, table_name: str) -> Dict[str, Any]:
        """Compare schema between source and target tables"""
        
        logger.info(f"Comparing schema for table: {table_name}")
        
        result = {
            'table_name': table_name,
            'schemas_match': True,
            'differences': [],
            'source_columns': {},
            'target_columns': {}
        }
        
        # Get source schema
        source_cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        source_columns = {row[0]: {'data_type': row[1], 'is_nullable': row[2], 'column_default': row[3]} 
                         for row in source_cursor.fetchall()}
        result['source_columns'] = source_columns
        
        # Get target schema
        target_cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        target_columns = {row[0]: {'data_type': row[1], 'is_nullable': row[2], 'column_default': row[3]} 
                         for row in target_cursor.fetchall()}
        result['target_columns'] = target_columns
        
        # Compare columns
        all_columns = set(source_columns.keys()) | set(target_columns.keys())
        
        for column in all_columns:
            if column not in source_columns:
                result['differences'].append(f"Column {column} exists in target but not source")
                result['schemas_match'] = False
            elif column not in target_columns:
                result['differences'].append(f"Column {column} exists in source but not target")
                result['schemas_match'] = False
            else:
                # Compare column properties
                source_col = source_columns[column]
                target_col = target_columns[column]
                
                if source_col['data_type'] != target_col['data_type']:
                    result['differences'].append(
                        f"Column {column} data type mismatch: source={source_col['data_type']}, "
                        f"target={target_col['data_type']}"
                    )
                    result['schemas_match'] = False
                
                if source_col['is_nullable'] != target_col['is_nullable']:
                    result['differences'].append(
                        f"Column {column} nullable mismatch: source={source_col['is_nullable']}, "
                        f"target={target_col['is_nullable']}"
                    )
                    result['schemas_match'] = False
        
        return result
    
    def generate_data_quality_report(self, validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a comprehensive data quality report"""
        
        report = {
            'report_generated': True,
            'overall_quality_score': 0,
            'total_tables': len(validation_results),
            'tables_passed': 0,
            'tables_failed': 0,
            'total_errors': 0,
            'total_warnings': 0,
            'table_summary': {},
            'recommendations': []
        }
        
        for table_name, table_result in validation_results.items():
            if table_result['passed']:
                report['tables_passed'] += 1
            else:
                report['tables_failed'] += 1
            
            error_count = len(table_result.get('errors', []))
            warning_count = len(table_result.get('warnings', []))
            
            report['total_errors'] += error_count
            report['total_warnings'] += warning_count
            
            report['table_summary'][table_name] = {
                'passed': table_result['passed'],
                'record_count': table_result.get('record_count', 0),
                'error_count': error_count,
                'warning_count': warning_count,
                'quality_score': self._calculate_table_quality_score(table_result)
            }
        
        # Calculate overall quality score
        if report['total_tables'] > 0:
            passed_ratio = report['tables_passed'] / report['total_tables']
            error_penalty = min(report['total_errors'] * 0.1, 0.5)
            warning_penalty = min(report['total_warnings'] * 0.05, 0.2)
            
            report['overall_quality_score'] = max(0, (passed_ratio - error_penalty - warning_penalty) * 100)
        
        # Generate recommendations
        if report['total_errors'] > 0:
            report['recommendations'].append("Address all data errors before proceeding with migration")
        
        if report['total_warnings'] > 10:
            report['recommendations'].append("Review and clean up data warnings for better quality")
        
        if report['overall_quality_score'] < 80:
            report['recommendations'].append("Data quality is below recommended threshold (80%)")
        
        return report
    
    def _calculate_table_quality_score(self, table_result: Dict[str, Any]) -> float:
        """Calculate quality score for a single table"""
        
        if not table_result['passed']:
            return 0.0
        
        error_count = len(table_result.get('errors', []))
        warning_count = len(table_result.get('warnings', []))
        record_count = table_result.get('record_count', 1)
        
        # Base score of 100
        score = 100.0
        
        # Deduct for errors and warnings
        error_penalty = (error_count / max(record_count, 1)) * 100
        warning_penalty = (warning_count / max(record_count, 1)) * 50
        
        score = max(0, score - error_penalty - warning_penalty)
        
        return round(score, 2)