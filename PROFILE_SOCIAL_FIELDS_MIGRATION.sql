-- Add social media profile fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sdc_username TEXT,
ADD COLUMN IF NOT EXISTS mutual_profile TEXT,
ADD COLUMN IF NOT EXISTS fb_profile TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.sdc_username IS 'SDC username for social media integration';
COMMENT ON COLUMN profiles.mutual_profile IS 'MUTUAL/S profile name for social media integration';
COMMENT ON COLUMN profiles.fb_profile IS 'Facebook profile URL or username for social media integration';
