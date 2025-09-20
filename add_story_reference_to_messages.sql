-- Add story_reference column to direct_messages table
-- This allows messages to reference stories when reactions/comments are sent

-- Add story_reference column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'direct_messages' 
    AND column_name = 'story_reference'
  ) THEN
    ALTER TABLE direct_messages 
    ADD COLUMN story_reference UUID REFERENCES stories(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added story_reference column to direct_messages table';
  ELSE
    RAISE NOTICE 'story_reference column already exists in direct_messages table';
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_story_reference 
ON direct_messages(story_reference);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
AND column_name = 'story_reference';
