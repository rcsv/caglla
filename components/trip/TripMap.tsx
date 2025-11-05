'use client'
import logger from '@/lib/core/logger'

import { useEffect, useRef, useState } from 'react'
import { Itinerary, Trip, PlaceData } from '@/lib/core/types'
import type { PlaceSearchResult } from '@/lib/core/types'
import { loadGoogleMapsAPI } from '@/lib/api/google/maps-loader'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'
import { routeOptimizer } from '@/lib/travel/route-optimization'
import { getZIndexClass } from '@/lib/core/z-index'
import POIDialog from '@/components/modals/POIDialog'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { dateUtils } from '@/lib/utils/date'
import MapSearchOverlay from './MapSearchOverlay'
import Loading from '@/components/common/Loading'
import { t } from '@/lib/i18n'

// マップのズームレベル定数
const DEFAULT_ZOOM_LEVEL = 14
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
  const [markers, setMarkers] = useState<any[]>([])
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
    smoothMoveToLocation(map, lat, lng, DEFAULT_ZOOM_LEVEL)
    
    // 地図操作を検出（スクロール連動を停止）
    onMapInteractionStart?.()
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
          const newPoiData = {
            placeId: r.place_id,
            name: r.name,
            location: { lat: pos.lat, lng: pos.lng },
          }
          setInternalPoiData(newPoiData)
          onPoiDataUpdate?.(newPoiData)
        })
        setSearchResultMarkers(prev => [...prev, mk])
      }, index * 120)
    })
  }

  // Google Maps API の読み込み
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 共通ローダーを使用してAPIを読み込み（ユーザー言語を付与）
        await loadGoogleMapsAPI(getUserLanguage(user))
        
        if (!mapRef.current || !window.google) {
          throw new Error(t('tripMap.loadFailed'))
        }

        // AdvancedMarkerElement用のmapIdを設定
        // Trip目的地または指定された初期中心位置を使用（フォールバックは東京）
        const defaultCenter = initialCenter || { lat: 35.6762, lng: 139.6503 }
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
          clickableIcons: true, // POIのクリックを有効化（カスタムダイアログを表示）
        })

        const newDirectionsService = new window.google.maps.DirectionsService()
        const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          // ビューポートは常にアプリ側で制御する（自動でセンターやズームを変更しない）
          preserveViewport: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 4,
          },
        })

        newDirectionsRenderer.setMap(newMap)

        // POIマーカーのクリックイベントを検出
        newMap.addListener('click', async (event: any) => {
          // 地図上の明示的なユーザー操作を検出（同期を即停止させる）
          onMapInteractionStart?.()
          // Google Maps標準のPOI情報ウィンドウをキャンセル
          const infoWindows = newMap.get('infoWindows') || []
          infoWindows.forEach((infoWindow: any) => {
            infoWindow.close()
          })
          
          // クリックされた位置のPOIマーカーを検出
          const clickLatLng = event.latLng
          
          // 新Places API (v1) を使用してPOI情報を取得
          try {
            const response = await fetch('/api/places/nearby', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                location: {
                  lat: clickLatLng.lat(),
                  lng: clickLatLng.lng()
                },
                radius: 200 // 200メートル以内のPOIを検索（クリック検出の感度を向上）
              })
            })

            if (!response.ok) {
              throw new Error(`Nearby search failed: ${response.status}`)
            }

            const data = await response.json()
            
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              // 最も近いPOIを選択
              const nearestPOI = data.results[0]
              const newPoiData = {
                placeId: nearestPOI.place_id,
                name: nearestPOI.name,
                location: {
                  lat: nearestPOI.geometry.location.lat,
                  lng: nearestPOI.geometry.location.lng
                }
              }
              setInternalPoiData(newPoiData)
              onPoiDataUpdate?.(newPoiData)
            } else {
              // 検索結果なし: POI情報がない場合はダイアログを表示しない
              logger.debug('No POI found at clicked location, not showing dialog')
              setInternalPoiData(null)
              onPoiDataUpdate?.(null)
            }
          } catch (error) {
            logger.warn('Places API search failed:', error)
            // API呼び出し失敗: POI情報が取得できない場合はダイアログを表示しない
            logger.debug('Places API failed, not showing dialog')
            setInternalPoiData(null)
            onPoiDataUpdate?.(null)
          }
        })

        // Google Maps標準のPOI情報ウィンドウを無効化
        newMap.addListener('poi_click', (event: any) => {
          onMapInteractionStart?.()
          // デフォルトのPOI情報ウィンドウをキャンセル
          event.stop()
          
          // カスタムPOIダイアログを表示
          if (event.placeId) {
            const newPoiData = {
              placeId: event.placeId,
              name: event.displayName || 'POI',
              location: {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
              }
              // placeDataは渡さない（PlacesCacheから取得）
            }
            setInternalPoiData(newPoiData)
            onPoiDataUpdate?.(newPoiData)
          }
        })

        // ユーザーの地図操作（パン/ズーム開始）を検出
        newMap.addListener('dragstart', () => onMapInteractionStart?.())
        newMap.addListener('zoom_changed', () => onMapInteractionStart?.())

        // コンテナのポインタ/タッチ開始も検出（モバイルのジェスチャーを早期捕捉）
        if (mapRef.current) {
          const handler = () => onMapInteractionStart?.()
          mapRef.current.addEventListener('pointerdown', handler, { passive: true })
          mapRef.current.addEventListener('touchstart', handler, { passive: true })
        }

        setMap(newMap)
        setDirectionsService(newDirectionsService)
        setDirectionsRenderer(newDirectionsRenderer)
        setLoading(false)
      } catch (error) {
        logger.error('Google Maps APIの読み込みに失敗しました:', error)
        setError(error instanceof Error ? error.message : t('countryMap.loadFailed'))
        setLoading(false)
      }
    }

    initializeMap()
  }, [initialCenter, onPoiDataUpdate])

  // itineraries が変更された時にマーカーとルートを更新
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer) return

    // 既存のマーカーをクリア
    markers.forEach(markerData => markerData.marker.map = null)
    setMarkers([])

    // 位置情報がある itineraries をフィルタリング
    logger.debug('🗺️ TripMap: Filtering itineraries')
    logger.debug('  Total itineraries:', itineraries.length)
    
    const validItineraries = itineraries.filter(
      itinerary => {
        const isValid = !!itinerary.place_data?.geometry?.location
        logger.debug(`  Itinerary "${itinerary.title}":`, {
          hasPlaceData: !!itinerary.place_data,
          hasGeometry: !!itinerary.place_data?.geometry,
          hasLocation: !!itinerary.place_data?.geometry?.location,
          isValid
        })
        return isValid
      }
    )

    logger.debug('  Valid itineraries count:', validItineraries.length)

    if (validItineraries.length === 0) {
      logger.debug('⚠️ No valid itineraries, resetting map')
      // 行先が無い場合は初期センターへ
      if (initialCenter) {
        map.setCenter(initialCenter)
        map.setZoom(11)
      }
      return
    }

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
      
      logger.debug(`  Creating marker for "${itinerary.title}" with number: ${markerNumber}`)

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
          setInternalPoiData(newPoiData)
          onPoiDataUpdate?.(newPoiData)
        }
        
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
          
          // 地図を選択された場所にフォーカス（滑らかなアニメーション）
          smoothMoveToLocation(map, position.lat, position.lng, DEFAULT_ZOOM_LEVEL)
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
        smoothMoveToLocation(map, position.lat, position.lng, DEFAULT_ZOOM_LEVEL)
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
      smoothMoveToLocation(
        map,
        validItineraries[0].place_data!.geometry!.location.lat,
        validItineraries[0].place_data!.geometry!.location.lng,
        DEFAULT_ZOOM_LEVEL
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
  }, [map, directionsService, directionsRenderer, itineraries, selectedDayId, focusMode, selectedItineraryId, initialCenter, scrollSyncEnabled, onItineraryClick, onPoiDataUpdate])

  // 選択されたItineraryにフォーカスする機能（クリック時のVenue表示用）
  useEffect(() => {
    // focusMode === 'single'の場合は常にフォーカス（クリック時のVenue表示のため）
    // focusMode !== 'single'の場合はスクロール連動が有効な場合のみフォーカス
    if (!map || !selectedItineraryId) return
    if (focusMode !== 'single' && !scrollSyncEnabled) return

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
    
    smoothMoveToLocation(map, position.lat, position.lng, DEFAULT_ZOOM_LEVEL)

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
  }, [selectedItineraryId, map, markers, itineraries, directionsRenderer, focusMode, scrollSyncEnabled])

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
        position="top-center"
      />
      
      {/* マップのオーバーレイ情報 */}
      <div className={`absolute top-4 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs ${getZIndexClass('MAIN_CONTENT')}`}>
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

      {/* 同期状態のオーバーレイは削除（スクロール連動機能を無効化） */}
      
      {/* POIダイアログ */}
      <POIDialog
        poiData={poiData || internalPoiData}
        onClose={() => {
          setInternalPoiData(null)
          onPoiDataUpdate?.(null)
        }}
        onAddToItinerary={async (placeId: string, dayId: string) => {
          if (onAddFromPOI) {
            // 親コンポーネントの新しいハンドラーを使用（ローディング状態付き）
            await onAddFromPOI(placeId, dayId)
            // POI ダイアログを閉じる
            setInternalPoiData(null)
            onPoiDataUpdate?.(null)
          } else {
            // フォールバック: 古い動作（デバッグ用）
            logger.warn('onAddFromPOI is not provided, POI add功能が利用できません')
          }
        }}
        availableDays={trip?.days?.sort((a, b) => (a.day_number || 0) - (b.day_number || 0)).map((day) => ({
          id: day.id,
          date: dateUtils.formatDate(day.date, { month: 'long', day: 'numeric', weekday: 'short', year: undefined }, getUserLanguage(user)),
          title: day.description
        })) || []}
      />
    </div>
  )
}