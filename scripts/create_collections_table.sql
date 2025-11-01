-- Create collections table for admin-managed collection page
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id) -- Only one product per category in collections
);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Anyone can view active collections
CREATE POLICY "Anyone can view active collections"
  ON collections FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only admins can manage collections
CREATE POLICY "Only admins can manage collections"
  ON collections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_category_id ON collections(category_id);
CREATE INDEX IF NOT EXISTS idx_collections_product_id ON collections(product_id);
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON collections(display_order);
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(is_active);
