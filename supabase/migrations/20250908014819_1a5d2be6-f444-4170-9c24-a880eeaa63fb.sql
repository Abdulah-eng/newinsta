-- Create test user profiles for developers
-- These are mock profiles that can be used for testing

-- Insert test profiles (assuming users will be created through auth)
INSERT INTO public.profiles (id, email, full_name, bio, avatar_url, membership_tier) 
VALUES 
  -- Test Admin User
  ('11111111-1111-1111-1111-111111111111', 'admin@echelontexas.com', 'Admin User', 'Test administrator account for development', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 'elite'),
  
  -- Test Premium User  
  ('22222222-2222-2222-2222-222222222222', 'premium@echelontexas.com', 'Premium User', 'Test premium member account', 'https://images.unsplash.com/photo-1494790108755-2616b612b05b?w=150&h=150&fit=crop&crop=face', 'premium'),
  
  -- Test Basic User
  ('33333333-3333-3333-3333-333333333333', 'basic@echelontexas.com', 'Basic User', 'Test basic member account', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 'basic'),
  
  -- Test Developer User
  ('44444444-4444-4444-4444-444444444444', 'developer@echelontexas.com', 'Developer Test', 'Developer testing account', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face', 'premium'),
  
  -- Test NSFW Content Creator
  ('55555555-5555-5555-5555-555555555555', 'creator@echelontexas.com', 'Content Creator', 'Test account for NSFW content testing', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 'elite')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  avatar_url = EXCLUDED.avatar_url,
  membership_tier = EXCLUDED.membership_tier;

-- Create test subscriber records
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@echelontexas.com', true, 'elite', now() + interval '1 year'),
  ('22222222-2222-2222-2222-222222222222', 'premium@echelontexas.com', true, 'premium', now() + interval '1 year'),
  ('33333333-3333-3333-3333-333333333333', 'basic@echelontexas.com', true, 'basic', now() + interval '1 year'),
  ('44444444-4444-4444-4444-444444444444', 'developer@echelontexas.com', true, 'premium', now() + interval '1 year'),
  ('55555555-5555-5555-5555-555555555555', 'creator@echelontexas.com', true, 'elite', now() + interval '1 year')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end;

-- Add some test posts from these users
INSERT INTO public.posts (id, author_id, content, image_url, is_nsfw, created_at)
VALUES 
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Welcome to Echelon Texas! This is a test post from the admin account.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', false, now() - interval '2 hours'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Testing the premium member experience! Love the exclusive content here.', 'https://images.unsplash.com/photo-1545267394-76ded3ad83c5?w=800&h=600&fit=crop', false, now() - interval '4 hours'),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'This is NSFW content for testing the blur functionality. Tap to reveal!', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop', true, now() - interval '6 hours'),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Developer testing various features and functionalities of the platform.', null, false, now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Add some test comments
INSERT INTO public.comments (id, post_id, author_id, content, created_at)
SELECT 
  gen_random_uuid(),
  p.id,
  '22222222-2222-2222-2222-222222222222',
  'Great post! Thanks for sharing.',
  now() - interval '30 minutes'
FROM public.posts p 
WHERE p.author_id = '11111111-1111-1111-1111-111111111111'
LIMIT 1
ON CONFLICT (id) DO NOTHING;