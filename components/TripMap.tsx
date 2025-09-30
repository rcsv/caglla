'use client'

import { useEffect, useRef, useState } from 'react'
import { Itinerary } from '@/lib/firestore'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { routeOptimizer } from '@/lib/route-optimization'

// ティアドロップ形状のマーカースタイル
const teardropStyles = `
  .teardrop-marker {
    width: 30px;
    height: 30px;
    position: relative;
    background-color: #3B82F6;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .teardrop-marker:hover {
    transform: rotate(-45deg) scale(1.1);
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  }
  .teardrop-marker::after {
    content: '';
    width: 12px;
    height: 12px;
    margin: 9px 0 0 9px;
    position: absolute;
    border-radius: 50%;
    background-color: #fff;
    display: none; /* 白抜きを非表示 */
  }
  .teardrop-marker.selected {
    background-color: #EF4444;
    transform: rotate(-45deg) scale(1.2);
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
  }
  .teardrop-marker.selected::after {
    background-color: #fff;
    display: none; /* 選択時も白抜きを非表示 */
  }
  .teardrop-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    color: white;
    font-weight: bold;
    font-size: 12px;
    pointer-events: none;
  }
`

interface TripMapProps {
  itineraries: Itinerary[]
  selectedItineraryId?: string | null
  selectedDayId?: string | null
  onItineraryClick?: (itineraryId: string) => void
  className?: string
  focusMode?: 'all' | 'day' | 'single' // フォーカスモードを追加
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
  className = '',
  focusMode = 'all' // デフォルトは全体表示
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Google Maps API の読み込み
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // APIキーの確認
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
        if (!apiKey) {
          throw new Error('Google Maps APIキーが設定されていません。.env.localファイルでNEXT_PUBLIC_GOOGLE_MAPS_API_KEYまたはNEXT_PUBLIC_GOOGLE_PLACES_API_KEYを設定してください。')
        }
        
        // 共通ローダーを使用してAPIを読み込み
        await loadGoogleMapsAPI()
        
        if (!mapRef.current || !window.google) {
          throw new Error('Google Maps APIの読み込みに失敗しました')
        }

        // CSSスタイルをDOMに追加
        const styleElement = document.createElement('style')
        styleElement.textContent = teardropStyles
        document.head.appendChild(styleElement)

        // AdvancedMarkerElement用のmapIdを設定
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
          mapId: 'trip-map-teardrop-markers', // AdvancedMarkerElement用のmapId
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
        setLoading(false)
      } catch (error) {
        console.error('Google Maps APIの読み込みに失敗しました:', error)
        setError(error instanceof Error ? error.message : '地図の読み込みに失敗しました')
        setLoading(false)
      }
    }

    initializeMap()
  }, [])

  // itineraries が変更された時にマーカーとルートを更新
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return

    // 既存のマーカーをクリア
    markers.forEach(markerData => markerData.marker.map = null)
    setMarkers([])

    // 位置情報がある itineraries をフィルタリング
    const validItineraries = itineraries.filter(
      itinerary => itinerary.place_data?.geometry?.location
    )

    if (validItineraries.length === 0) return

    // 日程ごとの番号を計算するためのマップを作成
    const dayNumberMap = new Map<string, number>()
    
    // ティアドロップ形状のマーカーを作成
    const newMarkers = validItineraries.map((itinerary, index) => {
      const position = {
        lat: itinerary.place_data!.geometry!.location.lat,
        lng: itinerary.place_data!.geometry!.location.lng,
      }

      // 日程ごとの番号を計算
      const dayId = itinerary.day_id
      if (!dayNumberMap.has(dayId)) {
        dayNumberMap.set(dayId, 1)
      } else {
        dayNumberMap.set(dayId, dayNumberMap.get(dayId)! + 1)
      }
      const dayNumber = dayNumberMap.get(dayId)!

      // ティアドロップ形状のマーカー要素を作成
      const teardropElement = document.createElement('div')
      teardropElement.className = 'teardrop-marker'
      
      // ラベル（番号）を追加 - 日程ごとの番号を使用
      const labelElement = document.createElement('div')
      labelElement.className = 'teardrop-label'
      labelElement.textContent = dayNumber.toString()
      teardropElement.appendChild(labelElement)

      // AdvancedMarkerElementを作成
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        title: itinerary.title,
        content: teardropElement,
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
        
        // 個別フォーカスモードの場合、選択された場所にフォーカス
        if (focusMode === 'single') {
          const position = {
            lat: itinerary.place_data!.geometry!.location.lat,
            lng: itinerary.place_data!.geometry!.location.lng,
          }
          
          // DirectionsRendererを一時的に非表示にして、ズームが正常に動作するようにする
          if (directionsRenderer) {
            directionsRenderer.setMap(null)
          }
          
          // 地図を選択された場所にフォーカス
          map.setCenter(position)
          map.setZoom(17)
        }
      })

      return { marker, element: teardropElement, itineraryId: itinerary.id }
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

      // ルート最適化を使用してルートを計算
      routeOptimizer.calculateRouteDebounced(
        {
          origin: `${validItineraries[0].place_data!.geometry!.location.lat},${validItineraries[0].place_data!.geometry!.location.lng}`,
          destination: `${validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lat},${validItineraries[validItineraries.length - 1].place_data!.geometry!.location.lng}`,
          waypoints: waypoints.map(wp => `${wp.location.lat},${wp.location.lng}`),
          travelMode: 'DRIVING'
        },
        directionsService,
        (result: any, status: any) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result)
          }
        }
      )
    }

    // マップのビューを調整（フォーカスモードに応じて）
    if (focusMode === 'single' && selectedItineraryId) {
      // 個別フォーカスモード：選択されたItineraryのみにフォーカス
      const selectedItinerary = validItineraries.find(it => it.id === selectedItineraryId)
      if (selectedItinerary) {
        // DirectionsRendererを一時的に非表示にして、ズームが正常に動作するようにする
        if (directionsRenderer) {
          directionsRenderer.setMap(null)
        }
        
        const position = {
          lat: selectedItinerary.place_data!.geometry!.location.lat,
          lng: selectedItinerary.place_data!.geometry!.location.lng,
        }
        map.setCenter(position)
        map.setZoom(17)
      }
    } else if (validItineraries.length === 1) {
      // 単一のItineraryの場合
      map.setCenter({
        lat: validItineraries[0].place_data!.geometry!.location.lat,
        lng: validItineraries[0].place_data!.geometry!.location.lng,
      })
      map.setZoom(17)
    } else if (validItineraries.length > 1) {
      // 複数のItineraryの場合：全体を表示
      // DirectionsRendererを再表示
      if (directionsRenderer) {
        directionsRenderer.setMap(map)
      }
      
      const bounds = new window.google.maps.LatLngBounds()
      validItineraries.forEach(itinerary => {
        bounds.extend({
          lat: itinerary.place_data!.geometry!.location.lat,
          lng: itinerary.place_data!.geometry!.location.lng,
        })
      })
      map.fitBounds(bounds)
    }
  }, [map, directionsService, directionsRenderer, itineraries, selectedDayId, focusMode, selectedItineraryId])

  // 選択されたItineraryにフォーカスする機能
  useEffect(() => {
    if (!map || !selectedItineraryId) return

    const selectedItinerary = itineraries.find(itinerary => itinerary.id === selectedItineraryId)
    if (!selectedItinerary?.place_data?.geometry?.location) return

    const position = {
      lat: selectedItinerary.place_data.geometry.location.lat,
      lng: selectedItinerary.place_data.geometry.location.lng,
    }

    // 選択されたVenueにズーム・フォーカス
    // DirectionsRendererを一時的に非表示にして、ズームが正常に動作するようにする
    if (directionsRenderer) {
      directionsRenderer.setMap(null)
    }
    
    map.setCenter(position)
    map.setZoom(17)

    // 該当するマーカーをハイライト
    markers.forEach((markerData) => {
      if (markerData.itineraryId === selectedItineraryId) {
        // 選択されたマーカーをハイライト
        markerData.element.className = 'teardrop-marker selected'
      } else {
        // 他のマーカーは通常の色
        markerData.element.className = 'teardrop-marker'
      }
    })
  }, [selectedItineraryId, map, markers, itineraries])

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">地図を読み込み中...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
          <div className="text-center p-4">
            <div className="text-red-500 text-lg mb-2">⚠️ 地図の読み込みに失敗しました</div>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      )}
      
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