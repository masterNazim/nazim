-- Categories SQL for EightHand Furniture
-- Run this in your Supabase SQL Editor to add furniture categories

INSERT INTO categories (name, description, image_url) VALUES
  ('Living Room', 'Comfortable sofas, chairs, and coffee tables for your living space', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'),
  ('Dining Room', 'Dining tables, chairs, and storage for memorable meals', 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg'),
  ('Bedroom', 'Beds, nightstands, dressers, and bedroom essentials', 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg'),
  ('Office', 'Desks, office chairs, and storage for productive workspaces', 'https://images.pexels.com/photos/586769/pexels-photo-586769.jpeg'),
  ('Storage', 'Bookcases, wardrobes, and organizational furniture', 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg'),
  ('Outdoor', 'Patio furniture, garden sets, and outdoor dining', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'),
  ('Kids Room', 'Furniture designed specifically for children and teens', 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg'),
  ('Accent Pieces', 'Decorative furniture, mirrors, and unique statement pieces', 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg')
ON CONFLICT (name) DO NOTHING;

-- Sample products for each category
INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Modern Sectional Sofa',
  'Luxurious L-shaped sectional sofa with premium fabric upholstery. Perfect for large living rooms with comfortable seating for 6-8 people.',
  1299.99,
  (SELECT id FROM categories WHERE name = 'Living Room'),
  'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg',
  15,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Modern Sectional Sofa');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Ergonomic Office Chair',
  'Professional office chair with lumbar support, adjustable height, and breathable mesh back. Ideal for long work sessions.',
  449.99,
  (SELECT id FROM categories WHERE name = 'Office'),
  'https://images.pexels.com/photos/586769/pexels-photo-586769.jpeg',
  25,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Ergonomic Office Chair');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Solid Oak Dining Table',
  'Handcrafted solid oak dining table that seats 6 people comfortably. Features a natural wood finish and sturdy construction.',
  899.99,
  (SELECT id FROM categories WHERE name = 'Dining Room'),
  'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg',
  8,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Solid Oak Dining Table');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Platform Bed Frame',
  'Minimalist platform bed frame with built-in nightstands. Made from sustainable bamboo with a clean, modern design.',
  649.99,
  (SELECT id FROM categories WHERE name = 'Bedroom'),
  'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg',
  12,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Platform Bed Frame');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Industrial Bookshelf',
  'Five-tier industrial bookshelf with metal frame and reclaimed wood shelves. Perfect for displaying books and decor.',
  329.99,
  (SELECT id FROM categories WHERE name = 'Storage'),
  'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg',
  18,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Industrial Bookshelf');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Teak Outdoor Dining Set',
  'Weather-resistant teak dining set includes table and 4 chairs. Perfect for outdoor entertaining and built to last.',
  1199.99,
  (SELECT id FROM categories WHERE name = 'Outdoor'),
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
  6,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Teak Outdoor Dining Set');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Kids Study Desk',
  'Adjustable height study desk designed for children. Features built-in storage and grows with your child.',
  249.99,
  (SELECT id FROM categories WHERE name = 'Kids Room'),
  'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg',
  20,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Kids Study Desk');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Vintage Accent Mirror',
  'Large decorative mirror with vintage brass frame. Adds elegance and light to any room.',
  189.99,
  (SELECT id FROM categories WHERE name = 'Accent Pieces'),
  'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg',
  14,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Vintage Accent Mirror');
