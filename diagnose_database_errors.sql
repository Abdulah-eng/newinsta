-- Diagnose database errors and check table states
-- This script will help identify what's causing the 500 errors

-- 1. Check if all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 
    'direct_messages', 'reports', 'user_restrictions', 'audit_logs'
)
ORDER BY table_name;

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

-- 3. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 
    'direct_messages', 'reports', 'user_restrictions', 'audit_logs'
)
ORDER BY tablename, policyname;

-- 4. Check if our admin functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('admin_delete_user', 'is_admin', 'user_exists')
ORDER BY routine_name;

-- 5. Test basic table access (this will show if RLS is blocking)
-- Note: Run this as the authenticated user, not as admin

-- Test profiles table access
SELECT COUNT(*) as profiles_count FROM profiles;

-- Test posts table access  
SELECT COUNT(*) as posts_count FROM posts;

-- Test stories table access
SELECT COUNT(*) as stories_count FROM stories;

-- Test follows table access
SELECT COUNT(*) as follows_count FROM follows;

-- Test likes table access
SELECT COUNT(*) as likes_count FROM likes;

-- Test comments table access
SELECT COUNT(*) as comments_count FROM comments;

-- Test direct_messages table access
SELECT COUNT(*) as messages_count FROM direct_messages;

-- Test reports table access
SELECT COUNT(*) as reports_count FROM reports;

-- 6. Check for any foreign key constraint issues
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
    'profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 
    'direct_messages', 'reports', 'user_restrictions', 'audit_logs'
)
ORDER BY tc.table_name, kcu.column_name;

-- 7. Check for any missing columns that might be referenced in queries
-- Check profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check posts table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

-- Check stories table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stories'
ORDER BY ordinal_position;

-- 8. Check if there are any syntax errors in our RLS policies
-- This will show any policies that might have syntax issues
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%ERROR%' OR with_check LIKE '%ERROR%' OR qual IS NULL OR with_check IS NULL)
ORDER BY tablename, policyname;
