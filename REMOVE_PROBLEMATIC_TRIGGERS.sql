-- Remove any problematic triggers that might be causing signup issues

-- Drop the trigger we created if it exists
DROP TRIGGER IF EXISTS create_subscriber_for_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_subscriber_on_user_created ON auth.users;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.create_subscriber_for_new_user();
DROP FUNCTION IF EXISTS public.create_subscriber_on_signup();

-- Verify no problematic triggers remain
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
