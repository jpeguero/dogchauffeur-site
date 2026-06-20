-- Create system_policies table to store key-value configuration values dynamically
CREATE TABLE IF NOT EXISTS public.system_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key TEXT NOT NULL UNIQUE,              -- e.g. 'override_max_hours'
    value_number NUMERIC,
    value_text TEXT,
    value_boolean BOOLEAN,
    description TEXT,
    updated_by TEXT,                               -- email or user id
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial policies to match current behavior
INSERT INTO public.system_policies (policy_key, value_number, description)
VALUES
    ('override_max_hours', 12, 'Maximum duration (hours) for emergency overrides'),
    ('override_min_audit_chars', 50, 'Minimum required characters in override audit notes')
ON CONFLICT (policy_key) DO UPDATE
SET 
    value_number = EXCLUDED.value_number,
    description = EXCLUDED.description;
