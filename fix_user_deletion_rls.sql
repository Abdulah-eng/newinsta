-- Fix RLS policies to allow admin user deletion
-- This script ensures admins can delete user accounts

-- First, let's check current RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might interfere with admin deletion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create comprehensive RLS policies for profiles table

-- 1. Allow users to view all profiles (for user discovery, etc.)
CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT
    USING (true);

-- 2. Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE
    USING (auth.uid() = id);

-- 5. Allow admins to perform any operation on any profile
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Now let's check and fix RLS policies on related tables

-- Fix posts table RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Create new policies
CREATE POLICY "Anyone can view posts" ON posts
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE
    USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts" ON posts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix direct_messages table RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON direct_messages;

-- Create new policies
CREATE POLICY "Users can view own messages" ON direct_messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert own messages" ON direct_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON direct_messages
    FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages" ON direct_messages
    FOR DELETE
    USING (auth.uid() = sender_id);

CREATE POLICY "Admins can manage all messages" ON direct_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix stories table RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all stories" ON stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

-- Create new policies
CREATE POLICY "Anyone can view stories" ON stories
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own stories" ON stories
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own stories" ON stories
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own stories" ON stories
    FOR DELETE
    USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all stories" ON stories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix reports table RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Create new policies
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can insert own reports" ON reports
    FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE
    USING (auth.uid() = reporter_id)
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can delete own reports" ON reports
    FOR DELETE
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports" ON reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix user_restrictions table RLS
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage restrictions" ON user_restrictions;

-- Create new policies
CREATE POLICY "Admins can manage restrictions" ON user_restrictions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix follows table RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;

-- Create new policies
CREATE POLICY "Users can view follows" ON follows
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own follows" ON follows
    FOR ALL
    USING (auth.uid() = follower_id)
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Admins can manage all follows" ON follows
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix likes table RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;

-- Create new policies
CREATE POLICY "Users can view likes" ON likes
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own likes" ON likes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all likes" ON likes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Fix comments table RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can manage own comments" ON comments;

-- Create new policies
CREATE POLICY "Users can view comments" ON comments
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own comments" ON comments
    FOR ALL
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all comments" ON comments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
        )
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'posts', 'direct_messages', 'stories', 'reports', 'user_restrictions', 'follows', 'likes', 'comments')
ORDER BY tablename, policyname;
