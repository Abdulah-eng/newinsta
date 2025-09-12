-- Admin Setup Script
-- Run this in your Supabase SQL Editor to create admin access

-- 1. First, create a regular user account through your app's signup process
-- 2. Then run this script to make that user an admin

-- Replace 'your-user-email@example.com' with the email of the user you want to make admin
-- You can find user emails in the auth.users table

-- Make a user an admin by updating their profile
UPDATE profiles 
SET is_admin = true, 
    membership_tier = 'elite',
    age_verified = true
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'your-user-email@example.com'
);

-- Verify the admin was created
SELECT 
    u.email,
    p.full_name,
    p.is_admin,
    p.membership_tier,
    p.age_verified
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.is_admin = true;

-- Alternative: Create admin directly (if you know the user ID)
-- UPDATE profiles 
-- SET is_admin = true, 
--     membership_tier = 'elite',
--     age_verified = true
-- WHERE id = 'your-user-id-here';
