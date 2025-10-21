'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useRef } from 'react'
import { placesApiHelpers, PlaceSearchResult } from '@/lib/api/google/places'
import { PlaceData } from '@/lib/core/types'  
import { PlaceSearchInputProps } from '@/lib/core/types'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'
import { useClickOutside } from '@/hooks/useClickOutside'


/**
 * A controlled place search input that performs debounced queries and shows selectable search results.
 *
 * Renders a text input that queries places as the user types (debounced), displays a dropdown of matches, allows selecting a place, and surfaces errors and loading state.
 *
 * @param currentPlace - The currently selected place or `null`; its `name` initializes the input value.
 * @param onPlaceSelect - Callback invoked with the selected `PlaceData` or `null` when the selection is cleared.
 * @param placeholder - Input placeholder text (defaults to "場所を検索...").
 * @param disabled - If `true`, disables the input and interaction.
 * @returns The input and dropdown UI for searching and selecting places. */

export default function PlaceSearchInput({ 
  currentPlace, 
  onPlaceSelect, 
  placeholder = "場所を検索...",
  disabled = false 
}: PlaceSearchInputProps & { initialText?: string }) {
  const { user } = useAuth()
  const [query, setQuery] = useState(currentPlace?.name || (arguments[0]?.initialText as string) || '')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 外部クリックで検索結果を閉じる
  useClickOutside(containerRef, () => setShowResults(false))

  // 検索クエリの変更を監視
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    // デバウンス処理
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await searchPlaces(query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const searchPlaces = async (searchQuery: string) => {
    if (searchQuery.length < 2) return

    setIsSearching(true)
    setError(null)

    try {
      // ユーザーの言語設定を取得してPlaces APIに渡す
      const language = getUserLanguage(user)
      const results = await placesApiHelpers.searchPlaces(searchQuery, language)
      setSearchResults(results)
      setShowResults(true)
      setError(null) // 成功時はエラーをクリア
    } catch (error) {
      logger.error('Search error:', error)
      const errorMessage = error instanceof Error ? error.message : '場所の検索に失敗しました'
      
      // ZERO_RESULTSの場合はエラーではなく、結果なしとして扱う
      if (errorMessage.includes('ZERO_RESULTS')) {
        setError(null)
        setSearchResults([])
        setShowResults(true) // 結果なしメッセージを表示
      } else {
        setError(`検索エラー: ${errorMessage}`)
        setSearchResults([])
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlaceSelect = async (place: PlaceSearchResult) => {
    try {
      // ここでは詳細取得せず、place_idのみで親に通知
      onPlaceSelect({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: place.geometry,
        types: place.types,
      } as PlaceData) // PlaceData型にキャスト
      
      setQuery(place.name)
      setShowResults(false)
      setError(null)
    } catch (error) {
      logger.error('Error getting place details:', error)
      const errorMessage = error instanceof Error ? error.message : '場所の詳細情報の取得に失敗しました'
      setError(`詳細取得エラー: ${errorMessage}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (currentPlace && e.target.value !== currentPlace.name) {
      // 現在の選択をクリア
      onPlaceSelect(null)
    }
    // エラーをクリア
    setError(null)
  }

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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

      {/* エラーメッセージ */}
      {error && (
        <div className="mt-1 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 検索結果 */}
      {showResults && searchResults.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
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
      {showResults && searchResults.length === 0 && !isSearching && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500 text-sm">
            <div className="mb-2">該当する場所が見つかりませんでした</div>
            <div className="text-xs text-gray-400">
              英語での検索や、より具体的な地名を試してみてください
            </div>
            <div className="mt-2 text-xs text-gray-400">
              または手動で入力
            </div>
          </div>
        </div>
      )}
    </div>
  )
}