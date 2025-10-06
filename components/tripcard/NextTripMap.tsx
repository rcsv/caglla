'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { getZIndexClass } from '@/lib/z-index-layers'
import { PinIcon } from '@/components/common/icons/PinIcon'
import type { Trip } from '@/lib/types'

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
        
        console.log('NextTripMap: 地図の初期化を開始')
        
        // APIキーの確認
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
        if (!apiKey) {
          throw new Error('Google Maps APIキーが設定されていません。')
        }
        
        console.log('NextTripMap: APIキー確認済み')
        
        // 共通ローダーを使用してAPIを読み込み
        await loadGoogleMapsAPI()
        
        if (!mapRef.current || !window.google) {
          throw new Error('Google Maps APIの読み込みに失敗しました')
        }

        console.log('NextTripMap: Google Maps API読み込み完了')

        // デフォルトの中心地（東京）
        const defaultCenter = { lat: 35.6762, lng: 139.6503 }
        
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 10,
          center: defaultCenter,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          clickableIcons: false,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || '6d1d86ef84ec9c9071f1b459', // Map IDを設定
        })

        console.log('NextTripMap: 地図インスタンス作成完了')
        setMap(newMap)
        setLoading(false)
      } catch (error) {
        console.error('NextTripMap: Google Maps APIの読み込みに失敗しました:', error)
        setError(error instanceof Error ? error.message : '地図の読み込みに失敗しました')
        setLoading(false)
      }
    }

    initializeMap()
  }, [])

  // trip の情報に基づいて地図を更新
  useEffect(() => {
    if (!map || !trip) return

    console.log('NextTripMap: 旅行情報に基づいて地図を更新', trip.destination)

    // 旅行の目的地に基づいて地図の中心を設定
    let center = { lat: 35.6762, lng: 139.6503 } // デフォルト: 東京
    let zoom = 10

    if (trip.destination) {
      // 目的地に応じて座標を設定
      const destination = trip.destination.toLowerCase()
      
      if (destination.includes('那覇') || destination.includes('沖縄') || destination.includes('okinawa')) {
        center = { lat: 26.2124, lng: 127.6792 } // 那覇市
        zoom = 12
        console.log('NextTripMap: 那覇市に設定')
      } else if (destination.includes('大阪') || destination.includes('osaka')) {
        center = { lat: 34.6937, lng: 135.5023 } // 大阪市
        zoom = 11
      } else if (destination.includes('京都') || destination.includes('kyoto')) {
        center = { lat: 35.0116, lng: 135.7681 } // 京都市
        zoom = 11
      } else if (destination.includes('札幌') || destination.includes('sapporo')) {
        center = { lat: 43.0642, lng: 141.3469 } // 札幌市
        zoom = 11
      } else if (destination.includes('福岡') || destination.includes('fukuoka')) {
        center = { lat: 33.5904, lng: 130.4017 } // 福岡市
        zoom = 11
      } else if (destination.includes('名古屋') || destination.includes('nagoya')) {
        center = { lat: 35.1815, lng: 136.9066 } // 名古屋市
        zoom = 11
      } else if (destination.includes('横浜') || destination.includes('yokohama')) {
        center = { lat: 35.4437, lng: 139.6380 } // 横浜市
        zoom = 11
      } else {
        console.log('NextTripMap: 未対応の目的地、東京をデフォルトとして使用')
      }
    }

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
    
    console.log('NextTripMap: 地図の中心を更新', center, 'ズーム:', zoom)

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
      <div className={`absolute top-4 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs ${getZIndexClass('MAIN_CONTENT', 1)}`}>
        <div className="text-sm text-gray-600">
          <div className="font-medium text-gray-900 mb-1">
            {trip.title}
          </div>
          <div>
            {trip.destination && (
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <PinIcon className="w-3 h-3" color="#ef4444" />
                {trip.destination}
              </div>
            )}
            {trip.start_date && trip.end_date && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-blue-500" />
                {new Date(trip.start_date).toLocaleDateString('ja-JP')} - {new Date(trip.end_date).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
