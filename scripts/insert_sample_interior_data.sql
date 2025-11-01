-- Insert sample interior gallery data
INSERT INTO interior_gallery (title, description, category, image_urls, project_details, featured) VALUES
(
    'Modern Office Workspace',
    'A contemporary office design featuring open spaces, natural lighting, and ergonomic furniture solutions.',
    'office_space',
    ARRAY[
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'
    ],
    '{"area": "2500 sq ft", "duration": "3 months", "client": "Tech Startup", "year": "2024"}',
    true
),
(
    'Luxury Hotel Suite',
    'Elegant hotel room design with premium materials, ambient lighting, and sophisticated color palette.',
    'hotel_space',
    ARRAY[
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
    ],
    '{"area": "800 sq ft", "duration": "2 months", "client": "Boutique Hotel", "year": "2024"}',
    true
),
(
    'Contemporary Residential Home',
    'Modern family home with open floor plan, natural materials, and seamless indoor-outdoor living.',
    'residential',
    ARRAY[
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    '{"area": "3200 sq ft", "duration": "6 months", "client": "Private Family", "year": "2023"}',
    false
),
(
    'Retail Store Design',
    'Modern commercial space with strategic lighting, product displays, and customer flow optimization.',
    'commercial_space',
    ARRAY[
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
    ],
    '{"area": "1800 sq ft", "duration": "4 months", "client": "Fashion Retailer", "year": "2024"}',
    false
);
