-- Fix subscription issue where new users are marked as subscribed
-- This script ensures that only users with valid Stripe subscriptions or trials are marked as subscribed

-- First, let's see what the current state is
SELECT 
    email,
    subscribed,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_end,
    created_at
FROM public.subscribers 
ORDER BY created_at DESC 
LIMIT 10;

-- Update any incorrectly marked subscribers
-- Users should only be subscribed if they have a valid Stripe customer ID and subscription
UPDATE public.subscribers 
SET 
    subscribed = false,
    subscription_tier = null,
    subscription_end = null,
    updated_at = now()
WHERE 
    stripe_customer_id IS NULL 
    OR stripe_subscription_id IS NULL
    OR (stripe_customer_id IS NOT NULL AND subscription_end < now());

-- Also update profiles to ensure consistency
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
        AND subscription_end > now()
    );

-- Show the corrected state
SELECT 
    email,
    subscribed,
    subscription_tier,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_end,
    created_at
FROM public.subscribers 
ORDER BY created_at DESC 
LIMIT 10;
