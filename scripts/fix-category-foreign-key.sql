-- Fix for products category foreign key constraint violation
-- This script addresses the root cause of the foreign key constraint error

-- Problem Analysis:
-- 1. The API tries to look up category by name but doesn't handle failures properly
-- 2. When category lookup fails, category_id remains undefined/null
-- 3. This causes foreign key constraint violation when inserting products

-- Solution 1: Ensure all products have valid category references
-- First, let's create a default "Uncategorized" category if it doesn't exist
INSERT INTO categories (name, description) 
VALUES ('Uncategorized', 'Products without a specific category')
ON CONFLICT (name) DO NOTHING;

-- Get the ID of the Uncategorized category for reference
DO $$
DECLARE
    uncategorized_id UUID;
BEGIN
    SELECT id INTO uncategorized_id FROM categories WHERE name = 'Uncategorized';
    RAISE NOTICE 'Uncategorized category ID: %', uncategorized_id;
END $$;

-- Solution 2: Fix any existing products with invalid category references
-- Update products with NULL category_id to use Uncategorized
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE name = 'Uncategorized')
WHERE category_id IS NULL;

-- Solution 3: Add a constraint to prevent NULL category_id in the future
-- (This will be handled in the API logic instead)

-- Solution 4: Create a function to safely get or create category
CREATE OR REPLACE FUNCTION get_or_create_category(category_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    category_id UUID;
    uncategorized_id UUID;
BEGIN
    -- First try to find the category by exact name match
    SELECT id INTO category_id 
    FROM categories 
    WHERE name = category_name;
    
    IF category_id IS NOT NULL THEN
        RETURN category_id;
    END IF;
    
    -- If not found, try case-insensitive match
    SELECT id INTO category_id 
    FROM categories 
    WHERE LOWER(name) = LOWER(category_name);
    
    IF category_id IS NOT NULL THEN
        RETURN category_id;
    END IF;
    
    -- If still not found, return Uncategorized category
    SELECT id INTO uncategorized_id 
    FROM categories 
    WHERE name = 'Uncategorized';
    
    IF uncategorized_id IS NOT NULL THEN
        RAISE NOTICE 'Category "{}" not found, using Uncategorized', category_name;
        RETURN uncategorized_id;
    END IF;
    
    -- This should never happen, but just in case
    RAISE EXCEPTION 'No valid category found and Uncategorized category is missing';
END;
$$;

-- Solution 5: Create a safer product insertion function
CREATE OR REPLACE FUNCTION safe_insert_product(
    p_name TEXT,
    p_description TEXT,
    p_price DECIMAL(10,2),
    p_category_name TEXT,
    p_stock INTEGER DEFAULT 0,
    p_is_featured BOOLEAN DEFAULT false,
    p_image_urls TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    product_id UUID;
    safe_category_id UUID;
BEGIN
    -- Get a safe category ID
    safe_category_id := get_or_create_category(p_category_name);
    
    -- Insert the product
    INSERT INTO products (name, description, price, category_id, stock, is_featured, image_urls)
    VALUES (p_name, p_description, p_price, safe_category_id, p_stock, p_is_featured, p_image_urls)
    RETURNING id INTO product_id;
    
    RETURN product_id;
END;
$$;

-- Test the function
DO $$
DECLARE
    test_product_id UUID;
BEGIN
    -- Test with existing category
    test_product_id := safe_insert_product(
        'Test Product 1',
        'Test description',
        99.99,
        'Dining Tables',
        10,
        false
    );
    RAISE NOTICE 'Test product 1 created with ID: %', test_product_id;
    
    -- Test with non-existing category (should use Uncategorized)
    test_product_id := safe_insert_product(
        'Test Product 2',
        'Test description',
        199.99,
        'Non-Existing Category',
        5,
        false
    );
    RAISE NOTICE 'Test product 2 created with ID: %', test_product_id;
    
    -- Clean up test products
    DELETE FROM products WHERE name LIKE 'Test Product %';
    RAISE NOTICE 'Test products cleaned up';
END $$;

-- Verification queries
SELECT 'Total categories:' as info, COUNT(*) as count FROM categories;
SELECT 'Total products:' as info, COUNT(*) as count FROM products;
SELECT 'Products with NULL category_id:' as info, COUNT(*) as count FROM products WHERE category_id IS NULL;
SELECT 'Products in Uncategorized:' as info, COUNT(*) as count 
FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE c.name = 'Uncategorized';

-- Show the fix is working
SELECT 'Sample products with categories:' as info, p.name, c.name as category_name
FROM products p
JOIN categories c ON p.category_id = c.id
LIMIT 5;
