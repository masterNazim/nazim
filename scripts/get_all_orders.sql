-- Create a stored procedure to get all orders bypassing RLS
-- This function should be executed with the service role key

CREATE OR REPLACE FUNCTION get_all_orders()
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM orders
  ORDER BY created_at DESC;
END;
$$;

-- Create a more comprehensive function that includes related data
CREATE OR REPLACE FUNCTION get_all_orders_with_details()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  total_amount decimal,
  status text,
  shipping_address text,
  created_at timestamptz,
  customer_name text,
  customer_phone text,
  items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.total_amount,
    o.status,
    o.shipping_address,
    o.created_at,
    p.full_name as customer_name,
    p.phone as customer_phone,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'product_name', prod.name,
          'product_image', prod.image_url
        )
      )
      FROM order_items oi
      LEFT JOIN products prod ON oi.product_id = prod.id
      WHERE oi.order_id = o.id
    ) as items
  FROM 
    orders o
  LEFT JOIN 
    profiles p ON o.user_id = p.id
  ORDER BY 
    o.created_at DESC;
END;
$$;
