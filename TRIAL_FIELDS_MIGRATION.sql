-- Add trial period fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ended_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN profiles.trial_started_at IS 'When the user started their 3-day trial period';
COMMENT ON COLUMN profiles.trial_ended_at IS 'When the user ended their trial period (null if still active)';

-- Create index for efficient trial queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active 
ON profiles (trial_started_at, trial_ended_at) 
WHERE trial_started_at IS NOT NULL AND trial_ended_at IS NULL;
