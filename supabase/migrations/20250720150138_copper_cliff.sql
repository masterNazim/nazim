/*
  # EightHand Furniture Database Schema

  1. New Tables
    - `profiles` - User profile data linked to auth.users
    - `categories` - Furniture categories (sofas, chairs, tables, etc.)
    - `products` - Furniture products with details and pricing
    - `orders` - Customer orders with status tracking
    - `order_items` - Individual items within orders

  2. Security
    - Enable RLS on all tables
    - Add policies for user access control
    - Admin-only access for product/category management
    - Users can only view their own orders

  3. Features
    - Full-text search on products
    - Inventory tracking
    - Order status management
    - Image storage integration
*/

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price > 0),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  image_url text,
  stock integer DEFAULT 0 CHECK (stock >= 0),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Orders policies (users can only see their own orders)
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Order items policies
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
  ('Sofas & Couches', 'Comfortable seating for your living room', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'),
  ('Chairs', 'Stylish chairs for every room', 'https://images.pexels.com/photos/586769/pexels-photo-586769.jpeg'),
  ('Tables', 'Dining and coffee tables', 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg'),
  ('Storage', 'Bookcases, wardrobes and storage solutions', 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg'),
  ('Bedroom', 'Beds, nightstands and bedroom furniture', 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Modern Sectional Sofa',
  'Luxurious sectional sofa perfect for large living rooms',
  1299.99,
  (SELECT id FROM categories WHERE name = 'Sofas & Couches'),
  'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg',
  15,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Modern Sectional Sofa');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Ergonomic Office Chair',
  'Comfortable office chair with lumbar support',
  449.99,
  (SELECT id FROM categories WHERE name = 'Chairs'),
  'https://images.pexels.com/photos/586769/pexels-photo-586769.jpeg',
  25,
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Ergonomic Office Chair');

INSERT INTO products (name, description, price, category_id, image_url, stock, is_featured) 
SELECT 
  'Oak Dining Table',
  'Solid oak dining table seats 6 people',
  899.99,
  (SELECT id FROM categories WHERE name = 'Tables'),
  'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg',
  8,
  false
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Oak Dining Table');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
