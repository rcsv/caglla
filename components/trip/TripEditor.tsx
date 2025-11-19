'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { updateTrip, getTrip, deleteTrip } from '@/lib/travel/trip-operations'
import { dateUtils } from '@/lib/utils/date'
import ImageUpload from '@/components/ui/ImageUpload'
import { imageUploadHelpers } from '@/lib/storage/image-upload'
import PlaceSearchInput from '@/components/common/PlaceSearchInput'
import type { Trip, Day, Itinerary, TripEditorProps } from '@/lib/core/types'
import { getZIndexClass } from '@/lib/core/z-index'
import Loading from '@/components/common/Loading'
import { t } from '@/lib/i18n'
import { currencyUtils } from '@/lib/utils/currency'
import { getUserLanguage } from '@/lib/utils/language'
import { useAuth } from '@/lib/contexts/auth'
import Toggle from '@/components/common/Toggle'
import { useUserData } from '@/lib/contexts/user-data'
import { RestrictionProvider, RestrictionType } from '@/lib/subscription/restriction'

/**
 * Renders an editor UI for a Trip and manages editing, saving, cancelling, and deletion.
 *
 * The component provides a modal form to edit trip fields (title, description, destination, dates, access level, image),
 * validates that the start date is not after the end date, shows fullscreen loading while saving, and confirms deletion.
 * On save it sends an update to the server, removes replaced images when applicable, and calls `onUpdate` with the latest trip data
 * (or a locally-updated fallback). On delete it calls `onDelete` after a successful server deletion.
 *
 * @param trip - The trip object to be displayed and edited.
 * @param onUpdate - Callback invoked with the updated trip data after a successful save.
 * @param onDelete - Optional callback invoked after a successful deletion of the trip.
 * @returns The JSX element for the trip editor or an edit button when not editing.
 */
export default function TripEditor({
  trip,
  onUpdate,
  onDelete,
  onClose,
  hideDestinationEdit = false,
  initialEditing = false,
  hideEditButton = false,
  disableDateFields = false,
  disablePublishControls = false
}: TripEditorProps) {
  const { user } = useAuth()
  const { userPlanId } = useUserData()
  const [isEditing, setIsEditing] = useState(initialEditing)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const currentLanguage = getUserLanguage(user)
  const formatDateForInput = (date: any): string => {
    if (!date) return ''
    
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      
      // タイムゾーンオフセットを考慮してローカル日付を取得
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    } catch (error) {
      logger.error('Error formatting date:', error)
      return ''
    }
  }

  const [formData, setFormData] = useState({
    title: trip.title,
    description: trip.description || '',
    destination: trip.destination || '',
    destinationPlace: trip.destination_place,
    startDate: trip.is_template ? '' : formatDateForInput(trip.start_date),
    endDate: trip.is_template ? '' : formatDateForInput(trip.end_date),
    accessLevel: trip.access_level,
    isTemplate: Boolean(trip.is_template),
    dayCount: trip.day_count ?? 0,
    imageUrl: trip.image_url || '',
    defaultCurrency: trip.default_currency || 'JPY'
  })
  const isTemplateMode = Boolean(formData.isTemplate)

  const [saving, setSaving] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState(trip.image_url || '')
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [dateError, setDateError] = useState('')
  const publicTemplateEnabled = RestrictionProvider.hasFeature(userPlanId, RestrictionType.PUBLIC_TEMPLATE)
  const canToggleTemplate = !disablePublishControls && (publicTemplateEnabled || formData.isTemplate)

  // 日付のバリデーション
  const validateDates = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return ''
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      return t('tripEditor.dateValidation')
    }
    
    return ''
  }

  // tripが変更された時にformDataを更新（編集モードでない場合のみ）
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        title: trip.title,
        description: trip.description || '',
        destination: trip.destination || '',
        destinationPlace: trip.destination_place,
        startDate: trip.is_template ? '' : formatDateForInput(trip.start_date),
        endDate: trip.is_template ? '' : formatDateForInput(trip.end_date),
        accessLevel: trip.access_level,
        isTemplate: Boolean(trip.is_template),
        dayCount: trip.day_count ?? 0,
        imageUrl: trip.image_url || '',
        defaultCurrency: trip.default_currency || 'JPY'
      })
      setOriginalImageUrl(trip.image_url || '')
      setDateError('')
    }
  }, [trip, isEditing])

  const handleSave = async () => {
    // 日付のバリデーション
    if (isTemplateMode) {
      if (!formData.dayCount || formData.dayCount <= 0) {
        alert(t('trip.create.validation.dayCountRequired'))
        return
      }
      setDateError('')
    } else {
      const dateValidationError = validateDates(formData.startDate, formData.endDate)
      if (dateValidationError) {
        setDateError(dateValidationError)
        return
      }
      setDateError('')
    }

    setSaving(true)
    setShowLoadingOverlay(true)
    
    try {
      await updateTrip(trip.id, {
        title: formData.title,
        description: formData.description,
        destination: formData.destination,
        destinationPlaceId: formData.destinationPlace?.place_id,
        startDate: isTemplateMode ? undefined : formData.startDate || undefined,
        endDate: isTemplateMode ? undefined : formData.endDate || undefined,
        accessLevel: formData.accessLevel,
        imageUrl: formData.imageUrl || undefined,
        isTemplate: isTemplateMode,
        defaultCurrency: formData.defaultCurrency,
      })

      // 古い画像を削除（新しい画像がアップロードされた場合）
      if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
        logger.info('Attempting to delete old image:', {
          originalImageUrl,
          newImageUrl: formData.imageUrl,
          tripId: trip.id
        })
        try {
          await imageUploadHelpers.deleteImage(originalImageUrl)
          logger.info('Successfully deleted old image:', originalImageUrl)
        } catch (error) {
          logger.error('Failed to delete old image:', {
            error,
            originalImageUrl,
            newImageUrl: formData.imageUrl,
            tripId: trip.id
          })
          // エラーが発生しても処理は続行（新規画像のアップロードは成功しているため）
        }
      } else {
        logger.debug('No old image to delete:', {
          originalImageUrl,
          newImageUrl: formData.imageUrl,
          urlsMatch: originalImageUrl === formData.imageUrl
        })
      }

      // 最新のtripデータを取得
      const latestTripData = await getTrip(trip.id)
      if (latestTripData) {
        // 最新データで一括更新
        onUpdate(latestTripData)
        setOriginalImageUrl(formData.imageUrl)
      } else {
        // フォールバック: ローカルデータで更新
        const updatedTrip = {
          ...trip,
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          start_date: isTemplateMode ? undefined : formData.startDate,
          end_date: isTemplateMode ? undefined : formData.endDate,
          access_level: formData.accessLevel,
          image_url: formData.imageUrl,
          is_template: isTemplateMode,
          day_count: isTemplateMode ? formData.dayCount : formData.dayCount || undefined,
          updated_at: new Date().toISOString()
        }
        onUpdate(updatedTrip)
      }
      
      // 編集モードを終了
      setIsEditing(false)
      onClose?.()
    } catch (error) {
      logger.error('Error updating trip:', error)
    } finally {
      setSaving(false)
      setShowLoadingOverlay(false)
    }
  }

  const handleCancel = async () => {
    // キャンセル時に新しくアップロードされた画像を削除
    if (formData.imageUrl && formData.imageUrl !== originalImageUrl) {
      try {
        await imageUploadHelpers.deleteImage(formData.imageUrl)
        logger.debug('Cancelled image deleted:', formData.imageUrl)
      } catch (error) {
        logger.error('Failed to delete cancelled image:', error)
      }
    }

    setFormData({
      title: trip.title,
      description: trip.description || '',
      destination: trip.destination || '',
      destinationPlace: trip.destination_place,
      startDate: formatDateForInput(trip.start_date),
      endDate: formatDateForInput(trip.end_date),
      accessLevel: trip.access_level,
      imageUrl: trip.image_url || '',
      defaultCurrency: trip.default_currency || 'JPY'
    })
    setIsEditing(false)
    onClose?.()
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setDeleting(true)
    try {
      await deleteTrip(trip.id)
      onDelete()
    } catch (error) {
      logger.error('Error deleting trip:', error)
      alert(t('common.deleteFailed'))
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      let newFormData: typeof prev
      if (name === 'accessLevel') {
        const nextLevel = value as 'private' | 'public'
        newFormData = {
          ...prev,
          accessLevel: nextLevel,
          isTemplate: nextLevel === 'private' ? false : prev.isTemplate
        }
      } else {
        newFormData = { ...prev, [name]: value }
      }
      
      // 出発日が変更された場合、帰宅日を自動的に出発日と同じ日にする（帰宅日が空の場合のみ）
      if (name === 'startDate' && value && !prev.endDate) {
        newFormData.endDate = value
      }
      
      return newFormData
    })
    
    // 日付が変更された場合は即座にバリデーションを実行
    if (!isTemplateMode && (name === 'startDate' || name === 'endDate')) {
      const newFormData = { ...formData, [name]: value }
      // 出発日が変更された場合、帰宅日も更新する（帰宅日が空の場合のみ）
      if (name === 'startDate' && value && !formData.endDate) {
        newFormData.endDate = value
      }
      const dateValidationError = validateDates(newFormData.startDate, newFormData.endDate)
      setDateError(dateValidationError)
    }
  }

  const handleTemplateToggle = (checked: boolean) => {
    if (disablePublishControls) {
      return
    }
    setFormData(prev => ({
      ...prev,
      isTemplate: checked,
      startDate: checked ? '' : prev.startDate,
      endDate: checked ? '' : prev.endDate,
      dayCount: checked ? (prev.dayCount && prev.dayCount > 0 ? prev.dayCount : 3) : prev.dayCount
    }))
    setDateError('')
  }

  const handleDayCountChange = (value: string) => {
    const parsed = Number(value)
    setFormData(prev => ({
      ...prev,
      dayCount: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
    }))
  }

  if (isEditing) {
    return (
      <>
        {/* 画面全体のローディングオーバーレイ（Portal） */}
        {showLoadingOverlay && createPortal(
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('FLOAT_MODAL')}`}>
            <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
              <Loading size="lg" color="blue" message={t('loading.updating')} />
              <p className="text-gray-600 text-sm">{t('loading.updatingDescription')}</p>
            </div>
          </div>,
          document.body
        )}
        
        {/* 編集モーダル（Portal） */}
        {createPortal(
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('FLOAT_MODAL')}`}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{t('tripEditor.title')}</h2>
              <button onClick={() => {
                setIsEditing(false)
                onClose?.()
              }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <IconRenderer iconName="close" className="w-6 h-6" />
              </button>
            </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {t('tripEditor.field.title')}
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('tripEditor.field.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!hideDestinationEdit && (
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                {t('tripEditor.field.destination')}
              </label>
              <PlaceSearchInput
                currentPlace={formData.destinationPlace}
                onPlaceSelect={(place) => setFormData(prev => ({ 
                  ...prev, 
                  destinationPlace: place || undefined,
                  destination: place?.name || '' // 後方互換性のため
                }))}
                placeholder={t('tripEditor.destinationPlaceholder')}
                initialText={formData.destination}
                disabled={saving}
              />
              {!formData.destinationPlace && formData.destination && (
                <p className="mt-2 text-sm text-yellow-700">
                  <span className="text-red-600 mr-1">*</span>{t('tripEditor.destinationReSelectHint')}
                </p>
              )}
            </div>
          )}

          {!disableDateFields && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tripEditor.field.startDate')}
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    lang={currentLanguage}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dateError ? 'border-red-300' : 'border-gray-300'
                    } ${isTemplateMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={isTemplateMode}
                  />
                </div>

                <div className={`${isTemplateMode ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tripEditor.field.endDate')}
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate || undefined}
                    lang={currentLanguage}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dateError ? 'border-red-300' : 'border-gray-300'
                    } ${isTemplateMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={isTemplateMode}
                  />
                </div>
              </div>

              {/* 日付エラーメッセージ */}
              {!isTemplateMode && dateError && (
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
            </>
          )}

          <div>
            <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 mb-2">
              {t('tripEditor.field.accessLevel')}
            </label>
            <select
              id="accessLevel"
              name="accessLevel"
              value={formData.accessLevel}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disablePublishControls ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300'}`}
              disabled={disablePublishControls}
            >
              <option value="private">{t('tripEditor.accessLevel.private')}</option>
              <option value="public">{t('tripEditor.accessLevel.public')}</option>
            </select>

            {formData.accessLevel === 'public' && !disablePublishControls && (
              <div className="mt-4">
                <Toggle
                  label={t('trip.create.templateMode.label')}
                  checked={formData.isTemplate}
                  onChange={(event) => handleTemplateToggle(event.target.checked)}
                  disabled={!canToggleTemplate}
                />
                <p className={`mt-1 text-xs ${publicTemplateEnabled ? 'text-gray-500' : 'text-red-500'}`}>
                  {formData.isTemplate
                    ? t('trip.create.templateMode.description.active')
                    : t('trip.create.templateMode.description.inactive')}
                </p>
                {!publicTemplateEnabled && (
                  <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                    {t('trip.template.upgradeRequired')}
                  </div>
                )}
              </div>
            )}
          </div>

          {isTemplateMode && (
            <div>
              <label htmlFor="dayCount" className="block text-sm font-medium text-gray-700 mb-2">
                {t('trip.create.dayCount.label')}
              </label>
              <input
                type="number"
                id="dayCount"
                name="dayCount"
                min={1}
                value={formData.dayCount ? String(formData.dayCount) : ''}
                onChange={(event) => handleDayCountChange(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('trip.create.dayCount.description')}
              </p>
            </div>
          )}

          <div>
            <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 mb-2">
              {t('tripEditor.field.defaultCurrency')}
            </label>
            <select
              id="defaultCurrency"
              name="defaultCurrency"
              value={formData.defaultCurrency}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  defaultCurrency: e.target.value
                }))
              }}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {/* 主要通貨を優先表示 */}
              <optgroup label={t('tripEditor.currency.major')}>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="JPY">¥ JPY (Japanese Yen)</option>
                <option value="GBP">£ GBP (British Pound)</option>
                <option value="CNY">¥ CNY (Chinese Yuan)</option>
                <option value="KRW">₩ KRW (South Korean Won)</option>
                <option value="AUD">A$ AUD (Australian Dollar)</option>
                <option value="CAD">C$ CAD (Canadian Dollar)</option>
                <option value="CHF">CHF (Swiss Franc)</option>
                <option value="SGD">S$ SGD (Singapore Dollar)</option>
              </optgroup>
              <optgroup label={t('tripEditor.currency.others')}>
                {currencyUtils.getAvailableCurrencies()
                  .filter(c => !['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'KRW', 'AUD', 'CAD', 'CHF', 'SGD'].includes(c.code))
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </option>
                  ))}
              </optgroup>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {t('tripEditor.field.defaultCurrency.hint')}
            </p>
          </div>

          <ImageUpload
            currentImageUrl={formData.imageUrl}
            onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
            tripId={trip.id}
            disabled={saving}
          />
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="px-4 py-2 text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
          >
            {t('common.delete')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !formData.title || dateError.length > 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
          </div>
        </div>, document.body)}

        {/* 削除確認ダイアログ（Portal） */}
        {showDeleteConfirm && createPortal(
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('FLOAT_MODAL')}`}>
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('tripEditor.deleteConfirm.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('tripEditor.deleteConfirm.message').replace('{title}', trip.title)}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? t('tripEditor.deleteConfirm.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>, document.body
        )}
      </>
    )
  }

  if (hideEditButton) {
    return null
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30 font-medium"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      編集
    </button>
  )
}