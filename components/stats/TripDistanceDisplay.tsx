'use client'

import { useState, useEffect, useMemo } from 'react'
import { distanceApiHelpers } from '@/lib/distance-api'
import { dateUtils } from '@/lib/date-utils'
import { Itinerary } from '@/lib/firestore'

interface TripDistanceDisplayProps {
  itineraries: Itinerary[]
  className?: string
}

export default function TripDistanceDisplay({ 
  itineraries, 
  className = '' 
}: TripDistanceDisplayProps) {
  const [distanceData, setDistanceData] = useState<{
    totalDistance: { meters: number; kilometers: number; text: string }
    totalDuration: { seconds: number; minutes: number; hours: number; text: string }
    segments: Array<{ from: string; to: string; distance: any; duration: any }>
    segmentCount: number
    poiCount: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 場所の座標をメモ化して、不要な再計算を防ぐ
  const placesKey = useMemo(() => {
    return itineraries
      .filter(itinerary => itinerary.place_data?.geometry?.location)
      .map(itinerary => `${itinerary.place_data!.geometry!.location!.lat},${itinerary.place_data!.geometry!.location!.lng}`)
      .join('|')
  }, [itineraries])

  useEffect(() => {
    const calculateTotalDistance = async () => {
      // place_dataがあるitineraryのみを抽出
      const placesWithLocation = itineraries
        .filter(itinerary => itinerary.place_data?.geometry?.location)
        .map(itinerary => itinerary.place_data!)

      if (placesWithLocation.length < 2) {
        setDistanceData(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await distanceApiHelpers.calculateTotalDistance(placesWithLocation, 'driving')
        if (result) {
          // POI数を計算（place_dataがあるitineraryの数）
          const poiCount = itineraries.filter(itinerary => 
            itinerary.place_data?.geometry?.location
          ).length
          
          setDistanceData({
            ...result,
            poiCount
          })
        } else {
          setError('距離計算に失敗しました')
        }
      } catch (err) {
        console.error('Error calculating total distance:', err)
        setError('総移動距離の計算に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    calculateTotalDistance()
  }, [placesKey])

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            総移動距離
          </h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span>総移動距離を計算中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            総移動距離
          </h3>
        </div>
        <div className="text-center py-4">
          <div className="text-red-500 text-sm mb-2">
            {error}
          </div>
          <p className="text-gray-500 text-xs">
            距離計算に失敗しました
          </p>
        </div>
      </div>
    )
  }

  if (!distanceData) {
    // place_dataがあるitineraryの数をチェック
    const placesWithLocation = itineraries.filter(itinerary => itinerary.place_data?.geometry?.location)
    
    if (placesWithLocation.length < 2) {
      return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              総移動距離
            </h3>
          </div>
          
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">
              {placesWithLocation.length === 0 
                ? '場所情報が設定されたスケジュールがありません' 
                : '移動距離を計算するには、場所情報が設定されたスケジュールが2つ以上必要です'
              }
            </p>
            <p className="text-gray-500 text-xs mt-2">
              各スケジュールに場所を設定すると、総移動距離が表示されます
            </p>
          </div>
        </div>
      )
    }
    
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          移動情報
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* メイン情報 - 1行レイアウト */}
        <div className="py-3 px-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            {/* 訪問地数 */}
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-blue-600">
                {distanceData.poiCount}
              </div>
              <div className="text-xs text-gray-500">訪問地</div>
            </div>
            
            {/* 区切り線 */}
            <div className="w-px h-8 bg-gray-300 mx-4"></div>
            
            {/* 総距離 */}
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-blue-600">
                {distanceData.totalDistance.text}
              </div>
              <div className="text-xs text-gray-500">総距離</div>
            </div>
            
            {/* 区切り線 */}
            <div className="w-px h-8 bg-gray-300 mx-4"></div>
            
            {/* 総時間 */}
            <div className="text-center flex-1">
              <div className="text-2xl font-bold text-blue-600">
                {dateUtils.formatDurationCompact(distanceData.totalDuration.minutes)}
              </div>
              <div className="text-xs text-gray-500">総時間</div>
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-gray-600 mb-1">平均距離</div>
            <div className="font-medium">
              {distanceData.segmentCount > 0 ? Math.round(distanceData.totalDistance.kilometers / distanceData.segmentCount * 10) / 10 : 0}km/区間
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-gray-600 mb-1">平均時間</div>
            <div className="font-medium">
              {distanceData.segmentCount > 0 ? Math.round(distanceData.totalDuration.minutes / distanceData.segmentCount) : 0}分/区間
            </div>
          </div>
        </div>

        {/* ヒント */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 各Venue間の詳細な距離・時間はスケジュール内で確認できます
          </p>
        </div>
      </div>
    </div>
  )
}



