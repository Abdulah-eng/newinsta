-- Migration to add navigate_to_portfolio column to profiles table
-- This column determines whether user should be redirected to /portal or /membership after login

-- Add navigate_to_portfolio column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS navigate_to_portfolio BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.profiles.navigate_to_portfolio IS 'If true, redirect to /portal after login, otherwise redirect to /membership. Set to true for users with active subscriptions or free trials.';

-- Create a function to automatically set navigate_to_portfolio based on subscription status
CREATE OR REPLACE FUNCTION update_navigate_to_portfolio()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has an active trial
  IF NEW.trial_started_at IS NOT NULL AND NEW.trial_ended_at IS NULL THEN
    -- Check if trial is still active (3 days from start)
    IF NEW.trial_started_at > (NOW() - INTERVAL '3 days') THEN
      NEW.navigate_to_portfolio := TRUE;
    ELSE
      -- Trial expired, end it and set navigate_to_portfolio to false
      NEW.trial_ended_at := NOW();
      NEW.navigate_to_portfolio := FALSE;
    END IF;
  ELSE
    -- No active trial, check subscription status
    -- This will be updated by the application logic when subscription status changes
    NEW.navigate_to_portfolio := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update navigate_to_portfolio on profile updates
DROP TRIGGER IF EXISTS trigger_update_navigate_to_portfolio ON public.profiles;
CREATE TRIGGER trigger_update_navigate_to_portfolio
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_navigate_to_portfolio();

-- Update existing profiles to set navigate_to_portfolio based on current trial status
UPDATE public.profiles 
SET navigate_to_portfolio = CASE 
  WHEN trial_started_at IS NOT NULL 
    AND trial_ended_at IS NULL 
    AND trial_started_at > (NOW() - INTERVAL '3 days')
  THEN TRUE
  ELSE FALSE
END;
