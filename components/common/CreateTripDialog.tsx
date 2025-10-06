'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import ImageUpload from '@/components/ImageUpload'
import { imageUploadHelpers } from '@/lib/image-upload'
import PlaceSearchInput from '@/components/common/PlaceSearchInput'
import { PlaceData } from '@/lib/firestore'
import { useSubscription } from '@/lib/subscription-context'
import { RestrictionType } from '@/lib/restriction-system'
import { getZIndexClass } from '@/lib/z-index-layers'
import { Input } from '@/components/common/Input'
import { Textarea } from '@/components/common/Textarea'
import { Select } from '@/components/common/Select'
import { Toggle } from '@/components/common/Toggle'
import { Button } from '@/components/common/Button'


interface CreateTripDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateTripDialog({ isOpen, onClose, onSuccess }: CreateTripDialogProps) {
  const router = useRouter()
  const { can, getRemaining, getLimitExceededMessage } = useSubscription()
  
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
  const [currentPrivateTripCount, setCurrentPrivateTripCount] = useState(0)
  const [isLoadingLimits, setIsLoadingLimits] = useState(true)
  const [dateError, setDateError] = useState('')

  // プラン制限のチェック
  useEffect(() => {
    const checkLimits = async () => {
      setIsLoadingLimits(true)
      try {
        // 現在の旅行数を取得
        const response = await makeAuthenticatedRequest('/api/trips', {
          method: 'GET'
        })
        
        if (response.ok) {
          const trips = await response.json()
          const tripsArray = Array.isArray(trips) ? trips : trips.trips || []
          setCurrentTripCount(tripsArray.length)
          
          // プライベート旅行数をカウント
          const privateTrips = tripsArray.filter((trip: any) => trip.access_level === 'private')
          setCurrentPrivateTripCount(privateTrips.length)
        } else {
          console.error('API request failed:', response.status, response.statusText)
          setCurrentTripCount(0)
          setCurrentPrivateTripCount(0)
        }
      } catch (error) {
        console.error('Error checking plan limits:', error)
        setCurrentTripCount(0)
        setCurrentPrivateTripCount(0)
      } finally {
        setIsLoadingLimits(false)
      }
    }

    if (isOpen) {
      checkLimits()
    }
  }, [isOpen])

  // 制限チェック
  const canCreateTrip = can(RestrictionType.MAX_TRIPS, currentTripCount + 1)
  const canCreatePrivateTrip = can(RestrictionType.MAX_PRIVATE_TRIPS, currentPrivateTripCount + 1)
  
  const remainingTrips = getRemaining(RestrictionType.MAX_TRIPS, currentTripCount)
  const remainingPrivateTrips = getRemaining(RestrictionType.MAX_PRIVATE_TRIPS, currentPrivateTripCount)

  // 旅行日数の計算
  const calculateTravelDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // 開始日と終了日を含む
    
    return diffDays
  }

  // 旅行日数制限チェック
  const canCreateTravelDays = can(RestrictionType.MAX_TRAVEL_DAYS, calculateTravelDays(formData.startDate, formData.endDate))

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

    // 日付のバリデーション
    const dateValidationError = validateDates(formData.startDate, formData.endDate)
    if (dateValidationError) {
      setDateError(dateValidationError)
      return
    }
    setDateError('')

    // プラン制限のチェック
    const totalDays = calculateTravelDays(formData.startDate, formData.endDate)
    
    if (!canCreateTrip) {
      alert('旅行データ数の制限に達しています。プランをアップグレードしてください。')
      return
    }
    
    if (!canCreateTravelDays) {
      alert('旅行日数の制限を超過しています。プランをアップグレードしてください。')
      return
    }

    if (formData.accessLevel === 'private' && !canCreatePrivateTrip) {
      alert('プライベート旅行数の制限に達しています。プランをアップグレードしてください。')
      return
    }

    setSubmitting(true)
    try {
      const response = await makeAuthenticatedRequest('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          destinationPlace: formData.destinationPlace,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          accessLevel: formData.accessLevel,
          imageUrl: formData.imageUrl || null,
        }),
      })

      if (response.ok) {
        const trip = await response.json()
        onSuccess()
        onClose()
        router.push(`/trip/${trip.id}`)
      } else {
        // 作成に失敗した場合、アップロードした画像を削除
        if (formData.imageUrl) {
          try {
            await imageUploadHelpers.deleteImage(formData.imageUrl)
            console.log('Failed creation image deleted:', formData.imageUrl)
          } catch (error) {
            console.error('Failed to delete image after creation failure:', error)
          }
        }
        console.error('Failed to create trip')
      }
    } catch (error) {
      // エラーが発生した場合、アップロードした画像を削除
      if (formData.imageUrl) {
        try {
          await imageUploadHelpers.deleteImage(formData.imageUrl)
          console.log('Error image deleted:', formData.imageUrl)
        } catch (deleteError) {
          console.error('Failed to delete image after error:', deleteError)
        }
      }
      console.error('Error creating trip:', error)
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
        console.log('Cancelled image deleted:', formData.imageUrl)
      } catch (error) {
        console.error('Failed to delete cancelled image:', error)
      }
    }
    
    // フォームをリセット
    setFormData({
      title: '',
      description: '',
      destination: '',
      destinationPlace: undefined,
      startDate: '',
      endDate: '',
      accessLevel: 'public',
      imageUrl: ''
    })
    setDateError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 ${getZIndexClass('FLOAT_MODAL')}`} style={{ margin: 0, top: 0 }}>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${getZIndexClass('FLOAT_MODAL', 1)}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">新しい旅行を作成</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* プラン制限の表示 */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">プラン制限</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">旅行データ数:</span>
                  <span className={`font-medium ${canCreateTrip ? 'text-green-600' : 'text-red-600'}`}>
                    {isLoadingLimits 
                      ? '読み込み中...'
                      : `${currentTripCount}件 (残り${remainingTrips === -1 ? '無制限' : remainingTrips}件)`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">プライベート旅行数:</span>
                  <span className={`font-medium ${canCreatePrivateTrip ? 'text-green-600' : 'text-red-600'}`}>
                    {isLoadingLimits 
                      ? '読み込み中...'
                      : `${currentPrivateTripCount}件 (残り${remainingPrivateTrips === -1 ? '無制限' : remainingPrivateTrips}件)`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">一回の旅行の最大日数:</span>
                  <span className={`font-medium ${canCreateTravelDays ? 'text-green-600' : 'text-red-600'}`}>
                    {isLoadingLimits 
                      ? '読み込み中...'
                      : `${calculateTravelDays(formData.startDate, formData.endDate)}日`
                    }
                  </span>
                </div>
                {/* 制限警告 */}
                {(!canCreateTrip || !canCreatePrivateTrip || !canCreateTravelDays) && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-800">
                          プラン制限を超過しています
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>現在のプランでは制限を超えています。より多くの旅行や長期間の旅行を作成するには、プランのアップグレードをご検討ください。</p>
                        </div>
                        <div className="mt-3">
                          <div className="-mx-2 -my-1.5 flex">
                            <button
                              type="button"
                              onClick={() => router.push('/subscription')}
                              className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                            >
                              プランをアップグレード
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push('/subscription')}
                              className="ml-3 bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                            >
                              プラン詳細を見る
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="旅行のタイトル *"
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="例: 沖縄旅行"
              />

              <Textarea
                label="説明"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="旅行の詳細や目的を記入してください"
              />

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                  目的地
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
                  <Input
                    label="または手動で入力"
                    type="text"
                    id="destinationText"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="例: 沖縄県那覇市"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="出発日"
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  error={dateError ? '日付エラー' : undefined}
                />

                <Input
                  label="帰宅日"
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  error={dateError ? '日付エラー' : undefined}
                />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公開設定
                </label>
                <Toggle
                  label="非公開（自分と共有ユーザーのみ）"
                  checked={formData.accessLevel === 'private'}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      accessLevel: e.target.checked ? 'private' : 'public'
                    }))
                  }}
                  disabled={!canCreatePrivateTrip}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.accessLevel === 'private' 
                    ? 'この旅行は自分と共有ユーザーのみが閲覧できます' 
                    : 'この旅行は誰でも閲覧できます'
                  }
                </p>
                {!canCreatePrivateTrip && (
                  <p className="mt-1 text-xs text-red-600">
                    プライベート旅行数の制限に達しています
                  </p>
                )}
              </div>

              <ImageUpload
                currentImageUrl={formData.imageUrl}
                onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
                disabled={submitting}
              />

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !formData.title || !!dateError || !canCreateTrip || !canCreateTravelDays || (formData.accessLevel === 'private' && !canCreatePrivateTrip)}
                >
                  {submitting ? '作成中...' : '旅行を作成'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
