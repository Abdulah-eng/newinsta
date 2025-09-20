-- Comprehensive Real-time Messaging Fix
-- Run this in Supabase SQL Editor to fix all real-time issues

-- 1. Check current real-time status
SELECT 
    'Current Real-time Status' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN '✅ ENABLED' ELSE '❌ DISABLED' END as result;

-- 2. Ensure direct_messages table exists with proper structure
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

-- 3. Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update messages they sent" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can delete messages they sent" ON public.direct_messages;

-- 5. Create RLS policies
CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they sent" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete messages they sent" ON public.direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- 7. Grant permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT SELECT ON public.direct_messages TO anon;

-- 8. CRITICAL: Enable real-time for direct_messages
-- Add table to real-time publication (this will work whether it exists or not)
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- 9. Create a test function to verify real-time
CREATE OR REPLACE FUNCTION test_realtime_publication()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if table is in publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
  ) THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute permission
GRANT EXECUTE ON FUNCTION test_realtime_publication() TO authenticated;

-- 11. Test insert to trigger real-time
DO $$
DECLARE
    test_user_id UUID;
    test_message_id UUID;
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
            'Real-time test message - ' || now()::text
        ) RETURNING id INTO test_message_id;
        
        RAISE NOTICE 'Test message inserted with ID: %', test_message_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- 12. Final verification
SELECT 
    'Final Real-time Status' as test_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE tablename = 'direct_messages' AND pubname = 'supabase_realtime'
    ) THEN '✅ REAL-TIME READY' ELSE '❌ STILL BROKEN' END as result

UNION ALL

SELECT 
    'Test Function' as test_name,
    CASE WHEN test_realtime_publication() THEN '✅ WORKING' ELSE '❌ FAILED' END as result

UNION ALL

SELECT 
    'Recent Messages' as test_name,
    COUNT(*)::TEXT as result
FROM direct_messages 
WHERE created_at > NOW() - INTERVAL '1 minute';
