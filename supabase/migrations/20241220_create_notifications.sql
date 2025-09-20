-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'like', 'follow', 'comment', 'report', 'admin')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB, -- Additional data like post_id, sender_id, etc.
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create function to automatically create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_sender_id UUID DEFAULT NULL,
  p_post_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, data, sender_id, post_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_sender_id, p_post_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create message notifications
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  recipient_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Get recipient name
  SELECT full_name INTO recipient_name FROM profiles WHERE id = NEW.recipient_id;
  
  -- Create notification for recipient
  PERFORM create_notification(
    NEW.recipient_id,
    'message',
    'New Message',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id),
    NEW.sender_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON direct_messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Create function to create like notifications
CREATE OR REPLACE FUNCTION notify_new_like() RETURNS TRIGGER AS $$
DECLARE
  liker_name TEXT;
  post_author_id UUID;
BEGIN
  -- Get liker name
  SELECT full_name INTO liker_name FROM profiles WHERE id = NEW.user_id;
  
  -- Get post author
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF NEW.user_id = post_author_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for post author
  PERFORM create_notification(
    post_author_id,
    'like',
    'New Like',
    COALESCE(liker_name, 'Someone') || ' liked your post',
    jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id),
    NEW.user_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new likes
DROP TRIGGER IF EXISTS trigger_notify_new_like ON likes;
CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_like();

-- Create function to create comment notifications
CREATE OR REPLACE FUNCTION notify_new_comment() RETURNS TRIGGER AS $$
DECLARE
  commenter_name TEXT;
  post_author_id UUID;
BEGIN
  -- Get commenter name
  SELECT full_name INTO commenter_name FROM profiles WHERE id = NEW.author_id;
  
  -- Get post author
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF NEW.author_id = post_author_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification for post author
  PERFORM create_notification(
    post_author_id,
    'comment',
    'New Comment',
    COALESCE(commenter_name, 'Someone') || ' commented on your post',
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.author_id),
    NEW.author_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new comments
DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;
CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();
