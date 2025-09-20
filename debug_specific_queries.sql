-- Debug the specific queries that are causing 500 errors
-- This script will test the exact queries that are failing

-- 1. Test the profiles query that's failing
-- Original failing query: /rest/v1/profiles?select=*&id=eq.dc952894-e66a-42c5-b387-bed3f180eafe
SELECT * FROM profiles WHERE id = 'dc952894-e66a-42c5-b387-bed3f180eafe';

-- 2. Test the follows query that's failing
-- Original failing query: /rest/v1/follows?select=following_id&follower_id=eq.dc952894-e66a-42c5-b387-bed3f180eafe
SELECT following_id FROM follows WHERE follower_id = 'dc952894-e66a-42c5-b387-bed3f180eafe';

-- 3. Test the stories query that's failing
-- Original failing query: /rest/v1/stories?select=*%2Cprofiles%21author_id%28id%2Cfull_name%2Cavatar_url%2Chandle%2Cmembership_tier%29%2Cstory_views%28id%2Cviewer_id%2Cviewed_at%29%2Cstory_reactions%28id%2Cuser_id%2Ccreated_at%29&expires_at=gt.2025-09-20T08%3A57%3A29.656Z&order=created_at.desc
SELECT 
    s.*,
    p.id, p.full_name, p.avatar_url, p.handle, p.membership_tier
FROM stories s
LEFT JOIN profiles p ON p.id = s.author_id
WHERE s.expires_at > '2025-09-20T08:57:29.656Z'
ORDER BY s.created_at DESC;

-- 4. Test the posts query that's failing
-- Original failing query: /rest/v1/posts?select=*%2Cprofiles%21posts_author_id_fkey%28full_name%2Cavatar_url%2Cmembership_tier%2Chandle%29%2Clikes%3Alikes%28count%29%2Ccomments%3Acomments%28count%29&is_hidden=eq.false&order=created_at.desc
SELECT 
    p.*,
    pr.full_name, pr.avatar_url, pr.membership_tier, pr.handle,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
WHERE p.is_hidden = false
ORDER BY p.created_at DESC;

-- 5. Check if the user exists in profiles
SELECT 
    id, 
    email, 
    full_name, 
    is_admin, 
    is_super_admin, 
    is_moderator,
    created_at
FROM profiles 
WHERE id = 'dc952894-e66a-42c5-b387-bed3f180eafe';

-- 6. Check RLS status on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 'direct_messages', 'reports')
ORDER BY tablename;

-- 7. Check for any policies that might be blocking access
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
AND tablename IN ('profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 'direct_messages', 'reports')
ORDER BY tablename, policyname;

-- 8. Check if there are any foreign key constraint issues
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
AND tc.table_name IN ('profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 'direct_messages', 'reports')
ORDER BY tc.table_name, kcu.column_name;

-- 9. Check if there are any missing columns that might be causing issues
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'posts', 'stories', 'follows', 'likes', 'comments', 'direct_messages', 'reports')
ORDER BY table_name, ordinal_position;
