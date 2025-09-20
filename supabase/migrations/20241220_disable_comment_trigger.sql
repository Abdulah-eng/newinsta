-- Temporarily disable the comment notification trigger to fix 400 error
-- This will be re-enabled once the main issue is fixed

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;

-- The trigger will be re-created in a later migration once the main issue is resolved
