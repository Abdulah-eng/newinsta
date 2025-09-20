-- Fix comments table RLS policies and foreign key references
-- The comments table should reference profiles instead of auth.users

-- First, update the foreign key to reference profiles instead of auth.users
ALTER TABLE public.comments 
DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies to work with profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Create new policies that work with profiles
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    author_id = auth.uid()
  );

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    author_id = auth.uid()
  );

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    author_id = auth.uid()
  );

-- Ensure the table has proper permissions
GRANT ALL ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;
