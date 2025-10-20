'use client'

import { Trip } from '@/lib/core/types'
import TripEditor from '@/components/trip/TripEditor'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { dateUtils } from '@/lib/utils/date'

interface TripHeroSectionProps {
  trip: Trip
  onUpdateTrip: (updatedTrip: Trip) => void
  onDeleteTrip: () => void
  onToggleMobileMenu: () => void
}

export default function TripHeroSection({
  trip,
  onUpdateTrip,
  onDeleteTrip,
  onToggleMobileMenu,
}: TripHeroSectionProps) {
  return (
    <header className="relative overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: trip.image_url 
            ? `url(${trip.image_url})` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>
      
      {/* Content Overlay */}
      <div className="relative h-full flex flex-col">
        {/* Top Navigation */}
        <div className="flex justify-between items-start p-6">
          <div className="flex items-center gap-4">
            {/* ハンバーガーボタン（768px以下）- 左端フロート */}
            <button
              onClick={onToggleMobileMenu}
              className={`md:hidden fixed top-6 left-6 zidx-top-menu-content inline-flex items-center px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <TripEditor 
            trip={trip} 
            onUpdate={onUpdateTrip} 
            onDelete={onDeleteTrip}
          />
        </div>
        
        {/* Main Content - Positioned higher */}
        <div className="flex-1 flex items-start pt-8">
          <div className="w-full px-6">
            <div className="max-w-4xl">
              {/* モバイル用のハンバーガーボタン用スペース */}
              <div className="md:hidden h-16 mb-2"></div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                {trip.title}
              </h1>
              
              {/* Date and Location - 2 lines */}
              <div className="flex flex-col items-start gap-2 mb-6">
                <div className="flex items-center text-white">
                  <CalendarIcon className="w-5 h-5 mr-2" color="white" />
                  <span className="text-lg font-medium">
                    {trip.start_date && trip.end_date 
                      ? dateUtils.formatTripDateRange(trip.start_date, trip.end_date)
                      : '日付が設定されていません'
                    }
                  </span>
                </div>
                
                {trip.destination && (
                  <div className="flex items-center text-white">
                    <PinIcon className="w-5 h-5 mr-2" color="white" />
                    <span className="text-lg font-medium">{trip.destination}</span>
                  </div>
                )}
              </div>
              
              {/* Creator Info */}
              {trip.creator && (
                <p className="text-white text-sm opacity-80 drop-shadow-md">
                  by {trip.creator.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
