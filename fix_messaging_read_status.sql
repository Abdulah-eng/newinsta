-- Fix messaging read status and unread count issues
-- Run this in your Supabase SQL Editor

-- 1. Fix the get_user_conversations function
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
    -- Get all users this user has messaged or been messaged by
    SELECT DISTINCT 
      CASE 
        WHEN dm.sender_id = p_user_id THEN dm.recipient_id
        ELSE dm.sender_id
      END as other_user_id
    FROM direct_messages dm
    WHERE dm.sender_id = p_user_id OR dm.recipient_id = p_user_id
  ),
  latest_messages AS (
    SELECT 
      cp.other_user_id,
      dm.content,
      dm.created_at
    FROM conversation_partners cp
    CROSS JOIN LATERAL (
      SELECT dm2.content, dm2.created_at
      FROM direct_messages dm2
      WHERE (dm2.sender_id = p_user_id AND dm2.recipient_id = cp.other_user_id) OR
            (dm2.recipient_id = p_user_id AND dm2.sender_id = cp.other_user_id)
      ORDER BY dm2.created_at DESC
      LIMIT 1
    ) dm
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

-- 2. Ensure the mark_messages_as_read function exists and works correctly
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
    
  -- Log the update for debugging
  RAISE NOTICE 'Marked messages as read for user % from sender %', p_user_id, p_other_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- 4. Test the functions (optional - remove after testing)
-- SELECT * FROM get_user_conversations('your-user-id-here');
-- SELECT mark_messages_as_read('your-user-id-here', 'other-user-id-here');
