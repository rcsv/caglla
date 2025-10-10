import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'
import { StorageFile } from './types'
import logger from './logger'

// ストレージ制限チェック用のAPI呼び出し
async function checkStorageQuota(userId: string, fileSize: number): Promise<{ canUpload: boolean; error?: string }> {
  try {
    const token = await getAuthToken()
    const response = await fetch('/api/storage/quota', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileSize })
    })
    
    const result = await response.json()
    return {
      canUpload: result.success ? result.data.canUpload : false,
      error: result.success ? result.data.error : result.error
    }
  } catch (error) {
    logger.error('Error checking storage quota:', error)
    return { canUpload: false, error: 'ストレージ制限の確認に失敗しました' }
  }
}

// ストレージ使用量更新用のAPI呼び出し
async function updateStorageUsage(userId: string, file: StorageFile): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAuthToken()
    const response = await fetch('/api/storage/usage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'add', file })
    })
    
    const result = await response.json()
    return {
      success: result.success,
      error: result.error
    }
  } catch (error) {
    logger.error('Error updating storage usage:', error)
    return { success: false, error: 'ストレージ使用量の更新に失敗しました' }
  }
}

// Firebase IDトークンを取得
async function getAuthToken(): Promise<string> {
  const { auth } = await import('./firebase')
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  return await user.getIdToken()
}

export const imageUploadHelpers = {
  // Upload image to Firebase Storage with storage tracking
  async uploadImage(file: File, path: string, userId: string, tripId?: string, isAvatar?: boolean): Promise<{ downloadURL: string; fileId: string }> {
    try {
      logger.debug('Firebase Storage upload starting...')
      logger.debug('File:', file.name, 'Size:', file.size, 'Type:', file.type)
      logger.debug('Path:', path)
      logger.debug('UserId:', userId)
      
      // ストレージ制限をチェック
      const quotaCheck = await checkStorageQuota(userId, file.size)
      if (!quotaCheck.canUpload) {
        throw new Error(`ストレージ制限を超えています: ${quotaCheck.error}`)
      }
      
      // Create a reference to the file
      const imageRef = ref(storage, path)
      logger.debug('Storage reference created:', imageRef.fullPath)
      
      // Upload the file
      logger.debug('Starting upload...')
      const snapshot = await uploadBytes(imageRef, file)
      logger.debug('Upload completed, snapshot:', snapshot)
      
      // Get the download URL
      logger.debug('Getting download URL...')
      const downloadURL = await getDownloadURL(snapshot.ref)
      logger.debug('Download URL obtained:', downloadURL)
      
      // ストレージ使用量を追跡
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const storageFile: StorageFile = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storagePath: path,
        downloadUrl: downloadURL,
        uploadedAt: new Date(),
        tripId,
        isAvatar
      }
      
      const addResult = await updateStorageUsage(userId, storageFile)
      if (!addResult.success) {
        logger.warn('Failed to track storage usage:', addResult.error)
        // アップロードは成功したが、追跡に失敗した場合は警告のみ
      }
      
      return { downloadURL, fileId }
    } catch (error) {
      logger.error('Detailed Firebase Storage error:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          throw new Error('認証エラー: Firebase Storageへのアクセス権限がありません')
        } else if (error.message.includes('storage/canceled')) {
          throw new Error('アップロードがキャンセルされました')
        } else if (error.message.includes('storage/unknown')) {
          throw new Error('不明なエラーが発生しました')
        } else if (error.message.includes('storage/invalid-argument')) {
          throw new Error('無効な引数です')
        } else if (error.message.includes('storage/invalid-checksum')) {
          throw new Error('ファイルのチェックサムが無効です')
        } else if (error.message.includes('storage/invalid-format')) {
          throw new Error('ファイル形式が無効です')
        } else if (error.message.includes('storage/invalid-name')) {
          throw new Error('ファイル名が無効です')
        } else if (error.message.includes('storage/object-not-found')) {
          throw new Error('ファイルが見つかりません')
        } else if (error.message.includes('storage/project-not-found')) {
          throw new Error('Firebase プロジェクトが見つかりません')
        } else if (error.message.includes('storage/quota-exceeded')) {
          throw new Error('ストレージの容量制限を超えました')
        } else if (error.message.includes('storage/unauthenticated')) {
          throw new Error('認証されていません')
        } else {
          throw new Error(`アップロードエラー: ${error.message}`)
        }
      }
      
      throw new Error('画像のアップロードに失敗しました')
    }
  },

  // Legacy method for backward compatibility
  async uploadImageLegacy(file: File, path: string): Promise<string> {
    const result = await this.uploadImage(file, path, 'anonymous', undefined, false)
    return result.downloadURL
  },

  // Delete image from Firebase Storage with storage tracking
  async deleteImage(imageUrl: string, userId?: string, fileId?: string): Promise<void> {
    try {
      // Check if imageUrl is valid
      if (!imageUrl || typeof imageUrl !== 'string') {
        logger.warn('Invalid imageUrl provided to deleteImage:', imageUrl)
        return
      }

      logger.debug('Attempting to delete image with URL:', imageUrl)

      // Extract the path from the URL with better error handling
      let path: string
      try {
        const url = new URL(imageUrl)
        logger.debug('Parsed URL pathname:', url.pathname)
        
        // Check if this is a Firebase Storage URL
        if (!url.pathname.includes('/o/')) {
          logger.warn('URL does not appear to be a Firebase Storage URL:', imageUrl)
          return
        }
        
        const pathParts = url.pathname.split('/o/')
        if (pathParts.length < 2) {
          logger.warn('Invalid Firebase Storage URL format:', imageUrl)
          return
        }
        
        const pathWithParams = pathParts[1]
        if (!pathWithParams) {
          logger.warn('No path found in Firebase Storage URL:', imageUrl)
          return
        }
        
        // Remove query parameters
        path = decodeURIComponent(pathWithParams.split('?')[0])
        logger.debug('Extracted path:', path)
        
        if (!path) {
          logger.warn('Empty path extracted from URL:', imageUrl)
          return
        }
      } catch (urlError) {
        logger.error('Error parsing image URL:', urlError)
        logger.error('Problematic URL:', imageUrl)
        return
      }
      
      // Create a reference to the file
      const imageRef = ref(storage, path)
      logger.debug('Created storage reference:', imageRef.fullPath)
      
      // Delete the file
      await deleteObject(imageRef)
      logger.debug('Successfully deleted image from storage')
      
      // ストレージ使用量からも削除
      if (userId && fileId) {
        try {
          const token = await getAuthToken()
          const response = await fetch('/api/storage/usage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'remove', fileId })
          })
          
          const result = await response.json()
          if (!result.success) {
            logger.warn('Failed to update storage usage after deletion:', result.error)
          } else {
            logger.debug('Successfully updated storage usage after deletion')
          }
        } catch (error) {
          logger.warn('Failed to update storage usage after deletion:', error)
        }
      }
    } catch (error) {
      logger.error('Error deleting image:', error)
      throw error
    }
  },

  // Generate unique path for trip images
  generateTripImagePath(tripId: string, fileName: string): string {
    const timestamp = Date.now()
    const extension = fileName.split('.').pop()
    return `trips/${tripId}/images/${timestamp}.${extension}`
  },

  // Generate unique path for user avatar images
  generateAvatarImagePath(userId: string, fileName: string): string {
    const timestamp = Date.now()
    const extension = fileName.split('.').pop()
    return `users/${userId}/avatar/${timestamp}.${extension}`
  },

  // Validate image file
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'JPEG、PNG、WebP形式の画像のみアップロードできます'
      }
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '画像サイズは5MB以下にしてください'
      }
    }
    
    return { valid: true }
  }
}
