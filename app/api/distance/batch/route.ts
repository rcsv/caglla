import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'
import type { PlaceData } from '@/lib/core/types'
import { requireGooglePlacesApiKey, withExternalApiErrorHandler } from '@/lib/api/external-api-helpers'

const GOOGLE_DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json'

export async function POST(request: NextRequest) {
  try {
    // API Keyの取得と検証
    const apiKeyResult = requireGooglePlacesApiKey()
    if (apiKeyResult instanceof NextResponse) {
      return apiKeyResult
    }
    const GOOGLE_PLACES_API_KEY = apiKeyResult

    const body = await parseRequestBody<{
      places?: PlaceData[]
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit'
    }>(request)
    const { places, mode = 'driving' } = body
    
    if (!places || places.length < 2) {
      return badRequest('At least 2 places are required')
    }

    // 連続する地点間の距離を計算
    const origins: string[] = []
    const destinations: string[] = []
    
    for (let i = 0; i < places.length - 1; i++) {
      const origin = places[i]
      const destination = places[i + 1]
      
      if (origin.geometry?.location && destination.geometry?.location) {
        origins.push(`${origin.geometry.location.lat},${origin.geometry.location.lng}`)
        destinations.push(`${destination.geometry.location.lat},${destination.geometry.location.lng}`)
      }
    }

    if (origins.length === 0) {
      return badRequest('No valid place coordinates found')
    }

    // Distance Matrix APIを呼び出し（エラーハンドリング付き）
    const data = await withExternalApiErrorHandler(
      async () => {
        const params = new URLSearchParams({
          origins: origins.join('|'),
          destinations: destinations.join('|'),
          mode: mode,
          language: 'ja',
          region: 'jp',
          key: GOOGLE_PLACES_API_KEY
        })

        const response = await fetch(`${GOOGLE_DISTANCE_MATRIX_API_URL}?${params}`, {
          signal: AbortSignal.timeout(15000) // 15秒でタイムアウト（バッチ処理は時間がかかるため）
        })

        if (!response.ok) {
          throw new Error(`Google Distance Matrix API error: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.status !== 'OK') {
          throw new Error(`Google Distance Matrix API error: ${result.status}`)
        }

        return result
      },
      'Google Distance Matrix API (Batch)',
      '/api/distance/batch'
    )

    if (data instanceof NextResponse) {
      return data
    }

    // 結果を処理して総距離と総時間を計算
    let totalDistance = 0 // meters
    let totalDuration = 0 // seconds
    const segments: Array<{
      from: string
      to: string
      distance: { text: string; value: number }
      duration: { text: string; value: number }
    }> = []

    data.rows.forEach((row: any, rowIndex: number) => {
      row.elements.forEach((element: any, elementIndex: number) => {
        if (element.status === 'OK') {
          totalDistance += element.distance.value
          totalDuration += element.duration.value
          
          segments.push({
            from: places[rowIndex].name,
            to: places[rowIndex + 1].name,
            distance: element.distance,
            duration: element.duration
          })
        } else {
          // 距離計算に失敗した区間をログに記録
          const fromPlace = places[rowIndex]
          const toPlace = places[rowIndex + 1]
          
          logger.warn('Distance calculation failed for segment', {
            rowIndex,
            elementIndex,
            from: fromPlace?.name || 'Unknown',
            to: toPlace?.name || 'Unknown',
            from_coords: fromPlace?.geometry?.location ? 
              `${fromPlace.geometry.location.lat},${fromPlace.geometry.location.lng}` : 'No coordinates',
            to_coords: toPlace?.geometry?.location ? 
              `${toPlace.geometry.location.lat},${toPlace.geometry.location.lng}` : 'No coordinates',
            status: element.status,
            error_message: element.error_message || 'Unknown error'
          })
          
          // ZERO_RESULTSの場合は直線距離を計算してフォールバック
          if (element.status === 'ZERO_RESULTS' && 
              fromPlace?.geometry?.location && 
              toPlace?.geometry?.location) {
            
            const fallbackDistance = calculateStraightLineDistance(
              fromPlace.geometry.location,
              toPlace.geometry.location
            )
            
            logger.debug('Using fallback straight-line distance', { distanceKm: fallbackDistance.toFixed(2) })
            
            // フォールバック距離を追加（徒歩時間を推定）
            const estimatedWalkingTime = Math.round(fallbackDistance * 12) // 時速5kmで計算
            totalDistance += fallbackDistance * 1000 // kmをmに変換
            totalDuration += estimatedWalkingTime * 60 // 分を秒に変換
            
            segments.push({
              from: fromPlace.name,
              to: toPlace.name,
              distance: {
                text: `${fallbackDistance.toFixed(2)}km (estimated)`,
                value: fallbackDistance * 1000
              },
              duration: {
                text: `${estimatedWalkingTime}min (estimated)`,
                value: estimatedWalkingTime * 60
              }
            })
          }
        }
      })
    })

    // 成功した区間がない場合はエラーを返す
    if (segments.length === 0) {
      return badRequest('All distance calculations failed')
    }

    return NextResponse.json({
      totalDistance: {
        meters: totalDistance,
        kilometers: Math.round(totalDistance / 1000 * 10) / 10,
        text: `${Math.round(totalDistance / 1000 * 10) / 10}km`
      },
      totalDuration: {
        seconds: totalDuration,
        minutes: Math.round(totalDuration / 60),
        hours: Math.floor(totalDuration / 3600),
        text: formatDuration(totalDuration)
      },
      segments,
      segmentCount: segments.length
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/distance/batch'
    )
  }
}

// 時間をフォーマットする関数（サーバー側は英語表記で統一）
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  
  if (hours >= 1) {
    if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h${minutes}m`
    }
  } else {
    return `${minutes}min`
  }
}

// 2点間の直線距離を計算する関数（ハヴァサイン公式）
function calculateStraightLineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371 // 地球の半径（km）
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

// 度をラジアンに変換する関数
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
