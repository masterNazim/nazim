import { supabase } from '@/lib/supabase'
import ProductDetailClient from './ProductDetailClient'
import { notFound } from 'next/navigation'

// Server-side product fetching - reliable like trendy section
async function getProduct(id) {
  try {
    console.log(`Server: Fetching product ${id}`)
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Server: Product query error:', error)
      return null
    }

    if (!data) {
      console.log('Server: Product not found')
      return null
    }

    // Normalize product data like trendy section
    const normalizedProduct = {
      id: data.id,
      name: data.name || 'Unnamed Product',
      description: data.description || 'No description available.',
      price: data.price || 0,
      stock: data.stock || 0,
      image_urls: data.image_urls || [],
      is_featured: data.is_featured || false,
      category_id: data.category_id,
      created_at: data.created_at,
      categories: data.categories || { name: 'Furniture' }
    }

    console.log('Server: Product fetched successfully:', normalizedProduct.name)
    return normalizedProduct
    
  } catch (error) {
    console.error('Server: Error fetching product:', error)
    return null
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = params

  console.log('Server: ProductDetailPage called with ID:', id)

  // Basic validation - just check if id exists
  if (!id) {
    console.log('Server: No ID provided')
    notFound()
  }

  // Fetch product server-side - always reliable
  const product = await getProduct(id)
  product.primary_image = product.image_urls?.[0] || '/placeholder-furniture.jpg';

  if (!product) {
    console.log('Server: Product not found for ID:', id)
    notFound()
  }

  console.log('Server: Rendering product:', product.name)
  // Pass product data to client component
  return <ProductDetailClient product={product} />
}
