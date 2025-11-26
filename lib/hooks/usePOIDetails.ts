import { useState, useEffect, useCallback, useRef } from 'react'
import logger from '@/lib/core/logger'
import { placesApiHelpers } from '@/lib/api/google/places'
import { getCachedPlace, placesCacheManager } from '@/lib/travel/places-cache'
import { getCachedPlaceImage, CachedImageInfo } from '@/lib/storage/image-cache'
import type { AggregatedVenueData, UnifiedReview } from '@/lib/api/venue-aggregator'
import type { PlaceData } from '@/lib/core/types'
import type { SupportedLanguage } from '@/lib/i18n'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 1日（24時間）

interface POICache {
  placeDetails: any
  aggregatedData: AggregatedVenueData | null
  unifiedReviews: UnifiedReview[]
  timestamp: number
}

export function usePOIDetails(
  placeId: string | undefined,
  placeData: PlaceData | undefined,
  language: SupportedLanguage,
  onClose?: () => void
) {
  const [placeDetails, setPlaceDetails] = useState<any>(null)
  const [aggregatedData, setAggregatedData] = useState<AggregatedVenueData | null>(null)
  const [unifiedReviews, setUnifiedReviews] = useState<UnifiedReview[]>([])
  const [cachedImages, setCachedImages] = useState<CachedImageInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  // POIキャッシュ（TTL付き）
  const poiCacheRef = useRef(new Map<string, POICache>())

  const cacheImages = useCallback(
    async (photos: any[]) => {
      if (!photos || photos.length === 0) return

      setImageLoading(true)
      try {
        const imagePromises = photos.map(async (photo) => {
          const googlePhotoUrl = placesApiHelpers.getPhotoUrl(photo.photo_reference, 300)
          return await getCachedPlaceImage(photo.photo_reference, googlePhotoUrl, {
            width: 300,
            height: 300,
            quality: 80,
          })
        })

        const cachedImageResults = await Promise.all(imagePromises)
        setCachedImages(cachedImageResults)

        logger.debug('POIDialog: 画像キャッシュ完了', {
          total: cachedImageResults.length,
          cached: cachedImageResults.filter((img) => img.cached).length,
          new: cachedImageResults.filter((img) => !img.cached).length,
        })
      } catch (error) {
        logger.error('画像キャッシュエラー', error)
      } finally {
        setImageLoading(false)
      }
    },
    []
  )

  const fetchPlaceDetails = useCallback(async () => {
    if (!placeId) return

    // TTLキャッシュチェック（5分間有効）
    const cached = poiCacheRef.current.get(placeId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('✅ Using TTL cached POI data', { placeId })
      setPlaceDetails(cached.placeDetails)
      setAggregatedData(cached.aggregatedData)
      setUnifiedReviews(cached.unifiedReviews)
      // キャッシュされた画像も復元
      if (cached.placeDetails?.photos && cached.placeDetails.photos.length > 0) {
        await cacheImages(cached.placeDetails.photos)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      // placeDataがあり、vicinityが存在する場合はそれを使用
      if (placeData) {
        if (placeData.vicinity) {
          logger.debug('✅ Using place_data with vicinity from Itinerary')
          setPlaceDetails(placeData)
          
          // placeDataのreviewsをunifiedReviews形式に変換
          let reviews: UnifiedReview[] = []
          if (placeData.reviews && Array.isArray(placeData.reviews)) {
            reviews = placeData.reviews.map((review: any) => ({
              id: review.name || `google-${review.author_name}-${review.time}`,
              source: 'google' as const,
              author: review.author_name || 'Anonymous',
              rating: review.rating || 0,
              text: review.text || '',
              time: review.time,
              relative_time_description: review.relative_time_description,
              helpful_votes: undefined,
            }))
            setUnifiedReviews(reviews)
            logger.debug('✅ Google reviews converted from placeData', { count: reviews.length })
          }
          
          setLoading(false)
          return
        }

        // vicinityがない場合はPlacesCacheをチェック
        logger.debug('⚠️ place_data missing vicinity, checking PlacesCache...')
        const cachedData = await getCachedPlace(placeId)
        if (cachedData && cachedData.vicinity) {
          logger.debug('✅ Found vicinity in PlacesCache, merging data')
          const mergedData = {
            ...placeData,
            vicinity: cachedData.vicinity,
            business_status: cachedData.business_status,
            url: cachedData.url,
            icon: cachedData.icon,
          }
          setPlaceDetails(mergedData)
          
          // マージされたデータのreviewsをunifiedReviews形式に変換
          let reviews: UnifiedReview[] = []
          if (mergedData.reviews && Array.isArray(mergedData.reviews)) {
            reviews = mergedData.reviews.map((review: any) => ({
              id: review.name || `google-${review.author_name}-${review.time}`,
              source: 'google' as const,
              author: review.author_name || 'Anonymous',
              rating: review.rating || 0,
              text: review.text || '',
              time: review.time,
              relative_time_description: review.relative_time_description,
              helpful_votes: undefined,
            }))
            setUnifiedReviews(reviews)
            logger.debug('✅ Google reviews converted from merged data', { count: reviews.length })
          }
          
          setLoading(false)
          return
        }
      }

      logger.debug('🔍 Checking PlacesCache for place_id:', placeId)

      const cachedData = await getCachedPlace(placeId)
      if (cachedData) {
        logger.debug('✅ Found cached data:', cachedData.name)
        setPlaceDetails(cachedData)
        
        // PlacesCacheのreviewsをunifiedReviews形式に変換
        let reviews: UnifiedReview[] = []
        if (cachedData.reviews && Array.isArray(cachedData.reviews)) {
          reviews = cachedData.reviews.map((review: any) => ({
            id: review.name || `google-${review.author_name}-${review.time}`,
            source: 'google' as const,
            author: review.author_name || 'Anonymous',
            rating: review.rating || 0,
            text: review.text || '',
            time: review.time,
            relative_time_description: review.relative_time_description,
            helpful_votes: undefined,
          }))
          setUnifiedReviews(reviews)
          logger.debug('✅ Google reviews converted from cache', { count: reviews.length })
        }
        
        setLoading(false)
        return
      }

      logger.debug('❌ No cached data found, calling Google Places API...')

      // POIDialogで必要なフィールドを明示的に要求
      const requiredFields = [
        'price_level',
        'rating',
        'user_ratings_total',
        'editorial_summary',
        'reviews',
        'opening_hours',
        'website',
        'formatted_phone_number'
      ]

      const details = await placesApiHelpers.getPlaceDetails(
        placeId, 
        language,
        requiredFields
      )
      setPlaceDetails(details)

      logger.debug('💾 Saving to PlacesCache...')
      await placesCacheManager.fetchAndCachePlace(placeId, language)
      logger.debug('✅ Data saved to PlacesCache')

      if (details?.photos && details.photos.length > 0) {
        await cacheImages(details.photos)
      }

      // TripAdvisor/Foursquare集約は無効化（コスト削減・エラー回避）
      // Google Places APIのレビューのみ使用
      let aggregated: AggregatedVenueData | null = null
      let reviews: UnifiedReview[] = []
      
      // Google Places APIのレビューをunifiedReviews形式に変換
      if (details?.reviews && Array.isArray(details.reviews)) {
        reviews = details.reviews.map((review: any) => ({
          id: review.name || `google-${review.author_name}-${review.time}`,
          source: 'google' as const,
          author: review.author_name || 'Anonymous',
          rating: review.rating || 0,
          text: review.text || '',
          time: review.time,
          relative_time_description: review.relative_time_description,
          helpful_votes: undefined,
        }))
        logger.debug('✅ Google reviews converted to unified format', { count: reviews.length })
      }
      
      logger.debug('⏭️ Skipping external venue data (TripAdvisor/Foursquare disabled)')
      setAggregatedData(null)
      setUnifiedReviews(reviews)

      // キャッシュに保存
      poiCacheRef.current.set(placeId, {
        placeDetails: details,
        aggregatedData: aggregated,
        unifiedReviews: reviews,
        timestamp: Date.now()
      })
      logger.debug('💾 POI data cached', { placeId })
    } catch (err) {
      logger.error('POI詳細取得エラー', err)
      setError('詳細情報の取得に失敗しました')
      setTimeout(() => {
        onClose?.()
      }, 100)
    } finally {
      setLoading(false)
    }
  }, [placeId, placeData, language, cacheImages, onClose])

  useEffect(() => {
    if (!placeId) return

    // 新しいPOIを取得する前に旧データをリセット
    setPlaceDetails(null)
    setAggregatedData(null)
    setUnifiedReviews([])
    setCachedImages([])
    setError(null)

    void fetchPlaceDetails()
  }, [placeId, fetchPlaceDetails])

  return {
    placeDetails,
    aggregatedData,
    unifiedReviews,
    cachedImages,
    loading,
    error,
    imageLoading,
  }
}

