-- Fix remaining email-based vulnerabilities in INSERT and UPDATE policies
-- Remove email matching from user policies to prevent unauthorized access

-- Drop unsafe INSERT and UPDATE policies
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;

-- Create secure INSERT policy - only allow users to insert their own subscription by user_id
CREATE POLICY "Users can insert own subscription by user_id only" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Create secure UPDATE policy - only allow users to update their own subscription by user_id  
CREATE POLICY "Users can update own subscription by user_id only" ON public.subscribers
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());