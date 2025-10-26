'use client'
import logger from '@/lib/core/logger'

import { useEffect, useRef, useState } from 'react'
import { CountryGroup } from '@/lib/travel/country/utils'
import { loadGoogleMapsAPI } from '@/lib/api/google/maps-loader'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'

// Google Maps APIの型定義
declare global { interface Window { google: typeof google } }
import { getCountryCoordinate } from '@/lib/travel/country/coordinates'

interface CountryMapProps {
  countryGroups: CountryGroup[]
  className?: string
}

export default function CountryMap({ countryGroups, className = '' }: CountryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Array<google.maps.marker.AdvancedMarkerElement>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true)
        setError(null)

        // 共通ローダーを使用してAPIを読み込み（ユーザー言語を付与）
        await loadGoogleMapsAPI(getUserLanguage(user))

        if (!mapRef.current) return

        // 地図を初期化
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 2,
          center: { lat: 20, lng: 0 }, // 世界地図の中心
          // mapTypeId はMapIDと併用しない
          mapId: '6d1d86ef84ec9c9071f1b459', // Google Maps Platformで作成したMapID
          // すべてのコントロールを無効化
          disableDefaultUI: true, // デフォルトのUIを無効化
          zoomControl: false, // ズームコントロールも無効化
          mapTypeControl: false, // 地図タイプコントロールを無効化
          scaleControl: false, // スケールコントロールを無効化
          streetViewControl: false, // ストリートビューコントロールを無効化
          rotateControl: false, // 回転コントロールを無効化
          fullscreenControl: false // フルスクリーンコントロールを無効化
          // MapID使用時はstylesプロパティを設定しない
          // スタイルはGoogle Cloud Consoleで管理
        })

        setMap(newMap)

        // 既存のマーカーをクリア
        markers.forEach(marker => marker.setMap(null))

        // 新しいマーカーを作成
        const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []

        countryGroups.forEach((group, index) => {
          const coordinate = getCountryCoordinate(group.countryCode)
          
          logger.debug(`Processing country: ${group.countryCode} (${group.countryNameJa})`, coordinate)
          
          if (coordinate) {
            // マーカーの色を旅行回数に応じて変更
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
            const colorIndex = Math.min(index, colors.length - 1)
            
            logger.debug(`Creating marker for ${group.countryNameJa} at ${coordinate.lat}, ${coordinate.lng}`)
            
            // カスタムマーカー要素を作成
            const markerElement = document.createElement('div')
            markerElement.style.width = `${8 + (group.tripCount * 2)}px`
            markerElement.style.height = `${8 + (group.tripCount * 2)}px`
            markerElement.style.borderRadius = '50%'
            markerElement.style.backgroundColor = colors[colorIndex]
            markerElement.style.border = '2px solid #ffffff'
            markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
            markerElement.style.cursor = 'pointer'
            markerElement.title = `${group.countryNameJa} (${group.tripCount}回)`
            
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { lat: coordinate.lat, lng: coordinate.lng },
              map: newMap,
              content: markerElement
            })

            // 情報ウィンドウを作成
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-semibold text-gray-800">${group.countryNameJa}</h3>
                  <p class="text-sm text-gray-600">${group.countryName}</p>
                  <p class="text-lg font-bold text-blue-600">${group.tripCount}回の旅行</p>
                </div>
              `
            })

            // マーカークリック時に情報ウィンドウを表示
            marker.addListener('click', () => {
              // infoWindow.open(newMap, marker)
            })

            newMarkers.push(marker)
          } else {
            logger.warn(`No coordinate found for country: ${group.countryCode}`)
          }
        })

        setMarkers(newMarkers)

        // すべてのマーカーが表示されるように地図の境界を調整
        if (newMarkers.length > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          newMarkers.forEach(marker => {
            const pos = marker.getPosition?.()
            if (pos) bounds.extend(pos)
          })
          newMap.fitBounds(bounds)
          
          // ズームレベルが大きすぎる場合は制限
          window.google.maps.event.addListenerOnce(newMap, 'bounds_changed', () => {
            if (newMap.getZoom() && newMap.getZoom()! > 10) {
              newMap.setZoom(10)
            }
          })
        }

      } catch (err) {
        logger.error('Error initializing map:', err)
        setError('地図の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (countryGroups.length > 0) {
      initMap()
    }
  }, [countryGroups, markers])

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">旅行マップ</h3>
        <div className="text-red-600 text-center py-8">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">旅行マップ</h3>
        <div className="text-sm text-gray-500">
          {countryGroups.length}カ国
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-80 rounded-lg border border-gray-200"
        style={{ minHeight: '320px' }}
      />
      
      {/* 凡例 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-2">凡例:</div>
        <div className="flex flex-wrap gap-2">
          {countryGroups.slice(0, 6).map((group, index) => {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
            const colorIndex = Math.min(index, colors.length - 1)
            
            return (
              <div key={group.countryCode} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[colorIndex] }}
                />
                <span className="text-xs text-gray-600">
                  {group.countryNameJa} ({group.tripCount}回)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
