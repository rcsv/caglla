'use client'
import logger from '@/lib/core/logger'

import { useState, useRef } from 'react'
import { imageUploadHelpers } from '@/lib/image-upload'
import { useAuth } from '@/lib/contexts/auth'

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  tripId?: string
  disabled?: boolean
  fileId?: string
  onFileIdChange?: (fileId: string | null) => void
}

export default function ImageUpload({ 
  currentImageUrl, 
  onImageChange, 
  tripId, 
  disabled, 
  fileId,
  onFileIdChange 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const processFile = async (file: File) => {
    // Validate file
    const validation = imageUploadHelpers.validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || '無効なファイルです')
      return
    }

    if (!user) {
      setError('ログインが必要です')
      return
    }

    // デバッグ: ユーザー情報を確認
    logger.debug('User object:', user)
    logger.debug('User ID:', user.id)
    logger.debug('User UID:', user.uid)
    
    if (!user.id && !user.uid) {
      setError('ユーザーIDが取得できません。ログインし直してください。')
      return
    }

    setError(null)
    setUploading(true)

    try {
      logger.debug('Starting image upload for file:', file.name, 'Size:', file.size)
      
      // Generate path for the image
      const userId = user.id || user.uid
      const path = tripId 
        ? imageUploadHelpers.generateTripImagePath(tripId, file.name)
        : imageUploadHelpers.generateAvatarImagePath(userId, file.name)

      logger.debug('Upload path:', path)

      // Upload image with storage tracking
      const result = await imageUploadHelpers.uploadImage(
        file, 
        path, 
        userId, 
        tripId, 
        !tripId // isAvatar if no tripId
      )
      
      logger.debug('Upload successful, URL:', result.downloadURL, 'FileId:', result.fileId)
      
      onImageChange(result.downloadURL)
      if (onFileIdChange) {
        onFileIdChange(result.fileId)
      }
    } catch (error) {
      logger.error('Detailed upload error:', error)
      setError(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) {
      logger.warn('No image URL to remove')
      return
    }

    try {
      logger.debug('Starting image removal process...')
      logger.debug('Current image URL:', currentImageUrl)
      logger.debug('User ID:', user?.id || user?.uid)
      logger.debug('File ID:', fileId)

      const userId = user?.id || user?.uid
      if (!userId) {
        setError('ユーザー情報が取得できません。ログインし直してください。')
        return
      }

      await imageUploadHelpers.deleteImage(
        currentImageUrl, 
        userId, 
        fileId
      )
      
      logger.debug('Image deletion successful, updating UI...')
      onImageChange(null)
      if (onFileIdChange) {
        onFileIdChange(null)
      }
      setError(null) // Clear any previous errors
    } catch (error) {
      logger.error('Error deleting image:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'
      setError(`画像の削除に失敗しました: ${errorMessage}`)
    }
  }

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      await processFile(file)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          旅行の画像
        </label>
        
        {currentImageUrl ? (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={currentImageUrl}
                alt="旅行画像"
                className="w-full h-48 object-cover rounded-lg border border-gray-300"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition duration-200"
                  disabled={uploading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={uploading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {uploading ? 'アップロード中...' : '別の画像を選択'}
              </button>
            )}
          </div>
        ) : (
          <div
            onClick={handleButtonClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-sm">
              {uploading ? 'アップロード中...' : isDragOver ? 'ここに画像をドロップ' : '画像をクリックまたはドラッグ&ドロップしてアップロード'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              JPEG、PNG、WebP形式（5MB以下）
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
