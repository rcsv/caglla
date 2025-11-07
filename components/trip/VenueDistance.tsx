'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useMemo } from 'react'
import { distanceApiHelpers, DistanceMatrixResult } from '@/lib/api/google/distance'
import { PlaceData } from '@/lib/core/types'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import Loading from '@/components/common/Loading'
import { t } from '@/lib/i18n'
import { useUserData } from '@/lib/contexts/user-data'
import { getUserUnitSystem } from '@/lib/utils/unit-system'
import { convertDistance } from '@/lib/utils/unit-conversion'
import { buildGoogleTransitUrl } from '@/lib/utils/maps'

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
  const { userData } = useUserData()
  const unitSystem = getUserUnitSystem(userData)
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
      logger.debug('📏 VenueDistance: Starting calculation')
      logger.debug('  fromPlace:', fromPlace)
      logger.debug('  toPlace:', toPlace)
      logger.debug('  fromPlace.geometry:', fromPlace?.geometry)
      logger.debug('  toPlace.geometry:', toPlace?.geometry)
      
      if (!fromPlace?.geometry?.location || !toPlace?.geometry?.location) {
        logger.debug('❌ Missing place data or geometry:', { 
          fromPlace: !!fromPlace, 
          toPlace: !!toPlace,
          fromGeometry: !!fromPlace?.geometry,
          toGeometry: !!toPlace?.geometry,
          fromLocation: !!fromPlace?.geometry?.location,
          toLocation: !!toPlace?.geometry?.location
        })
        setDistanceInfo(null)
        return
      }

      // 同じ場所の場合は距離を表示しない
      if (fromPlace.place_id === toPlace.place_id) {
        logger.debug('⚠️ Same place, skipping distance calculation')
        setDistanceInfo(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        logger.debug('🔄 Calculating distance between:', fromPlace.name, 'and', toPlace.name)
        logger.debug('  From coords:', fromPlace.geometry.location)
        logger.debug('  To coords:', toPlace.geometry.location)
        
        const result = await distanceApiHelpers.calculateDistance(
          fromPlace.geometry.location,
          toPlace.geometry.location,
          mode
        )
        
        logger.debug('✅ Distance result:', result)
        setDistanceInfo(result)
      } catch (err) {
        logger.error('❌ Error calculating distance:', err)
        setError(t('venueDistance.calculationFailed'))
      } finally {
        setIsLoading(false)
      }
    }

    calculateDistance()
  }, [placesKey, fromPlace, toPlace, mode])

  if (!fromPlace || !toPlace) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <Loading inline size="sm" color="blue" message={t('loading.calculating')} />
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

  // 単位系に応じて距離を変換
  const distanceKm = distanceApiHelpers.metersToKm(distanceInfo.distance.value)
  const distanceInfo_converted = convertDistance(distanceKm, unitSystem)
  const durationText = distanceApiHelpers.formatDuration(distanceInfo.duration.value)
  const transitUrl = buildGoogleTransitUrl(fromPlace, toPlace)
  const isLinkEnabled = Boolean(transitUrl)

  const wrapperBaseClass = 'bg-white border-2 border-gray-300 rounded-full p-2 shadow-sm transition-colors'
  const wrapperInteractiveClass = isLinkEnabled
    ? ' hover:border-blue-400 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400'
    : ' opacity-60 cursor-not-allowed'
  const wrapperClassName = `${wrapperBaseClass}${wrapperInteractiveClass ? ` ${wrapperInteractiveClass}` : ''}`

  const distanceContent = (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="font-medium text-xs">
        {distanceInfo_converted.formatted} / {durationText}
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
  )

  return (
    <div className={`relative flex items-center justify-center py-4 ${className}`}>
      {/* Gitタイムライン風の縦線 */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300"></div>
      
      {/* 距離・時間表示と挿入ボタンを横並びに配置 */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* 距離・時間表示 */}
        {isLinkEnabled ? (
          <a
            href={transitUrl as string}
            target="_blank"
            rel="noopener noreferrer"
            className={wrapperClassName}
            title={t('distance.openTransit')}
          >
            {distanceContent}
          </a>
        ) : (
          <div
            className={wrapperClassName}
            aria-disabled="true"
            title={t('distance.openTransitUnavailable')}
          >
            {distanceContent}
          </div>
        )}
        
        {/* 挿入ボタン */}
        {showInsertButton && onInsertVenue && (
          <button
            onClick={onInsertVenue}
            className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm"
            title={t('schedule.addVenueBetween')}
          >
            <IconRenderer 
              iconName="plus" 
              className="w-4 h-4" 
              color="currentColor"
            />
          </button>
        )}
      </div>
    </div>
  )
}
