'use client'

import { useState, useEffect, useMemo } from 'react'
import { distanceApiHelpers, DistanceMatrixResult } from '@/lib/distance-api'
import { PlaceData } from '@/lib/firestore'

interface VenueDistanceProps {
  fromPlace?: PlaceData | null
  toPlace?: PlaceData | null
  mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
  className?: string
  onInsertVenue?: () => void // 挿入ボタンのコールバック
  showInsertButton?: boolean // 挿入ボタンを表示するかどうか
}

export default function VenueDistance({ 
  fromPlace, 
  toPlace, 
  mode = 'driving',
  className = '',
  onInsertVenue,
  showInsertButton = false
}: VenueDistanceProps) {
  const [distanceInfo, setDistanceInfo] = useState<DistanceMatrixResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 場所の座標をメモ化して、不要な再計算を防ぐ
  const placesKey = useMemo(() => {
    if (!fromPlace?.geometry?.location || !toPlace?.geometry?.location) {
      return null
    }
    return `${fromPlace.geometry.location.lat},${fromPlace.geometry.location.lng}|${toPlace.geometry.location.lat},${toPlace.geometry.location.lng}|${mode}`
  }, [fromPlace?.geometry?.location, toPlace?.geometry?.location, mode])

  useEffect(() => {
    const calculateDistance = async () => {
      if (!fromPlace?.geometry?.location || !toPlace?.geometry?.location) {
        console.log('Missing place data:', { fromPlace, toPlace })
        setDistanceInfo(null)
        return
      }

      // 同じ場所の場合は距離を表示しない
      if (fromPlace.place_id === toPlace.place_id) {
        setDistanceInfo(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('Calculating distance between:', fromPlace.name, 'and', toPlace.name)
        const result = await distanceApiHelpers.calculateDistance(
          fromPlace.geometry.location,
          toPlace.geometry.location,
          mode
        )
        
        console.log('Distance result:', result)
        setDistanceInfo(result)
      } catch (err) {
        console.error('Error calculating distance:', err)
        setError('距離の計算に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    calculateDistance()
  }, [placesKey])

  if (!fromPlace || !toPlace) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>計算中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className="text-sm text-red-500">
          {error}
        </div>
      </div>
    )
  }

  if (!distanceInfo) {
    return null
  }

  return (
    <div className={`relative flex items-center justify-center py-4 ${className}`}>
      {/* Gitタイムライン風の縦線 */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>
      
      {/* 距離・時間表示と挿入ボタンを横並びに配置 */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* 距離・時間表示 */}
        <div className="bg-white border-2 border-gray-300 rounded-full p-2 shadow-sm">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-xs">
              {distanceApiHelpers.formatDistanceAndDuration(distanceInfo)}
            </span>
            {mode === 'driving' && (
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {mode === 'walking' && (
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* 挿入ボタン */}
        {showInsertButton && onInsertVenue && (
          <button
            onClick={onInsertVenue}
            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
            title="間にVenueを追加"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12S21.1 14 20 14H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V14H4C2.9 14 2 13.1 2 12S2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
              <path 
                d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" 
                fill="white"
                opacity="0.8"
                transform="scale(0.3) translate(20, 20)"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
