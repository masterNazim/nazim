-- Disable RLS temporarily to fix issues
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Create storage bucket policy for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productimage', 'productimage', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to product images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'productimage');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'productimage' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'productimage' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'productimage' AND auth.role() = 'authenticated');

-- Re-enable RLS with proper policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products and categories
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);

-- Allow authenticated users to manage products (for admin)
CREATE POLICY "Authenticated users can manage products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
