-- Create videos table for homepage video management
CREATE TABLE IF NOT EXISTS videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_id VARCHAR(50) NOT NULL,
    thumbnail_url TEXT,
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_messages table for admin message management
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collections table for featured product management
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id) -- Only one product per category in collections
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON videos(display_order);
CREATE INDEX IF NOT EXISTS idx_videos_is_active ON videos(is_active);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_collections_category_id ON collections(category_id);
CREATE INDEX IF NOT EXISTS idx_collections_product_id ON collections(product_id);
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON collections(display_order);

-- Enable Row Level Security
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for videos (admin only)
CREATE POLICY IF NOT EXISTS "Videos are viewable by everyone" ON videos
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Videos are manageable by authenticated users" ON videos
    FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for contact_messages (admin only)
CREATE POLICY IF NOT EXISTS "Contact messages are manageable by authenticated users" ON contact_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for collections (admin only)
CREATE POLICY IF NOT EXISTS "Collections are viewable by everyone" ON collections
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Collections are manageable by authenticated users" ON collections
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data for videos (3 placeholder videos for homepage)
INSERT INTO videos (title, description, youtube_id, display_order, is_active) VALUES
    ('Welcome to Eight Hands Work', 'Discover our premium furniture collection', 'dQw4w9WgXcQ', 1, true),
    ('Craftsmanship Excellence', 'See how we create beautiful furniture pieces', 'dQw4w9WgXcQ', 2, true),
    ('Customer Stories', 'Hear from our satisfied customers', 'dQw4w9WgXcQ', 3, true)
ON CONFLICT DO NOTHING;

-- Insert sample contact messages for testing
INSERT INTO contact_messages (name, email, subject, message, is_read) VALUES
    ('John Doe', 'john@example.com', 'Product Inquiry', 'I am interested in your dining table collection.', false),
    ('Jane Smith', 'jane@example.com', 'Custom Order', 'Can you create a custom bookshelf for my home office?', true),
    ('Mike Johnson', 'mike@example.com', 'Delivery Question', 'What are your delivery options for large furniture?', false)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'All missing tables created successfully!' as status;
