'use client'

import { Trip, Itinerary } from '@/lib/core/types'
import TripMap from '@/components/trip/TripMap'
import Checklist from '@/components/ui/Checklist'

interface TripRightPaneProps {
  trip: Trip
  currentView: 'summary' | 'itinerary' | 'checklist'
  selectedItineraryId: string | null
  selectedDayId: string | null
  mapFocusMode: 'all' | 'day' | 'single'
  poiData: {
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null
  onItineraryClick: (itineraryId: string) => void
  onPoiDataUpdate: (poiData: any) => void
  onTripUpdate?: () => void // 追加: trip が更新された時に親に通知
  getFilteredItineraries: () => Itinerary[]
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function TripRightPane({
  trip,
  currentView,
  selectedItineraryId,
  selectedDayId,
  mapFocusMode,
  poiData,
  onItineraryClick,
  onPoiDataUpdate,
  onTripUpdate,
  getFilteredItineraries,
}: TripRightPaneProps) {
  return (
    <div className="hidden md:block right-pane-responsive flex-shrink-0">
      <div className="h-full bg-gray-100">
        {currentView === 'checklist' ? (
          <Checklist />
        ) : (
          <TripMap
            itineraries={getFilteredItineraries()}
            trip={trip}
            selectedItineraryId={selectedItineraryId}
            selectedDayId={selectedDayId}
            onItineraryClick={onItineraryClick}
            onPoiDataUpdate={onPoiDataUpdate}
            onTripUpdate={onTripUpdate}
            poiData={poiData}
            className="h-full"
            focusMode={mapFocusMode}
            initialCenter={trip.destination_place?.geometry?.location || undefined as any}
          />
        )}
      </div>
    </div>
  )
}
