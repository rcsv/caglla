import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'
import { storageManagementHelpers } from './storage-management'
import { StorageFile } from './types'

export const imageUploadHelpers = {
  // Upload image to Firebase Storage with storage tracking
  async uploadImage(file: File, path: string, userId: string, tripId?: string, isAvatar?: boolean): Promise<{ downloadURL: string; fileId: string }> {
    try {
      console.log('Firebase Storage upload starting...')
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
      console.log('Path:', path)
      console.log('UserId:', userId)
      
      // ストレージ制限をチェック
      const quotaCheck = await storageManagementHelpers.checkStorageQuota(userId, file.size)
      if (!quotaCheck.canUpload) {
        throw new Error(`ストレージ制限を超えています: ${quotaCheck.error}`)
      }
      
      // Create a reference to the file
      const imageRef = ref(storage, path)
      console.log('Storage reference created:', imageRef.fullPath)
      
      // Upload the file
      console.log('Starting upload...')
      const snapshot = await uploadBytes(imageRef, file)
      console.log('Upload completed, snapshot:', snapshot)
      
      // Get the download URL
      console.log('Getting download URL...')
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log('Download URL obtained:', downloadURL)
      
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
      
      const addResult = await storageManagementHelpers.addFileToStorageUsage(userId, storageFile)
      if (!addResult.success) {
        console.warn('Failed to track storage usage:', addResult.error)
        // アップロードは成功したが、追跡に失敗した場合は警告のみ
      }
      
      return { downloadURL, fileId }
    } catch (error) {
      console.error('Detailed Firebase Storage error:', error)
      
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
      // Extract the path from the URL
      const url = new URL(imageUrl)
      const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0])
      
      // Create a reference to the file
      const imageRef = ref(storage, path)
      
      // Delete the file
      await deleteObject(imageRef)
      
      // ストレージ使用量からも削除
      if (userId && fileId) {
        const removeResult = await storageManagementHelpers.removeFileFromStorageUsage(userId, fileId)
        if (!removeResult.success) {
          console.warn('Failed to update storage usage after deletion:', removeResult.error)
        }
      }
    } catch (error) {
      console.error('Error deleting image:', error)
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
