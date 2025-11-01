import { Card, CardContent } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Stats Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Loading */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          ))}
        </div>

        {/* Review Cards Loading */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-15 h-15 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-16 bg-gray-200 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
