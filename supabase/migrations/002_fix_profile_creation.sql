-- Fix profile creation issue
-- This migration fixes the trigger and RLS policies for profile creation

-- ============================================
-- 1. Drop and recreate the trigger with proper permissions
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      'New User'
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. Add INSERT policy for service role
-- ============================================

-- Allow service role to insert profiles (needed for trigger)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. Create profiles for existing users without profiles
-- ============================================

-- Insert profiles for any auth.users that don't have a profile yet
INSERT INTO public.profiles (id, full_name)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.email,
    'User'
  ) as full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if trigger exists
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Check profiles count vs users count
SELECT
  'Users' as type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT
  'Profiles' as type, COUNT(*) as count FROM public.profiles;
