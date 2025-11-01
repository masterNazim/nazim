import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8">
          <div className="h-8 w-36 bg-gray-200 rounded animate-pulse mr-4"></div>
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Generate 8 skeleton product cards */}
          {Array(8).fill().map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Image placeholder */}
              <div className="h-64 bg-gray-200 animate-pulse"></div>
              
              <div className="p-4">
                {/* Title placeholder */}
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                
                {/* Description placeholder - two lines */}
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                
                {/* Price and details placeholders */}
                <div className="flex justify-between items-center mt-3">
                  <div className="h-7 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Date added placeholder */}
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
