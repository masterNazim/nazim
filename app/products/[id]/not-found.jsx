import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6 max-w-md">
            The product you are looking for does not exist or may have been removed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/products">
            <Button className="bg-amber-600 hover:bg-amber-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
