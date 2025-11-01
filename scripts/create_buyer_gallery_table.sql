-- Create buyer_gallery table for showcasing completed projects
CREATE TABLE IF NOT EXISTS buyer_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  delivery_location VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0
);

-- Create storage bucket for buyer gallery images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('buyergallery', 'buyergallery', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for buyer_gallery table
ALTER TABLE buyer_gallery ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Public can view buyer gallery" ON buyer_gallery
  FOR SELECT USING (true);

-- Policy for admin insert access
CREATE POLICY "Admin can insert buyer gallery" ON buyer_gallery
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy for admin update access
CREATE POLICY "Admin can update buyer gallery" ON buyer_gallery
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Policy for admin delete access
CREATE POLICY "Admin can delete buyer gallery" ON buyer_gallery
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Set up storage policies for buyergallery bucket
CREATE POLICY "Public can view buyer gallery images" ON storage.objects
  FOR SELECT USING (bucket_id = 'buyergallery');

CREATE POLICY "Admin can upload buyer gallery images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'buyergallery' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin can update buyer gallery images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'buyergallery' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin can delete buyer gallery images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'buyergallery' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_buyer_gallery_category ON buyer_gallery(category_id);
CREATE INDEX IF NOT EXISTS idx_buyer_gallery_featured ON buyer_gallery(is_featured);
CREATE INDEX IF NOT EXISTS idx_buyer_gallery_created_at ON buyer_gallery(created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_gallery_display_order ON buyer_gallery(display_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_buyer_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buyer_gallery_updated_at
  BEFORE UPDATE ON buyer_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_gallery_updated_at();
