'use client'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { placesApiHelpers } from '@/lib/api/google/places'
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'
import { useClickOutside } from '@/hooks/useClickOutside'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'
import type { PlaceData, PlaceSearchResult } from '@/lib/core/types'

interface MapSearchOverlayProps {
  /** 場所が選択された時のコールバック */
  onPlaceChosen?: (place: PlaceData) => void
  /** 地図の現在のビューポートを取得する関数（locationBias用） */
  getMapViewport?: () => {
    center?: { lat: number; lng: number }
    bounds?: { north: number; south: number; east: number; west: number }
  }
  /** 検索結果（一覧）を親へ通知（地図上のピンドロップ描画用） */
  onSearchResultsUpdated?: (results: PlaceSearchResult[]) => void
  /** サジェストの表示を抑止（地図ピンのみ落とす用途） */
  hideSuggestions?: boolean
  /** 検索窓のプレースホルダー */
  placeholder?: string
  /** 検索窓の幅（CSS値） */
  width?: string
  /** 検索窓の位置 */
  position?: 'top-left' | 'top-center' | 'top-right'
}

/**
 * 地図上にフロート表示される検索オーバーレイ
 * 既存のPlaceSearchInputを活用してGoogle Places検索を提供
 */
export default function MapSearchOverlay({
  onPlaceChosen,
  getMapViewport,
  onSearchResultsUpdated,
  hideSuggestions = false,
  placeholder = t('placeSearch.placeholder'),
  width = "min(420px,36vw)",
  position = "top-center"
}: MapSearchOverlayProps) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchResultsUpdatedRef = useRef(onSearchResultsUpdated)
  const getMapViewportRef = useRef(getMapViewport)
  const collapseTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    searchResultsUpdatedRef.current = onSearchResultsUpdated
  }, [onSearchResultsUpdated])

  useEffect(() => {
    getMapViewportRef.current = getMapViewport
  }, [getMapViewport])

  // 外部クリックで検索結果を閉じる
  const collapseOverlay = useCallback(() => {
    setShowResults(false)
    setIsExpanded(false)
  }, [])

  useClickOutside(containerRef, () => collapseOverlay())

  useEffect(() => {
    if (query.length < 2) {
      let cleared = false

      setSearchResults((prev) => {
        if (prev.length === 0) return prev
        cleared = true
        return []
      })

      setShowResults((prev) => (prev ? false : prev))
      setIsSearching(false)
      setError(null)

      if (cleared) {
        searchResultsUpdatedRef.current?.([])
      }

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = undefined
      }

      return
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      setError(null)

      try {
        const language = getUserLanguage(user)

        const viewport = getMapViewportRef.current?.()
        let locationBias: any = undefined

        if (viewport?.center) {
          locationBias = {
            circle: {
              center: {
                latitude: viewport.center.lat,
                longitude: viewport.center.lng
              },
              radius: 10000
            }
          }
        } else if (viewport?.bounds) {
          locationBias = {
            rectangle: {
              low: {
                latitude: viewport.bounds.south,
                longitude: viewport.bounds.west
              },
              high: {
                latitude: viewport.bounds.north,
                longitude: viewport.bounds.east
              }
            }
          }
        }

        const results = await placesApiHelpers.searchPlaces(query, language, locationBias)
        setSearchResults(results)
        setShowResults(!hideSuggestions && isExpanded)
        setError(null)
        searchResultsUpdatedRef.current?.(results)
      } catch (error) {
        logger.error('Search error:', error)
        const errorMessage = error instanceof Error ? error.message : t('placeSearch.searchFailed')

        if (errorMessage.includes('ZERO_RESULTS')) {
          setError(null)
          setSearchResults([])
          setShowResults(!hideSuggestions)
          searchResultsUpdatedRef.current?.([])
        } else {
          setError(`検索エラー: ${errorMessage}`)
          setSearchResults([])
          searchResultsUpdatedRef.current?.([])
        }
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = undefined
      }
    }
  }, [query, hideSuggestions, user, isExpanded])

  const handlePlaceSelect = async (place: PlaceSearchResult) => {
    try {
      const placeData = {
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: place.geometry,
        types: place.types,
      } as PlaceData
      
      setQuery(place.name)
      setShowResults(false)
      setError(null)
      onPlaceChosen?.(placeData)
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current)
      }
      collapseTimerRef.current = setTimeout(() => {
        collapseOverlay()
        inputRef.current?.blur()
      }, 200)
    } catch (error) {
      logger.error('Error selecting place:', error)
      const errorMessage = error instanceof Error ? error.message : t('placeSearch.selectFailed')
      setError(`選択エラー: ${errorMessage}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setError(null)
  }

  const handleInputFocus = () => {
    setIsExpanded(true)
    if (hideSuggestions) return
    if (searchResults.length > 0) {
      setShowResults(true)
    }
  }

  const handleInputBlur = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
    }
    collapseTimerRef.current = setTimeout(() => {
      const active = document.activeElement
      if (containerRef.current && active && containerRef.current.contains(active)) {
        return
      }
      collapseOverlay()
    }, 160)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      collapseOverlay()
      inputRef.current?.blur()
    }
  }

  const handleExpandClick = () => {
    setIsExpanded(true)
    setShowResults(searchResults.length > 0 && !hideSuggestions)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // 位置に応じたCSSクラスを生成
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2'
      case 'top-right':
        return 'top-4 right-4'
      default:
        return 'top-4 left-1/2 -translate-x-1/2'
    }
  }, [position])

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current)
      }
    }
  }, [])

  const expandedWidth = width || "min(420px,36vw)"
  const collapsedWidth = '80px'
  const containerWidth = isExpanded ? expandedWidth : collapsedWidth
  const overlayBaseClasses = 'rounded-md border transition-all duration-200 ease-out backdrop-blur'
  const overlayVisualClasses = isExpanded
    ? 'bg-white/95 border-gray-200 shadow-lg'
    : 'bg-white/40 border-white/40 shadow-sm'

  return (
    <div 
      ref={containerRef}
      className={`absolute ${positionClasses} zidx-map-overlay`}
      style={{ width: containerWidth }}
    >
      <div className={`${overlayBaseClasses} ${overlayVisualClasses} ${isExpanded ? 'p-2' : 'p-1.5'} pointer-events-auto`}>
        {isExpanded ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            
            {/* 検索アイコン */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleExpandClick}
            className="flex items-center justify-center w-full h-9 rounded-md bg-white/20 hover:bg-white/40 transition-colors duration-200 text-gray-600"
            aria-label={t('placeSearch.placeholder')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        {/* エラーメッセージ */}
        {isExpanded && error && (
          <div className="mt-1 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* 検索結果 */}
        {isExpanded && !hideSuggestions && showResults && searchResults.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute zidx-popup-menu w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {searchResults.map((place) => (
              <div
                key={place.place_id}
                onClick={() => handlePlaceSelect(place)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {place.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {place.formatted_address}
                    </p>
                    {place.types.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {place.types.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {placesApiHelpers.getTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    )}
                    {place.rating && (
                      <div className="mt-1 flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 text-xs text-gray-500">
                          {place.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 検索結果が空の場合 */}
        {isExpanded && !hideSuggestions && showResults && searchResults.length === 0 && !isSearching && query.length >= 2 && (
          <div className="absolute zidx-popup-menu w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              <div className="mb-2">{t('placeSearch.noResults')}</div>
              <div className="text-xs text-gray-400">
                英語での検索や、より具体的な地名を試してみてください
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
