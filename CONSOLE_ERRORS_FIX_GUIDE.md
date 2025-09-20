# Console Errors Fix Guide

## Issues Found:
1. **500 error on CommentSection.tsx** - Fixed syntax errors
2. **404 error on story_comments** - Missing table
3. **409 error on story_reactions** - Missing table with unique constraints
4. **Missing Dialog Description** - Accessibility warning

## ✅ Fixed Issues:

### 1. CommentSection.tsx Syntax Errors
- Fixed indentation issues
- Corrected JSX structure
- All syntax errors resolved

### 2. Dialog Description Warnings
- Added `DialogDescription` import
- Added descriptions to both Dialog components in StoriesDisplay.tsx
- Accessibility warnings resolved

## 🔧 Database Fix Required:

Run this SQL script in your Supabase SQL editor:

```sql
-- Create story_comments table
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_reactions table
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for story_comments
CREATE POLICY "Users can view story comments" ON story_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert story comments" ON story_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story comments" ON story_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for story_reactions
CREATE POLICY "Users can view story reactions" ON story_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert story reactions" ON story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story reactions" ON story_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Add to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE story_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE story_reactions;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user_id ON story_reactions(user_id);
```

## 🎯 What This Fixes:

1. **Story Comments**: Users can now comment on stories without 404 errors
2. **Story Reactions**: Users can react to stories without 409 conflicts
3. **Real-time Updates**: Comments and reactions will update in real-time
4. **Accessibility**: Dialog components now have proper descriptions
5. **Performance**: Added indexes for better query performance

## 📋 Steps to Apply:

1. **Copy the SQL script above**
2. **Go to your Supabase Dashboard**
3. **Navigate to SQL Editor**
4. **Paste and run the script**
5. **Refresh your application**

After running the SQL script, all console errors should be resolved!
