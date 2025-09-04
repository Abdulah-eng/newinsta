-- Fix foreign key relationship for posts table to reference profiles instead of auth.users
-- First, we need to add the foreign key constraint properly

-- Update posts table to properly reference profiles
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_author_id_fkey;

-- Add proper foreign key to profiles table
ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Do the same for comments table
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key from comments to posts
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Enable realtime for posts and comments
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;