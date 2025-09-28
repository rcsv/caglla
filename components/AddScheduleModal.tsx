'use client'

import { useState, useEffect } from 'react'
import { placesApiHelpers, PlaceSearchResult } from '@/lib/places-api'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'

interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  dayId: string
  onScheduleAdded: (schedule: any) => void
}

export default function AddScheduleModal({ 
  isOpen, 
  onClose, 
  dayId, 
  onScheduleAdded 
}: AddScheduleModalProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 検索結果をクリア
  const clearResults = () => {
    setSearchResults([])
    setSelectedPlace(null)
  }

  // モーダルを閉じる
  const handleClose = () => {
    setQuery('')
    clearResults()
    onClose()
  }

  // 場所を検索
  const handleSearch = async () => {
    if (!query.trim()) {
      clearResults()
      return
    }

    setIsSearching(true)
    try {
      const results = await placesApiHelpers.searchPlaces(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching places:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // エンターキーで検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 場所を選択してスケジュールを保存
  const handleSelectPlace = async (place: PlaceSearchResult) => {
    setIsSaving(true)
    try {
      // 詳細情報を取得
      const placeDetails = await placesApiHelpers.getPlaceDetails(place.place_id)
      
      // APIでスケジュールを保存
      const response = await makeAuthenticatedRequest('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_id: dayId,
          place_data: placeDetails,
          title: place.name,
          description: place.formatted_address,
          location: place.formatted_address
        })
      })

      if (response.ok) {
        const newSchedule = await response.json()
        onScheduleAdded(newSchedule)
        handleClose()
      } else {
        console.error('Failed to save schedule')
        alert('スケジュールの保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('スケジュールの保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Venue / Point of Interest を追加
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 検索フィールド */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              場所を検索
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="例: 東京タワー, 浅草寺, 銀座..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? '検索中...' : '検索'}
              </button>
            </div>
          </div>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-2">検索結果</h3>
              <div className="space-y-2">
                {searchResults.map((place) => (
                  <div
                    key={place.place_id}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectPlace(place)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{place.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{place.formatted_address}</p>
                        {place.rating && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 ml-1">{place.rating}</span>
                          </div>
                        )}
                      </div>
                      {isSaving && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 検索結果がない場合 */}
          {query && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-4 text-gray-500">
              <p>検索結果が見つかりませんでした</p>
              <p className="text-sm mt-1">別のキーワードで検索してみてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
