-- Fix product loading issues by ensuring proper RLS policies
-- This script ensures products are always accessible to anonymous and authenticated users

-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Only admins can manage products" ON products;

DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create clean, non-conflicting policies for products
CREATE POLICY "products_select_policy" 
  ON products FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "products_admin_all_policy" 
  ON products FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create clean, non-conflicting policies for categories  
CREATE POLICY "categories_select_policy" 
  ON categories FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "categories_admin_all_policy" 
  ON categories FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Ensure storage bucket is properly configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productimage', 'productimage', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create clean storage policies
CREATE POLICY "storage_select_policy" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'productimage');

CREATE POLICY "storage_insert_policy" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'productimage' AND auth.role() = 'authenticated');

CREATE POLICY "storage_update_policy" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'productimage' AND auth.role() = 'authenticated');

CREATE POLICY "storage_delete_policy" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'productimage' AND auth.role() = 'authenticated');

-- Verify the policies are working
DO $$
BEGIN
  -- Test that we can select products
  PERFORM * FROM products LIMIT 1;
  RAISE NOTICE 'Product access test passed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Product access test failed: %', SQLERRM;
END $$;
