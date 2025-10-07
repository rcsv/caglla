'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '@/components/common/icons/CloseIcon'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { dateUtils } from '@/lib/date-utils'
import ImageUpload from './ImageUpload'
import { imageUploadHelpers } from '@/lib/image-upload'
import PlaceSearchInput from '@/components/common/PlaceSearchInput'
import type { Trip, Day, Itinerary, TripEditorProps } from '@/lib/types'
import { getZIndexClass, getZIndex } from '@/lib/z-index-layers'

export default function TripEditor({ trip, onUpdate, onDelete }: TripEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
      console.error('Error formatting date:', error)
      return ''
    }
  }

  const [formData, setFormData] = useState({
    title: trip.title,
    description: trip.description || '',
    destination: trip.destination || '',
    destinationPlace: trip.destination_place,
    startDate: formatDateForInput(trip.start_date),
    endDate: formatDateForInput(trip.end_date),
    accessLevel: trip.access_level,
    imageUrl: trip.image_url || ''
  })
  const [saving, setSaving] = useState(false)
  const [originalImageUrl, setOriginalImageUrl] = useState(trip.image_url || '')
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false)
  const [dateError, setDateError] = useState('')

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

  // tripが変更された時にformDataを更新（編集モードでない場合のみ）
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        title: trip.title,
        description: trip.description || '',
        destination: trip.destination || '',
        destinationPlace: trip.destination_place,
        startDate: formatDateForInput(trip.start_date),
        endDate: formatDateForInput(trip.end_date),
        accessLevel: trip.access_level,
        imageUrl: trip.image_url || ''
      })
      setOriginalImageUrl(trip.image_url || '')
    }
  }, [trip, isEditing])

  const handleSave = async () => {
    // 日付のバリデーション
    const dateValidationError = validateDates(formData.startDate, formData.endDate)
    if (dateValidationError) {
      setDateError(dateValidationError)
      return
    }
    setDateError('')

    setSaving(true)
    setShowLoadingOverlay(true)
    
    try {
      const response = await makeAuthenticatedRequest(`/api/trip/${trip.id}`, {
        method: 'PUT',
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
        // 古い画像を削除（新しい画像がアップロードされた場合）
        if (originalImageUrl && originalImageUrl !== formData.imageUrl) {
          try {
            await imageUploadHelpers.deleteImage(originalImageUrl)
            console.log('Old image deleted:', originalImageUrl)
          } catch (error) {
            console.error('Failed to delete old image:', error)
            // エラーが発生しても処理は続行
          }
        }

        // 最新のtripデータを取得
        const tripResponse = await makeAuthenticatedRequest(`/api/trip/${trip.id}`)
        if (tripResponse.ok) {
          const latestTripData = await tripResponse.json()
          
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
            start_date: formData.startDate,
            end_date: formData.endDate,
            access_level: formData.accessLevel,
            image_url: formData.imageUrl,
            updated_at: new Date().toISOString()
          }
          onUpdate(updatedTrip)
        }
        
        // 編集モードを終了
        setIsEditing(false)
      } else {
        console.error('Failed to update trip')
      }
    } catch (error) {
      console.error('Error updating trip:', error)
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
        console.log('Cancelled image deleted:', formData.imageUrl)
      } catch (error) {
        console.error('Failed to delete cancelled image:', error)
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
      imageUrl: trip.image_url || ''
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setDeleting(true)
    try {
      const response = await makeAuthenticatedRequest(`/api/trip/${trip.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onDelete()
      } else {
        console.error('Failed to delete trip')
        alert('旅行の削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('旅行の削除中にエラーが発生しました')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
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

  if (isEditing) {
    return (
      <>
        {/* 画面全体のローディングオーバーレイ（Portal） */}
        {showLoadingOverlay && createPortal(
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('FLOAT_MODAL', 1)}`} style={{ zIndex: getZIndex('FLOAT_MODAL', 1) }}>
            <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4 shadow-xl">
              {/* 回転プログレスバー */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-medium text-lg">保存中...</p>
                <p className="text-gray-600 text-sm">日程を更新しています</p>
              </div>
            </div>
          </div>,
          document.body
        )}
        
        {/* 編集モーダル（Portal） */}
        {createPortal(
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('FLOAT_MODAL')}`} style={{ zIndex: getZIndex('FLOAT_MODAL') }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">旅行情報を編集</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              旅行のタイトル *
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
              説明
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
              disabled={saving}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="例: 沖縄県那覇市"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                出発日
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  dateError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                帰宅日
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
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
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="px-4 py-2 text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
          >
            削除
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !formData.title || dateError}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
          </div>
        </div>, document.body)}

        {/* 削除確認ダイアログ（Portal） */}
        {showDeleteConfirm && createPortal(
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${getZIndexClass('FLOAT_MODAL', 2)}`} style={{ zIndex: getZIndex('FLOAT_MODAL', 2) }}>
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                旅行を削除しますか？
              </h3>
              <p className="text-gray-600 mb-6">
                「{trip.title}」を削除します。この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>, document.body
        )}
      </>
    )
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
