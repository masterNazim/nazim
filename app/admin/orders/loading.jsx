export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 pb-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          <div className="pt-4">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center space-x-4 p-3 bg-gray-100 rounded-lg">
                  <div className="h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
