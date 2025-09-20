-- Complete Real-Time Messaging Fix
-- Run this in your Supabase SQL Editor to fix all real-time messaging issues

-- 1. Ensure direct_messages table exists with proper structure
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

-- 2. Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update messages they sent" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can delete messages they sent" ON public.direct_messages;

-- 4. Create RLS policies
CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they sent" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete messages they sent" ON public.direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- 6. Grant permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT SELECT ON public.direct_messages TO anon;

-- 7. Enable real-time for direct_messages (CRITICAL FIX)
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- 8. Create or replace messaging functions
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE(
  conversation_id TEXT,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = p_user_id THEN recipient_id
        ELSE sender_id
      END as other_user_id
    FROM direct_messages
    WHERE sender_id = p_user_id OR recipient_id = p_user_id
  ),
  latest_messages AS (
    SELECT 
      dm.sender_id,
      dm.recipient_id,
      dm.content,
      dm.created_at,
      dm.is_read,
      CASE 
        WHEN dm.sender_id = p_user_id THEN dm.recipient_id
        ELSE dm.sender_id
      END as other_user_id
    FROM direct_messages dm
    INNER JOIN conversation_partners cp ON (
      (dm.sender_id = p_user_id AND dm.recipient_id = cp.other_user_id) OR
      (dm.recipient_id = p_user_id AND dm.sender_id = cp.other_user_id)
    )
    WHERE dm.created_at = (
      SELECT MAX(created_at)
      FROM direct_messages dm2
      WHERE (dm2.sender_id = p_user_id AND dm2.recipient_id = cp.other_user_id) OR
            (dm2.recipient_id = p_user_id AND dm2.sender_id = cp.other_user_id)
    )
  ),
  unread_counts AS (
    SELECT 
      sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM direct_messages
    WHERE recipient_id = p_user_id AND is_read = false
    GROUP BY sender_id
  )
  SELECT 
    lm.other_user_id::TEXT as conversation_id,
    lm.other_user_id,
    COALESCE(p.full_name, 'Unknown User') as other_user_name,
    p.avatar_url as other_user_avatar,
    lm.content as last_message_content,
    lm.created_at as last_message_created_at,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM latest_messages lm
  LEFT JOIN profiles p ON p.id = lm.other_user_id
  LEFT JOIN unread_counts uc ON uc.other_user_id = lm.other_user_id
  ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 50,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count attempts in the time window
  SELECT COUNT(*)
  INTO attempt_count
  FROM direct_messages
  WHERE sender_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- Return true if under limit
  RETURN attempt_count < p_max_attempts;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, allow the action (fail open)
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE direct_messages
  SET is_read = true, read_at = NOW()
  WHERE recipient_id = p_user_id 
    AND sender_id = p_other_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(
  p_user_id UUID,
  p_other_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  content TEXT,
  image_url TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.id,
    dm.sender_id,
    dm.recipient_id,
    dm.content,
    dm.image_url,
    dm.is_read,
    dm.read_at,
    dm.created_at,
    dm.updated_at
  FROM direct_messages dm
  WHERE (dm.sender_id = p_user_id AND dm.recipient_id = p_other_user_id)
     OR (dm.sender_id = p_other_user_id AND dm.recipient_id = p_user_id)
  ORDER BY dm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- 13. Verify the setup
SELECT 
    'direct_messages table exists' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'direct_messages' AND table_schema = 'public'
    ) THEN 'YES' ELSE 'NO' END as result

UNION ALL

SELECT 
    'real-time enabled' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN 'YES' ELSE 'NO' END as result

UNION ALL

SELECT 
    'RLS enabled' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'direct_messages' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN 'YES' ELSE 'NO' END as result

UNION ALL

SELECT 
    'Functions created' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_user_conversations'
    ) THEN 'YES' ELSE 'NO' END as result;
