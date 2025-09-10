-- Quick fix for database schema issues
-- Run this in Supabase SQL Editor

-- Fix stories table foreign key relationship
ALTER TABLE public.stories 
DROP CONSTRAINT IF EXISTS stories_author_id_fkey;

ALTER TABLE public.stories 
ADD CONSTRAINT stories_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix story_views table foreign key relationship
ALTER TABLE public.story_views 
DROP CONSTRAINT IF EXISTS story_views_story_id_fkey;

ALTER TABLE public.story_views 
ADD CONSTRAINT story_views_story_id_fkey 
FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;

ALTER TABLE public.story_views 
DROP CONSTRAINT IF EXISTS story_views_viewer_id_fkey;

ALTER TABLE public.story_views 
ADD CONSTRAINT story_views_viewer_id_fkey 
FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix story_reactions table foreign key relationship
ALTER TABLE public.story_reactions 
DROP CONSTRAINT IF EXISTS story_reactions_story_id_fkey;

ALTER TABLE public.story_reactions 
ADD CONSTRAINT story_reactions_story_id_fkey 
FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;

ALTER TABLE public.story_reactions 
DROP CONSTRAINT IF EXISTS story_reactions_user_id_fkey;

ALTER TABLE public.story_reactions 
ADD CONSTRAINT story_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix direct_messages table foreign key relationship
ALTER TABLE public.direct_messages 
DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey;

ALTER TABLE public.direct_messages 
ADD CONSTRAINT direct_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.direct_messages 
DROP CONSTRAINT IF EXISTS direct_messages_recipient_id_fkey;

ALTER TABLE public.direct_messages 
ADD CONSTRAINT direct_messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix message_reactions table foreign key relationship
ALTER TABLE public.message_reactions 
DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey;

ALTER TABLE public.message_reactions 
ADD CONSTRAINT message_reactions_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.direct_messages(id) ON DELETE CASCADE;

ALTER TABLE public.message_reactions 
DROP CONSTRAINT IF EXISTS message_reactions_user_id_fkey;

ALTER TABLE public.message_reactions 
ADD CONSTRAINT message_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix likes table foreign key relationship
ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_post_id_fkey;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.likes 
DROP CONSTRAINT IF EXISTS likes_user_id_fkey;

ALTER TABLE public.likes 
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix bookmarks table foreign key relationship
ALTER TABLE public.bookmarks 
DROP CONSTRAINT IF EXISTS bookmarks_post_id_fkey;

ALTER TABLE public.bookmarks 
ADD CONSTRAINT bookmarks_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.bookmarks 
DROP CONSTRAINT IF EXISTS bookmarks_user_id_fkey;

ALTER TABLE public.bookmarks 
ADD CONSTRAINT bookmarks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix follows table foreign key relationship
ALTER TABLE public.follows 
DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;

ALTER TABLE public.follows 
ADD CONSTRAINT follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.follows 
DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

ALTER TABLE public.follows 
ADD CONSTRAINT follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix reports table foreign key relationships
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_reported_post_id_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reported_post_id_fkey 
FOREIGN KEY (reported_post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_resolved_by_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_resolved_by_fkey 
FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix user_roles table foreign key relationship
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_granted_by_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_granted_by_fkey 
FOREIGN KEY (granted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix admin_actions table foreign key relationship
ALTER TABLE public.admin_actions 
DROP CONSTRAINT IF EXISTS admin_actions_admin_id_fkey;

ALTER TABLE public.admin_actions 
ADD CONSTRAINT admin_actions_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix rate_limits table foreign key relationship
ALTER TABLE public.rate_limits 
DROP CONSTRAINT IF EXISTS rate_limits_user_id_fkey;

ALTER TABLE public.rate_limits 
ADD CONSTRAINT rate_limits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix user_restrictions table foreign key relationship
ALTER TABLE public.user_restrictions 
DROP CONSTRAINT IF EXISTS user_restrictions_user_id_fkey;

ALTER TABLE public.user_restrictions 
ADD CONSTRAINT user_restrictions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_restrictions 
DROP CONSTRAINT IF EXISTS user_restrictions_created_by_fkey;

ALTER TABLE public.user_restrictions 
ADD CONSTRAINT user_restrictions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix audit_logs table foreign key relationship
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
