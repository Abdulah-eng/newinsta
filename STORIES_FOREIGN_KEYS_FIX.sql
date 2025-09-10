-- Fix foreign key relationships for stories table
-- This will resolve the 400 errors when loading stories

-- First, let's check if the stories table exists and its current structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
    RAISE NOTICE 'Stories table does not exist. Creating it...';
    
    -- Create stories table if it doesn't exist
    CREATE TABLE stories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT,
      image_url TEXT,
      video_url TEXT,
      is_nsfw BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create story_views table
    CREATE TABLE story_views (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(story_id, viewer_id)
    );
    
    -- Create story_reactions table
    CREATE TABLE story_reactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      reaction_type TEXT NOT NULL DEFAULT 'like',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(story_id, user_id)
    );
    
  ELSE
    RAISE NOTICE 'Stories table exists. Checking foreign key constraints...';
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Check and add foreign key for stories.author_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stories_author_id_fkey'
  ) THEN
    ALTER TABLE stories 
    ADD CONSTRAINT stories_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: stories_author_id_fkey';
  END IF;
  
  -- Check and add foreign key for story_views.story_id -> stories.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'story_views_story_id_fkey'
  ) THEN
    ALTER TABLE story_views 
    ADD CONSTRAINT story_views_story_id_fkey 
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: story_views_story_id_fkey';
  END IF;
  
  -- Check and add foreign key for story_views.viewer_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'story_views_viewer_id_fkey'
  ) THEN
    ALTER TABLE story_views 
    ADD CONSTRAINT story_views_viewer_id_fkey 
    FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: story_views_viewer_id_fkey';
  END IF;
  
  -- Check and add foreign key for story_reactions.story_id -> stories.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'story_reactions_story_id_fkey'
  ) THEN
    ALTER TABLE story_reactions 
    ADD CONSTRAINT story_reactions_story_id_fkey 
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: story_reactions_story_id_fkey';
  END IF;
  
  -- Check and add foreign key for story_reactions.user_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'story_reactions_user_id_fkey'
  ) THEN
    ALTER TABLE story_reactions 
    ADD CONSTRAINT story_reactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint: story_reactions_user_id_fkey';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories
DROP POLICY IF EXISTS "Users can view active stories" ON stories;
CREATE POLICY "Users can view active stories" ON stories
  FOR SELECT USING (
    expires_at > NOW() AND 
    (is_nsfw = false OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.age_verified = true
    ))
  );

DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;
CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (author_id = auth.uid());

-- Create RLS policies for story_views
DROP POLICY IF EXISTS "Users can view story views" ON story_views;
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create story views" ON story_views;
CREATE POLICY "Users can create story views" ON story_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Create RLS policies for story_reactions
DROP POLICY IF EXISTS "Users can view story reactions" ON story_reactions;
CREATE POLICY "Users can view story reactions" ON story_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create story reactions" ON story_reactions;
CREATE POLICY "Users can create story reactions" ON story_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own story reactions" ON story_reactions;
CREATE POLICY "Users can delete their own story reactions" ON story_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE stories IS 'User stories that expire after 24 hours';
COMMENT ON TABLE story_views IS 'Tracks who viewed which stories';
COMMENT ON TABLE story_reactions IS 'User reactions to stories (likes, etc.)';

-- Verify the foreign key relationships
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('stories', 'story_views', 'story_reactions')
ORDER BY tc.table_name, tc.constraint_name;
