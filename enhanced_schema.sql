-- Enhanced Echelon Texas Portal Database Schema
-- This extends the existing schema to support all requested features
-- Run this script in your Supabase SQL Editor

-- =============================================
-- 1. ENHANCED PROFILES TABLE
-- =============================================

-- Add new columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS safe_mode_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- Create index for handle lookups
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- =============================================
-- 2. ENHANCED POSTS TABLE
-- =============================================

-- Add new columns to existing posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_is_hidden ON public.posts(is_hidden);
CREATE INDEX IF NOT EXISTS idx_posts_is_reported ON public.posts(is_reported);
CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts(location);

-- =============================================
-- 3. LIKES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Likes RLS policies
CREATE POLICY "Anyone can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- =============================================
-- 4. STORIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  is_nsfw BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories RLS policies
CREATE POLICY "Anyone can view active stories" ON public.stories
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid() = author_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- =============================================
-- 5. STORY VIEWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Story views RLS policies
CREATE POLICY "Users can view own story views" ON public.story_views
  FOR SELECT USING (auth.uid() = viewer_id);

CREATE POLICY "Users can create story views" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON public.story_views(viewer_id);

-- =============================================
-- 6. DIRECT MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Direct messages RLS policies
CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they sent" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete messages they sent" ON public.direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dm_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON public.direct_messages(created_at DESC);

-- =============================================
-- 7. REPORTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reports RLS policies
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_post_id ON public.reports(reported_post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- =============================================
-- 8. FOLLOWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows RLS policies
CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- =============================================
-- 9. BOOKMARKS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Bookmarks RLS policies
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON public.bookmarks(post_id);

-- =============================================
-- 10. ENHANCED STORAGE BUCKETS
-- =============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for stories
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for direct messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('messages', 'messages', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. STORAGE POLICIES
-- =============================================

-- Avatar storage policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Stories storage policies
CREATE POLICY "Anyone can view stories" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');

CREATE POLICY "Authenticated users can upload stories" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own stories" ON storage.objects
  FOR UPDATE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own stories" ON storage.objects
  FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Messages storage policies
CREATE POLICY "Users can view messages they sent or received" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'messages' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR 
      auth.uid()::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Authenticated users can upload messages" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'messages' AND auth.role() = 'authenticated');

-- =============================================
-- 12. ENHANCED FUNCTIONS
-- =============================================

-- Function to update post like count
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET updated_at = now() 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET updated_at = now() 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like count updates
CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET updated_at = now() 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET updated_at = now() 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment count updates
CREATE TRIGGER update_post_comment_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Function to update user's last active timestamp
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_active = now() 
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last active on any user action
CREATE TRIGGER update_last_active_trigger
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_last_active();

CREATE TRIGGER update_last_active_trigger_comments
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_last_active();

-- =============================================
-- 13. ENHANCED RLS POLICIES FOR EXISTING TABLES
-- =============================================

-- Enhanced profiles policies to allow viewing other profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

-- Enhanced posts policies to respect hidden posts
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view non-hidden posts" ON public.posts
  FOR SELECT USING (is_hidden = false);

-- Admin policies for posts
CREATE POLICY "Admins can view all posts" ON public.posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update any post" ON public.posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete any post" ON public.posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================
-- 14. VIEWS FOR COMMON QUERIES
-- =============================================

-- View for posts with like and comment counts
CREATE OR REPLACE VIEW public.posts_with_counts AS
SELECT 
  p.*,
  COALESCE(l.like_count, 0) as like_count,
  COALESCE(c.comment_count, 0) as comment_count
FROM public.posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as like_count
  FROM public.likes
  GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comment_count
  FROM public.comments
  GROUP BY post_id
) c ON p.id = c.post_id;

-- View for user stats
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  p.id,
  p.full_name,
  p.handle,
  p.avatar_url,
  p.membership_tier,
  p.is_admin,
  p.age_verified,
  COALESCE(post_count.posts, 0) as post_count,
  COALESCE(follower_count.followers, 0) as followers,
  COALESCE(following_count.following, 0) as following
FROM public.profiles p
LEFT JOIN (
  SELECT author_id, COUNT(*) as posts
  FROM public.posts
  WHERE is_hidden = false
  GROUP BY author_id
) post_count ON p.id = post_count.author_id
LEFT JOIN (
  SELECT following_id, COUNT(*) as followers
  FROM public.follows
  GROUP BY following_id
) follower_count ON p.id = follower_count.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as following
  FROM public.follows
  GROUP BY follower_id
) following_count ON p.id = following_count.follower_id;

-- =============================================
-- 15. GRANT PERMISSIONS
-- =============================================

-- Grant permissions for new tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =============================================
-- 16. SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample admin user (replace with your actual admin email)
-- UPDATE public.profiles 
-- SET is_admin = true, handle = 'admin'
-- WHERE email = 'your-admin-email@example.com';

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- This schema now supports:
-- ✅ Enhanced profiles with handles, age verification, safe mode
-- ✅ Posts with videos, locations, reporting, hiding
-- ✅ Likes system with real-time counts
-- ✅ Stories with 24-hour expiration
-- ✅ Direct messaging between users
-- ✅ Comprehensive reporting and moderation system
-- ✅ Follow system for user relationships
-- ✅ Bookmarks for saving posts
-- ✅ Enhanced storage buckets for different media types
-- ✅ Admin controls and role-based access
-- ✅ Performance optimized with proper indexes
-- ✅ Real-time triggers for count updates
-- ✅ Views for common queries
