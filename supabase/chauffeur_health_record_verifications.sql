-- Create chauffeur_health_record_verifications table for trip-scoped visual safety checks
CREATE TABLE IF NOT EXISTS public.chauffeur_health_record_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id VARCHAR(255) NOT NULL,
    passenger_profile_id UUID REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
    reviewed_by VARCHAR(255) NOT NULL, -- chauffeur email
    reviewed_at TIMESTAMPTZ NOT NULL,
    visual_match_confirmed BOOLEAN DEFAULT false NOT NULL,
    restraint_hardware_confirmed BOOLEAN DEFAULT false NOT NULL,
    photo_capture_attached BOOLEAN DEFAULT false NOT NULL,
    transport_decision VARCHAR(50) NOT NULL CHECK (transport_decision IN ('pass_visual_match', 'fail_visual_mismatch')),
    hold_reason TEXT, -- fail_reason
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_trip_health_verification UNIQUE (trip_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_health_verifications_trip ON public.chauffeur_health_record_verifications(trip_id);
CREATE INDEX IF NOT EXISTS idx_health_verifications_profile ON public.chauffeur_health_record_verifications(passenger_profile_id);

-- Enable RLS
ALTER TABLE public.chauffeur_health_record_verifications ENABLE ROW LEVEL SECURITY;

-- Block public operations
DROP POLICY IF EXISTS "Block public access" ON public.chauffeur_health_record_verifications;
CREATE POLICY "Block public access" ON public.chauffeur_health_record_verifications
    FOR ALL
    USING (false)
    WITH CHECK (false);
