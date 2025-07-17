-- Add TPA (Third-Party Agreement) fields to processes table
ALTER TABLE processes
ADD COLUMN IF NOT EXISTS is_tpa_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tpa_responsible_contact_id TEXT REFERENCES contacts(id),
ADD COLUMN IF NOT EXISTS tpa_data_source TEXT,
ADD COLUMN IF NOT EXISTS tpa_start_date DATE,
ADD COLUMN IF NOT EXISTS tpa_end_date DATE;

-- Add check constraint to ensure end date is after start date
ALTER TABLE processes
ADD CONSTRAINT check_tpa_dates 
CHECK (tpa_end_date IS NULL OR tpa_start_date IS NULL OR tpa_end_date >= tpa_start_date);

-- Add index on TPA required field for filtering
CREATE INDEX IF NOT EXISTS idx_processes_is_tpa_required ON processes(is_tpa_required);

-- Add index on TPA responsible contact for joins
CREATE INDEX IF NOT EXISTS idx_processes_tpa_responsible_contact_id ON processes(tpa_responsible_contact_id);