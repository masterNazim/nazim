-- Add Reviews Table Migration
-- This migration adds a reviews table for product reviews with admin approval system

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  image_urls text[], -- Array of image URLs from 'review' bucket
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Reviews policies
-- Public can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

-- Users can view their own reviews (approved or not)
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own reviews
CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_approved = false);

-- Users can update their own unapproved reviews
CREATE POLICY "Users can update their own unapproved reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_approved = false)
  WITH CHECK (auth.uid() = user_id AND is_approved = false);

-- Users can delete their own unapproved reviews
CREATE POLICY "Users can delete their own unapproved reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_approved = false);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can approve/reject reviews (update)
CREATE POLICY "Admins can manage reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Admins can delete any review
CREATE POLICY "Admins can delete any review"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to set approval timestamp when review is approved
CREATE OR REPLACE FUNCTION set_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_approved changed from false to true, set approved_at and approved_by
    IF OLD.is_approved = false AND NEW.is_approved = true THEN
        NEW.approved_at = now();
        NEW.approved_by = auth.uid();
    END IF;
    
    -- If is_approved changed from true to false, clear approved_at and approved_by
    IF OLD.is_approved = true AND NEW.is_approved = false THEN
        NEW.approved_at = NULL;
        NEW.approved_by = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically set approval timestamp
CREATE TRIGGER set_review_approval_timestamp
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_approval_timestamp();

-- Create a view for product reviews with user information
CREATE OR REPLACE VIEW product_reviews_with_user AS
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
    p.email as user_email
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.is_approved = true
ORDER BY r.created_at DESC;

-- Create a view for review statistics per product
CREATE OR REPLACE VIEW product_review_stats AS
SELECT 
    product_id,
    COUNT(*) as total_reviews,
    AVG(rating)::numeric(3,2) as average_rating,
    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM reviews 
WHERE is_approved = true
GROUP BY product_id;
