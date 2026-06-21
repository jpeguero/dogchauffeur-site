-- SQL migration to add safety_attestations and trip_intent to public.trips table
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS trip_intent VARCHAR(50) DEFAULT 'standard' NOT NULL CHECK (trip_intent IN ('standard', 'vaccine_appointment', 'vet_visit', 'grooming_social')),
  ADD COLUMN IF NOT EXISTS safety_attestations JSONB DEFAULT NULL;
