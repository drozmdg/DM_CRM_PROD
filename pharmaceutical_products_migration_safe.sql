-- Safe Migration: Add pharmaceutical fields to products table
-- Checks for existing types and columns before creating them

-- Create ENUM types only if they don't exist
DO $$ 
BEGIN
    -- Check and create therapeutic_area type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'therapeutic_area') THEN
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
    END IF;

    -- Check and create drug_class type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'drug_class') THEN
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
    END IF;

    -- Check and create regulatory_status type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regulatory_status') THEN
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
    END IF;

    -- Check and create responsibility_level type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'responsibility_level') THEN
        CREATE TYPE responsibility_level AS ENUM (
          'Primary',
          'Secondary', 
          'Support'
        );
    END IF;
END
$$;

-- Add pharmaceutical fields to products table (only if they don't exist)
DO $$ 
BEGIN
    -- Add therapeutic_area column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'therapeutic_area'
    ) THEN
        ALTER TABLE products ADD COLUMN therapeutic_area therapeutic_area;
    END IF;

    -- Add drug_class column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'drug_class'
    ) THEN
        ALTER TABLE products ADD COLUMN drug_class drug_class;
    END IF;

    -- Add indication column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'indication'
    ) THEN
        ALTER TABLE products ADD COLUMN indication TEXT;
    END IF;

    -- Add regulatory_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'regulatory_status'
    ) THEN
        ALTER TABLE products ADD COLUMN regulatory_status regulatory_status DEFAULT 'Pre-clinical';
    END IF;
END
$$;

-- Add responsibility level to team_products junction table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_products' AND column_name = 'responsibility_level'
    ) THEN
        ALTER TABLE team_products ADD COLUMN responsibility_level responsibility_level DEFAULT 'Primary';
    END IF;
END
$$;

-- Create indexes for the new fields (only if they don't exist)
DO $$ 
BEGIN
    -- Index for therapeutic_area
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_therapeutic_area'
    ) THEN
        CREATE INDEX idx_products_therapeutic_area ON products(therapeutic_area);
    END IF;

    -- Index for drug_class
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_drug_class'
    ) THEN
        CREATE INDEX idx_products_drug_class ON products(drug_class);
    END IF;

    -- Index for regulatory_status
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'idx_products_regulatory_status'
    ) THEN
        CREATE INDEX idx_products_regulatory_status ON products(regulatory_status);
    END IF;

    -- Index for responsibility_level
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'team_products' AND indexname = 'idx_team_products_responsibility_level'
    ) THEN
        CREATE INDEX idx_team_products_responsibility_level ON team_products(responsibility_level);
    END IF;
END
$$;

-- Grant usage on ENUM types (safe to run multiple times)
GRANT USAGE ON TYPE therapeutic_area TO anon, authenticated, public;
GRANT USAGE ON TYPE drug_class TO anon, authenticated, public;
GRANT USAGE ON TYPE regulatory_status TO anon, authenticated, public;
GRANT USAGE ON TYPE responsibility_level TO anon, authenticated, public;

-- Update table comments
COMMENT ON TABLE products IS 'Stores pharmaceutical products offered to customers, managed by teams with specific responsibilities';

-- Add column comments only if columns exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'therapeutic_area'
    ) THEN
        COMMENT ON COLUMN products.therapeutic_area IS 'Medical therapeutic area/specialty the product targets';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'drug_class'
    ) THEN
        COMMENT ON COLUMN products.drug_class IS 'Classification of the pharmaceutical product type';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'indication'
    ) THEN
        COMMENT ON COLUMN products.indication IS 'Medical condition or indication the product treats';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'regulatory_status'
    ) THEN
        COMMENT ON COLUMN products.regulatory_status IS 'Current regulatory development status';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_products' AND column_name = 'responsibility_level'
    ) THEN
        COMMENT ON COLUMN team_products.responsibility_level IS 'Level of team responsibility for the product (Primary, Secondary, Support)';
    END IF;
END
$$;

-- Verify the migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE therapeutic_area IS NOT NULL) as products_with_therapeutic_area,
  COUNT(*) FILTER (WHERE drug_class IS NOT NULL) as products_with_drug_class,
  COUNT(*) FILTER (WHERE regulatory_status IS NOT NULL) as products_with_regulatory_status
FROM products;

-- Show available enum values for verification
SELECT 
  'therapeutic_area' as enum_type,
  unnest(enum_range(NULL::therapeutic_area))::text as values
UNION ALL
SELECT 
  'drug_class' as enum_type,
  unnest(enum_range(NULL::drug_class))::text as values
UNION ALL
SELECT 
  'regulatory_status' as enum_type,
  unnest(enum_range(NULL::regulatory_status))::text as values
UNION ALL
SELECT 
  'responsibility_level' as enum_type,
  unnest(enum_range(NULL::responsibility_level))::text as values
ORDER BY enum_type, values;