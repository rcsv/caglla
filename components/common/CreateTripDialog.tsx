'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import ImageUpload from '@/components/ui/ImageUpload'
import { imageUploadHelpers } from '@/lib/storage/image-upload'
import PlaceSearchInput from '@/components/common/PlaceSearchInput'
import { PlaceData } from '@/lib/core/types'
import { useUserData } from '@/lib/contexts/user-data'
import { RestrictionProvider, RestrictionType } from '@/lib/subscription/restriction'
import { getZIndexClass } from '@/lib/core/z-index'
import { Input } from '@/components/common/Input'
import { Textarea } from '@/components/common/Textarea'
import { Select } from '@/components/common/Select'
import { Toggle } from '@/components/common/Toggle'
import { Button } from '@/components/common/Button'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { t } from '@/lib/i18n'
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'


interface CreateTripDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Dialog modal for creating a new trip, collecting destination, travel dates, optional title/description/image, and access level.
 *
 * The component validates required fields and dates, can auto-fetch an Unsplash image for the destination, enforces plan limits, uploads/removes images as needed, posts trip data to the API, and redirects to the created trip on success.
 *
 * @param isOpen - Whether the dialog is visible
 * @param onClose - Called when the dialog is closed or cancelled
 * @param onSuccess - Called after a trip is successfully created
 * @returns The dialog's rendered React element when open, or `null` when closed
 */
export default function CreateTripDialog({ isOpen, onClose, onSuccess }: CreateTripDialogProps) {
  const router = useRouter()
  const { userPlanId, tripCount, privateTripCount } = useUserData()
  const { user } = useAuth()
  
  // 現在のユーザー言語を取得（date inputのlang属性用）
  const currentLanguage = getUserLanguage(user)
  
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
  const [dateError, setDateError] = useState('')
  const [isLoadingUnsplashImage, setIsLoadingUnsplashImage] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  // RestrictionProviderを使用してプラン制限をチェック
  const canCreateTrip = RestrictionProvider.can(userPlanId, RestrictionType.MAX_TRIPS, tripCount + 1)
  const canCreatePrivateTrip = RestrictionProvider.can(userPlanId, RestrictionType.MAX_PRIVATE_TRIPS, privateTripCount + 1)
  
  const remainingTrips = RestrictionProvider.getRemaining(userPlanId, RestrictionType.MAX_TRIPS, tripCount)
  const remainingPrivateTrips = RestrictionProvider.getRemaining(userPlanId, RestrictionType.MAX_PRIVATE_TRIPS, privateTripCount)

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
  }, [formData.destination, formData.imageUrl])

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
  const canCreateTravelDays = RestrictionProvider.can(userPlanId, RestrictionType.MAX_TRAVEL_DAYS, calculateTravelDays(formData.startDate, formData.endDate))

  // 日付のバリデーション
  const validateDates = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return ''
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      return t('trip.create.dateValidation.startBeforeEnd')
    }
    
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 必須項目のバリデーション
    if (!formData.destinationPlace) {
      alert(t('trip.create.validation.destinationRequired'))
      return
    }

    if (!formData.startDate) {
      alert(t('trip.create.validation.startDateRequired'))
      return
    }

    if (!formData.endDate) {
      alert(t('trip.create.validation.endDateRequired'))
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
          // 初期レンダリング用に最小限の場所オブジェクトも送る（キャッシュミス時の即時保存）
          destinationPlace: formData.destinationPlace,
          startDate: formData.startDate,
          endDate: formData.endDate,
          accessLevel: formData.accessLevel,
          imageUrl: formData.imageUrl || null,
        }),
      })

      if (response.ok) {
        const trip = await response.json()
        onSuccess()
        onClose()
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
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value }
      
      // 出発日が変更された場合、帰宅日を自動的に出発日と同じ日にする
      if (name === 'startDate' && value && !prev.endDate) {
        newFormData.endDate = value
      }
      
      return newFormData
    })
    
    // 日付が変更された場合は即座にバリデーションを実行
    if (name === 'startDate' || name === 'endDate') {
      const newFormData = { ...formData, [name]: value }
      // 出発日が変更された場合、帰宅日も更新する
      if (name === 'startDate' && value && !formData.endDate) {
        newFormData.endDate = value
      }
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
        <div className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${getZIndexClass('FLOAT_MODAL')}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{t('trip.create.title')}</h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <IconRenderer iconName="close" className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 必須項目 */}
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('trip.create.destination.label')}
                </label>
                <PlaceSearchInput
                  currentPlace={formData.destinationPlace}
                  onPlaceSelect={(place: PlaceData | null) => setFormData(prev => ({ 
                    ...prev, 
                    destinationPlace: place || undefined,
                    destination: place?.name || '' // 後方互換性のため
                  }))}
                  placeholder={t('trip.create.destination.placeholder')}
                  disabled={submitting}
                />
                {!formData.destinationPlace && (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="text-red-600 mr-1">*</span>{t('trip.create.destination.hint')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('trip.create.startDate.label')}
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  placeholder={t('trip.create.startDate.placeholder')}
                  hint={t('trip.create.startDate.hint')}
                  required
                  error={dateError ? t('trip.create.dateError') : undefined}
                  lang={currentLanguage}
                />

                <Input
                  label={t('trip.create.endDate.label')}
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  placeholder={t('trip.create.endDate.placeholder')}
                  hint={t('trip.create.endDate.hint')}
                  required
                  error={dateError ? t('trip.create.dateError') : undefined}
                  min={formData.startDate || undefined}
                  lang={currentLanguage}
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

              {/* 詳細設定の折りたたみ */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2 -m-2"
                >
                  <span>{t('trip.create.advancedSettings')}</span>
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
                    <Input
                      label={t('trip.create.title.label')}
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={t('trip.create.title.placeholder')}
                    />

                    <Textarea
                      label={t('trip.create.description.label')}
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder={t('trip.create.description.placeholder')}
                    />

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
                              {t('trip.create.imageLoading')}
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
                              {t('trip.create.imageLoaded')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('trip.create.accessLevel.label')}
                      </label>
                      <Toggle
                        label={t('trip.create.accessLevel.private.label')}
                        checked={formData.accessLevel === 'private'}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            accessLevel: e.target.checked ? 'private' : 'public'
                          }))
                        }}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.accessLevel === 'private' 
                          ? t('trip.create.accessLevel.private.description')
                          : t('trip.create.accessLevel.public.description')
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  {t('trip.create.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !formData.destinationPlace || !formData.startDate || !formData.endDate || !!dateError}
                >
                  {submitting ? t('trip.create.submitting') : t('trip.create.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}