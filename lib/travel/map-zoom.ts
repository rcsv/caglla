/**
 * Itinerary向けの地図ズーム管理ユーティリティ
 */

export const DEFAULT_ITINERARY_ZOOM = 14

/**
 * Place types に応じた推奨ズームレベルを返す
 */
export const getZoomForPlaceTypes = (types?: string[] | null): number => {
  if (!types || types.length === 0) return DEFAULT_ITINERARY_ZOOM

  const prioritizedZoomByType: Record<string, number> = {
    restaurant: 19,
    cafe: 18,
    bar: 18,
    tourist_attraction: 18,
    lodging: 18,
    bakery: 18,
  }

  for (const type of types) {
    const zoom = prioritizedZoomByType[type]
    if (zoom) {
      return zoom
    }
  }

  // 店舗・POI系（かなり寄る）
  const poiTypes = new Set([
    'point_of_interest',
    'establishment',
    'store',
    'book_store',
    'shopping_mall',
    'museum',
    'airport',
  ])
  if (types.some(t => poiTypes.has(t))) return 17

  // 近隣エリア
  const neighborhoodTypes = new Set([
    'sublocality',
    'sublocality_level_1',
    'sublocality_level_2',
    'neighborhood',
  ])
  if (types.some(t => neighborhoodTypes.has(t))) return 15

  // 市区町村
  if (types.includes('locality')) return 12

  // 郡・行政区画レベル2
  if (types.includes('administrative_area_level_2')) return 10

  // 都道府県・行政区画レベル1
  if (types.includes('administrative_area_level_1')) return 9

  // 国
  if (types.includes('country')) return 6

  return DEFAULT_ITINERARY_ZOOM
}

