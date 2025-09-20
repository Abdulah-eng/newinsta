-- Create a secure admin function to delete users
-- This function bypasses RLS and can only be called by admins

-- First, create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR is_super_admin = true OR is_moderator = true)
  );
END;
$$;

-- Create the main delete user function
CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id UUID,
  p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  result JSON;
BEGIN
  -- Check if the current user is an admin
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Access denied: Admin privileges required'
    );
  END IF;

  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Prevent admins from deleting themselves
  IF p_user_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete your own account'
    );
  END IF;

  -- Start transaction
  BEGIN
    -- Delete user's posts
    DELETE FROM posts WHERE author_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % posts', deleted_count;

    -- Delete user's messages (both sent and received)
    DELETE FROM direct_messages WHERE sender_id = p_user_id OR recipient_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % messages', deleted_count;

    -- Delete user's stories
    DELETE FROM stories WHERE author_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % stories', deleted_count;

    -- Delete user's reports (both as reporter and reported)
    DELETE FROM reports WHERE reporter_id = p_user_id OR reported_user_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % reports', deleted_count;

    -- Delete user's restrictions
    DELETE FROM user_restrictions WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % restrictions', deleted_count;

    -- Delete user's follows (both as follower and following)
    DELETE FROM follows WHERE follower_id = p_user_id OR following_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % follows', deleted_count;

    -- Delete user's likes
    DELETE FROM likes WHERE user_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % likes', deleted_count;

    -- Delete user's comments
    DELETE FROM comments WHERE author_id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % comments', deleted_count;

    -- Finally, delete the user profile
    DELETE FROM profiles WHERE id = p_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % profiles', deleted_count;

    -- Log the admin action
    INSERT INTO audit_logs (
      actor_id,
      action_type,
      target_type,
      target_id,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      'delete_user',
      'user',
      p_user_id,
      json_build_object('reason', p_reason),
      NOW()
    );

    -- Return success
    RETURN json_build_object(
      'success', true,
      'message', 'User account deleted successfully',
      'deleted_user_id', p_user_id
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on error
      RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID, TEXT) TO authenticated;

-- Test the function (uncomment to test)
-- SELECT admin_delete_user('user-id-here', 'Test deletion');

-- Create a function to check if user exists (for validation)
CREATE OR REPLACE FUNCTION user_exists(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION user_exists(UUID) TO authenticated;
