-- SQL Migration: Document Expiry and Warning Tooling

-- 1. Extend passenger_document_clearances table
ALTER TABLE public.passenger_document_clearances
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS calculated_expiry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expiry_notice_sent BOOLEAN DEFAULT false NOT NULL;

-- 2. Add validation constraint on system_policies table for ranges (30 to 1460 days)
ALTER TABLE public.system_policies
DROP CONSTRAINT IF EXISTS chk_document_expiry_bounds;

ALTER TABLE public.system_policies
ADD CONSTRAINT chk_document_expiry_bounds
CHECK (
  policy_key NOT IN ('rabies_max_age_days', 'usda_max_age_days', 'doc_expiry_warning_days') OR
  (value_number >= 30 AND value_number <= 1460)
);

-- 3. Seed default configurations
INSERT INTO public.system_policies (policy_key, value_number, description)
VALUES
  ('rabies_max_age_days', 1095, 'Maximum age in days for Rabies Certificate validity (standard 3 years)'),
  ('usda_max_age_days', 30, 'Maximum age in days for USDA/APHIS Health Certificate validity (standard 30 days)'),
  ('doc_expiry_warning_days', 30, 'Warning window in days to notify and display expiring document alerts')
ON CONFLICT (policy_key) DO UPDATE
SET
  value_number = EXCLUDED.value_number,
  description = EXCLUDED.description;
