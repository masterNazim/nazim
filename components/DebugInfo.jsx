'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Bug } from 'lucide-react'

export default function DebugInfo({ error, productId, retryCount }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show debug info in production
  }

  return (
    <Card className="mt-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-600 hover:text-orange-800"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-orange-800">Product ID:</strong>
              <code className="ml-2 px-2 py-1 bg-orange-100 rounded text-xs">
                {productId}
              </code>
            </div>
            
            <div>
              <strong className="text-orange-800">Retry Count:</strong>
              <span className="ml-2">{retryCount}</span>
            </div>
            
            {error && (
              <div>
                <strong className="text-orange-800">Error:</strong>
                <pre className="ml-2 mt-1 p-2 bg-orange-100 rounded text-xs overflow-auto">
                  {typeof error === 'object' ? JSON.stringify(error, null, 2) : error}
                </pre>
              </div>
            )}
            
            <div>
              <strong className="text-orange-800">Environment:</strong>
              <span className="ml-2">{process.env.NODE_ENV}</span>
            </div>
            
            <div>
              <strong className="text-orange-800">Timestamp:</strong>
              <span className="ml-2">{new Date().toISOString()}</span>
            </div>
            
            <div>
              <strong className="text-orange-800">User Agent:</strong>
              <code className="ml-2 text-xs block mt-1 p-2 bg-orange-100 rounded">
                {navigator.userAgent}
              </code>
            </div>
            
            <div>
              <strong className="text-orange-800">URL:</strong>
              <code className="ml-2 text-xs block mt-1 p-2 bg-orange-100 rounded">
                {window.location.href}
              </code>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
