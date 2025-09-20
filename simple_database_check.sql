-- Simple database check without ambiguous column references
-- This script will help identify what's causing the 500 errors

-- 1. Check if all required tables exist
SELECT 
    CASE 
        WHEN it.table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    t.table_name
FROM (
    SELECT unnest(ARRAY[
        'profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 
        'direct_messages', 'reports', 'user_restrictions', 'audit_logs',
        'message_reactions', 'story_views', 'story_reactions'
    ]) as table_name
) t
LEFT JOIN information_schema.tables it 
    ON it.table_name = t.table_name 
    AND it.table_schema = 'public'
ORDER BY status, t.table_name;

-- 2. Check RLS status on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 
    'direct_messages', 'reports', 'user_restrictions', 'audit_logs'
)
ORDER BY tablename;

-- 3. Test basic access to each table
SELECT 'Testing basic access...' as status;

-- Test profiles access
SELECT COUNT(*) as profiles_count FROM profiles LIMIT 1;

-- Test posts access
SELECT COUNT(*) as posts_count FROM posts LIMIT 1;

-- Test stories access
SELECT COUNT(*) as stories_count FROM stories LIMIT 1;

-- Test follows access
SELECT COUNT(*) as follows_count FROM follows LIMIT 1;

-- Test likes access
SELECT COUNT(*) as likes_count FROM likes LIMIT 1;

-- Test comments access
SELECT COUNT(*) as comments_count FROM comments LIMIT 1;

-- Test direct_messages access
SELECT COUNT(*) as messages_count FROM direct_messages LIMIT 1;

-- Test reports access
SELECT COUNT(*) as reports_count FROM reports LIMIT 1;

SELECT 'Basic access test completed' as status;

-- 4. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 
    'direct_messages', 'reports', 'user_restrictions', 'audit_logs'
)
ORDER BY tablename, policyname;
