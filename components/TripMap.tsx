'use client'

import { useEffect, useRef, useState } from 'react'
import { Itinerary } from '@/lib/firestore'

interface TripMapProps {
  itineraries: Itinerary[]
  className?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function TripMap({ itineraries, className = '' }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)

  // Google Maps API の読み込み
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
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
    }

    loadGoogleMaps()
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
  }, [map, directionsService, directionsRenderer, itineraries])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* マップのオーバーレイ情報 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-900 mb-1">旅程マップ</div>
          <div>
            {itineraries.filter(i => i.place_data?.geometry?.location).length} 箇所の地点を表示
          </div>
        </div>
      </div>
    </div>
  )
}
