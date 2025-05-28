-- Create communications table
CREATE TABLE IF NOT EXISTS public.communications (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'other')),
    subject TEXT NOT NULL,
    notes TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on contact_id for better query performance
CREATE INDEX IF NOT EXISTS idx_communications_contact_id ON public.communications(contact_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all for now, can be refined later)
CREATE POLICY "Allow all operations on communications" ON public.communications
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON TABLE public.communications TO anon;
GRANT ALL ON TABLE public.communications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.communications_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.communications_id_seq TO authenticated;
