/*
  # Fix Reviews System

  1. Storage Setup
    - Ensure productimage bucket exists and is public
    - Add proper storage policies for review images

  2. Reviews Table Fixes
    - Ensure proper RLS policies
    - Add missing columns if needed
    - Fix approval system

  3. Functions and Views
    - Create helper functions for review management
    - Add views for easier data access
*/

-- Ensure productimage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productimage', 
  'productimage', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Clean up existing storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_policy" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'productimage');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'productimage' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'productimage' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'productimage' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can manage all images
CREATE POLICY "Admins can manage all images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'productimage' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Ensure reviews table has all necessary columns
DO $$
BEGIN
  -- Add approved_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE reviews ADD COLUMN approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add approved_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE reviews ADD COLUMN approved_at timestamptz;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE reviews ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Clean up existing review policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own unapproved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own unapproved reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON reviews;

-- Create clean review policies
CREATE POLICY "reviews_select_approved_public"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "reviews_select_own"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND is_approved = false
  );

CREATE POLICY "reviews_update_own_unapproved"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND is_approved = false
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND is_approved = false
  );

CREATE POLICY "reviews_delete_own_unapproved"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND is_approved = false
  );

CREATE POLICY "reviews_admin_all"
  ON reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create or replace the approval timestamp function
CREATE OR REPLACE FUNCTION set_review_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Set updated_at on any update
    NEW.updated_at = now();
    
    -- If is_approved changed from false/null to true, set approval info
    IF (OLD.is_approved IS DISTINCT FROM true) AND NEW.is_approved = true THEN
        NEW.approved_at = now();
        NEW.approved_by = auth.uid();
    END IF;
    
    -- If is_approved changed from true to false/null, clear approval info
    IF OLD.is_approved = true AND (NEW.is_approved IS DISTINCT FROM true) THEN
        NEW.approved_at = NULL;
        NEW.approved_by = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_set_review_approval_timestamp ON reviews;
CREATE TRIGGER trigger_set_review_approval_timestamp
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_review_approval_timestamp();

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the updated_at trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get reviews with user info (bypasses RLS issues)
CREATE OR REPLACE FUNCTION get_product_reviews(product_id_param uuid)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  user_id uuid,
  rating integer,
  title text,
  comment text,
  image_urls text[],
  is_approved boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text,
  user_email text,
  product_name text,
  product_image text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.product_id,
    r.user_id,
    r.rating,
    r.title,
    r.comment,
    r.image_urls,
    r.is_approved,
    r.created_at,
    r.updated_at,
    p.full_name as user_name,
    p.email as user_email,
    prod.name as product_name,
    COALESCE((prod.image_urls)[1], prod.image_url, '/placeholder.jpg') as product_image
  FROM 
    reviews r
  LEFT JOIN 
    profiles p ON r.user_id = p.id
  LEFT JOIN 
    products prod ON r.product_id = prod.id
  WHERE 
    r.product_id = product_id_param
    AND r.is_approved = true
  ORDER BY 
    r.created_at DESC;
END;
$$;

-- Create a function to get all reviews for admin (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_reviews_admin()
RETURNS TABLE (
  id uuid,
  product_id uuid,
  user_id uuid,
  rating integer,
  title text,
  comment text,
  image_urls text[],
  is_approved boolean,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text,
  user_email text,
  product_name text,
  product_image text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.product_id,
    r.user_id,
    r.rating,
    r.title,
    r.comment,
    r.image_urls,
    r.is_approved,
    r.approved_by,
    r.approved_at,
    r.created_at,
    r.updated_at,
    p.full_name as user_name,
    p.email as user_email,
    prod.name as product_name,
    COALESCE((prod.image_urls)[1], prod.image_url, '/placeholder.jpg') as product_image
  FROM 
    reviews r
  LEFT JOIN 
    profiles p ON r.user_id = p.id
  LEFT JOIN 
    products prod ON r.product_id = prod.id
  ORDER BY 
    r.created_at DESC;
END;
$$;

-- Test the reviews system
DO $$
BEGIN
  -- Test that we can select from reviews table
  PERFORM * FROM reviews LIMIT 1;
  RAISE NOTICE 'Reviews table access test passed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Reviews table access test failed: %', SQLERRM;
END $$;
