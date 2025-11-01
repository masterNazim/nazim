-- Create homepage_images table for room showcase images
CREATE TABLE IF NOT EXISTS homepage_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  room_type VARCHAR(100) NOT NULL, -- e.g., 'Living Room', 'Bedroom', 'Dining Room', 'Kitchen'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for homepage images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homepageimage', 'homepageimage', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for homepage_images table
ALTER TABLE homepage_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active homepage images
CREATE POLICY "Allow public read access to active homepage images" ON homepage_images
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to view all homepage images (for admin)
CREATE POLICY "Allow authenticated users to view all homepage images" ON homepage_images
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert homepage images
CREATE POLICY "Allow authenticated users to insert homepage images" ON homepage_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update homepage images
CREATE POLICY "Allow authenticated users to update homepage images" ON homepage_images
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete homepage images
CREATE POLICY "Allow authenticated users to delete homepage images" ON homepage_images
  FOR DELETE USING (auth.role() = 'authenticated');

-- Set up storage policies for homepageimage bucket
CREATE POLICY "Allow public read access to homepage images" ON storage.objects
  FOR SELECT USING (bucket_id = 'homepageimage');

CREATE POLICY "Allow authenticated users to upload homepage images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'homepageimage' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update homepage images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'homepageimage' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete homepage images" ON storage.objects
  FOR DELETE USING (bucket_id = 'homepageimage' AND auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_homepage_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_homepage_images_updated_at
  BEFORE UPDATE ON homepage_images
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_images_updated_at();

-- Insert some sample data
INSERT INTO homepage_images (title, description, image_url, room_type, display_order) VALUES
('Modern Living Room', 'Elegant and comfortable living room furniture for your home', 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 'Living Room', 1),
('Cozy Bedroom', 'Stylish bedroom furniture for a peaceful night''s sleep', 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 'Bedroom', 2),
('Elegant Dining Room', 'Beautiful dining sets for memorable family gatherings', 'https://images.pexels.com/photos/1080696/pexels-photo-1080696.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 'Dining Room', 3),
('Colorful Kids Room', 'Colorful and functional furniture for children''s rooms', 'https://images.pexels.com/photos/3932929/pexels-photo-3932929.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', 'Kids Room', 4);
