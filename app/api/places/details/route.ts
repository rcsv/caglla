import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { isSupportedLanguage, DEFAULT_LANGUAGE } from '@/lib/utils/language'
import { getPlaceFromCache, savePlaceToCache, isCacheStale } from '@/lib/api/places-cache'
import type { SupportedLanguage, PlaceDetailsResult } from '@/lib/core/types'

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
// 新Places API (v1) のエンドポイント
const GOOGLE_PLACES_API_URL = 'https://places.googleapis.com/v1/places'

// Soft TTL: 14日（ミリ秒）
// Google Places API利用規約: すべてのデータは30日以内のキャッシュのみ許可
// 14日でバックグラウンド更新、30日で自動削除
const SOFT_TTL_MS = 14 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 500 }
      )
    }

    const { placeId, language } = await request.json()
    
    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      )
    }

    // 言語バリデーション
    const validLanguage: SupportedLanguage = language && isSupportedLanguage(language) 
      ? language 
      : DEFAULT_LANGUAGE

    logger.debug('Getting place details', { placeId, language: validLanguage })

    // 1. キャッシュを確認
    const cached = await getPlaceFromCache(placeId, validLanguage)
    
    if (cached) {
      // キャッシュヒット
      const isStale = isCacheStale(cached, SOFT_TTL_MS)
      
      if (isStale) {
        // Soft TTL: 古いキャッシュだが即座に返し、バックグラウンドで更新
        logger.info('Cache hit but stale, returning cached data and refreshing in background', {
          placeId,
          language: validLanguage
        })
        
        // バックグラウンド更新（非同期、結果を待たない）
        refreshPlaceInBackground(placeId, validLanguage).catch(err => {
          logger.warn('Background refresh failed:', err)
        })
      } else {
        logger.info('Cache hit (fresh)', { placeId, language: validLanguage })
      }
      
      // 旧API形式に変換して返却
      return NextResponse.json({
        status: 'OK',
        result: cached
      })
    }

    // 2. キャッシュミス：APIから取得
    logger.info('Cache miss, fetching from API', { placeId, language: validLanguage })
    const placeData = await fetchPlaceDetailsFromAPI(placeId, validLanguage)
    
    // 3. キャッシュに保存
    try {
      await savePlaceToCache(placeData, validLanguage)
    } catch (cacheError) {
      // キャッシュ保存失敗は致命的ではない
      logger.warn('Failed to save to cache:', cacheError)
    }
    
    return NextResponse.json({
      status: 'OK',
      result: placeData
    })
  } catch (error) {
    logger.error('Error in places details proxy:', error)
    return NextResponse.json(
      { error: 'Failed to get place details' },
      { status: 500 }
    )
  }
}

/**
 * Google Places APIから場所詳細を取得
 */
async function fetchPlaceDetailsFromAPI(placeId: string, language: SupportedLanguage) {

    // 新Places API (v1) フィールドマスク定義
    // Basic Data（無料）: id, displayName, formattedAddress, location, viewport, addressComponents, types, businessStatus, photos, googleMapsUri, iconBackgroundColor
    // Contact Data（$3.00/1,000件）: nationalPhoneNumber, internationalPhoneNumber, websiteUri, regularOpeningHours
    // Atmosphere Data（$5.00/1,000件）: rating, userRatingCount, priceLevel, editorialSummary, reviews
    const fieldMask = [
      // Basic Data（無料）
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'addressComponents', // 国コード取得のため追加
      'types',
      'businessStatus',
      'photos',
      'googleMapsUri',
      'shortFormattedAddress', // vicinity の代わり
      // Contact Data（$3.00/1,000件）
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'websiteUri',
      'regularOpeningHours',
      // Atmosphere Data（$5.00/1,000件）
      'rating',
      'userRatingCount',
      'priceLevel',
      'editorialSummary',
      'reviews'
    ].join(',')

  // 新Places API (v1) を呼び出し
  const response = await fetch(
    `${GOOGLE_PLACES_API_URL}/${placeId}?languageCode=${language}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': fieldMask,
        'Accept-Language': language
      }
    }
  )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Google Places API error:', errorData)
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
    // 🔍 デバッグ: 新Places API v1からの完全なレスポンスをログ出力
    logger.debug('================================================')
    logger.debug('📦 新Places API (v1) レスポンス全体:')
    logger.debug(JSON.stringify(data, null, 2))
    logger.debug('================================================')
    
  // 旧APIとの互換性のため、レスポンス形式を変換
  const placeDetails: PlaceDetailsResult = {
        // 新API → 旧API フィールドマッピング
        place_id: data.id?.replace('places/', ''), // "places/ChIJ..." → "ChIJ..."
        name: data.displayName?.text || data.displayName || data.name,
        formatted_address: data.formattedAddress,
        // geometry変換（必須フィールド）
        geometry: {
          location: {
            lat: data.location?.latitude || 0,
            lng: data.location?.longitude || 0
          }
        },
        vicinity: data.shortFormattedAddress,
        business_status: data.businessStatus,
        types: data.types,
        url: data.googleMapsUri,
        icon: `https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/geocode-71.png`, // デフォルトアイコン
        // addressComponents変換
        address_components: data.addressComponents?.map((comp: any) => ({
          long_name: comp.longText,
          short_name: comp.shortText,
          types: comp.types
        })),
        // photos変換（新API v1では photo.name をそのまま使用）
        photos: data.photos?.map((photo: any) => ({
          photo_reference: photo.name, // "places/ChIJ.../photos/XXX" 形式をそのまま保存
          height: photo.heightPx,
          width: photo.widthPx
        })),
        // Contact Data
        formatted_phone_number: data.nationalPhoneNumber,
        international_phone_number: data.internationalPhoneNumber,
        website: data.websiteUri,
        // opening_hours変換
        opening_hours: data.regularOpeningHours ? {
          open_now: data.regularOpeningHours.openNow,
          weekday_text: data.regularOpeningHours.weekdayDescriptions
        } : undefined,
        // Atmosphere Data
        rating: data.rating,
        user_ratings_total: data.userRatingCount,
        price_level: data.priceLevel ? (() => {
          const priceLevels = ['FREE', 'INEXPENSIVE', 'MODERATE', 'EXPENSIVE', 'VERY_EXPENSIVE']
          const index = priceLevels.indexOf(data.priceLevel)
          return index >= 0 ? index : undefined
        })() : undefined,
        editorial_summary: data.editorialSummary?.text ? {
          overview: data.editorialSummary.text
        } : (data.editorialSummary?.overview ? {
          overview: data.editorialSummary.overview
        } : undefined),
    // reviews変換
    reviews: data.reviews?.map((review: any) => ({
      author_name: review.authorAttribution?.displayName || review.author_name,
      rating: review.rating,
      text: review.text?.text || review.text || '',
      time: review.publishTime ? Math.floor(new Date(review.publishTime).getTime() / 1000) : (review.time || 0),
      relative_time_description: review.relativePublishTimeDescription || review.relative_time_description
    }))
  }
  
  return placeDetails
}

/**
 * バックグラウンドで場所データを更新
 */
async function refreshPlaceInBackground(placeId: string, language: SupportedLanguage): Promise<void> {
  try {
    logger.debug('Refreshing place in background', { placeId, language })
    const placeData = await fetchPlaceDetailsFromAPI(placeId, language)
    await savePlaceToCache(placeData, language)
    logger.info('Background refresh completed', { placeId, language })
  } catch (error) {
    logger.error('Background refresh failed:', error)
    throw error
  }
}
