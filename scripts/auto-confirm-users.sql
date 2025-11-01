-- Auto-confirm users for development
-- This trigger automatically confirms users when they sign up
-- Remove this in production if you want email confirmation

CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm user for development
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_confirm_user ON auth.users;

-- Create trigger to auto-confirm users
CREATE TRIGGER trigger_auto_confirm_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();

-- Also create/update the profile creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
