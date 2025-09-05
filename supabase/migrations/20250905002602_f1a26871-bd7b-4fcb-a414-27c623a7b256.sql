-- Fix the overly permissive service role policy
-- The current policy allows public access which overrides the anonymous blocking policy

-- Drop the problematic service role policy
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;

-- Create a properly restricted service role policy that only applies to service role operations
-- This policy will only be effective when using the service role key, not for public/anonymous access
CREATE POLICY "Service role can manage subscriptions" ON public.subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);