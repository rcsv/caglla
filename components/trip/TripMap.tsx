'use client'
import logger from '@/lib/core/logger'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Itinerary, Trip, PlaceData } from '@/lib/core/types'
import type { PlaceSearchResult } from '@/lib/core/types'
import { loadGoogleMapsAPI } from '@/lib/api/google/maps-loader'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'
import { routeOptimizer } from '@/lib/travel/route-optimization'
import { getZIndexClass } from '@/lib/core/z-index'
import { getZoomForPlaceTypes, DEFAULT_ITINERARY_ZOOM } from '@/lib/travel/map-zoom'
import POIDialog from '@/components/modals/POIDialog'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { dateUtils } from '@/lib/utils/date'
import MapSearchOverlay from './MapSearchOverlay'
import Loading from '@/components/common/Loading'
import { t } from '@/lib/i18n'

// マップのズームレベル定数
const DEFAULT_ZOOM_LEVEL = DEFAULT_ITINERARY_ZOOM
const SMOOTH_PAN_DISTANCE_THRESHOLD = 5 // 約5km（滑らかなパンを使用する距離の閾値）

// 2点間の距離を計算する関数（簡易版）
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 滑らかな移動でマップを更新する関数
const smoothMoveToLocation = (map: google.maps.Map, targetLat: number, targetLng: number, targetZoom: number) => {
  const currentCenter = map.getCenter()
  if (!currentCenter) return
  
  const currentLat = currentCenter.lat()
  const currentLng = currentCenter.lng()
  
  const distance = calculateDistance(currentLat, currentLng, targetLat, targetLng)
  
  if (distance < SMOOTH_PAN_DISTANCE_THRESHOLD) {
    // 近い場合は滑らかなパン
    map.panTo({ lat: targetLat, lng: targetLng })
    
    // ズームレベルも段階的に変更
    const currentZoom = map.getZoom()
    if (currentZoom !== targetZoom) {
      setTimeout(() => {
        map.setZoom(targetZoom)
      }, 300) // パンの完了後にズーム
    }
  } else {
    // 遠い場合は即座に移動
    map.setCenter({ lat: targetLat, lng: targetLng })
    map.setZoom(targetZoom)
  }
}

interface TripMapProps {
  itineraries: Itinerary[]
  trip?: Trip // 追加: Day 一覧を取得するために必要
  selectedItineraryId?: string | null
  selectedDayId?: string | null
  onItineraryClick?: (itineraryId: string) => void
  onPoiDataUpdate?: (poiData: {
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: PlaceData
  } | null) => void
  onAddFromPOI?: (placeId: string, dayId: string) => Promise<void> // POIから追加する際のハンドラー
  poiData?: {
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: PlaceData
  } | null
  className?: string
  focusMode?: 'all' | 'day' | 'single' // フォーカスモードを追加
  initialCenter?: { lat: number; lng: number } // 初期センター位置（未指定時は東京）
  // 追加: 地図操作を親へ通知（スクロール連動の即停止用）
  onMapInteractionStart?: () => void
  // 追加: スクロール連動状態と明示的再開の要求
  scrollSyncEnabled?: boolean
  onRequestEnableScrollSync?: () => void
}

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

export default function TripMap({
  itineraries,
  trip,
  selectedItineraryId = null,
  selectedDayId = null,
  onItineraryClick,
  onPoiDataUpdate,
  onAddFromPOI,
  poiData,
  className = '',
  focusMode = 'all', // デフォルトは全体表示
  initialCenter,
  onMapInteractionStart,
  scrollSyncEnabled,
  onRequestEnableScrollSync
}: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<any[]>([])
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [internalPoiData, setInternalPoiData] = useState<{
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null>(null)
  const [searchMarker, setSearchMarker] = useState<any>(null) // 検索結果のマーカー
  const [searchResultMarkers, setSearchResultMarkers] = useState<any[]>([]) // 一覧検索のピン
  const poiMarkerRef = useRef<any>(null)
  const onPoiDataUpdateRef = useRef(onPoiDataUpdate)
  const onItineraryClickRef = useRef(onItineraryClick)
  const onMapInteractionStartRef = useRef(onMapInteractionStart)
  const lastResetKeyRef = useRef<string | null>(null)

  useEffect(() => {
    onPoiDataUpdateRef.current = onPoiDataUpdate
  }, [onPoiDataUpdate])

  useEffect(() => {
    onItineraryClickRef.current = onItineraryClick
  }, [onItineraryClick])

  useEffect(() => {
    onMapInteractionStartRef.current = onMapInteractionStart
  }, [onMapInteractionStart])

  // itineraries を正規化して依存配列を安定化（ID と place_data の有無だけを比較）
  const normalizedItinerariesKey = useMemo(() => {
    return itineraries
      .map(it => `${it.id}:${it.place_data?.geometry?.location ? '1' : '0'}`)
      .join(',')
  }, [itineraries])

  const initialCenterLat =
    typeof initialCenter?.lat === 'function' ? initialCenter.lat() : initialCenter?.lat ?? null
  const initialCenterLng =
    typeof initialCenter?.lng === 'function' ? initialCenter.lng() : initialCenter?.lng ?? null
  const hasInitialCenter = initialCenterLat !== null && initialCenterLng !== null
  const initialCenterKey = hasInitialCenter
    ? `${initialCenterLat}:${initialCenterLng}`
    : 'default-center'

  // 地図の現在のビューポートを取得する関数
  const getMapViewport = () => {
    if (!map) return { center: undefined, bounds: undefined }
    
    const center = map.getCenter()
    const bounds = map.getBounds()
    
    return {
      center: center ? { lat: center.lat(), lng: center.lng() } : undefined,
      bounds: bounds ? {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      } : undefined
    }
  }

  // 検索結果の場所にパン・ズームするハンドラー
  const handleSearchPlaceChosen = (place: PlaceData) => {
    if (!map || !place.geometry?.location) return

    const { lat, lng } = place.geometry.location
    const zoom = getZoomForPlaceTypes(place.types)
    
    // 既存の検索マーカーをクリア
    if (searchMarker) {
      searchMarker.map = null
    }

    // 検索結果用のカスタムマーカー要素を作成
    const searchMarkerElement = document.createElement('div')
    searchMarkerElement.className = 'search-result-marker'
    searchMarkerElement.innerHTML = `
      <div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
      </div>
    `

    // 新しい検索マーカーを作成
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat, lng },
      title: place.name,
      content: searchMarkerElement
    })

    setSearchMarker(marker)

    // 地図を選択された場所にパン・ズーム
    smoothMoveToLocation(map, lat, lng, zoom)
    
    // 地図操作を検出（スクロール連動を停止）
    onMapInteractionStartRef.current?.()
  }

  // 検索結果一覧のピンをDROPアニメーションで順次描画
  const handleSearchResultsUpdated = (results: PlaceSearchResult[]) => {
    if (!map) return

    // 既存の検索結果ピンをクリア
    searchResultMarkers.forEach((m) => m.setMap(null))
    setSearchResultMarkers([])

    // 先頭から順にストンストン落とす（最大10件）
    const limited = results.slice(0, 10)
    limited.forEach((r, index) => {
      const pos = r.geometry?.location
      if (!pos) return
      setTimeout(() => {
        // Google標準に近いピン形状（Materialの場所ピンパス）を色違いで使用
        const pinPath = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z'
        const scale = 1.25
        const icon = {
          path: pinPath,
          fillColor: '#F59E0B', // 温かみのある印象
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale,
          anchor: new window.google.maps.Point(12 * scale, 24 * scale),
        } as google.maps.Symbol

        const mk = new window.google.maps.Marker({
          map,
          position: { lat: pos.lat, lng: pos.lng },
          title: r.name,
          animation: window.google.maps.Animation.DROP,
          icon,
        })
        // クリックでPOIDialogを開く
        mk.addListener('click', () => {
          console.log('🟠 [SEARCH RESULT] Marker clicked')
          console.log('🟠 Place ID:', r.place_id)
          console.log('🟠 Name:', r.name)
          
          logger.debug('🟠 Search result marker clicked:', {
            placeId: r.place_id,
            name: r.name
          })
          
          const newPoiData = {
            placeId: r.place_id,
            name: r.name,
            location: { lat: pos.lat, lng: pos.lng },
          }
          console.log('🟢 [SEARCH RESULT] Setting POI data:', newPoiData)
          logger.debug('🟢 Setting POI data from search result:', newPoiData)
          setInternalPoiData(newPoiData)
          onPoiDataUpdateRef.current?.(newPoiData)
        })
        setSearchResultMarkers(prev => [...prev, mk])
      }, index * 120)
    })
  }

  // Google Maps API の読み込み
  useEffect(() => {
    let isMounted = true
    let createdMap: google.maps.Map | null = null
    let createdDirectionsRenderer: google.maps.DirectionsRenderer | null = null
    let mapElement: HTMLDivElement | null = null

    const pointerHandler = () => {
      onMapInteractionStartRef.current?.()
    }

    const initializeMap = async () => {
      console.log('🗺️ [MAP INIT] Initializing map...')
      try {
        setLoading(true)
        setError(null)

        const language = getUserLanguage(user)
        await loadGoogleMapsAPI(language)
        console.log('✅ [MAP INIT] Google Maps API loaded')

        if (!mapRef.current || !window.google) {
          throw new Error(t('tripMap.loadFailed'))
        }

        mapElement = mapRef.current

        const defaultCenter = hasInitialCenter
          ? { lat: initialCenterLat!, lng: initialCenterLng! }
          : { lat: 35.6762, lng: 139.6503 }
        const newMap = new window.google.maps.Map(mapElement, {
          zoom: 10,
          center: defaultCenter,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT,
          },
          mapId: 'trip-map-teardrop-markers',
          clickableIcons: true,
        })

        const newDirectionsService = new window.google.maps.DirectionsService()
        const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
          },
        })

        newDirectionsRenderer.setMap(newMap)

        createdMap = newMap
        createdDirectionsRenderer = newDirectionsRenderer

        newMap.addListener('click', async (event: any) => {
          console.log('⚪ [MAP CLICK] Click event fired')
          console.log('⚪ Event object:', event)
          console.log('⚪ Has placeId:', event.placeId)
          console.log('⚪ Location:', {
            lat: event.latLng?.lat(),
            lng: event.latLng?.lng()
          })
          
          onMapInteractionStartRef.current?.()
          
          // InfoWindowを閉じる
          const infoWindows = newMap.get('infoWindows') || []
          infoWindows.forEach((infoWindow: any) => {
            infoWindow.close()
          })

          // ✅ Google標準POIマーカーをクリックした場合の処理
          // poi_clickイベントが発火しない場合のフォールバック
          if (event.placeId) {
            console.log('🟡 [MAP CLICK → POI] Google POI detected via click event')
            console.log('🟡 Place ID:', event.placeId)
            
            // Place Details APIから名前を含む詳細情報を取得
            try {
              const language = getUserLanguage(user)
              const response = await fetch('/api/places/details', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  placeId: event.placeId,
                  language: language
                })
            })

              if (response.ok) {
            const data = await response.json()
                if (data.status === 'OK' && data.result) {
              const newPoiData = {
                    placeId: event.placeId,
                    name: data.result.name || 'POI',
                location: {
                      lat: event.latLng.lat(),
                      lng: event.latLng.lng(),
                },
                    placeData: data.result
              }
                  console.log('🟢 [MAP CLICK → POI] Setting POI data with name:', newPoiData)
                  logger.debug('🟡 Google POI marker clicked via click event:', newPoiData)
              setInternalPoiData(newPoiData)
              onPoiDataUpdateRef.current?.(newPoiData)
            } else {
                  // Place Details取得失敗時のフォールバック
                  const newPoiData = {
                    placeId: event.placeId,
                    name: 'POI',
                    location: {
                      lat: event.latLng.lat(),
                      lng: event.latLng.lng(),
                    },
                  }
                  console.warn('⚠️ [MAP CLICK → POI] Failed to get place details, using fallback')
                  setInternalPoiData(newPoiData)
                  onPoiDataUpdateRef.current?.(newPoiData)
                }
            }
          } catch (error) {
              console.error('❌ [MAP CLICK → POI] Error fetching place details:', error)
              // エラー時のフォールバック
              const newPoiData = {
                placeId: event.placeId,
                name: 'POI',
                location: {
                  lat: event.latLng.lat(),
                  lng: event.latLng.lng(),
                },
              }
              setInternalPoiData(newPoiData)
              onPoiDataUpdateRef.current?.(newPoiData)
            }
            return
          }

          // マップ空白部分をクリックした場合
          console.log('⚪ [MAP CLICK] Blank area clicked (no POI search)')
          logger.debug('⚪ Map blank area clicked (no POI search)', {
            lat: event.latLng?.lat(),
            lng: event.latLng?.lng()
          })
          
          // POI検索は実行しない
          // POIDialogは、以下の場合のみ表示：
          // 1. Itineraryマーカー（ティアドロップ）をクリック
          // 2. Google標準POIマーカーをクリック（event.placeIdが存在）
          // 3. 検索結果マーカーをクリック
        })

        // Google標準POIマーカーのクリックイベント
        const poiClickListener = newMap.addListener('poi_click', (event: any) => {
          console.log('🟡 [POI_CLICK EVENT] Google POI marker clicked')
          console.log('🟡 Event details:', event)
          console.log('🟡 Place ID:', event.placeId)
          console.log('🟡 Display Name:', event.displayName)
          
          logger.debug('🟡 Google POI marker clicked:', {
            placeId: event.placeId,
            name: event.displayName
          })
          
          onMapInteractionStartRef.current?.()
          event.stop()

          if (event.placeId) {
            const newPoiData = {
              placeId: event.placeId,
              name: event.displayName || 'POI',
              location: {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
              },
            }
            console.log('🟢 [POI_CLICK] Setting POI data:', newPoiData)
            logger.debug('🟢 Setting POI data from Google POI:', newPoiData)
            setInternalPoiData(newPoiData)
            onPoiDataUpdateRef.current?.(newPoiData)
          } else {
            console.warn('⚠️ [POI_CLICK] No placeId in event')
          }
        })
        
        console.log('✅ POI click listener registered:', poiClickListener)

        newMap.addListener('dragstart', () => onMapInteractionStartRef.current?.())
        newMap.addListener('zoom_changed', () => onMapInteractionStartRef.current?.())

        if (mapElement) {
          mapElement.addEventListener('pointerdown', pointerHandler, { passive: true })
          mapElement.addEventListener('touchstart', pointerHandler, { passive: true })
        }

        if (!isMounted) {
          return
        }

        console.log('✅ [MAP INIT] Map initialization complete')
        console.log('✅ [MAP INIT] Event listeners registered')

        setMap(newMap)
        setDirectionsService(newDirectionsService)
        setDirectionsRenderer(newDirectionsRenderer)
        setLoading(false)
      } catch (error) {
        if (!isMounted) {
          return
        }
        logger.error('Google Maps APIの読み込みに失敗しました:', error)
        setError(error instanceof Error ? error.message : t('countryMap.loadFailed'))
        setLoading(false)
      }
    }

    initializeMap()

    return () => {
      isMounted = false
      if (mapElement) {
        mapElement.removeEventListener('pointerdown', pointerHandler)
        mapElement.removeEventListener('touchstart', pointerHandler)
      }
      if (createdDirectionsRenderer) {
        createdDirectionsRenderer.setMap(null)
      }
      if (createdMap && typeof window !== 'undefined' && window.google) {
        google.maps.event.clearInstanceListeners(createdMap)
      }
    }
  }, [initialCenterKey, user])

  // itineraries が変更された時にマーカーとルートを更新
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return

    // 既存のマーカーをクリア
    markersRef.current.forEach(markerData => {
      if (markerData.marker) {
        markerData.marker.map = null
      }
    })
    markersRef.current = []

    // 位置情報がある itineraries をフィルタリング
    const validItineraries = itineraries.filter(
      itinerary => !!itinerary.place_data?.geometry?.location
    )

    const fallbackCenter = hasInitialCenter
      ? { lat: initialCenterLat!, lng: initialCenterLng! }
      : undefined

    if (validItineraries.length === 0) {
      // リセット処理を1回だけ実行するためのガード
      const resetKey = `reset-${normalizedItinerariesKey}`
      if (lastResetKeyRef.current === resetKey) {
        return // 既に同じ状態でリセット済み
      }
      lastResetKeyRef.current = resetKey
      
      // 行先が無い場合は初期センターへ
      if (fallbackCenter) {
        map.setCenter(fallbackCenter)
        map.setZoom(11)
      }
      return
    }
    
    // 有効な itineraries がある場合はリセットキーをクリア
    lastResetKeyRef.current = null

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
      
      // ラベル（番号）を追加 - sort_numberを使用（日程ごとの番号ではなく、全体の番号）
      const labelElement = document.createElement('div')
      labelElement.className = 'teardrop-label'
      const markerNumber = itinerary.sort_number
      labelElement.textContent = markerNumber.toString()
      teardropElement.appendChild(labelElement)

      // AdvancedMarkerElementを作成
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        title: itinerary.title,
        content: teardropElement,
      })

      // インフォウィンドウを作成（非表示）
      // const infoWindow = new window.google.maps.InfoWindow({
      //   content: `
      //     <div class="p-2">
      //       <h3 class="font-semibold text-gray-900">${itinerary.title}</h3>
      //       ${itinerary.description ? `<p class="text-sm text-gray-600 mt-1">${itinerary.description}</p>` : ''}
      //       ${itinerary.start_time ? `<p class="text-xs text-gray-500 mt-1">開始: ${itinerary.start_time}</p>` : ''}
      //       ${itinerary.end_time ? `<p class="text-xs text-gray-500">終了: ${itinerary.end_time}</p>` : ''}
      //     </div>
      //   `,
      // })

      marker.addListener('click', () => {
        console.log('🔵 [ITINERARY MARKER] Marker clicked')
        console.log('🔵 Itinerary ID:', itinerary.id)
        console.log('🔵 Title:', itinerary.title)
        console.log('🔵 Has place_id:', !!itinerary.place_data?.place_id)
        console.log('🔵 Place ID:', itinerary.place_data?.place_id)
        
        logger.debug('🔵 Itinerary marker clicked:', {
          itineraryId: itinerary.id,
          title: itinerary.title,
          hasPlaceId: !!itinerary.place_data?.place_id,
          placeId: itinerary.place_data?.place_id
        })
        
        // 通常のInfoWindowは非表示（カスタムPOIダイアログのみ表示）
        // infoWindow.open(map, marker)
        
        // POIダイアログを表示（place_idがある場合）
        if (itinerary.place_data?.place_id) {
          const newPoiData = {
            placeId: itinerary.place_data.place_id,
            name: itinerary.title,
            location: {
              lat: itinerary.place_data.geometry!.location.lat,
              lng: itinerary.place_data.geometry!.location.lng
            },
            placeData: itinerary.place_data // Itinerariesに保存されているplace_dataを渡す
          }
          console.log('🟢 [ITINERARY MARKER] Setting POI data:', newPoiData)
          logger.debug('🟢 Setting POI data:', newPoiData)
          setInternalPoiData(newPoiData)
        onPoiDataUpdateRef.current?.(newPoiData)
        } else {
          console.warn('⚠️ [ITINERARY MARKER] No place_id found:', itinerary.title)
          logger.warn('⚠️ Itinerary marker clicked but no place_id found:', itinerary.title)
        }
        
        // 左ペインのItineraryにスクロールするためのコールバック
      onItineraryClickRef.current?.(itinerary.id)
        
        // 個別フォーカスモードの場合、選択された場所にフォーカス
        if (focusMode === 'single') {
          const position = {
            lat: itinerary.place_data!.geometry!.location.lat,
            lng: itinerary.place_data!.geometry!.location.lng,
          }
          const zoom = getZoomForPlaceTypes(itinerary.place_data?.types)
          
          // DirectionsRendererを一時的に非表示にして、ズームが正常に動作するようにする
          if (directionsRenderer) {
            directionsRenderer.setMap(null)
          }
          
          // 地図を選択された場所にフォーカス（滑らかなアニメーション）
          smoothMoveToLocation(map, position.lat, position.lng, zoom)
        }
      })

      return { marker, element: teardropElement, itineraryId: itinerary.id }
    })

    markersRef.current = newMarkers

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
    // focusMode === 'single'の場合はスクロール連動の状態に関係なく、クリック時のVenue表示を実行
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
        const zoom = getZoomForPlaceTypes(selectedItinerary.place_data?.types)
        smoothMoveToLocation(map, position.lat, position.lng, zoom)
      }
      return // 個別フォーカスモードの場合はここで終了
    }
    
    // スクロール連動が停止中は地図位置を自動で動かさない（全体表示モードの場合のみ）
    if (!scrollSyncEnabled) {
      return
    }

    // 全体表示モードの場合の処理
    if (validItineraries.length === 1) {
      // 単一のItineraryの場合
      const only = validItineraries[0]
      const zoom = getZoomForPlaceTypes(only.place_data?.types)
      smoothMoveToLocation(
        map,
        only.place_data!.geometry!.location.lat,
        only.place_data!.geometry!.location.lng,
        zoom
      )
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
  }, [
    map,
    directionsService,
    directionsRenderer,
    normalizedItinerariesKey,
    itineraries,
    selectedDayId,
    focusMode,
    selectedItineraryId,
    initialCenterKey,
    scrollSyncEnabled,
    hasInitialCenter,
    initialCenterLat,
    initialCenterLng
  ])

  // POIダイアログ用の一時マーカーを制御
  useEffect(() => {
    if (!map) return

    const cleanupMarker = () => {
      if (poiMarkerRef.current) {
        poiMarkerRef.current.setMap(null)
        poiMarkerRef.current = null
      }
    }

    // 常に既存のマーカーをクリア（同時に複数表示されないようにする）
    cleanupMarker()

    const activePoi = poiData || internalPoiData
    if (!activePoi) {
      return () => {
        cleanupMarker()
      }
    }

    const selectedItinerary = selectedItineraryId
      ? itineraries.find((itinerary) => itinerary.id === selectedItineraryId)
      : null
    const selectedPlaceId = selectedItinerary?.place_data?.place_id

    // 選択中Itineraryと同一の場所であれば既存マーカーで十分なので表示しない
    if (selectedPlaceId && activePoi.placeId && activePoi.placeId === selectedPlaceId) {
      return () => {
        cleanupMarker()
      }
    }

    const positionSource = activePoi.placeData?.geometry?.location || activePoi.location
    const rawLat = positionSource?.lat
    const rawLng = positionSource?.lng
    const lat = typeof rawLat === 'function' ? rawLat() : rawLat
    const lng = typeof rawLng === 'function' ? rawLng() : rawLng

    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      return () => {
        cleanupMarker()
      }
    }

    const markerContainer = document.createElement('div')
    markerContainer.style.position = 'relative'
    markerContainer.style.transform = 'translate(-50%, -100%)'

    const markerBody = document.createElement('div')
    markerBody.style.width = '22px'
    markerBody.style.height = '22px'
    markerBody.style.borderRadius = '9999px'
    markerBody.style.backgroundColor = '#2563eb'
    markerBody.style.border = '3px solid #ffffff'
    markerBody.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.35)'
    markerBody.style.display = 'flex'
    markerBody.style.alignItems = 'center'
    markerBody.style.justifyContent = 'center'

    const markerInner = document.createElement('div')
    markerInner.style.width = '6px'
    markerInner.style.height = '6px'
    markerInner.style.borderRadius = '9999px'
    markerInner.style.backgroundColor = '#ffffff'

    markerBody.appendChild(markerInner)

    const markerStem = document.createElement('div')
    markerStem.style.position = 'absolute'
    markerStem.style.bottom = '-10px'
    markerStem.style.left = '50%'
    markerStem.style.transform = 'translateX(-50%)'
    markerStem.style.width = '2px'
    markerStem.style.height = '12px'
    markerStem.style.backgroundColor = '#2563eb'

    markerContainer.appendChild(markerBody)
    markerContainer.appendChild(markerStem)

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat, lng },
      content: markerContainer,
      zIndex: 600,
    })

    poiMarkerRef.current = marker

    return () => {
      cleanupMarker()
    }
  }, [map, poiData, internalPoiData, itineraries, selectedItineraryId])

  // 選択されたItineraryにフォーカスする機能（クリック時のVenue表示用）
  useEffect(() => {
    // focusMode === 'single'の場合は常にフォーカス（クリック時のVenue表示のため）
    // focusMode !== 'single'の場合はスクロール連動が有効な場合のみフォーカス
    if (!map || !selectedItineraryId) return
    if (focusMode !== 'single' && !scrollSyncEnabled) return

    const selectedItinerary = itineraries.find(itinerary => itinerary.id === selectedItineraryId)
    if (!selectedItinerary?.place_data?.geometry?.location) return

    // POIDialogが表示されている場合のチェック
    // poiDataが設定されている かつ poiData.placeIdがselectedItineraryIdに対応するItineraryのplace_idと一致しない場合
    // → Google POIマーカーをクリックした場合と判断し、フォーカス移動を抑制
    if (poiData) {
      const selectedPlaceId = selectedItinerary.place_data?.place_id
      if (selectedPlaceId && poiData.placeId && poiData.placeId !== selectedPlaceId) {
        // Google POIマーカーをクリックした場合: フォーカス移動を抑制
        // ただし、マーカーのハイライトは維持する（既存の選択状態を視覚的に保持）
        markersRef.current.forEach((markerData) => {
          if (markerData.itineraryId === selectedItineraryId) {
            markerData.element.className = 'teardrop-marker selected'
          } else {
            markerData.element.className = 'teardrop-marker'
          }
        })
        return
      }
    }

    const position = {
      lat: selectedItinerary.place_data.geometry.location.lat,
      lng: selectedItinerary.place_data.geometry.location.lng,
    }

    // 選択されたVenueにズーム・フォーカス
    // DirectionsRendererを一時的に非表示にして、ズームが正常に動作するようにする
    if (directionsRenderer) {
      directionsRenderer.setMap(null)
    }
    
    const zoom = getZoomForPlaceTypes(selectedItinerary.place_data?.types)
    logger.debug('🎯 TripMap: Focusing on selected itinerary with types-based zoom', {
      itineraryTitle: selectedItinerary.title,
      types: selectedItinerary.place_data?.types,
      calculatedZoom: zoom,
      position
    })
    smoothMoveToLocation(map, position.lat, position.lng, zoom)

    // 該当するマーカーをハイライト
    markersRef.current.forEach((markerData) => {
      if (markerData.itineraryId === selectedItineraryId) {
        // 選択されたマーカーをハイライト
        markerData.element.className = 'teardrop-marker selected'
      } else {
        // 他のマーカーは通常の色
        markerData.element.className = 'teardrop-marker'
      }
    })
  }, [selectedItineraryId, map, itineraries, directionsRenderer, focusMode, scrollSyncEnabled, poiData])

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className={`absolute inset-0 bg-gray-100 ${getZIndexClass('MAIN_CONTENT')}`}>
          <Loading center size="sm" color="blue" message={t('loading.mapLoading')} />
        </div>
      )}
      
      {error && (
        <div className={`absolute inset-0 bg-red-50 flex items-center justify-center ${getZIndexClass('MAIN_CONTENT')}`}>
          <div className="text-center p-4">
            <div className="text-red-500 text-lg mb-2">{t('tripMap.loadFailedWarning')}</div>
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
      
      {/* 検索オーバーレイ */}
      <MapSearchOverlay
        onPlaceChosen={handleSearchPlaceChosen}
        getMapViewport={getMapViewport}
        onSearchResultsUpdated={handleSearchResultsUpdated}
        hideSuggestions
        placeholder={t('placeSearch.placeholder')}
        position="top-left"
      />
      
      {/* マップのオーバーレイ情報 */}
      <div className={`absolute top-4 right-4 max-w-xs sm:max-w-sm pointer-events-auto ${getZIndexClass('MAP_OVERLAY')}`}>
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md rounded-lg px-4 py-3 text-sm text-gray-700 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-gray-900">
              {t('tripMap.overlay.title')}
            </span>
            {selectedDayId && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                {t('tripMap.overlay.filtering')}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 leading-snug">
            {t('tripMap.overlay.displayingLocations').replace(
              '{count}',
              itineraries.filter(i => i.place_data?.geometry?.location).length.toString()
            )}
          </div>
          {selectedDayId && (
            <div className="text-xs text-red-600">
              {t('tripMap.overlay.filteredByDay')}
            </div>
          )}
        </div>
      </div>

      {/* 同期状態のオーバーレイは削除（スクロール連動機能を無効化） */}
      
      {/* POIダイアログ */}
      <POIDialog
        poiData={poiData || internalPoiData}
        onClose={() => {
          setInternalPoiData(null)
          onPoiDataUpdateRef.current?.(null)
        }}
        onAddToItinerary={async (placeId: string, dayId: string) => {
          if (onAddFromPOI) {
            // 親コンポーネントの新しいハンドラーを使用（ローディング状態付き）
            await onAddFromPOI(placeId, dayId)
            // POI ダイアログを閉じる
            setInternalPoiData(null)
            onPoiDataUpdateRef.current?.(null)
          } else {
            // フォールバック: 古い動作（デバッグ用）
            logger.warn('onAddFromPOI is not provided, POI add功能が利用できません')
          }
        }}
        availableDays={(() => {
          const sortedDays = trip?.days?.sort((a, b) => (a.day_number || 0) - (b.day_number || 0)) || []
          
          // 複数の年が含まれるかチェック
          const years = new Set<number>()
          sortedDays.forEach(day => {
            if (day.date) {
              try {
                const date = dateUtils.toDate(day.date)
                if (date) {
                  years.add(date.getFullYear())
                }
              } catch {
                // 日付が無効な場合はスキップ
              }
            }
          })
          
          // 複数の年が含まれる場合は年も表示、そうでなければ省略
          const includeYear = years.size > 1
          
          return sortedDays.map((day) => ({
            id: day.id,
            date: dateUtils.formatDate(
              day.date, 
              { 
                month: 'long', 
                day: 'numeric', 
                weekday: 'short', 
                year: includeYear ? 'numeric' : undefined 
              }, 
              getUserLanguage(user)
            ),
            title: day.description
          }))
        })()}
      />
    </div>
  )
}