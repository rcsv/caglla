'use client'

import { Trip } from '@/lib/core/types'
import TripEditor from '@/components/trip/TripEditor'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { dateUtils } from '@/lib/utils/date'
import { t } from '@/lib/i18n'
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'

interface TripHeroSectionProps {
  trip: Trip
  onUpdateTrip: (updatedTrip: Trip) => void
  onDeleteTrip: () => void
}

export default function TripHeroSection({
  trip,
  canEdit = true,
  onUpdateTrip,
  onDeleteTrip,
}: TripHeroSectionProps & { canEdit?: boolean }) {
  const { user } = useAuth()
  const currentLanguage = getUserLanguage(user)
  
  // Format date range with i18n support
  const formattedDateRange = trip.start_date && trip.end_date
    ? dateUtils.formatTripDateRange(trip.start_date, trip.end_date, currentLanguage)
    : null
  
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
        {/* Access badge overlay (right top) */}
        <div className="absolute right-4 top-4 zidx-top-menu-content">
          <PublicAccessBadge accessLevel={trip.access_level === 'private' ? 'private' : 'public'} />
        </div>
        {/* Top Navigation */}
        <div className="flex justify-between items-start p-6">
          <div className="flex items-center gap-4" />
          {canEdit && (
            <TripEditor 
              trip={trip} 
              onUpdate={onUpdateTrip} 
              onDelete={onDeleteTrip}
              hideEditButton={true}
            />
          )}
        </div>
        
        {/* Main Content - Positioned higher */}
        <div className="flex-1 flex items-start pt-8">
          <div className="w-full px-6">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                {trip.title}
              </h1>
              
              {/* Date and Location - 2 lines */}
              <div className="flex flex-col items-start gap-2 mb-6">
                <div className="flex items-center text-white">
                  <CalendarIcon className="w-5 h-5 mr-2" color="white" />
                  <span className="text-lg font-medium">
                    {formattedDateRange || t('date.notSet')}
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
