-- Function to get orders for a specific user with comprehensive details
CREATE OR REPLACE FUNCTION get_user_orders_with_details(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  total_amount decimal,
  status text,
  shipping_address text,
  created_at timestamptz,
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
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'product_name', prod.name,
          'product_image', COALESCE((prod.image_urls)[0], prod.image_url, '/placeholder.jpg')
        )
      )
      FROM order_items oi
      LEFT JOIN products prod ON oi.product_id = prod.id
      WHERE oi.order_id = o.id
    ) as items
  FROM 
    orders o
  WHERE 
    o.user_id = user_id_param
  ORDER BY 
    o.created_at DESC;
END;
$$;
