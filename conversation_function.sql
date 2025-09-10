-- SQL function to get user conversations for Direct Messages
-- Add this to your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  id UUID,
  other_user JSONB,
  last_message JSONB,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    -- Get all users this user has messaged or been messaged by
    SELECT DISTINCT 
      CASE 
        WHEN dm.sender_id = user_id THEN dm.recipient_id
        ELSE dm.sender_id
      END as partner_id
    FROM direct_messages dm
    WHERE dm.sender_id = user_id OR dm.recipient_id = user_id
  ),
  conversations AS (
    SELECT 
      cp.partner_id as id,
      p.full_name,
      p.avatar_url,
      p.handle,
      -- Get the last message in this conversation
      (
        SELECT jsonb_build_object(
          'content', dm.content,
          'created_at', dm.created_at,
          'sender_id', dm.sender_id,
          'is_read', dm.is_read
        )
        FROM direct_messages dm
        WHERE (dm.sender_id = user_id AND dm.recipient_id = cp.partner_id)
           OR (dm.sender_id = cp.partner_id AND dm.recipient_id = user_id)
        ORDER BY dm.created_at DESC
        LIMIT 1
      ) as last_message,
      -- Count unread messages from this partner
      (
        SELECT COUNT(*)
        FROM direct_messages dm
        WHERE dm.sender_id = cp.partner_id 
          AND dm.recipient_id = user_id
          AND dm.is_read = false
      ) as unread_count
    FROM conversation_partners cp
    JOIN profiles p ON p.id = cp.partner_id
  )
  SELECT 
    c.id,
    jsonb_build_object(
      'id', c.id,
      'full_name', c.full_name,
      'avatar_url', c.avatar_url,
      'handle', c.handle
    ) as other_user,
    c.last_message,
    c.unread_count
  FROM conversations c
  ORDER BY (c.last_message->>'created_at')::timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
