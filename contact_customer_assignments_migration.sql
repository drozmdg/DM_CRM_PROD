-- Migration to enable Internal contacts to be assigned to multiple customers
-- This creates a many-to-many relationship between contacts and customers for Internal contact types

-- Step 1: Create the junction table for contact-customer assignments
CREATE TABLE IF NOT EXISTS contact_customer_assignments (
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by TEXT, -- Optional: track who made the assignment
    PRIMARY KEY (contact_id, customer_id)
);

-- Step 2: Create indexes for better query performance
CREATE INDEX idx_contact_customer_assignments_contact_id ON contact_customer_assignments(contact_id);
CREATE INDEX idx_contact_customer_assignments_customer_id ON contact_customer_assignments(customer_id);

-- Step 3: Make customerId nullable in contacts table for Internal contacts
-- First, we need to migrate existing Internal contacts to the junction table
INSERT INTO contact_customer_assignments (contact_id, customer_id, assigned_at)
SELECT id, customer_id, created_at
FROM contacts
WHERE type = 'Internal' AND customer_id IS NOT NULL;

-- Step 4: Alter the contacts table to make customer_id nullable
-- Note: This needs to be done carefully to preserve existing relationships
ALTER TABLE contacts ALTER COLUMN customer_id DROP NOT NULL;

-- Step 5: Add a constraint to ensure non-Internal contacts still have a customer_id
ALTER TABLE contacts ADD CONSTRAINT check_customer_id_required 
CHECK (type = 'Internal' OR customer_id IS NOT NULL);

-- Step 6: Create a view to simplify querying contacts with their assignments
CREATE OR REPLACE VIEW v_contact_assignments AS
SELECT 
    c.*,
    COALESCE(
        ARRAY_AGG(
            DISTINCT jsonb_build_object(
                'customer_id', cca.customer_id,
                'customer_name', cust.name,
                'assigned_at', cca.assigned_at
            )
        ) FILTER (WHERE cca.customer_id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as customer_assignments
FROM contacts c
LEFT JOIN contact_customer_assignments cca ON c.id = cca.contact_id
LEFT JOIN customers cust ON cca.customer_id = cust.id
GROUP BY c.id, c.name, c.title, c.email, c.phone, c.role, c.type, c.customer_id, c.created_at;

-- Step 7: Create helper functions for managing internal contact assignments
CREATE OR REPLACE FUNCTION assign_internal_contact_to_customer(
    p_contact_id TEXT,
    p_customer_id TEXT,
    p_assigned_by TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_contact_type TEXT;
BEGIN
    -- Check if contact is Internal type
    SELECT type INTO v_contact_type FROM contacts WHERE id = p_contact_id;
    
    IF v_contact_type != 'Internal' THEN
        RAISE EXCEPTION 'Only Internal contacts can be assigned to multiple customers';
    END IF;
    
    -- Insert the assignment (ON CONFLICT DO NOTHING to handle duplicates)
    INSERT INTO contact_customer_assignments (contact_id, customer_id, assigned_by)
    VALUES (p_contact_id, p_customer_id, p_assigned_by)
    ON CONFLICT (contact_id, customer_id) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unassign_internal_contact_from_customer(
    p_contact_id TEXT,
    p_customer_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM contact_customer_assignments 
    WHERE contact_id = p_contact_id AND customer_id = p_customer_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update the function to get all contacts for a customer (including assigned internal contacts)
CREATE OR REPLACE FUNCTION get_customer_contacts(p_customer_id TEXT)
RETURNS TABLE (
    id TEXT,
    customer_id TEXT,
    name TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    type TEXT,
    created_at TIMESTAMP,
    is_assigned BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Get contacts directly belonging to the customer
    SELECT 
        c.id,
        c.customer_id,
        c.name,
        c.title,
        c.email,
        c.phone,
        c.role,
        c.type,
        c.created_at,
        FALSE as is_assigned
    FROM contacts c
    WHERE c.customer_id = p_customer_id
    
    UNION
    
    -- Get Internal contacts assigned to this customer
    SELECT 
        c.id,
        p_customer_id as customer_id, -- Show as if belonging to this customer
        c.name,
        c.title,
        c.email,
        c.phone,
        c.role,
        c.type,
        c.created_at,
        TRUE as is_assigned
    FROM contacts c
    INNER JOIN contact_customer_assignments cca ON c.id = cca.contact_id
    WHERE cca.customer_id = p_customer_id AND c.type = 'Internal'
    
    ORDER BY type, name;
END;
$$ LANGUAGE plpgsql;

-- Add comment to explain the new structure
COMMENT ON TABLE contact_customer_assignments IS 'Junction table to enable Internal contacts to be assigned to multiple customers';
COMMENT ON COLUMN contact_customer_assignments.contact_id IS 'Reference to the Internal contact';
COMMENT ON COLUMN contact_customer_assignments.customer_id IS 'Reference to the customer this contact is assigned to';
COMMENT ON COLUMN contact_customer_assignments.assigned_at IS 'Timestamp when the assignment was made';
COMMENT ON COLUMN contact_customer_assignments.assigned_by IS 'Optional: User ID who made the assignment';