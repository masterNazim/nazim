-- Create reviews table for product reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    image_urls TEXT[],
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id) -- One review per user per product
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
CREATE POLICY IF NOT EXISTS "Reviews are viewable by everyone when approved" ON reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY IF NOT EXISTS "Users can view their own reviews" ON reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Create function to get product reviews for public display
CREATE OR REPLACE FUNCTION get_product_reviews_public(product_id_param UUID)
RETURNS TABLE (
    id UUID,
    product_id UUID,
    user_id UUID,
    rating INTEGER,
    title VARCHAR(255),
    comment TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    user_email TEXT
) AS $$
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
        r.created_at,
        COALESCE(p.full_name, 'Anonymous User') as user_name,
        p.email as user_email
    FROM reviews r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.product_id = product_id_param 
    AND r.is_approved = true
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all reviews for admin
CREATE OR REPLACE FUNCTION get_all_reviews_for_admin()
RETURNS TABLE (
    id UUID,
    product_id UUID,
    user_id UUID,
    rating INTEGER,
    title VARCHAR(255),
    comment TEXT,
    image_urls TEXT[],
    is_approved BOOLEAN,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_name TEXT,
    user_email TEXT,
    product_name TEXT,
    product_image TEXT
) AS $$
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
        r.approved_at,
        r.approved_by,
        r.created_at,
        r.updated_at,
        COALESCE(p.full_name, 'Anonymous User') as user_name,
        p.email as user_email,
        COALESCE(prod.name, 'Unknown Product') as product_name,
        COALESCE(prod.image_urls[1], prod.image_url, '/placeholder.jpg') as product_image
    FROM reviews r
    LEFT JOIN profiles p ON r.user_id = p.id
    LEFT JOIN products prod ON r.product_id = prod.id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to approve review with logging
CREATE OR REPLACE FUNCTION approve_review_with_logging(
    review_id_param UUID,
    admin_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reviews 
    SET 
        is_approved = true,
        approved_at = NOW(),
        approved_by = admin_user_id,
        updated_at = NOW()
    WHERE id = review_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Reviews table and functions created successfully!' as status;
