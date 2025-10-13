import { NextRequest, NextResponse } from 'next/server'
import { venueAggregator } from '@/lib/api/venue-aggregator'
import { PlaceData } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * 複数のVenue API（Google Places、TripAdvisor、Foursquare）から
 * 集約データを取得するサーバーサイドプロキシエンドポイント
 * 
 * CORS問題を回避し、APIキーをクライアント側に露出しないために使用
 */
export async function POST(req: NextRequest) {
  try {
    const googlePlaceData: PlaceData = await req.json()

    if (!googlePlaceData || !googlePlaceData.place_id) {
      return NextResponse.json(
        { error: 'Google Place data with place_id is required' },
        { status: 400 }
      )
    }

    logger.debug('🔄 Aggregating venue data for place:', googlePlaceData.place_id)
    logger.debug('📍 Place info:', {
      name: googlePlaceData.name,
      lat: googlePlaceData.geometry?.location?.lat,
      lng: googlePlaceData.geometry?.location?.lng
    })

    // 環境変数の確認（デバッグ用）
    logger.debug('🔑 API Keys status:', {
      tripAdvisor: !!process.env.TRIPADVISOR_API_KEY,
      foursquare: !!process.env.FOURSQUARE_API_KEY,
      tripAdvisorLength: process.env.TRIPADVISOR_API_KEY?.length || 0,
      foursquareLength: process.env.FOURSQUARE_API_KEY?.length || 0
    })

    // 集約データを取得
    const aggregatedData = await venueAggregator.getAggregatedVenueData(googlePlaceData)
    
    // レビューを統合
    const unifiedReviews = venueAggregator.unifyReviews(aggregatedData)

    logger.debug('✅ Venue data aggregated successfully', {
      tripAdvisor: !!aggregatedData.tripAdvisor.details,
      foursquare: !!aggregatedData.foursquare.details,
      totalReviews: unifiedReviews.length,
      tripAdvisorData: aggregatedData.tripAdvisor.details ? {
        locationId: aggregatedData.tripAdvisor.details.location_id,
        name: aggregatedData.tripAdvisor.details.name,
        rating: aggregatedData.tripAdvisor.details.rating,
        reviewCount: aggregatedData.tripAdvisor.details.num_reviews
      } : null,
      foursquareData: aggregatedData.foursquare.details ? {
        fsqId: aggregatedData.foursquare.details.fsq_id,
        name: aggregatedData.foursquare.details.name,
        rating: aggregatedData.foursquare.details.rating
      } : null
    })

    return NextResponse.json({
      aggregatedData,
      unifiedReviews
    })

  } catch (error) {
    logger.error('❌ Venue aggregation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to aggregate venue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

