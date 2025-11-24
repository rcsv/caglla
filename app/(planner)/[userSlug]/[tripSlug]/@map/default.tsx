'use client'

import TripMap from '@/components/trip/TripMap'
import POIDialog from '@/components/modals/POIDialog'
import type { Itinerary } from '@/lib/core/types'
import { useEffect, useMemo } from 'react'
import Loading from '@/components/common/Loading'
import { useTrip } from '../TripProvider'
import { useTripUrlState } from '../useTripUrlState'
import { POIProvider, usePOI } from '../POIProvider'
import { dispatchPOIOpen, dispatchPOIClose } from '../poi-events'

/**
 * Map Default Slot (Read-only)
 * 
 * Phase 4: POIProviderの実装（v3.0.0）
 * 
 * TripProviderからTripデータを取得し、useTripUrlStateでURL状態を管理します。
 * POIProviderでPOIデータを管理し、CustomEventで@timelineからの通知を受け取ります。
 * 読み取り専用として地図を描画（追加・移動などの操作は抑止）
 */
function MapContent() {
  const { trip } = useTrip()
  const {
    selectedDayId,
    selectedItineraryId,
    mapFocusMode,
    setSelectedItineraryId,
    updateQuery,
  } = useTripUrlState()
  const { poiData, setPoiData } = usePOI()

  // @timelineからのCustomEventを受け取る
  useEffect(() => {
    const handlePOIOpen = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setPoiData(customEvent.detail)
      }
    }

    const handlePOIClose = () => {
      setPoiData(null)
    }

    window.addEventListener('planner:poi-open', handlePOIOpen as EventListener)
    window.addEventListener('planner:poi-close', handlePOIClose)

    return () => {
      window.removeEventListener('planner:poi-open', handlePOIOpen as EventListener)
      window.removeEventListener('planner:poi-close', handlePOIClose)
    }
  }, [setPoiData])


  const itineraries: Itinerary[] = useMemo(() => {
    if (!trip?.days) return []
    if (selectedDayId) {
      const day = trip.days.find(d => d.id === selectedDayId)
      return day?.itineraries || []
    }
    return trip.days.flatMap(d => d.itineraries || [])
  }, [trip, selectedDayId])

  if (!trip) {
    return <Loading className="py-6" />
  }

  return (
    <div className="h-full bg-white relative overflow-hidden">
      <TripMap
        itineraries={itineraries}
        trip={trip}
        selectedItineraryId={selectedItineraryId}
        selectedDayId={selectedDayId}
        onItineraryClick={(id) => {
          setSelectedItineraryId(id)
          updateQuery({ si: id, mf: 'single' })
        }}
        onPoiDataUpdate={(data) => {
          if (data) {
            setPoiData({
              placeId: data.placeId,
              name: data.name,
              location: data.location,
              placeData: data.placeData,
            })
          } else {
            setPoiData(null)
          }
        }}
        // 読み取り専用のため追加操作は無効化
        onAddFromPOI={undefined}
        className="h-full w-full"
        focusMode={mapFocusMode}
        onMapInteractionStart={() => {}}
        scrollSyncEnabled={false}
        onRequestEnableScrollSync={() => {}}
        initialCenter={trip.destination_place?.geometry?.location || undefined}
      />
      {poiData && (
        <POIDialog
          poiData={poiData}
          onClose={() => {
            setPoiData(null)
            dispatchPOIClose()
          }}
          onAddToItinerary={undefined} // 読み取り専用のため無効化
          // availableDaysは削除（Structural Fix: POIDialog内でTripProviderから直接取得）
        />
      )}
    </div>
  )
}

export default function MapDefault() {
  return (
    <POIProvider>
      <MapContent />
    </POIProvider>
  )
}

