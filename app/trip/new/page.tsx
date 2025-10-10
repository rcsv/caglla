'use client'
import logger from '@/lib/core/logger'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import Loading from '@/components/common/Loading'
import ImageUpload from '@/components/ui/ImageUpload'
import { imageUploadHelpers } from '@/lib/image-upload'
import PlaceSearchInput from '@/components/common/PlaceSearchInput'
import { PlaceData } from '@/lib/core/types'
import { useSubscription } from '@/lib/contexts/subscription'
import { RestrictionType } from '@/lib/subscription/restriction'

/**
 * Renders the "New Trip" page and manages creation flow, including form state, date validation, authenticated plan-limit checks, automatic destination image fetching, image upload cleanup, and navigation after creation.
 *
 * @returns The New Trip page React element.
 */
export default function NewTripPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { can, hasFeature, getRemaining, getLimitExceededMessage } = useSubscription()
  
  // 制限値を取得するヘルパー関数
  const getLimitValue = (type: RestrictionType): number => {
    // 無料プランの制限値を直接返す（現在は固定値）
    switch (type) {
      case RestrictionType.MAX_TRIPS:
        return 3
      case RestrictionType.MAX_TRAVEL_DAYS:
        return 5
      default:
        return 0
    }
  }
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    destinationPlace: undefined as PlaceData | undefined,
    startDate: '',
    endDate: '',
    accessLevel: 'public' as 'private' | 'public',
    imageUrl: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [currentTripCount, setCurrentTripCount] = useState(0)
  const [isLoadingLimits, setIsLoadingLimits] = useState(true)
  const [dateError, setDateError] = useState('')
  const [isLoadingUnsplashImage, setIsLoadingUnsplashImage] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // プラン制限のチェック
  useEffect(() => {
    const checkLimits = async () => {
      if (!user) return

      setIsLoadingLimits(true)
      try {
        // 現在の旅行数を取得
        const response = await makeAuthenticatedRequest('/api/trips', {
          method: 'GET'
        })
        
        if (response.ok) {
          const trips = await response.json()
          logger.debug('API Response:', trips) // デバッグ用
          
          // tripsが配列かどうかチェック
          const tripsArray = Array.isArray(trips) ? trips : trips.trips || []
          logger.debug('Trips array:', tripsArray) // デバッグ用
          
          setCurrentTripCount(tripsArray.length)
        } else {
          logger.error('API request failed:', response.status, response.statusText)
          setCurrentTripCount(0)
        }
      } catch (error) {
        logger.error('Error checking plan limits:', error)
        setCurrentTripCount(0)
      } finally {
        setIsLoadingLimits(false)
      }
    }

    checkLimits()
  }, [user])

  // Unsplash画像の自動取得
  const fetchUnsplashImage = async (destination: string) => {
    if (!destination.trim()) return

    setIsLoadingUnsplashImage(true)
    try {
      const response = await makeAuthenticatedRequest(`/api/unsplash?destination=${encodeURIComponent(destination)}&count=1`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.photo) {
          setFormData(prev => ({ ...prev, imageUrl: data.photo.url }))
        }
      }
    } catch (error) {
      logger.error('Failed to fetch Unsplash image:', error)
    } finally {
      setIsLoadingUnsplashImage(false)
    }
  }

  // 目的地が変更された時にUnsplash画像を自動取得
  useEffect(() => {
    if (formData.destination.trim() && !formData.imageUrl) {
      const timeoutId = setTimeout(() => {
        fetchUnsplashImage(formData.destination)
      }, 1000) // 1秒後に実行（デバウンス）

      return () => clearTimeout(timeoutId)
    }
  }, [formData.destination])

  // 旅行日数の計算
  const calculateTravelDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // 開始日と終了日を含む
    
    return diffDays
  }

  // 日付のバリデーション
  const validateDates = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return ''
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      return '出発日は帰宅日より前の日付を選択してください'
    }
    
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // 必須項目のバリデーション
    if (!formData.destination.trim()) {
      alert('目的地を入力してください。')
      return
    }

    if (!formData.startDate) {
      alert('出発日を選択してください。')
      return
    }

    if (!formData.endDate) {
      alert('帰宅日を選択してください。')
      return
    }

    // 日付のバリデーション
    const dateValidationError = validateDates(formData.startDate, formData.endDate)
    if (dateValidationError) {
      setDateError(dateValidationError)
      return
    }
    setDateError('')


    setSubmitting(true)
    try {
      const response = await makeAuthenticatedRequest('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title || formData.destination, // タイトル未入力時は目的地を使用
          description: formData.description,
          destination: formData.destination,
          destinationPlaceId: formData.destinationPlace?.place_id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          accessLevel: formData.accessLevel,
          imageUrl: formData.imageUrl || null,
        }),
      })

      if (response.ok) {
        const trip = await response.json()
        // スラッグベースのURLにリダイレクト（フォールバック: IDベース）
        if (trip.creator?.slug && trip.slug) {
          router.push(`/${trip.creator.slug}/${trip.slug}`)
        } else {
          router.push(`/trip/${trip.id}`)
        }
      } else {
        // 作成に失敗した場合、アップロードした画像を削除
        if (formData.imageUrl) {
          try {
            await imageUploadHelpers.deleteImage(formData.imageUrl)
            logger.debug('Failed creation image deleted:', formData.imageUrl)
          } catch (error) {
            logger.error('Failed to delete image after creation failure:', error)
          }
        }
        logger.error('Failed to create trip')
      }
    } catch (error) {
      // エラーが発生した場合、アップロードした画像を削除
      if (formData.imageUrl) {
        try {
          await imageUploadHelpers.deleteImage(formData.imageUrl)
          logger.debug('Error image deleted:', formData.imageUrl)
        } catch (deleteError) {
          logger.error('Failed to delete image after error:', deleteError)
        }
      }
      logger.error('Error creating trip:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 日付が変更された場合は即座にバリデーションを実行
    if (name === 'startDate' || name === 'endDate') {
      const newFormData = { ...formData, [name]: value }
      const dateValidationError = validateDates(newFormData.startDate, newFormData.endDate)
      setDateError(dateValidationError)
    }
  }

  const handleCancel = async () => {
    // キャンセル時にアップロードした画像を削除
    if (formData.imageUrl) {
      try {
        await imageUploadHelpers.deleteImage(formData.imageUrl)
        logger.debug('Cancelled image deleted:', formData.imageUrl)
      } catch (error) {
        logger.error('Failed to delete cancelled image:', error)
      }
    }
    
    // ルーティングエラーを防ぐため、window.locationを使用
    try {
      router.push('/home')
    } catch (error) {
      logger.error('Router push failed, using window.location:', error)
      window.location.href = '/home'
    }
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/home')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">新しい旅行を作成</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* 必須項目 */} 
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                  目的地 *
                </label>
                <PlaceSearchInput
                  currentPlace={formData.destinationPlace}
                  onPlaceSelect={(place) => setFormData(prev => ({ 
                    ...prev, 
                    destinationPlace: place,
                    destination: place.name // 後方互換性のため
                  }))}
                  placeholder="目的地を検索..."
                  disabled={submitting}
                />
                {/* 従来のテキスト入力も残す（フォールバック用） */}
                <div className="mt-2">
                  <label htmlFor="destinationText" className="block text-xs text-gray-500 mb-1">
                    または手動で入力
                  </label>
                  <input
                    type="text"
                    id="destinationText"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="例: 沖縄県那覇市"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    出発日 *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dateError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    帰宅日 *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dateError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* 日付エラーメッセージ */}
              {dateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{dateError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 詳細設定の折りたたみ */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2 -m-2"
                >
                  <span>詳細設定</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAdvancedSettings && (
                  <div className="mt-4 space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        旅行のタイトル（未入力時は目的地が使用されます）
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: 沖縄旅行（空欄の場合は目的地が使用されます）"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        説明
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="旅行の詳細や目的を記入してください"
                      />
                    </div>

                    <ImageUpload
                      currentImageUrl={formData.imageUrl}
                      onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
                      disabled={submitting}
                    />

                    {/* Unsplash画像自動取得の状態表示 */}
                    {isLoadingUnsplashImage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-800">
                              目的地に関連する画像を自動取得中...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unsplash画像が取得された場合の表示 */}
                    {formData.imageUrl && !isLoadingUnsplashImage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-800">
                              目的地に関連する画像を自動取得しました
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        公開設定
                      </label>
                      <select
                        id="accessLevel"
                        name="accessLevel"
                        value={formData.accessLevel}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="private">非公開（自分と共有ユーザーのみ）</option>
                        <option value="public">公開（誰でも閲覧可能）</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.destination.trim() || !formData.startDate || !formData.endDate || !!dateError}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                {submitting ? '作成中...' : '旅行を作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}