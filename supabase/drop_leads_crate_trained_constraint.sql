-- SQL Migration: Drop crate training constraint if it blocks non-crate-trained lead profiles
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_crate_trained_valid;
