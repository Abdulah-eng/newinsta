-- Check if navigate_to_portfolio column exists in profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check a sample profile to see if navigate_to_portfolio column exists
SELECT id, email, navigate_to_portfolio, trial_started_at, trial_ended_at
FROM profiles 
LIMIT 1;
