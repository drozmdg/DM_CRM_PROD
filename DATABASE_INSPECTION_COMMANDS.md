# Database Inspection Commands

You can run these commands to inspect the PostgreSQL database and verify the migration work:

## 1. Connect to Database Interactively
```bash
docker exec -it sales-dashboard-db-dev psql -U postgres -d sales_dashboard_dev
```

## 2. Basic Database Information
```sql
-- List all tables
\dt

-- Get table sizes
SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats WHERE tablename IN ('customers','contacts','processes','services') ORDER BY tablename,attname;

-- Show table structure
\d customers
\d contacts  
\d processes
\d services
```

## 3. Verify Migrated Data
```sql
-- Count records in core tables
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL SELECT 'processes', COUNT(*) FROM processes  
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'documents', COUNT(*) FROM documents;

-- Show customer data
SELECT id, name, phase, contract_start_date, contract_end_date, active 
FROM customers ORDER BY name;

-- Show contact data
SELECT id, name, type, title, email 
FROM contacts ORDER BY type, name;

-- Show process data  
SELECT id, name, status, sdlc_stage, customer_id 
FROM processes ORDER BY name;
```

## 4. Verify Relationships
```sql
-- Customer-Process relationships
SELECT 
  c.name as customer_name, 
  COUNT(p.id) as process_count,
  COUNT(s.id) as service_count
FROM customers c 
LEFT JOIN processes p ON c.id = p.customer_id 
LEFT JOIN services s ON c.id = s.customer_id 
GROUP BY c.id, c.name 
ORDER BY c.name;

-- Foreign key integrity check
SELECT 
  p.name as process_name,
  c.name as customer_name
FROM processes p
JOIN customers c ON p.customer_id = c.id
ORDER BY c.name, p.name;
```

## 5. Data Quality Checks
```sql
-- Check for null timestamps (should be 0)
SELECT COUNT(*) as null_created_at FROM customers WHERE created_at IS NULL;
SELECT COUNT(*) as null_updated_at FROM customers WHERE updated_at IS NULL;

-- Check data consistency
SELECT 
  'customers' as table_name,
  MIN(created_at) as earliest_record,
  MAX(updated_at) as latest_update,
  COUNT(*) as total_records
FROM customers;
```

## 6. Health Check Function
```sql
-- Test the health check function
SELECT health_check();

-- Check if all core tables have data
SELECT 
  'customers' as table_name, 
  CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'EMPTY' END as status
FROM customers
UNION ALL
SELECT 'contacts', CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'EMPTY' END FROM contacts
UNION ALL  
SELECT 'processes', CASE WHEN COUNT(*) > 0 THEN 'HAS_DATA' ELSE 'EMPTY' END FROM processes;
```

## 7. Performance Verification
```sql
-- Test query performance (should be fast)
EXPLAIN ANALYZE SELECT 
  c.name,
  COUNT(p.id) as processes,
  COUNT(s.id) as services  
FROM customers c
LEFT JOIN processes p ON c.id = p.customer_id
LEFT JOIN services s ON c.id = s.customer_id
GROUP BY c.id, c.name;
```

## 8. Exit Database
```sql
\q
```

## Expected Results

Based on successful migration:
- **4 customers**: Beta Pharma Company, Delta Pharma, Sigma Pharma, Zeta Science
- **13 contacts**: Mix of Client, Internal, and Vendor contacts
- **5 processes**: Various data integration processes
- **10 services**: Service agreements totaling 180+ hours
- **0 documents**: Document migration had issues (column mismatch)

## Migration Source Files Location
```bash
ls -la database/migration-data/
cat database/migration-data/comprehensive-migration-report.md
```