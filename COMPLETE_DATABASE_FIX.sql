-- Complete database fix for all stories and messaging issues
-- This will fix foreign keys, missing columns, and RLS policies

-- 1. Fix stories table structure and foreign keys
DO $$
BEGIN
  -- Check if stories table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
    CREATE TABLE stories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      author_id UUID NOT NULL,
      content TEXT,
      image_url TEXT,
      video_url TEXT,
      is_nsfw BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created stories table';
  END IF;

  -- Check if story_views table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_views') THEN
    CREATE TABLE story_views (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      story_id UUID NOT NULL,
      viewer_id UUID NOT NULL,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(story_id, viewer_id)
    );
    RAISE NOTICE 'Created story_views table';
  END IF;

  -- Check if story_reactions table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_reactions') THEN
    CREATE TABLE story_reactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      story_id UUID NOT NULL,
      user_id UUID NOT NULL,
      reaction_type TEXT NOT NULL DEFAULT 'like',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(story_id, user_id)
    );
    RAISE NOTICE 'Created story_reactions table';
  END IF;

  -- Add missing reaction_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'story_reactions' AND column_name = 'reaction_type'
  ) THEN
    ALTER TABLE story_reactions ADD COLUMN reaction_type TEXT NOT NULL DEFAULT 'like';
    RAISE NOTICE 'Added reaction_type column to story_reactions';
  END IF;

END $$;

-- 2. Drop existing foreign key constraints if they exist
DO $$
BEGIN
  -- Drop stories foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'stories_author_id_fkey') THEN
    ALTER TABLE stories DROP CONSTRAINT stories_author_id_fkey;
  END IF;

  -- Drop story_views foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_views_story_id_fkey') THEN
    ALTER TABLE story_views DROP CONSTRAINT story_views_story_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_views_viewer_id_fkey') THEN
    ALTER TABLE story_views DROP CONSTRAINT story_views_viewer_id_fkey;
  END IF;

  -- Drop story_reactions foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_reactions_story_id_fkey') THEN
    ALTER TABLE story_reactions DROP CONSTRAINT story_reactions_story_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_reactions_user_id_fkey') THEN
    ALTER TABLE story_reactions DROP CONSTRAINT story_reactions_user_id_fkey;
  END IF;

  RAISE NOTICE 'Dropped existing foreign key constraints';
END $$;

-- 3. Add foreign key constraints with correct references
DO $$
BEGIN
  -- Add stories foreign key
  ALTER TABLE stories 
  ADD CONSTRAINT stories_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Added stories_author_id_fkey';

  -- Add story_views foreign keys
  ALTER TABLE story_views 
  ADD CONSTRAINT story_views_story_id_fkey 
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
  ALTER TABLE story_views 
  ADD CONSTRAINT story_views_viewer_id_fkey 
  FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Added story_views foreign keys';

  -- Add story_reactions foreign keys
  ALTER TABLE story_reactions 
  ADD CONSTRAINT story_reactions_story_id_fkey 
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
  ALTER TABLE story_reactions 
  ADD CONSTRAINT story_reactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Added story_reactions foreign keys';

END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);

-- 5. Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Stories policies
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

-- Story views policies
DROP POLICY IF EXISTS "Users can view story views" ON story_views;
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create story views" ON story_views;
CREATE POLICY "Users can create story views" ON story_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- Story reactions policies
DROP POLICY IF EXISTS "Users can view story reactions" ON story_reactions;
CREATE POLICY "Users can view story reactions" ON story_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create story reactions" ON story_reactions;
CREATE POLICY "Users can create story reactions" ON story_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own story reactions" ON story_reactions;
CREATE POLICY "Users can delete their own story reactions" ON story_reactions
  FOR DELETE USING (user_id = auth.uid());

-- 7. Add comments
COMMENT ON TABLE stories IS 'User stories that expire after 24 hours';
COMMENT ON TABLE story_views IS 'Tracks who viewed which stories';
COMMENT ON TABLE story_reactions IS 'User reactions to stories (likes, etc.)';

-- 8. Verify the foreign key relationships
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
