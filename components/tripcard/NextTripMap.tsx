'use client'
import logger from '@/lib/core/logger'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsAPI } from '@/lib/api/google/maps-loader'
import { getZIndexClass } from '@/lib/core/z-index'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { getCountryFlag } from '@/lib/utils/country-flags'
import type { Trip } from '@/lib/core/types'

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
  interface Window {
    google: any
  }
}

export default function NextTripMap({ trip, className = '' }: NextTripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<any>(null)
  const [map, setMap] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Google Maps API の読み込み
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true)
        setError(null)
        
        logger.debug('NextTripMap: 地図の初期化を開始')
        
        // 共通ローダーを使用してAPIを読み込み（環境変数検証はローダー内で実施）
        await loadGoogleMapsAPI()
        
        if (!mapRef.current || !window.google) {
          throw new Error('Google Maps APIの読み込みに失敗しました')
        }

        logger.debug('NextTripMap: Google Maps API読み込み完了')

        // Trip目的地を優先、フォールバックは東京
        const defaultCenter = trip.destination_place?.geometry?.location || { lat: 35.6762, lng: 139.6503 }
        
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 10,
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
  const updateMapAndMarker = (center: { lat: number; lng: number }, zoom: number) => {
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
  }

  // trip の情報に基づいて地図を更新
  useEffect(() => {
    if (!map || !trip) return

    logger.debug('NextTripMap: 旅行情報に基づいて地図を更新', trip.destination)

    // destination_placeの座標を優先使用
    if (trip.destination_place?.geometry?.location) {
      const center = {
        lat: trip.destination_place.geometry.location.lat,
        lng: trip.destination_place.geometry.location.lng
      }
      const zoom = 11
      logger.debug('NextTripMap: destination_placeの座標を使用', center)
      updateMapAndMarker(center, zoom)
    } else {
      // フォールバック: ブラウザの位置情報を取得
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const center = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            const zoom = 10
            logger.debug('NextTripMap: ブラウザの位置情報を使用', center)
            updateMapAndMarker(center, zoom)
          },
          (error) => {
            logger.debug('NextTripMap: 位置情報取得エラー、Trip目的地または東京をデフォルトとして使用', error)
            // エラーの場合はTrip目的地または東京をデフォルトとして使用
            const center = trip.destination_place?.geometry?.location || { lat: 35.6762, lng: 139.6503 }
            const zoom = 10
            updateMapAndMarker(center, zoom)
          }
        )
      } else {
        logger.debug('NextTripMap: 位置情報API非対応、Trip目的地または東京をデフォルトとして使用')
        const center = trip.destination_place?.geometry?.location || { lat: 35.6762, lng: 139.6503 }
        const zoom = 10
        updateMapAndMarker(center, zoom)
      }
    }

  }, [map, trip])

  return (
    <div className={`relative h-full ${className}`}>
      {loading && (
        <div className={`absolute inset-0 bg-gray-100 flex items-center justify-center ${getZIndexClass('MAIN_CONTENT')}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">地図を読み込み中...</p>
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
                  const startDate = typeof trip.start_date === 'string' 
                    ? new Date(trip.start_date) 
                    : trip.start_date instanceof Date 
                      ? trip.start_date 
                      : new Date(trip.start_date.seconds * 1000)
                  const endDate = typeof trip.end_date === 'string' 
                    ? new Date(trip.end_date) 
                    : trip.end_date instanceof Date 
                      ? trip.end_date 
                      : new Date(trip.end_date.seconds * 1000)
                  return `${startDate.toLocaleDateString('ja-JP')} - ${endDate.toLocaleDateString('ja-JP')}`
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
