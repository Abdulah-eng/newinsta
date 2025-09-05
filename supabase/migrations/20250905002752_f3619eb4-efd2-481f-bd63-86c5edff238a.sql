-- Remove the overly broad service role policy that triggers security warnings
-- Edge functions will work through bypassing RLS entirely when using service role key

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;

-- The service role will now bypass RLS entirely rather than using a policy
-- This is actually more secure as it prevents any potential policy conflicts
-- Edge functions using service role key automatically bypass all RLS policies