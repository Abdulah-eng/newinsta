-- Debug Real-time Messaging Issues
-- Run this in Supabase SQL Editor to diagnose problems

-- 1. Check if real-time is enabled for direct_messages
SELECT 
    'Real-time Publication Check' as test_name,
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
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'direct_messages';

-- 4. Check if rate limiting function exists
SELECT 
    'Rate Limit Function' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_rate_limit'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as result;

-- 5. Test insert (this should trigger real-time)
-- Replace with actual user IDs from your auth.users table
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insert test message
        INSERT INTO direct_messages (
            sender_id,
            recipient_id,
            content
        ) VALUES (
            test_user_id,
            test_user_id,
            'Debug test message - ' || now()::text
        );
        
        RAISE NOTICE 'Test message inserted for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- 6. Check recent messages
SELECT 
    'Recent Messages' as test_name,
    COUNT(*) as message_count,
    MAX(created_at) as latest_message
FROM direct_messages 
WHERE created_at > NOW() - INTERVAL '5 minutes';

-- 7. Check publication details
SELECT 
    'Publication Details' as test_name,
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'direct_messages';

-- 8. If real-time is not enabled, enable it
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

-- 9. Final verification
SELECT 
    'Final Status' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN '✅ REAL-TIME READY' ELSE '❌ NEEDS FIX' END as result;
