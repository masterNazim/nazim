-- Migration to support multiple product images

-- Alter products table to use image_urls array instead of single image_url
ALTER TABLE products
ADD COLUMN image_urls text[] DEFAULT '{}'::text[];

-- Copy existing image_url to image_urls if exists
UPDATE products
SET image_urls = CASE
  WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url]
  ELSE '{}'::text[]
END;

-- Drop the old image_url column
ALTER TABLE products
DROP COLUMN image_url;

-- Add index for array contains queries if needed
CREATE INDEX idx_products_image_urls ON products USING GIN(image_urls);

-- Verify the change
SELECT id, image_urls FROM products LIMIT 1;
