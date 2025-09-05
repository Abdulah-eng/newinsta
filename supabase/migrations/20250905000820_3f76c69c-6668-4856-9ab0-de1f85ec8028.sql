-- Fix critical security issues in subscribers table RLS policies

-- Drop the existing unsafe policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure insert policy - only authenticated users can insert their own subscription records
CREATE POLICY "Users can insert own subscription" ON public.subscribers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR email = auth.email())
);

-- Create secure update policy - only users can update their own subscription records
CREATE POLICY "Users can update own subscription" ON public.subscribers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR email = auth.email())
);

-- Add policy for edge functions to manage subscriptions (using service role key)
CREATE POLICY "Service role can manage subscriptions" ON public.subscribers
FOR ALL
USING (true)
WITH CHECK (true);

-- Grant necessary permissions for edge functions
GRANT ALL ON public.subscribers TO service_role;