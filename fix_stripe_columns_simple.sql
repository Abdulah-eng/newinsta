-- Fix Stripe Integration Database Issues
-- Simple migration to add missing Stripe columns

-- Add missing stripe_subscription_id column to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add missing Stripe columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for efficient Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription 
ON public.subscribers (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON public.profiles (stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription 
ON public.profiles (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Update RLS policies to allow webhook updates
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "update_subscription_webhook" ON public.subscribers
FOR UPDATE
USING (true);

CREATE POLICY "insert_subscription_webhook" ON public.subscribers
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "update_profiles_webhook" ON public.profiles;
CREATE POLICY "update_profiles_webhook" ON public.profiles
FOR UPDATE
USING (true);
