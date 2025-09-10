-- Fix messaging rate limiting issues
-- This will create a simple rate limiting function for messaging

-- Create a simple rate limiting function for messaging
CREATE OR REPLACE FUNCTION check_messaging_rate_limit(
  p_user_id UUID,
  p_max_attempts INTEGER DEFAULT 50,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_count INTEGER;
BEGIN
  -- Count messages sent by user in the last window_minutes
  SELECT COUNT(*)
  INTO message_count
  FROM direct_messages
  WHERE sender_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Return true if under limit, false if over limit
  RETURN message_count < p_max_attempts;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_messaging_rate_limit(UUID, INTEGER, INTEGER) TO authenticated;

-- Create an index for better performance on rate limiting queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_created 
ON direct_messages(sender_id, created_at DESC);

-- Add a comment explaining the function
COMMENT ON FUNCTION check_messaging_rate_limit(UUID, INTEGER, INTEGER) IS 
'Simple rate limiting function for messaging. Returns true if user is under the limit.';

-- Also create a generic rate limiting function that can be used for multiple actions
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT DEFAULT 'general',
  p_max_attempts INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_count INTEGER;
BEGIN
  -- For messaging, check direct_messages table
  IF p_action_type = 'messaging' THEN
    SELECT COUNT(*)
    INTO action_count
    FROM direct_messages
    WHERE sender_id = p_user_id
      AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  -- For posting, check posts table
  ELSIF p_action_type = 'posting' THEN
    SELECT COUNT(*)
    INTO action_count
    FROM posts
    WHERE author_id = p_user_id
      AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  -- For stories, check stories table
  ELSIF p_action_type = 'stories' THEN
    SELECT COUNT(*)
    INTO action_count
    FROM stories
    WHERE author_id = p_user_id
      AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  -- For general actions, check audit_logs table
  ELSE
    SELECT COUNT(*)
    INTO action_count
    FROM audit_logs
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  END IF;
  
  -- Return true if under limit, false if over limit
  RETURN action_count < p_max_attempts;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- Add a comment explaining the function
COMMENT ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) IS 
'Generic rate limiting function for various actions. Returns true if user is under the limit.';

-- Test the functions
SELECT check_messaging_rate_limit(gen_random_uuid(), 50, 60) as messaging_test;
SELECT check_rate_limit(gen_random_uuid(), 'messaging', 50, 60) as generic_test;
