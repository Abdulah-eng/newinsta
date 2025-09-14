-- Fix Stripe Integration Database Issues
-- This migration adds missing columns and fixes the Stripe integration

-- 1. Add missing stripe_subscription_id column to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Add missing Stripe columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. Add comments for documentation
COMMENT ON COLUMN public.subscribers.stripe_subscription_id IS 'Stripe subscription ID for payment processing';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription ID for trial/subscription management';

-- 4. Create indexes for efficient Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription 
ON public.subscribers (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON public.profiles (stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription 
ON public.profiles (stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- 5. Update RLS policies to allow webhook updates
-- Drop existing policies
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create new policies that allow webhook functions to update
CREATE POLICY "update_subscription_webhook" ON public.subscribers
FOR UPDATE
USING (true);

CREATE POLICY "insert_subscription_webhook" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- 6. Add policy for profiles table updates
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "update_profiles_webhook" ON public.profiles;
CREATE POLICY "update_profiles_webhook" ON public.profiles
FOR UPDATE
USING (true);

-- 7. Verify the changes
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('subscribers', 'profiles') 
    AND column_name LIKE '%stripe%'
ORDER BY table_name, column_name;
