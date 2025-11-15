import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { storageManagementHelpers } from '@/lib/firebase/storage'
import { withAuth, badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

// GET /api/storage/quota - ユーザーのストレージ制限情報を取得
export const GET = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth
  
  const quotaCheck = await storageManagementHelpers.checkStorageQuota(userId)
  
  return NextResponse.json({
    success: true,
    data: {
      quota: quotaCheck.quota,
      canUpload: quotaCheck.canUpload,
      currentUsage: quotaCheck.currentUsage,
      usagePercentage: storageManagementHelpers.calculateUsagePercentage(
        quotaCheck.currentUsage.totalBytes,
        quotaCheck.quota.maxBytes
      ),
      formattedQuota: {
        maxBytes: storageManagementHelpers.formatFileSize(quotaCheck.quota.maxBytes),
        maxFiles: quotaCheck.quota.maxFiles,
        description: quotaCheck.quota.description
      },
      formattedUsage: {
        totalBytes: storageManagementHelpers.formatFileSize(quotaCheck.currentUsage.totalBytes),
        fileCount: quotaCheck.currentUsage.fileCount
      }
    }
  })
})

// POST /api/storage/quota - ファイルアップロード前の制限チェック
export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth
  
  const body = await parseRequestBody<{ fileSize?: number }>(request)
  const { fileSize } = body
  
  if (typeof fileSize !== 'number' || fileSize <= 0) {
    return badRequest('無効なファイルサイズです')
  }
  
  const quotaCheck = await storageManagementHelpers.checkStorageQuota(userId, fileSize)
  
  return NextResponse.json({
    success: true,
    data: {
      canUpload: quotaCheck.canUpload,
      quota: quotaCheck.quota,
      currentUsage: quotaCheck.currentUsage,
      projectedUsage: {
        totalBytes: quotaCheck.currentUsage.totalBytes + fileSize,
        fileCount: quotaCheck.currentUsage.fileCount + 1
      },
      usagePercentage: storageManagementHelpers.calculateUsagePercentage(
        quotaCheck.currentUsage.totalBytes + fileSize,
        quotaCheck.quota.maxBytes
      ),
      error: quotaCheck.error
    }
  })
})
