-- Diagnose and fix category foreign key constraint issue
-- This script helps identify the root cause of the foreign key violation

-- 1. Check if categories table has data
SELECT 'Categories count:' as info, COUNT(*) as count FROM categories;

-- 2. List all categories with their IDs
SELECT 'All categories:' as info, id, name FROM categories ORDER BY name;

-- 3. Check if there are any products with invalid category_id
SELECT 'Products with invalid category_id:' as info, COUNT(*) as count 
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

-- 4. Show products with invalid category references
SELECT 'Invalid product references:' as info, p.id, p.name, p.category_id
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE p.category_id IS NOT NULL AND c.id IS NULL;

-- 5. Check for products with NULL category_id
SELECT 'Products with NULL category_id:' as info, COUNT(*) as count
FROM products 
WHERE category_id IS NULL;

-- 6. Show the foreign key constraint details
SELECT 
    'Foreign key constraint info:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'products_category_id_fkey';

-- 7. Test category lookup by name (simulate API behavior)
DO $$
DECLARE
    test_category_name TEXT := 'Dining Tables'; -- Example category name
    found_id UUID;
BEGIN
    SELECT id INTO found_id 
    FROM categories 
    WHERE name = test_category_name;
    
    IF found_id IS NOT NULL THEN
        RAISE NOTICE 'Category "{}" found with ID: {}', test_category_name, found_id;
    ELSE
        RAISE NOTICE 'Category "{}" NOT FOUND - This would cause foreign key violation!', test_category_name;
    END IF;
END $$;

-- 8. Show sample of category names that might have issues
SELECT 'Category names with special characters:' as info, name
FROM categories 
WHERE name ~ '[^a-zA-Z0-9 /&-]'
ORDER BY name;

-- 9. Check for case sensitivity issues
SELECT 'Case sensitivity test:' as info, 
       name as original_name,
       LOWER(name) as lowercase_name,
       UPPER(name) as uppercase_name
FROM categories 
WHERE name ILIKE '%dining%' OR name ILIKE '%table%'
ORDER BY name;
