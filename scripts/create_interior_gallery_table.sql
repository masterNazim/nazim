-- Create interior_gallery table for showcasing interior design work
CREATE TABLE IF NOT EXISTS interior_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('office_space', 'hotel_space', 'residential', 'commercial_space')),
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  project_details JSONB DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interior_gallery_updated_at BEFORE UPDATE
    ON interior_gallery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE interior_gallery ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow public read access
CREATE POLICY "Allow public read access" ON interior_gallery
    FOR SELECT USING (true);

-- Allow admin users to insert, update, delete
CREATE POLICY "Allow admin full access" ON interior_gallery
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_interior_gallery_category ON interior_gallery(category);
CREATE INDEX IF NOT EXISTS idx_interior_gallery_featured ON interior_gallery(featured);
CREATE INDEX IF NOT EXISTS idx_interior_gallery_created_at ON interior_gallery(created_at DESC);
