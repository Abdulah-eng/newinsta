-- SIMPLE FIX for Subscription Issues
-- This is a safer approach that fixes the core problem without complex triggers

-- 1. Remove the problematic DEFAULT 'premium' from subscription_tier
ALTER TABLE public.subscribers 
ALTER COLUMN subscription_tier DROP DEFAULT;

-- 2. Clean up existing incorrect data
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

-- 3. Update profiles to ensure consistency
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

-- 4. Add comments for clarity
COMMENT ON COLUMN public.subscribers.subscribed IS 'Whether the user has an active subscription (false by default)';
COMMENT ON COLUMN public.subscribers.subscription_tier IS 'Subscription tier (NULL by default, set only when user has active subscription)';

-- 5. Verify the fix
SELECT 
    'Fixed records count' as description,
    COUNT(*) as count
FROM public.subscribers 
WHERE subscribed = false 
AND subscription_tier IS NULL;
