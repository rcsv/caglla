'use client'
import logger from '@/lib/core/logger'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMapsAPI } from '@/lib/api/google/maps-loader'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'
import { getZIndexClass } from '@/lib/core/z-index'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { getCountryFlag } from '@/lib/utils/country-flags'
import { dateUtils } from '@/lib/utils/date'
import type { Trip } from '@/lib/core/types'
import type { GoogleMapsAPI } from '@/lib/core/types/google-maps'

// SVGアイコンコンポーネント
const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

interface NextTripMapProps {
  trip: Trip
  className?: string
}

declare global {
  interface Window { google: typeof google }
}

// 東京のデフォルト座標（DRY原則に従って定数化）
const TOKYO_CENTER = { lat: 35.6762, lng: 139.6503 }

export default function NextTripMap({ trip, className = '' }: NextTripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Google Maps API の読み込み
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true)
        setError(null)
        
        logger.debug('NextTripMap: 地図の初期化を開始')
        
        // 共通ローダーを使用してAPIを読み込み（ユーザー言語を付与）
        await loadGoogleMapsAPI(getUserLanguage(user))
        
        if (!mapRef.current || !window.google) {
          throw new Error('Google Maps APIの読み込みに失敗しました')
        }

        logger.debug('NextTripMap: Google Maps API読み込み完了')

        // Trip目的地を優先、フォールバックは東京（ズームレベルも一貫性を保つ）
        const defaultCenter = trip.destination_place?.geometry?.location || TOKYO_CENTER
        const defaultZoom = trip.destination_place?.geometry?.location ? 11 : 10
        
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: defaultZoom,
          center: defaultCenter,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          clickableIcons: false,
          mapId: '6d1d86ef84ec9c9071f1b459', // Map IDを設定
        })

        logger.debug('NextTripMap: 地図インスタンス作成完了')
        setMap(newMap)
        setLoading(false)
      } catch (error) {
        logger.error('NextTripMap: Google Maps APIの読み込みに失敗しました:', error)
        setError(error instanceof Error ? error.message : '地図の読み込みに失敗しました')
        setLoading(false)
      }
    }

    initializeMap()
  }, [])

  // マーカーを作成・更新する関数
  const updateMapAndMarker = useCallback((center: { lat: number; lng: number }, zoom: number) => {
    if (!map || !trip) return

    // 地図の中心とズームを更新
    map.setCenter(center)
    map.setZoom(zoom)
    
    // 既存のマーカーを削除
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }
    
    // 新しいマーカーを作成（AdvancedMarkerElementを使用）
    let newMarker
    if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
      // AdvancedMarkerElementが利用可能な場合
      newMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position: center,
        map: map,
        title: trip.title,
        content: document.createElement('div')
      })
    } else {
      // フォールバック: 従来のMarker
      newMarker = new window.google.maps.Marker({
        position: center,
        map: map,
        title: trip.title,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(32, 32)
        }
      })
    }
    
    markerRef.current = newMarker
    
    logger.debug('NextTripMap: 地図の中心を更新', center, 'ズーム:', zoom)
  }, [map, trip])

  // trip の情報に基づいて地図を更新
  useEffect(() => {
    if (!map || !trip) return

    logger.debug('NextTripMap: 旅行情報に基づいて地図を更新', trip.destination)

    // デバッグ: tripの座標情報を詳細ログ出力
    console.log('🗺️ NextTripMap trip debug:', {
      tripId: trip.id,
      title: trip.title,
      destination: trip.destination,
      destination_place_id: trip.destination_place_id,
      destination_place: trip.destination_place,
      destination_place_geometry: trip.destination_place?.geometry,
      destination_place_location: trip.destination_place?.geometry?.location,
      hasLocation: !!(trip.destination_place?.geometry?.location)
    })

    // 旅行データの座標のみを使用（ブラウザ現在地には依存しない）
    const center = trip.destination_place?.geometry?.location || TOKYO_CENTER
    const zoom = trip.destination_place?.geometry?.location ? 11 : 10
    logger.debug('NextTripMap: 旅行データの座標を使用（現在地のフォールバック無効化）', center)
    updateMapAndMarker(center, zoom)

  }, [map, trip, updateMapAndMarker])

  return (
    <div className={`relative h-full ${className}`}>
      {loading && (
        <div className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${getZIndexClass('MAIN_CONTENT')}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">{require('@/lib/i18n').t('loading.mapLoading')}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className={`absolute inset-0 bg-red-50 flex items-center justify-center ${getZIndexClass('MAIN_CONTENT')}`}>
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
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* 旅行情報のオーバーレイ */}
      <div className={`absolute top-4 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs ${getZIndexClass('MAIN_CONTENT')}`}>
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-900 mb-1">
            {trip.title}
          </div>
          <div>
            {trip.destination && (
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <PinIcon className="w-3 h-3" color="#ef4444" />
                {trip.destination}
                {trip.destination_place?.address_components && (
                  <span className="ml-1">
                    {getCountryFlag(
                      trip.destination_place.address_components
                        .find((component: any) => component.types.includes('country'))
                        ?.short_name || 'unknown'
                    )}
                  </span>
                )}
              </div>
            )}
            {trip.start_date && trip.end_date && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-blue-500" />
                {(() => {
                  const language = getUserLanguage()
                  const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
                  if (futureTrips.length > 0) {
                    return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date, language)
                  } else if (pastTrips.length > 0) {
                    return dateUtils.formatPastTripDate(trip.start_date, trip.end_date)
                  } else {
                    return dateUtils.formatDateRange(trip.start_date, trip.end_date)
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
