-- DDL Migration: Create Ride Chat Tables
-- Adds public.ride_conversations and public.ride_messages tables in Supabase.

-- 1. Create ride_conversations table
CREATE TABLE IF NOT EXISTS public.ride_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  booking_ref VARCHAR(50) NULL,
  trip_id VARCHAR(50) NULL,
  assigned_driver_email VARCHAR(255) NULL,
  assigned_driver_name VARCHAR(255) NULL,
  owner_access_token_hash VARCHAR(255) NOT NULL UNIQUE,
  owner_access_expires_at TIMESTAMP WITH TIME ZONE NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexing on foreign keys & tokens
CREATE INDEX IF NOT EXISTS idx_ride_conversations_lead_id ON public.ride_conversations(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_conversations_booking_ref ON public.ride_conversations(booking_ref) WHERE booking_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_conversations_trip_id ON public.ride_conversations(trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_conversations_driver_email ON public.ride_conversations(assigned_driver_email) WHERE assigned_driver_email IS NOT NULL;

-- 2. Create ride_messages table
CREATE TABLE IF NOT EXISTS public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ride_conversations(id) ON DELETE CASCADE,
  sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('owner', 'driver', 'admin')),
  sender_display_name VARCHAR(255) NOT NULL,
  message_body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  visible_to_owner BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB NULL
);

-- Index on conversation_id for fast fetching
CREATE INDEX IF NOT EXISTS idx_ride_messages_conversation_id ON public.ride_messages(conversation_id);
