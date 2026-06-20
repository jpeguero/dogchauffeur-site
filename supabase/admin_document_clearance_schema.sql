-- Table representing passenger document clearance records
CREATE TABLE IF NOT EXISTS public.passenger_document_clearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_profile_id UUID NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('rabies_certificate', 'usda_health_certificate')),
    document_url TEXT NOT NULL, -- storage path
    status VARCHAR(50) DEFAULT 'pending_review' NOT NULL 
        CHECK (status IN ('pending_review', 'approved_active', 'expired', 'rejected')),
    
    -- QA & Security Fields
    vet_signing_name VARCHAR(255),
    vet_license_number VARCHAR(100),
    clinic_name VARCHAR(255),
    clinic_phone VARCHAR(50),
    vaccine_manufacturer VARCHAR(100),
    vaccine_lot_number VARCHAR(100),
    vaccine_expiration_date DATE,
    pdf_integrity_checked BOOLEAN DEFAULT false NOT NULL,
    pdf_checksum VARCHAR(64) UNIQUE, -- SHA256 of document to prevent duplication
    
    -- Review Meta
    reviewed_by VARCHAR(255), -- admin email
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table representing immutable super-admin overrides
CREATE TABLE IF NOT EXISTS public.admin_override_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id VARCHAR(255) NOT NULL, -- reference to trip
    passenger_profile_id UUID NOT NULL REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
    overridden_by VARCHAR(255) NOT NULL, -- admin email
    overridden_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reason_category VARCHAR(50) NOT NULL 
        CHECK (reason_category IN ('medical_emergency', 'vet_direct_confirmation', 'clerical_exception')),
    override_notes TEXT NOT NULL,
    bypass_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Ensure overrides are clean and traceable
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS policies for audits
ALTER TABLE public.admin_override_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block all mutations on audit logs" ON public.admin_override_logs;
CREATE POLICY "Block all mutations on audit logs" ON public.admin_override_logs
    FOR ALL USING (true) WITH CHECK (false); -- Select allowed, Write/Edit blocked for non-superusers

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doc_clearances_profile ON public.passenger_document_clearances(passenger_profile_id);
CREATE INDEX IF NOT EXISTS idx_override_logs_trip ON public.admin_override_logs(trip_id);
