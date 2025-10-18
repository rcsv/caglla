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
  onAddFromPOI?: (placeId: string, dayId: string) => Promise<void> // POIから追加する際のハンドラー
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
  onAddFromPOI,
  getFilteredItineraries,
}: TripRightPaneProps) {
  // チェックリストビューの場合は右ペイン自体を非表示（メインコンテンツを全幅表示）
  if (currentView === 'checklist') {
    return null
  }

  return (
    <div className="hidden md:block right-pane-responsive flex-shrink-0">
      <div className="h-full bg-gray-100">
        <TripMap
          itineraries={getFilteredItineraries()}
          trip={trip}
          selectedItineraryId={selectedItineraryId}
          selectedDayId={selectedDayId}
          onItineraryClick={onItineraryClick}
          onPoiDataUpdate={onPoiDataUpdate}
          onAddFromPOI={onAddFromPOI}
          poiData={poiData}
          className="h-full"
          focusMode={mapFocusMode}
          initialCenter={trip.destination_place?.geometry?.location || undefined as any}
        />
      </div>
    </div>
  )
}
