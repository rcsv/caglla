'use client'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'

import { useState, useEffect } from 'react'
import { placesApiHelpers, PlaceSearchResult } from '@/lib/api/google/places'
import { CloseIcon } from '@/components/common/icons/CloseIcon'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { useAuth } from '@/lib/contexts/auth'
import { getUserLanguage } from '@/lib/utils/language'
import type { Itinerary } from '@/lib/core/types'

// コンポーネント固有のProps型（中央集約型とは別の用途）
interface AddScheduleModalComponentProps {
  isOpen: boolean
  onClose: () => void
  dayId: string
  onScheduleAdded: (schedule: Itinerary) => void
  insertAfterIndex?: number // 挿入位置を指定（undefinedの場合は最後に追加）
}

/**
 * Modal UI for searching places and adding a schedule entry to a specific day.
 *
 * Provides a search field, displays place results, and saves a selected place as a schedule
 * entry. When `insertAfterIndex` is provided the component uses the insert endpoint to place
 * the new schedule at the specified position; otherwise it appends via the regular API.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback invoked when the modal is closed
 * @param dayId - Identifier of the day to which the schedule will be added
 * @param onScheduleAdded - Callback invoked with the newly created schedule object after a successful save
 * @param insertAfterIndex - Optional zero-based index after which the new schedule should be inserted; undefined means append to the end
 * @returns The modal element when `isOpen` is true, otherwise `null`
 */
export default function AddScheduleModal({ 
  isOpen, 
  onClose, 
  dayId, 
  onScheduleAdded,
  insertAfterIndex
}: AddScheduleModalComponentProps) {
  const { user } = useAuth()
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
      // ユーザーの言語設定を取得してPlaces APIに渡す
      const language = getUserLanguage(user)
      const results = await placesApiHelpers.searchPlaces(query, language)
      setSearchResults(results)
    } catch (error) {
      logger.error('Error searching places:', error)
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
      logger.debug(`AddScheduleModal: insertAfterIndex=${insertAfterIndex}, dayId=${dayId}`)
      logger.debug(`Selected place:`, place)
      
      // 挿入位置が指定されている場合は新しい挿入APIを使用、そうでなければ従来のAPIを使用
      const apiEndpoint = insertAfterIndex !== undefined ? '/api/itineraries/insert' : '/api/itineraries'
      
      const requestBody: any = {
        day_id: dayId,
        place_id: place.place_id,
        // place_dataを含めることで、API側でplaces_cacheに保存される
        place_data: {
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          photos: place.photos,
          rating: place.rating,
          price_level: place.price_level,
          types: place.types
        },
        title: place.name,
        description: place.formatted_address,
        location: place.formatted_address
      }
      
      // 挿入位置が指定されている場合は追加
      if (insertAfterIndex !== undefined) {
        requestBody.insert_after_index = insertAfterIndex + 1 // 1ベースのインデックスに変換
        logger.debug(`Using insert API with insert_after_index=${insertAfterIndex + 1} (converted from 0-based ${insertAfterIndex})`)
      } else {
        logger.debug(`Using regular API (no insert position specified)`)
      }
      
      logger.debug(`Sending request to ${apiEndpoint} with place_data`)
      
      // APIでスケジュールを保存（place_idとplace_dataを送信）
      const response = await makeAuthenticatedRequest(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const newSchedule = await response.json()
        onScheduleAdded(newSchedule)
        handleClose()
      } else {
        logger.error('Failed to save schedule')
        alert(t('trip.schedule.saveFailed'))
      }
    } catch (error) {
      logger.error('Error saving schedule:', error)
      alert(t('trip.schedule.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Venue / Point of Interest を追加
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6" />
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
              <p className="text-sm mt-1">{t('addScheduleModal.tryDifferentKeyword')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}