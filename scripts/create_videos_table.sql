-- Create videos table for managing homepage videos
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_id text NOT NULL,
  thumbnail_url text,
  display_order integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view active videos
CREATE POLICY "Anyone can view active videos"
  ON videos FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only admins can manage videos
CREATE POLICY "Only admins can manage videos"
  ON videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON videos(display_order);
CREATE INDEX IF NOT EXISTS idx_videos_active ON videos(is_active);

-- Insert default videos
INSERT INTO videos (title, description, youtube_id, thumbnail_url, display_order, is_active) VALUES
  ('Craftsmanship Excellence', 'Watch our skilled artisans create beautiful furniture pieces', '', '/furniture-craftsmanship-workshop.jpg', 1, true),
  ('Room Transformation', 'See how our furniture transforms living spaces', '', '/modern-living-room-furniture-setup.jpg', 2, true),
  ('Behind the Scenes', 'Get an inside look at our manufacturing process', '', '/furniture-workshop-behind-scenes.jpg', 3, true)
ON CONFLICT DO NOTHING;
