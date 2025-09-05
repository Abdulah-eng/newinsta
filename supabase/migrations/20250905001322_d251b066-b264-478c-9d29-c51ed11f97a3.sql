-- Fix critical security vulnerability in subscribers table SELECT policy
-- Remove email-based access for regular users - only allow user_id matching

-- Drop the current unsafe SELECT policy
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create secure SELECT policy - only allow users to view their own subscription by user_id
CREATE POLICY "Users can view own subscription by user_id only" ON public.subscribers
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- The service role policy already exists for edge functions to manage subscriptions
-- This ensures edge functions can still create/update subscriptions using email matching
-- but regular users can only access their own data via user_id