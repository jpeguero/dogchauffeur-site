-- Create chauffeur_logs table for append-only post-trip logs
CREATE TABLE IF NOT EXISTS public.chauffeur_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id VARCHAR(255) NOT NULL,
    passenger_profile_id UUID REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
    chauffeur_id VARCHAR(255) NOT NULL, -- chauffeur email
    event_type VARCHAR(50) DEFAULT 'post_trip_observation' NOT NULL CHECK (event_type IN ('post_trip_observation', 'vaccine_override_exception', 'medical_refusal_exception')),
    behavior_summary VARCHAR(50) NOT NULL CHECK (behavior_summary IN ('calm', 'anxious', 'vocal', 'resistant', 'aggressive', 'other')),
    handling_outcomes JSONB DEFAULT '[]'::jsonb NOT NULL,
    incident_severity VARCHAR(50) NOT NULL CHECK (incident_severity IN ('none', 'minor', 'moderate', 'urgent')),
    recommend_profile_review BOOLEAN DEFAULT false NOT NULL,
    recommend_risk_reassessment BOOLEAN DEFAULT false NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT unique_trip_observation UNIQUE (trip_id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_chauffeur_logs_profile_id ON public.chauffeur_logs(passenger_profile_id);
CREATE INDEX IF NOT EXISTS idx_chauffeur_logs_trip_id ON public.chauffeur_logs(trip_id);

-- Enable RLS
ALTER TABLE public.chauffeur_logs ENABLE ROW LEVEL SECURITY;

-- Block public operations
DROP POLICY IF EXISTS "Block public access" ON public.chauffeur_logs;
CREATE POLICY "Block public access" ON public.chauffeur_logs
    FOR ALL
    USING (false)
    WITH CHECK (false);
