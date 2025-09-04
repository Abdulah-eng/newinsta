-- Check and fix the handle_new_user function to better handle profile creation
-- Also add a trigger to ensure it runs on user creation

-- First, let's check if we have a trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create an improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'fullName', 
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$function$;

-- Create the trigger to run this function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fix RLS policies for profiles to ensure users can see their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more permissive policies for profile access
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles  
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Update the existing profile with a better display name if full_name is null
UPDATE public.profiles 
SET full_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE full_name IS NULL OR full_name = '';