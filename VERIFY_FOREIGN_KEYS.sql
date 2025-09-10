-- Quick verification that foreign key relationships are working
-- Run this to confirm the stories system is properly set up

-- 1. Check if all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('stories', 'story_views', 'story_reactions') THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_name IN ('stories', 'story_views', 'story_reactions')
ORDER BY table_name;

-- 2. Check foreign key constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ CONSTRAINT EXISTS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('stories', 'story_views', 'story_reactions')
ORDER BY tc.table_name, tc.constraint_name;

-- 3. Check if profiles table exists (required for foreign keys)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ PROFILES TABLE EXISTS'
    ELSE '❌ PROFILES TABLE MISSING - This will cause foreign key errors!'
  END as profiles_status;

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('stories', 'story_views', 'story_reactions')
ORDER BY tablename, policyname;

-- 5. Test the rate limiting function
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'check_story_rate_limit'
    ) 
    THEN '✅ RATE LIMITING FUNCTION EXISTS'
    ELSE '❌ RATE LIMITING FUNCTION MISSING'
  END as rate_limit_status;

-- 6. Check indexes for performance
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('stories', 'story_views', 'story_reactions')
ORDER BY tablename, indexname;

-- 7. Test a simple query to see if foreign keys work
-- This should work without errors if everything is set up correctly
SELECT 
  s.id,
  s.content,
  s.created_at,
  p.full_name as author_name,
  p.avatar_url
FROM stories s
LEFT JOIN profiles p ON s.author_id = p.id
LIMIT 5;
