-- Final fix for stories foreign key relationships
-- This will ensure the foreign key relationships are properly established

-- First, let's check if the foreign key constraints exist
DO $$
BEGIN
  -- Check if stories table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
    RAISE NOTICE 'Stories table does not exist. Please run the main migration first.';
    RETURN;
  END IF;

  -- Check if profiles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE 'Profiles table does not exist. Please run the main migration first.';
    RETURN;
  END IF;

  -- Drop existing foreign key constraints if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stories_author_id_fkey'
  ) THEN
    ALTER TABLE stories DROP CONSTRAINT stories_author_id_fkey;
    RAISE NOTICE 'Dropped existing stories_author_id_fkey constraint';
  END IF;

  -- Add the foreign key constraint with the correct name
  ALTER TABLE stories 
  ADD CONSTRAINT stories_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
  
  RAISE NOTICE 'Added stories_author_id_fkey constraint';

  -- Verify the constraint was created
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stories_author_id_fkey'
  ) THEN
    RAISE NOTICE 'Foreign key constraint verified successfully';
  ELSE
    RAISE NOTICE 'Failed to create foreign key constraint';
  END IF;

END $$;

-- Also ensure story_views and story_reactions have proper foreign keys
DO $$
BEGIN
  -- Check and fix story_views foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_views') THEN
    -- Drop existing constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_views_story_id_fkey') THEN
      ALTER TABLE story_views DROP CONSTRAINT story_views_story_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_views_viewer_id_fkey') THEN
      ALTER TABLE story_views DROP CONSTRAINT story_views_viewer_id_fkey;
    END IF;

    -- Add new constraints
    ALTER TABLE story_views ADD CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
    ALTER TABLE story_views ADD CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed story_views foreign key constraints';
  END IF;

  -- Check and fix story_reactions foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_reactions') THEN
    -- Drop existing constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_reactions_story_id_fkey') THEN
      ALTER TABLE story_reactions DROP CONSTRAINT story_reactions_story_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'story_reactions_user_id_fkey') THEN
      ALTER TABLE story_reactions DROP CONSTRAINT story_reactions_user_id_fkey;
    END IF;

    -- Add new constraints
    ALTER TABLE story_reactions ADD CONSTRAINT story_reactions_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
    ALTER TABLE story_reactions ADD CONSTRAINT story_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed story_reactions foreign key constraints';
  END IF;

END $$;

-- Verify all foreign key relationships
SELECT 
  tc.table_name,
  tc.constraint_name,
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
