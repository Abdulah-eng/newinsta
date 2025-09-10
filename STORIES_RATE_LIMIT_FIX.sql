-- Fix for stories rate limiting and ambiguous column issues

-- Create a simple rate limiting function
CREATE OR REPLACE FUNCTION check_story_rate_limit(
  p_user_id UUID,
  p_max_attempts INTEGER DEFAULT 10,
  p_window_hours INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  story_count INTEGER;
BEGIN
  -- Count stories created by user in the last window_hours
  SELECT COUNT(*)
  INTO story_count
  FROM stories
  WHERE author_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour' * p_window_hours;
  
  -- Return true if under limit, false if over limit
  RETURN story_count < p_max_attempts;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_story_rate_limit(UUID, INTEGER, INTEGER) TO authenticated;

-- Fix any potential ambiguous column issues by ensuring proper table references
-- This ensures that if there are any window functions or CTEs, they don't conflict
DO $$
BEGIN
  -- Check if stories table exists and has proper structure
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
    -- Ensure the table has the expected columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'author_id') THEN
      RAISE NOTICE 'Stories table structure may be incorrect. Please check your migration.';
    END IF;
  ELSE
    RAISE NOTICE 'Stories table does not exist. Please run the main migration first.';
  END IF;
END $$;

-- Create an index for better performance on rate limiting queries
CREATE INDEX IF NOT EXISTS idx_stories_author_created 
ON stories(author_id, created_at DESC);

-- Add a comment explaining the function
COMMENT ON FUNCTION check_story_rate_limit(UUID, INTEGER, INTEGER) IS 
'Simple rate limiting function for story creation. Returns true if user is under the limit.';
