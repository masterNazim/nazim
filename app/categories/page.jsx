import { CategoryGrid } from '@/components/categories/CategoryGrid'

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Furniture Categories</h1>
          <p className="text-gray-600">
            Browse our carefully curated collection of furniture categories
          </p>
        </div>
        
        <CategoryGrid />
      </div>
    </div>
  )
}
