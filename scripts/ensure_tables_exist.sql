-- Create all required tables if they don't exist

-- Ensure videos table exists
CREATE TABLE IF NOT EXISTS videos (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_id VARCHAR(50) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure collections table exists
CREATE TABLE IF NOT EXISTS collections (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

-- Insert default videos if none exist
INSERT INTO videos (title, description, youtube_id, display_order, is_active)
SELECT 
  'Welcome to EightHand Furniture',
  'Discover our premium furniture collection',
  'dQw4w9WgXcQ',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM videos WHERE display_order = 1);

INSERT INTO videos (title, description, youtube_id, display_order, is_active)
SELECT 
  'Craftsmanship Excellence',
  'See how we create beautiful furniture',
  'dQw4w9WgXcQ',
  2,
  true
WHERE NOT EXISTS (SELECT 1 FROM videos WHERE display_order = 2);

INSERT INTO videos (title, description, youtube_id, display_order, is_active)
SELECT 
  'Customer Stories',
  'Hear from our satisfied customers',
  'dQw4w9WgXcQ',
  3,
  true
WHERE NOT EXISTS (SELECT 1 FROM videos WHERE display_order = 3);

-- Enable RLS on new tables
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies for videos table
CREATE POLICY "Videos are viewable by everyone" ON videos FOR SELECT USING (true);
CREATE POLICY "Videos are manageable by authenticated users" ON videos FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for collections table
CREATE POLICY "Collections are viewable by everyone" ON collections FOR SELECT USING (true);
CREATE POLICY "Collections are manageable by authenticated users" ON collections FOR ALL USING (auth.role() = 'authenticated');
