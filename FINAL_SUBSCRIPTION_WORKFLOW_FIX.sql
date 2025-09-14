-- FINAL COMPREHENSIVE FIX for Subscription Workflow Issues
-- This fixes all the problems causing new users to be marked as subscribed

-- 1. Remove the problematic DEFAULT 'premium' from subscription_tier
ALTER TABLE public.subscribers 
ALTER COLUMN subscription_tier DROP DEFAULT;

-- 2. Create a proper trigger to create subscriber records for new users
-- This ensures every new user gets a subscriber record with correct defaults
CREATE OR REPLACE FUNCTION public.create_subscriber_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create subscriber record for new user with correct defaults
  INSERT INTO public.subscribers (
    user_id,
    email,
    stripe_customer_id,
    stripe_subscription_id,
    subscribed,
    subscription_tier,
    subscription_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NULL, -- No Stripe customer ID initially
    NULL, -- No Stripe subscription ID initially
    false, -- Not subscribed initially
    NULL, -- No subscription tier initially
    NULL, -- No subscription end date initially
    now(),
    now()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicates if already exists
  
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_subscriber_for_new_user_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER create_subscriber_for_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_subscriber_for_new_user();

-- 3. Clean up existing incorrect data
-- Fix users who were incorrectly marked as subscribed
UPDATE public.subscribers 
SET 
    subscribed = false,
    subscription_tier = NULL,
    subscription_end = NULL,
    stripe_customer_id = NULL,
    stripe_subscription_id = NULL,
    updated_at = now()
WHERE 
    subscribed = true 
    AND (stripe_customer_id IS NULL OR stripe_subscription_id IS NULL);

-- 4. Update profiles to ensure consistency
-- Set navigate_to_portfolio to false for non-subscribers
UPDATE public.profiles 
SET 
    navigate_to_portfolio = false,
    updated_at = now()
WHERE 
    id NOT IN (
        SELECT user_id 
        FROM public.subscribers 
        WHERE subscribed = true 
        AND stripe_customer_id IS NOT NULL 
        AND stripe_subscription_id IS NOT NULL
    );

-- 5. Add comments for clarity
COMMENT ON COLUMN public.subscribers.subscribed IS 'Whether the user has an active subscription (false by default)';
COMMENT ON COLUMN public.subscribers.subscription_tier IS 'Subscription tier (NULL by default, set only when user has active subscription)';
COMMENT ON COLUMN public.subscribers.stripe_customer_id IS 'Stripe customer ID (NULL by default, set only when user has Stripe account)';
COMMENT ON COLUMN public.subscribers.stripe_subscription_id IS 'Stripe subscription ID (NULL by default, set only when user has active subscription)';

-- 6. Verify the fix
-- This query should return only users who actually have active subscriptions
SELECT 
    s.email,
    s.subscribed,
    s.subscription_tier,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.subscription_end
FROM public.subscribers s
WHERE s.subscribed = true
ORDER BY s.created_at DESC
LIMIT 10;
