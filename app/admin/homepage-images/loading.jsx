export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                        <div className="h-48 bg-gray-200 animate-pulse"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="flex justify-between items-center">
                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
