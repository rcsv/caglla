'use client'

import { useState, useRef } from 'react'
import { imageUploadHelpers } from '@/lib/image-upload'

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  tripId?: string
  disabled?: boolean
}

export default function ImageUpload({ currentImageUrl, onImageChange, tripId, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = imageUploadHelpers.validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || '無効なファイルです')
      return
    }

    setError(null)
    setUploading(true)

    try {
      console.log('Starting image upload for file:', file.name, 'Size:', file.size)
      
      // Generate path for the image
      const path = tripId 
        ? imageUploadHelpers.generateTripImagePath(tripId, file.name)
        : `temp/${Date.now()}_${file.name}`

      console.log('Upload path:', path)

      // Upload image
      const imageUrl = await imageUploadHelpers.uploadImage(file, path)
      console.log('Upload successful, URL:', imageUrl)
      
      onImageChange(imageUrl)
    } catch (error) {
      console.error('Detailed upload error:', error)
      setError(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (currentImageUrl) {
      try {
        await imageUploadHelpers.deleteImage(currentImageUrl)
        onImageChange(null)
      } catch (error) {
        console.error('Error deleting image:', error)
        setError('画像の削除に失敗しました')
      }
    }
  }

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
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
            className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition duration-200 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-sm">
              {uploading ? 'アップロード中...' : '画像をクリックしてアップロード'}
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
