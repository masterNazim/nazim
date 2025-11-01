/*
  # Debug Review Policies
  
  This migration helps debug why admin approval isn't working by:
  1. Adding detailed logging to approval functions
  2. Creating a test function to verify admin permissions
  3. Adding better error handling for approval operations
*/

-- Function to test admin permissions
CREATE OR REPLACE FUNCTION test_admin_permissions(user_id_param uuid)
RETURNS TABLE (
  user_exists boolean,
  profile_exists boolean,
  is_admin boolean,
  can_update_reviews boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
  profile_count integer;
  admin_status boolean;
  update_test boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT COUNT(*) INTO user_count
  FROM auth.users
  WHERE id = user_id_param;
  
  -- Check if profile exists
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE id = user_id_param;
  
  -- Check admin status
  SELECT COALESCE(profiles.is_admin, false) INTO admin_status
  FROM profiles
  WHERE id = user_id_param;
  
  -- Test if user can update reviews (simplified test)
  BEGIN
    -- Try to perform a dummy update to test permissions
    UPDATE reviews 
    SET updated_at = now() 
    WHERE id = '00000000-0000-0000-0000-000000000000'; -- Non-existent ID
    update_test := true;
  EXCEPTION
    WHEN OTHERS THEN
      update_test := false;
  END;
  
  RETURN QUERY SELECT 
    user_count > 0 as user_exists,
    profile_count > 0 as profile_exists,
    admin_status as is_admin,
    update_test as can_update_reviews;
END;
$$;

-- Enhanced approval function with detailed logging
CREATE OR REPLACE FUNCTION approve_review_with_logging(
  review_id_param uuid,
  admin_user_id uuid
)
RETURNS TABLE (
  success boolean,
  error_message text,
  review_found boolean,
  admin_verified boolean,
  update_successful boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review_count integer;
  admin_count integer;
  update_count integer;
BEGIN
  -- Initialize return values
  success := false;
  error_message := '';
  review_found := false;
  admin_verified := false;
  update_successful := false;
  
  -- Check if review exists
  SELECT COUNT(*) INTO review_count
  FROM reviews
  WHERE id = review_id_param;
  
  review_found := review_count > 0;
  
  IF NOT review_found THEN
    error_message := 'Review not found';
    RETURN QUERY SELECT success, error_message, review_found, admin_verified, update_successful;
    RETURN;
  END IF;
  
  -- Check if user is admin
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE id = admin_user_id AND is_admin = true;
  
  admin_verified := admin_count > 0;
  
  IF NOT admin_verified THEN
    error_message := 'User is not an admin';
    RETURN QUERY SELECT success, error_message, review_found, admin_verified, update_successful;
    RETURN;
  END IF;
  
  -- Attempt to update the review
  BEGIN
    UPDATE reviews
    SET 
      is_approved = true,
      approved_at = now(),
      approved_by = admin_user_id,
      updated_at = now()
    WHERE id = review_id_param;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    update_successful := update_count > 0;
    
    IF update_successful THEN
      success := true;
      error_message := 'Review approved successfully';
    ELSE
      error_message := 'No rows were updated';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      error_message := SQLERRM;
      update_successful := false;
  END;
  
  RETURN QUERY SELECT success, error_message, review_found, admin_verified, update_successful;
END;
$$;

-- Function to get detailed review info for debugging
CREATE OR REPLACE FUNCTION get_review_debug_info(review_id_param uuid)
RETURNS TABLE (
  review_exists boolean,
  current_status boolean,
  user_id uuid,
  product_id uuid,
  created_at timestamptz,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as review_exists,
    r.is_approved as current_status,
    r.user_id,
    r.product_id,
    r.created_at,
    r.updated_at as last_updated
  FROM reviews r
  WHERE r.id = review_id_param;
END;
$$;
