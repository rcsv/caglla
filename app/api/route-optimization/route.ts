import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
const GOOGLE_DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json'

export interface RouteOptimizationRequest {
  origin: string | { lat: number; lng: number }
  destination: string | { lat: number; lng: number }
  waypoints: Array<string | { lat: number; lng: number }>
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'
  optimizeWaypoints?: boolean
  avoidHighways?: boolean
  avoidTolls?: boolean
  avoidFerries?: boolean
}

export interface RouteOptimizationResponse {
  routes: any[]
  status: string
  optimizedOrder?: number[]
  totalDistance?: { meters: number; text: string }
  totalDuration?: { seconds: number; text: string }
  costEstimate?: {
    apiCalls: number
    estimatedCost: number
    currency: string
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    const body: RouteOptimizationRequest = await request.json()
    
    if (!body.origin || !body.destination || !body.waypoints) {
      return NextResponse.json(
        { error: 'Origin, destination, and waypoints are required' },
        { status: 400 }
      )
    }

    // 座標を文字列に変換するヘルパー関数
    const formatLocation = (location: string | { lat: number; lng: number }): string => {
      if (typeof location === 'string') {
        return location
      }
      return `${location.lat},${location.lng}`
    }

    // waypointの最適化戦略を決定
    const waypointCount = body.waypoints.length
    const shouldOptimize = body.optimizeWaypoints !== false && waypointCount > 1

    // Google Directions APIのリクエストパラメータを構築
    const params = new URLSearchParams({
      origin: formatLocation(body.origin),
      destination: formatLocation(body.destination),
      waypoints: body.waypoints.map(formatLocation).join('|'),
      travelMode: body.travelMode || 'DRIVING',
      language: 'ja',
      region: 'jp',
      key: GOOGLE_PLACES_API_KEY
    })

    // 最適化オプションを追加
    if (shouldOptimize) {
      params.append('optimizeWaypoints', 'true')
    }

    // 回避オプションを追加
    const avoidOptions = []
    if (body.avoidHighways) avoidOptions.push('highways')
    if (body.avoidTolls) avoidOptions.push('tolls')
    if (body.avoidFerries) avoidOptions.push('ferries')
    if (avoidOptions.length > 0) {
      params.append('avoid', avoidOptions.join('|'))
    }

    logger.debug('Route optimization request', {
      origin: formatLocation(body.origin),
      destination: formatLocation(body.destination),
      waypointCount,
      shouldOptimize,
      avoidOptions
    })

    const response = await fetch(`${GOOGLE_DIRECTIONS_API_URL}?${params}`, {
      signal: AbortSignal.timeout(15000) // 15秒でタイムアウト
    })

    if (!response.ok) {
      throw new Error(`Google Directions API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${data.status}`)
    }

    // レスポンスを処理して最適化された情報を追加
    const optimizedResponse: RouteOptimizationResponse = {
      routes: data.routes,
      status: data.status,
      optimizedOrder: data.routes[0]?.waypoint_order,
      totalDistance: data.routes[0]?.legs?.reduce((total: any, leg: any) => ({
        meters: total.meters + leg.distance.value,
        text: `${Math.round((total.meters + leg.distance.value) / 1000 * 10) / 10} km`
      }), { meters: 0, text: '0 km' }),
      totalDuration: data.routes[0]?.legs?.reduce((total: any, leg: any) => ({
        seconds: total.seconds + leg.duration.value,
        text: `${Math.round((total.seconds + leg.duration.value) / 60)} 分`
      }), { seconds: 0, text: '0 分' }),
      costEstimate: {
        apiCalls: 1,
        estimatedCost: 0.005, // Google Directions API料金: $0.005 per request
        currency: 'USD'
      }
    }

    return NextResponse.json(optimizedResponse)
  } catch (error) {
    logger.error('Error in route optimization API', error)
    return NextResponse.json(
      { error: 'Failed to optimize route' },
      { status: 500 }
    )
  }
}

// ルート最適化のコスト見積もりを提供するGETエンドポイント
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const waypointCount = parseInt(searchParams.get('waypoints') || '0')
    
    if (waypointCount < 0) {
      return NextResponse.json(
        { error: 'Waypoint count must be non-negative' },
        { status: 400 }
      )
    }

    // Google Directions API料金計算
    const requestsNeeded = Math.ceil(waypointCount / 23) // 1リクエストあたり最大23のwaypoint
    const estimatedCostValue = requestsNeeded * 0.005 // $0.005 per request

    const costEstimate: {
      waypointCount: number
      requestsNeeded: number
      estimatedCost: string
      currency: string
      suggestions: string[]
    } = {
      waypointCount,
      requestsNeeded,
      estimatedCost: `$${estimatedCostValue.toFixed(3)}`,
      currency: 'USD',
      suggestions: []
    }

    // コスト削減の提案を追加
    if (waypointCount > 10) {
      costEstimate.suggestions.push('多数の地点があります。日程別に分けて表示すると料金を削減できます。')
    }
    
    if (waypointCount > 20) {
      costEstimate.suggestions.push('20地点を超えています。ルート絞り込み機能の使用を推奨します。')
    }

    return NextResponse.json(costEstimate)
  } catch (error) {
    logger.error('Error in cost estimation API', error)
    return NextResponse.json(
      { error: 'Failed to estimate cost' },
      { status: 500 }
    )
  }
}
