-- Create leads table for Pawffeur Smart OS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_ref VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'new' NOT NULL,
    
    -- Customer Info
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Pet Info
    pet_name VARCHAR(255),
    pet_type VARCHAR(100),
    pet_size VARCHAR(100),
    
    -- Ride Info
    ride_type VARCHAR(100) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_window VARCHAR(100),
    is_urgent BOOLEAN DEFAULT FALSE NOT NULL,
    how_heard VARCHAR(255),
    notes TEXT,
    
    -- Source Tracking
    partner_id VARCHAR(100),
    qr_id VARCHAR(100),
    campaign_id VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    source VARCHAR(100),
    
    -- Routing/Assignment & Smart OS
    assigned_to VARCHAR(100),
    priority INTEGER DEFAULT 3 NOT NULL,
    estimated_value NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    follow_up_due TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Consent
    consent BOOLEAN DEFAULT FALSE NOT NULL,
    consent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    consent_text TEXT NOT NULL,
    
    -- Duplicates
    possible_duplicate BOOLEAN DEFAULT FALSE NOT NULL,
    normalized_phone TEXT,
    normalized_email TEXT,
    
    -- Notification
    notification_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance and duplicate checking
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_due ON public.leads(follow_up_due);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_phone ON public.leads(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_email ON public.leads(normalized_email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Block public operations
CREATE POLICY "Block public access" ON public.leads
    FOR ALL
    USING (false)
    WITH CHECK (false);
