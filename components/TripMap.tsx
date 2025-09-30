'use client'

import { useEffect, useRef, useState } from 'react'
import { Itinerary } from '@/lib/firestore'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'

interface TripMapProps {
  itineraries: Itinerary[]
  selectedItineraryId?: string | null
  selectedDayId?: string | null
  onItineraryClick?: (itineraryId: string) => void
  className?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function TripMap({ 
  itineraries, 
  selectedItineraryId = null,
  selectedDayId = null,
  onItineraryClick,
  className = '' 
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)

  // Google Maps API の読み込み
  useEffect(() => {
    const initializeMap = async () => {
      try {
        // 共通ローダーを使用してAPIを読み込み
        await loadGoogleMapsAPI()
        
        if (!mapRef.current || !window.google) return

        const defaultCenter = { lat: 35.6762, lng: 139.6503 } // 東京
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 10,
          center: defaultCenter,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT,
          },
        })

        const newDirectionsService = new window.google.maps.DirectionsService()
        const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
          },
        })

        newDirectionsRenderer.setMap(newMap)

        setMap(newMap)
        setDirectionsService(newDirectionsService)
        setDirectionsRenderer(newDirectionsRenderer)
      } catch (error) {
        console.error('Google Maps APIの読み込みに失敗しました:', error)
      }
    }

    initializeMap()
  }, [])

  // itineraries が変更された時にマーカーとルートを更新
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return

    // 既存のマーカーをクリア
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])

    // 位置情報がある itineraries をフィルタリング
    const validItineraries = itineraries.filter(
      itinerary => itinerary.place_data?.geometry?.location
    )

    if (validItineraries.length === 0) return

    // マーカーを作成
    const newMarkers = validItineraries.map((itinerary, index) => {
      const position = {
        lat: itinerary.place_data!.geometry!.location.lat,
        lng: itinerary.place_data!.geometry!.location.lng,
      }

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: itinerary.title,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      })

      // インフォウィンドウを作成
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${itinerary.title}</h3>
            ${itinerary.description ? `<p class="text-sm text-gray-600 mt-1">${itinerary.description}</p>` : ''}
            ${itinerary.start_time ? `<p class="text-xs text-gray-500 mt-1">開始: ${itinerary.start_time}</p>` : ''}
            ${itinerary.end_time ? `<p class="text-xs text-gray-500">終了: ${itinerary.end_time}</p>` : ''}
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        // 左ペインのItineraryにスクロールするためのコールバック
        if (onItineraryClick) {
          onItineraryClick(itinerary.id)
        }
      })

      return marker
    })

    setMarkers(newMarkers)

    // ルートを描画（2つ以上の地点がある場合）
    if (validItineraries.length >= 2) {
      const waypoints = validItineraries.slice(1, -1).map(itinerary => ({
        location: {
          lat: itinerary.place_data!.geometry!.location.lat,
          lng: itinerary.place_data!.geometry!.location.lng,
        },
      }))

      const request = {
        origin: {
          lat: validItineraries[0].place_data!.geometry!.location.lat,
          lng: validItineraries[0].place_data!.geometry!.location.lng,
        },
        destination: {
          lat: validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lat,
          lng: validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lng,
        },
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      }

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result)
        }
      })
    }

    // マップのビューを調整
    if (validItineraries.length === 1) {
      map.setCenter({
        lat: validItineraries[0].place_data!.geometry!.location.lat,
        lng: validItineraries[0].place_data!.geometry!.location.lng,
      })
      map.setZoom(15)
    } else if (validItineraries.length > 1) {
      const bounds = new window.google.maps.LatLngBounds()
      validItineraries.forEach(itinerary => {
        bounds.extend({
          lat: itinerary.place_data!.geometry!.location.lat,
          lng: itinerary.place_data!.geometry!.location.lng,
        })
      })
      map.fitBounds(bounds)
    }
  }, [map, directionsService, directionsRenderer, itineraries, selectedDayId])

  // 選択されたItineraryにフォーカスする機能
  useEffect(() => {
    if (!map || !selectedItineraryId) return

    const selectedItinerary = itineraries.find(itinerary => itinerary.id === selectedItineraryId)
    if (!selectedItinerary?.place_data?.geometry?.location) return

    const position = {
      lat: selectedItinerary.place_data.geometry.location.lat,
      lng: selectedItinerary.place_data.geometry.location.lng,
    }

    // 地図を選択されたVenueにズーム・フォーカス
    map.setCenter(position)
    map.setZoom(16)

    // 該当するマーカーをハイライト
    markers.forEach((marker, index) => {
      const itinerary = itineraries.find(i => i.place_data?.geometry?.location)
      if (itinerary?.id === selectedItineraryId) {
        // 選択されたマーカーをハイライト
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 25,
          fillColor: '#EF4444', // 赤色でハイライト
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        })
      } else {
        // 他のマーカーは通常の色
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        })
      }
    })
  }, [selectedItineraryId, map, markers, itineraries])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* マップのオーバーレイ情報 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[60]">
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-900 mb-1">
            旅程マップ
            {selectedDayId && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                フィルタ中
              </span>
            )}
          </div>
          <div>
            {itineraries.filter(i => i.place_data?.geometry?.location).length} 箇所の地点を表示
            {selectedDayId && (
              <div className="text-xs text-red-600 mt-1">
                選択された日程のみ表示中
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}