-- Real-time Messaging Verification Test
-- Run this to test if real-time messaging is working properly

-- 1. Check if real-time is enabled
SELECT 
    'Real-time Status' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END as result;

-- 2. Check table structure
SELECT 
    'Table Structure' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'direct_messages' AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 3. Check RLS policies
SELECT 
    'RLS Policies' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'direct_messages'
    ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END as result;

-- 4. Check functions exist
SELECT 
    'Functions' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname IN ('get_user_conversations', 'check_rate_limit', 'mark_messages_as_read', 'get_conversation_messages')
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 5. Test insert (this should trigger real-time)
INSERT INTO direct_messages (
  sender_id,
  recipient_id,
  content
) VALUES (
  'a164adb0-9264-453a-82d7-4a3eec6d4865'::uuid,
  'a164adb0-9264-453a-82d7-4a3eec6d4865'::uuid,
  'Real-time test message - ' || now()::text
) RETURNING id, content, created_at;

-- 6. Check recent messages
SELECT 
    'Recent Messages' as test_name,
    COUNT(*) as message_count,
    MAX(created_at) as latest_message
FROM direct_messages 
WHERE sender_id = 'a164adb0-9264-453a-82d7-4a3eec6d4865'::uuid
   OR recipient_id = 'a164adb0-9264-453a-82d7-4a3eec6d4865'::uuid;
