-- Add policy to explicitly block anonymous access to subscribers table
-- This prevents unauthenticated users from accessing any payment/subscription data

CREATE POLICY "Block anonymous access to subscribers" ON public.subscribers
FOR ALL 
TO anon
USING (false);