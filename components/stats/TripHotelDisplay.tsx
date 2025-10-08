import React from 'react'
import Card from '@/components/common/Card'

interface TripHotelDisplayProps {
  className?: string
}

export default function TripHotelDisplay({ className = '' }: TripHotelDisplayProps) {
  return (
    <Card title={<div className="flex items-center"><svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>ホテル情報</div>} className={className}>
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            ホテル情報機能は<br />
            開発中です
          </p>
        </div>
      </div>
    </Card>
  )
}
