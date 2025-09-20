-- Check for missing tables and columns that might cause 500 errors
-- This script will help identify what's missing from the database

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

-- 2. Check for missing columns in profiles table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'profiles' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'email', 'full_name', 'avatar_url', 'handle', 'bio', 'created_at',
        'is_admin', 'is_super_admin', 'is_moderator', 'is_banned', 'ban_reason',
        'age_verified', 'safe_mode_enabled', 'membership_tier', 'last_active'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'profiles' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 3. Check for missing columns in posts table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'posts' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'author_id', 'content', 'image_url', 'video_url', 'is_nsfw',
        'location', 'created_at', 'is_hidden', 'hidden_reason'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'posts' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 4. Check for missing columns in stories table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'stories' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'author_id', 'content', 'image_url', 'video_url', 'is_nsfw',
        'created_at', 'expires_at'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'stories' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 5. Check for missing columns in follows table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'follows' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'follower_id', 'following_id', 'created_at'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'follows' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 6. Check for missing columns in likes table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'likes' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'user_id', 'post_id', 'created_at'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'likes' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 7. Check for missing columns in comments table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'comments' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'author_id', 'post_id', 'content', 'created_at'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'comments' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 8. Check for missing columns in direct_messages table
SELECT 
    CASE 
        WHEN ic.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status,
    'direct_messages' as table_name,
    t.column_name
FROM (
    SELECT unnest(ARRAY[
        'id', 'sender_id', 'recipient_id', 'content', 'created_at',
        'is_read', 'read_at'
    ]) as column_name
) t
LEFT JOIN information_schema.columns ic 
    ON ic.column_name = t.column_name 
    AND ic.table_name = 'direct_messages' 
    AND ic.table_schema = 'public'
ORDER BY status, t.column_name;

-- 9. Check for missing foreign key relationships
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
ORDER BY tc.table_name, kcu.column_name;

-- 10. Check for any views that might be missing
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'VIEW'
ORDER BY table_name;
