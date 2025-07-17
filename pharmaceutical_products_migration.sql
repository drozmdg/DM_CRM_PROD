-- Migration: Add pharmaceutical fields to products table
-- Run this in Supabase SQL Editor after the products table exists

-- Create ENUM types for pharmaceutical fields
CREATE TYPE therapeutic_area AS ENUM (
  'Oncology',
  'Cardiology', 
  'Neurology',
  'Immunology',
  'Infectious Disease',
  'Endocrinology',
  'Gastroenterology',
  'Respiratory',
  'Dermatology',
  'Ophthalmology',
  'Psychiatry',
  'Rheumatology',
  'Rare Disease',
  'Other'
);

CREATE TYPE drug_class AS ENUM (
  'Monoclonal Antibody',
  'Small Molecule',
  'Protein Therapeutic',
  'Gene Therapy',
  'Cell Therapy',
  'Vaccine',
  'Biosimilar',
  'Combination Therapy',
  'Radiopharmaceutical',
  'Medical Device',
  'Diagnostic',
  'Other'
);

CREATE TYPE regulatory_status AS ENUM (
  'Approved',
  'Phase III',
  'Phase II', 
  'Phase I',
  'Pre-clinical',
  'Discovery',
  'Discontinued',
  'On Hold'
);

CREATE TYPE responsibility_level AS ENUM (
  'Primary',
  'Secondary', 
  'Support'
);

-- Add pharmaceutical fields to products table
ALTER TABLE products 
ADD COLUMN therapeutic_area therapeutic_area,
ADD COLUMN drug_class drug_class,
ADD COLUMN indication TEXT,
ADD COLUMN regulatory_status regulatory_status DEFAULT 'Pre-clinical';

-- Add responsibility level to team_products junction table
ALTER TABLE team_products 
ADD COLUMN responsibility_level responsibility_level DEFAULT 'Primary';

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_products_therapeutic_area ON products(therapeutic_area);
CREATE INDEX IF NOT EXISTS idx_products_drug_class ON products(drug_class);
CREATE INDEX IF NOT EXISTS idx_products_regulatory_status ON products(regulatory_status);
CREATE INDEX IF NOT EXISTS idx_team_products_responsibility_level ON team_products(responsibility_level);

-- Grant usage on new ENUM types
GRANT USAGE ON TYPE therapeutic_area TO anon, authenticated, public;
GRANT USAGE ON TYPE drug_class TO anon, authenticated, public;
GRANT USAGE ON TYPE regulatory_status TO anon, authenticated, public;
GRANT USAGE ON TYPE responsibility_level TO anon, authenticated, public;

-- Update table comments
COMMENT ON TABLE products IS 'Stores pharmaceutical products offered to customers, managed by teams with specific responsibilities';
COMMENT ON COLUMN products.therapeutic_area IS 'Medical therapeutic area/specialty the product targets';
COMMENT ON COLUMN products.drug_class IS 'Classification of the pharmaceutical product type';
COMMENT ON COLUMN products.indication IS 'Medical condition or indication the product treats';
COMMENT ON COLUMN products.regulatory_status IS 'Current regulatory development status';
COMMENT ON COLUMN team_products.responsibility_level IS 'Level of team responsibility for the product (Primary, Secondary, Support)';

-- Sample data update (optional)
UPDATE products 
SET 
  therapeutic_area = 'Oncology',
  drug_class = 'Monoclonal Antibody',
  indication = 'Treatment of various cancer types',
  regulatory_status = 'Approved'
WHERE name = 'Data Analytics Platform';

UPDATE products 
SET 
  therapeutic_area = 'Cardiology',
  drug_class = 'Small Molecule', 
  indication = 'Management of cardiovascular conditions',
  regulatory_status = 'Phase III'
WHERE name = 'Customer Data Integration';

-- Verify the migration
SELECT 
  'Pharmaceutical fields added successfully' as status,
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE therapeutic_area IS NOT NULL) as products_with_therapeutic_area
FROM products;