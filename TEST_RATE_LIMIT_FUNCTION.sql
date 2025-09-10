-- Test the rate limiting function to ensure it's working correctly

-- Test 1: Check if function exists and is callable
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'check_story_rate_limit';

-- Test 2: Test the function with a sample user ID
-- Replace 'your-user-id-here' with an actual user ID from your auth.users table
SELECT check_story_rate_limit('your-user-id-here', 10, 1) as rate_limit_ok;

-- Test 3: Check if stories table has the expected structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'stories'
ORDER BY ordinal_position;

-- Test 4: Check if the index was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'stories' 
  AND indexname = 'idx_stories_author_created';

-- Test 5: Count existing stories (if any)
SELECT COUNT(*) as total_stories FROM stories;

-- Test 6: Check recent stories for rate limiting
SELECT 
  author_id,
  COUNT(*) as story_count,
  MAX(created_at) as latest_story
FROM stories 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY author_id
ORDER BY story_count DESC;
