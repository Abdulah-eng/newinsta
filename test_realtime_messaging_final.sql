-- Final Real-time Messaging Test and Fix
-- Run this in your Supabase SQL Editor to ensure everything is working

-- 1. Check if real-time is enabled for direct_messages
SELECT 
    'Real-time Status Check' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN '✅ ENABLED' ELSE '❌ DISABLED - RUN FIX SCRIPT' END as result;

-- 2. If not enabled, enable it
DO $$
BEGIN
    -- Check if table exists in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN
        -- Add table to real-time publication
        ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
        RAISE NOTICE 'Added direct_messages to real-time publication';
    ELSE
        RAISE NOTICE 'direct_messages already enabled for real-time';
    END IF;
END $$;

-- 3. Verify RLS policies exist
SELECT 
    'RLS Policies' as test_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'direct_messages';

-- 4. Test insert to trigger real-time (replace with actual user IDs)
-- This will create a test message that should trigger real-time events
INSERT INTO direct_messages (
  sender_id,
  recipient_id,
  content
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1),
  'Real-time test message - ' || now()::text
) RETURNING id, content, created_at;

-- 5. Check recent messages count
SELECT 
    'Recent Messages' as test_name,
    COUNT(*) as message_count,
    MAX(created_at) as latest_message
FROM direct_messages 
WHERE created_at > NOW() - INTERVAL '1 minute';

-- 6. Final verification
SELECT 
    'Final Status' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN '✅ REAL-TIME READY' ELSE '❌ NEEDS FIX' END as result;
