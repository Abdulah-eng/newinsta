-- Trial System Migration
-- This migration sets up the complete trial system with Stripe integration

-- Add trial fields to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.trial_started_at IS 'When the user started their 3-day trial period';
COMMENT ON COLUMN public.profiles.trial_ended_at IS 'When the user ended their trial period (null if still active)';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription ID for trial/subscription management';

-- Create index for efficient trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active 
ON public.profiles (trial_started_at, trial_ended_at) 
WHERE trial_started_at IS NOT NULL AND trial_ended_at IS NULL;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON public.profiles (stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Create a function to check if a user is eligible for a trial
CREATE OR REPLACE FUNCTION is_trial_eligible(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_used_trial BOOLEAN;
  has_active_subscription BOOLEAN;
BEGIN
  -- Check if user has ever used a trial
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
    AND trial_started_at IS NOT NULL
  ) INTO has_used_trial;
  
  -- Check if user has an active subscription
  SELECT EXISTS(
    SELECT 1 FROM public.subscribers 
    WHERE user_id = user_id 
    AND subscribed = true
  ) INTO has_active_subscription;
  
  -- User is eligible if they haven't used a trial and don't have an active subscription
  RETURN NOT has_used_trial AND NOT has_active_subscription;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically expire trials
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update profiles where trial has expired (more than 3 days ago)
  UPDATE public.profiles 
  SET 
    trial_ended_at = NOW(),
    navigate_to_portfolio = false,
    updated_at = NOW()
  WHERE 
    trial_started_at IS NOT NULL 
    AND trial_ended_at IS NULL 
    AND trial_started_at < (NOW() - INTERVAL '3 days');
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log the number of expired trials
  RAISE NOTICE 'Expired % trials', expired_count;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire trials (if pg_cron is available)
-- This will run every hour to check for expired trials
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('expire-trials', '0 * * * *', 'SELECT expire_trials();');

-- Update existing profiles to set default values
UPDATE public.profiles 
SET 
  navigate_to_portfolio = CASE 
    WHEN trial_started_at IS NOT NULL 
      AND trial_ended_at IS NULL 
      AND trial_started_at > (NOW() - INTERVAL '3 days')
    THEN TRUE
    ELSE FALSE
  END
WHERE navigate_to_portfolio IS NULL;

-- Create a view for active trials
CREATE OR REPLACE VIEW active_trials AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.trial_started_at,
  p.trial_ended_at,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  EXTRACT(EPOCH FROM (p.trial_started_at + INTERVAL '3 days' - NOW())) / 3600 AS hours_remaining
FROM public.profiles p
WHERE 
  p.trial_started_at IS NOT NULL 
  AND p.trial_ended_at IS NULL 
  AND p.trial_started_at > (NOW() - INTERVAL '3 days');

-- Grant necessary permissions
GRANT SELECT ON active_trials TO authenticated;
GRANT EXECUTE ON FUNCTION is_trial_eligible(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_trials() TO service_role;
