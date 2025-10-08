'use client'

import { useState, useRef } from 'react'
import { imageUploadHelpers } from '@/lib/image-upload'

interface AvatarUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  userId: string
  disabled?: boolean
}

export default function AvatarUpload({ currentImageUrl, onImageChange, userId, disabled }: AvatarUploadProps) {
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
      console.log('Starting avatar upload for file:', file.name, 'Size:', file.size)
      
      // Generate path for the avatar image
      const path = imageUploadHelpers.generateAvatarImagePath(userId, file.name)
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
          プロフィール画像
        </label>
        
        <div className="flex items-center space-x-4">
          {/* Avatar Display */}
          <div className="relative">
            {currentImageUrl ? (
              <div className="relative">
                <img
                  src={currentImageUrl}
                  alt="プロフィール画像"
                  className="w-20 h-20 object-cover rounded-full border-2 border-gray-300"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition duration-200"
                    disabled={uploading}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={uploading || disabled}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed"
            >
              {uploading ? 'アップロード中...' : currentImageUrl ? '画像を変更' : '画像をアップロード'}
            </button>
            <p className="text-gray-500 text-xs mt-1">
              JPEG、PNG、WebP形式（5MB以下）
            </p>
          </div>
        </div>
        
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
