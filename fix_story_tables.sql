-- Fix story tables and related issues
-- This script creates missing tables and fixes conflicts

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
