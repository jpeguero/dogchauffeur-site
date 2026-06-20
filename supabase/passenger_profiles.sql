-- Create passenger_profiles table for pet passenger tracking
CREATE TABLE IF NOT EXISTS public.passenger_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_name VARCHAR(255) NOT NULL,
    species VARCHAR(50) NOT NULL CHECK (species IN ('Dog', 'Cat', 'Other')),
    breed VARCHAR(255),
    weight NUMERIC NOT NULL CHECK (weight > 0),
    age_group VARCHAR(50) NOT NULL CHECK (age_group IN ('Puppy/Kitten', 'Adult', 'Senior')),
    temperament VARCHAR(50) NOT NULL CHECK (temperament IN ('Calm', 'Excited', 'Anxious', 'Fearful', 'Reactive')),
    
    -- Risk Flags (Enforced as false in Slice 1)
    escape_risk BOOLEAN DEFAULT false NOT NULL,
    bite_scratch_risk BOOLEAN DEFAULT false NOT NULL,
    medical_risk BOOLEAN DEFAULT false NOT NULL,
    carrier_required BOOLEAN DEFAULT false NOT NULL,
    
    -- Vet details
    emergency_vet_name VARCHAR(255),
    emergency_vet_phone VARCHAR(50),
    emergency_vet_address TEXT,
    
    -- Emergency contacts
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_phone VARCHAR(50) NOT NULL,
    
    -- Consent
    emergency_vet_consent BOOLEAN DEFAULT false NOT NULL,
    emergency_vet_consent_timestamp TIMESTAMPTZ,
    emergency_vet_consent_method VARCHAR(50) CHECK (emergency_vet_consent_method IN ('In-App Checkbox', 'Signed Form Upload', 'Staff Phone Log')),
    
    -- Flexible fields
    species_specific_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    write_in_feedback JSONB DEFAULT '{}'::jsonb NOT NULL,
    suggested_changes JSONB,
    
    -- State and freshness
    lifecycle_state VARCHAR(50) DEFAULT 'Draft' NOT NULL CHECK (lifecycle_state IN ('Draft', 'Active', 'Needs Reconfirmation', 'Suspended', 'Archived')),
    owner_email VARCHAR(255) NOT NULL,
    primary_owner_id UUID,
    last_confirmed_by UUID,
    last_confirmed_at TIMESTAMPTZ,
    freshness_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    safety_requirements_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT chk_vet_consent_timestamp CHECK (emergency_vet_consent = false OR emergency_vet_consent_timestamp IS NOT NULL)
);

-- Index recommendations
CREATE INDEX IF NOT EXISTS idx_passenger_profiles_owner_email ON public.passenger_profiles(owner_email);
CREATE INDEX IF NOT EXISTS idx_passenger_profiles_state ON public.passenger_profiles(lifecycle_state);

-- Enable RLS
ALTER TABLE public.passenger_profiles ENABLE ROW LEVEL SECURITY;

-- Block public access
DROP POLICY IF EXISTS "Block public access" ON public.passenger_profiles;
CREATE POLICY "Block public access" ON public.passenger_profiles
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Create passenger_co_owners join table
CREATE TABLE IF NOT EXISTS public.passenger_co_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passenger_profile_id UUID REFERENCES public.passenger_profiles(id) ON DELETE CASCADE,
    co_owner_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_passenger_co_owner UNIQUE (passenger_profile_id, co_owner_email)
);

CREATE INDEX IF NOT EXISTS idx_passenger_co_owners_email ON public.passenger_co_owners(co_owner_email);
ALTER TABLE public.passenger_co_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block public access" ON public.passenger_co_owners;
CREATE POLICY "Block public access" ON public.passenger_co_owners
    FOR ALL
    USING (false)
    WITH CHECK (false);
