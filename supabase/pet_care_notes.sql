-- Create pet_care_notes table for internal pet care tracking
CREATE TABLE IF NOT EXISTS public.pet_care_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    normalized_phone VARCHAR(50),
    normalized_email VARCHAR(255),
    pet_name VARCHAR(255) NOT NULL,
    care_note_raw TEXT,
    driver_instruction TEXT,
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'replaced', 'archived')),
    supersedes UUID REFERENCES public.pet_care_notes(id) ON DELETE SET NULL,
    created_by VARCHAR(255) DEFAULT 'system' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_confirmed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure at least one contact key exists
    CONSTRAINT chk_at_least_one_contact CHECK (normalized_phone IS NOT NULL OR normalized_email IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pet_care_notes_lead_id ON public.pet_care_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_pet_care_notes_status ON public.pet_care_notes(status);

-- Partial unique indexes to prevent multiple active notes for the same owner/pet
CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_care_notes_active_phone_pet 
ON public.pet_care_notes (normalized_phone, lower(pet_name)) 
WHERE status = 'active' AND normalized_phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_care_notes_active_email_pet 
ON public.pet_care_notes (normalized_email, lower(pet_name)) 
WHERE status = 'active' AND normalized_email IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.pet_care_notes ENABLE ROW LEVEL SECURITY;

-- Block public operations
DROP POLICY IF EXISTS "Block public access" ON public.pet_care_notes;
CREATE POLICY "Block public access" ON public.pet_care_notes
    FOR ALL
    USING (false)
    WITH CHECK (false);
