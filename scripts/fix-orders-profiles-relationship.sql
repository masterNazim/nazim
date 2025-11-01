-- Fix the relationship between orders and profiles tables
-- This script creates the missing foreign key relationship

-- First, ensure the orders table has the correct user_id column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create the foreign key relationship between orders and profiles
-- Note: profiles.id should reference auth.users(id)
ALTER TABLE orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Ensure profiles table has proper structure
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
