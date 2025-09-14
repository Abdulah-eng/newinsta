-- COMPLETE FIX for subscription issue
-- This script fixes all subscription-related problems

-- 1. Fix the DEFAULT value for subscription_tier
ALTER TABLE public.subscribers 
ALTER COLUMN subscription_tier DROP DEFAULT;

-- 2. Create a trigger to automatically create subscriber records for new users
CREATE OR REPLACE FUNCTION public.create_subscriber_on_signup()
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
    subscribed,
    subscription_tier,
    subscription_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NULL, -- No Stripe customer ID initially
    false, -- Not subscribed initially
    NULL, -- No subscription tier initially
    NULL, -- No subscription end date initially
    now(),
    now()
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger to run this function when a new user is created
DROP TRIGGER IF EXISTS create_subscriber_on_user_created ON auth.users;
CREATE TRIGGER create_subscriber_on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_subscriber_on_signup();

-- 3. Fix existing incorrectly marked subscribers
UPDATE public.subscribers 
SET 
    subscribed = false,
    subscription_tier = NULL,
    subscription_end = NULL,
    updated_at = now()
WHERE 
    stripe_customer_id IS NULL 
    OR stripe_subscription_id IS NULL;

-- 4. Update profiles to ensure consistency
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
COMMENT ON COLUMN public.subscribers.subscription_tier IS 'Subscription tier (NULL by default, set only when subscribed)';

-- 6. Verify the changes
SELECT 
    'Fixed subscribers table schema and created trigger' as status,
    COUNT(*) as total_subscribers,
    COUNT(CASE WHEN subscribed = true THEN 1 END) as subscribed_count,
    COUNT(CASE WHEN subscribed = false THEN 1 END) as unsubscribed_count
FROM public.subscribers;
