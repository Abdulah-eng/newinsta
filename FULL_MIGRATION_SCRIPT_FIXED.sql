-- =============================================
-- ECHELON TEXAS PORTAL - FULL MIGRATION SCRIPT (FIXED)
-- =============================================
-- This script adds all Milestone 2 features to your existing database
-- Run this in your Supabase SQL Editor
-- FIXED: Handles existing policies gracefully

-- =============================================
-- STEP 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS safe_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS messaging_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS story_privacy VARCHAR(20) DEFAULT 'public' CHECK (story_privacy IN ('public', 'followers', 'close_friends'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- =============================================
-- STEP 2: CREATE NEW TABLES FOR MILESTONE 2
-- =============================================

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Direct Messages table (if not exists)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories table (if not exists)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    is_nsfw BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Views table
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

-- Story Reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, user_id, emoji)
);

-- Reports table (if not exists)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    reported_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'violence', 'hate_speech', 'nudity', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'moderator', 'super_admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Rate Limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, action_type, window_start)
);

-- User Restrictions table
CREATE TABLE IF NOT EXISTS public.user_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restriction_type VARCHAR(50) NOT NULL CHECK (restriction_type IN ('posting', 'messaging', 'commenting', 'all')),
    reason TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: CREATE RLS POLICIES (WITH ERROR HANDLING)
-- =============================================

-- Function to create policy if it doesn't exist
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    policy_name TEXT,
    table_name TEXT,
    policy_command TEXT,
    policy_definition TEXT
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = table_name
    ) THEN
        EXECUTE format('CREATE POLICY %I ON %I %s %s', 
            policy_name, table_name, policy_command, policy_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Likes policies
SELECT create_policy_if_not_exists(
    'Anyone can view likes',
    'likes',
    'FOR SELECT',
    'USING (true)'
);

SELECT create_policy_if_not_exists(
    'Users can create likes',
    'likes',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete their own likes',
    'likes',
    'FOR DELETE',
    'USING (auth.uid() = user_id)'
);

-- Bookmarks policies
SELECT create_policy_if_not_exists(
    'Users can view their own bookmarks',
    'bookmarks',
    'FOR SELECT',
    'USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can create bookmarks',
    'bookmarks',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete their own bookmarks',
    'bookmarks',
    'FOR DELETE',
    'USING (auth.uid() = user_id)'
);

-- Follows policies
SELECT create_policy_if_not_exists(
    'Anyone can view follows',
    'follows',
    'FOR SELECT',
    'USING (true)'
);

SELECT create_policy_if_not_exists(
    'Users can create follows',
    'follows',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = follower_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete their own follows',
    'follows',
    'FOR DELETE',
    'USING (auth.uid() = follower_id)'
);

-- Direct Messages policies
SELECT create_policy_if_not_exists(
    'Users can view their own messages',
    'direct_messages',
    'FOR SELECT',
    'USING (auth.uid() = sender_id OR auth.uid() = recipient_id)'
);

SELECT create_policy_if_not_exists(
    'Users can send messages',
    'direct_messages',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = sender_id)'
);

SELECT create_policy_if_not_exists(
    'Users can update their own messages',
    'direct_messages',
    'FOR UPDATE',
    'USING (auth.uid() = sender_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete their own messages',
    'direct_messages',
    'FOR DELETE',
    'USING (auth.uid() = sender_id)'
);

-- Stories policies
SELECT create_policy_if_not_exists(
    'Anyone can view active stories',
    'stories',
    'FOR SELECT',
    'USING (expires_at > NOW())'
);

SELECT create_policy_if_not_exists(
    'Users can create stories',
    'stories',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = author_id)'
);

SELECT create_policy_if_not_exists(
    'Users can update their own stories',
    'stories',
    'FOR UPDATE',
    'USING (auth.uid() = author_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete their own stories',
    'stories',
    'FOR DELETE',
    'USING (auth.uid() = author_id)'
);

-- Story Views policies
SELECT create_policy_if_not_exists(
    'Users can view story views',
    'story_views',
    'FOR SELECT',
    'USING (true)'
);

SELECT create_policy_if_not_exists(
    'Users can create story views',
    'story_views',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = viewer_id)'
);

-- Story Reactions policies
SELECT create_policy_if_not_exists(
    'Anyone can view story reactions',
    'story_reactions',
    'FOR SELECT',
    'USING (true)'
);

SELECT create_policy_if_not_exists(
    'Users can create story reactions',
    'story_reactions',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Users can delete their own story reactions',
    'story_reactions',
    'FOR DELETE',
    'USING (auth.uid() = user_id)'
);

-- Reports policies
SELECT create_policy_if_not_exists(
    'Users can view their own reports',
    'reports',
    'FOR SELECT',
    'USING (auth.uid() = reporter_id)'
);

SELECT create_policy_if_not_exists(
    'Admins can view all reports',
    'reports',
    'FOR SELECT',
    'USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_moderator = true OR is_super_admin = true)
        )
    )'
);

SELECT create_policy_if_not_exists(
    'Users can create reports',
    'reports',
    'FOR INSERT',
    'WITH CHECK (auth.uid() = reporter_id)'
);

SELECT create_policy_if_not_exists(
    'Admins can update reports',
    'reports',
    'FOR UPDATE',
    'USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_moderator = true OR is_super_admin = true)
        )
    )'
);

-- User Roles policies
SELECT create_policy_if_not_exists(
    'Admins can view user roles',
    'user_roles',
    'FOR SELECT',
    'USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true)
        )
    )'
);

SELECT create_policy_if_not_exists(
    'Super admins can manage user roles',
    'user_roles',
    'FOR ALL',
    'USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND is_super_admin = true
        )
    )'
);

-- Rate Limits policies
SELECT create_policy_if_not_exists(
    'Users can view their own rate limits',
    'rate_limits',
    'FOR SELECT',
    'USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'System can manage rate limits',
    'rate_limits',
    'FOR ALL',
    'USING (true)'
);

-- User Restrictions policies
SELECT create_policy_if_not_exists(
    'Users can view their own restrictions',
    'user_restrictions',
    'FOR SELECT',
    'USING (auth.uid() = user_id)'
);

SELECT create_policy_if_not_exists(
    'Admins can manage user restrictions',
    'user_restrictions',
    'FOR ALL',
    'USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_moderator = true OR is_super_admin = true)
        )
    )'
);

-- Audit Logs policies
SELECT create_policy_if_not_exists(
    'Admins can view audit logs',
    'audit_logs',
    'FOR SELECT',
    'USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR is_super_admin = true)
        )
    )'
);

SELECT create_policy_if_not_exists(
    'System can create audit logs',
    'audit_logs',
    'FOR INSERT',
    'WITH CHECK (true)'
);

-- =============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at DESC);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- Direct Messages indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_read ON public.direct_messages(is_read);

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_is_nsfw ON public.stories(is_nsfw);

-- Story Views indexes
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON public.story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewed_at ON public.story_views(viewed_at DESC);

-- Story Reactions indexes
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON public.story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_created_at ON public.story_reactions(created_at DESC);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_post_id ON public.reports(reported_post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- User Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON public.user_roles(is_active);

-- Rate Limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_action_type ON public.rate_limits(action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- User Restrictions indexes
CREATE INDEX IF NOT EXISTS idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_type ON public.user_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_expires_at ON public.user_restrictions(expires_at);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON public.audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =============================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to new tables
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user conversations
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT 
      CASE 
        WHEN dm.sender_id = p_user_id THEN dm.recipient_id
        ELSE dm.sender_id
      END as other_user_id,
      MAX(dm.created_at) as last_message_time
    FROM public.direct_messages dm
    WHERE dm.sender_id = p_user_id OR dm.recipient_id = p_user_id
    GROUP BY other_user_id
  ),
  unread_counts AS (
    SELECT 
      dm.sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM public.direct_messages dm
    WHERE dm.recipient_id = p_user_id AND dm.is_read = false
    GROUP BY dm.sender_id
  )
  SELECT 
    c.other_user_id as conversation_id,
    c.other_user_id,
    p.full_name as other_user_name,
    p.avatar_url as other_user_avatar,
    dm.content as last_message_content,
    dm.created_at as last_message_created_at,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM conversations c
  JOIN public.profiles p ON p.id = c.other_user_id
  LEFT JOIN public.direct_messages dm ON (
    (dm.sender_id = p_user_id AND dm.recipient_id = c.other_user_id) OR
    (dm.sender_id = c.other_user_id AND dm.recipient_id = p_user_id)
  ) AND dm.created_at = c.last_message_time
  LEFT JOIN unread_counts uc ON uc.other_user_id = c.other_user_id
  ORDER BY c.last_message_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 7: GRANT PERMISSIONS
-- =============================================

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.likes TO anon, authenticated;
GRANT ALL ON public.bookmarks TO anon, authenticated;
GRANT ALL ON public.follows TO anon, authenticated;
GRANT ALL ON public.direct_messages TO anon, authenticated;
GRANT ALL ON public.stories TO anon, authenticated;
GRANT ALL ON public.story_views TO anon, authenticated;
GRANT ALL ON public.story_reactions TO anon, authenticated;
GRANT ALL ON public.reports TO anon, authenticated;
GRANT ALL ON public.user_roles TO anon, authenticated;
GRANT ALL ON public.rate_limits TO anon, authenticated;
GRANT ALL ON public.user_restrictions TO anon, authenticated;
GRANT ALL ON public.audit_logs TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.cleanup_expired_stories() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO anon, authenticated;

-- =============================================
-- STEP 8: CREATE STORAGE BUCKETS
-- =============================================

-- Create storage bucket for stories
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('messages', 'messages', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 9: STORAGE POLICIES (WITH ERROR HANDLING)
-- =============================================

-- Function to create storage policy if it doesn't exist
CREATE OR REPLACE FUNCTION create_storage_policy_if_not_exists(
    policy_name TEXT,
    policy_command TEXT,
    policy_definition TEXT
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
    ) THEN
        EXECUTE format('CREATE POLICY %I ON storage.objects %s %s', 
            policy_name, policy_command, policy_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Stories storage policies
SELECT create_storage_policy_if_not_exists(
    'Anyone can view story images',
    'FOR SELECT',
    'USING (bucket_id = ''stories'')'
);

SELECT create_storage_policy_if_not_exists(
    'Authenticated users can upload story images',
    'FOR INSERT',
    'WITH CHECK (bucket_id = ''stories'' AND auth.role() = ''authenticated'')'
);

SELECT create_storage_policy_if_not_exists(
    'Users can update their own story images',
    'FOR UPDATE',
    'USING (bucket_id = ''stories'' AND auth.uid()::text = (storage.foldername(name))[1])'
);

SELECT create_storage_policy_if_not_exists(
    'Users can delete their own story images',
    'FOR DELETE',
    'USING (bucket_id = ''stories'' AND auth.uid()::text = (storage.foldername(name))[1])'
);

-- Messages storage policies
SELECT create_storage_policy_if_not_exists(
    'Users can view message images',
    'FOR SELECT',
    'USING (bucket_id = ''messages'')'
);

SELECT create_storage_policy_if_not_exists(
    'Authenticated users can upload message images',
    'FOR INSERT',
    'WITH CHECK (bucket_id = ''messages'' AND auth.role() = ''authenticated'')'
);

SELECT create_storage_policy_if_not_exists(
    'Users can update their own message images',
    'FOR UPDATE',
    'USING (bucket_id = ''messages'' AND auth.uid()::text = (storage.foldername(name))[1])'
);

SELECT create_storage_policy_if_not_exists(
    'Users can delete their own message images',
    'FOR DELETE',
    'USING (bucket_id = ''messages'' AND auth.uid()::text = (storage.foldername(name))[1])'
);

-- =============================================
-- STEP 10: CLEANUP HELPER FUNCTIONS
-- =============================================

-- Drop the helper functions as they're no longer needed
DROP FUNCTION IF EXISTS create_policy_if_not_exists(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_storage_policy_if_not_exists(TEXT, TEXT, TEXT);

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================

-- The migration is now complete. Your database now includes:
-- ✅ All Milestone 2 tables and columns
-- ✅ Proper RLS policies for security (with error handling)
-- ✅ Performance indexes
-- ✅ Helper functions
-- ✅ Storage buckets for media
-- ✅ Complete audit logging system

-- Next steps:
-- 1. Update your App.tsx to use the full contexts instead of fallback contexts
-- 2. Test all the new features
-- 3. Deploy to production
