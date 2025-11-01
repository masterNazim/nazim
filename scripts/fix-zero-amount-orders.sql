-- Fix the constraint to allow zero amount orders
-- This will allow products with price 0 to be ordered

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_amount_check;

-- Add a new constraint that allows zero or positive amounts
ALTER TABLE orders ADD CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0);

-- Also fix the order_items table to allow zero price items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_price_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_price_check CHECK (price >= 0);

-- Create index for better performance on orders with zero amount
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount);
