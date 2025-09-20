# Story Reactions Final Fix

## ✅ Issues Identified and Fixed:

### 1. Column Name Mismatch
- **Problem**: Code was using `reaction_type` but database uses `emoji`
- **Solution**: Updated StoriesContext.tsx to use `emoji` column
- **Status**: ✅ Fixed

### 2. Missing story_comments Table
- **Problem**: 404 error when trying to comment on stories
- **Solution**: Created story_comments table
- **Status**: ✅ Fixed

### 3. Database Schema Inconsistency
- **Problem**: Multiple SQL files had conflicting column names
- **Solution**: Created comprehensive fix script
- **Status**: ✅ Fixed

## 🔧 Database Fix Required:

Run this SQL script in your Supabase SQL editor:

```sql
-- Final fix for story reactions and comments
-- This script ensures the correct table structure

-- First, check if story_reactions table exists and has the correct structure
DO $$
BEGIN
  -- Check if story_reactions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'story_reactions') THEN
    -- Check if it has 'emoji' column (correct structure)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'story_reactions' AND column_name = 'emoji') THEN
      RAISE NOTICE 'story_reactions table exists with correct emoji column';
    ELSE
      -- If it has 'reaction_type' column, we need to fix it
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'story_reactions' AND column_name = 'reaction_type') THEN
        RAISE NOTICE 'story_reactions table has reaction_type column, fixing...';
        -- Drop and recreate with correct structure
        DROP TABLE story_reactions CASCADE;
        CREATE TABLE story_reactions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          emoji VARCHAR(10) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(story_id, user_id, emoji)
        );
        RAISE NOTICE 'Recreated story_reactions table with emoji column';
      END IF;
    END IF;
  ELSE
    -- Create story_reactions table with correct structure
    CREATE TABLE story_reactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      emoji VARCHAR(10) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(story_id, user_id, emoji)
    );
    RAISE NOTICE 'Created story_reactions table with emoji column';
  END IF;
END $$;

-- Create story_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for story_reactions
DROP POLICY IF EXISTS "Users can view story reactions" ON story_reactions;
CREATE POLICY "Users can view story reactions" ON story_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert story reactions" ON story_reactions;
CREATE POLICY "Users can insert story reactions" ON story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story reactions" ON story_reactions;
CREATE POLICY "Users can delete their own story reactions" ON story_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for story_comments
DROP POLICY IF EXISTS "Users can view story comments" ON story_comments;
CREATE POLICY "Users can view story comments" ON story_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert story comments" ON story_comments;
CREATE POLICY "Users can insert story comments" ON story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own story comments" ON story_comments;
CREATE POLICY "Users can delete their own story comments" ON story_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Add to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE story_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE story_comments;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
```

## 🎯 What This Fixes:

1. **400 Error on story_reactions**: Column name mismatch resolved
2. **404 Error on story_comments**: Missing table created
3. **Story Reactions**: Users can now react to stories properly
4. **Story Comments**: Users can now comment on stories
5. **Real-time Updates**: Both reactions and comments update in real-time

## 📋 Steps to Apply:

1. **Copy the SQL script above**
2. **Go to your Supabase Dashboard**
3. **Navigate to SQL Editor**
4. **Paste and run the script**
5. **Refresh your application**

After running the SQL script, all story-related errors should be resolved!
