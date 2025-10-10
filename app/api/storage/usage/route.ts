import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { storageManagementHelpers } from '@/lib/storage-management'
import { verifyIdToken } from '@/lib/firebase-admin'

// GET /api/storage/usage - ユーザーのストレージ使用量を取得
export async function GET(request: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await verifyIdToken(token)
    
    const usage = await storageManagementHelpers.getUserStorageUsage(decodedToken.uid)
    const quotaCheck = await storageManagementHelpers.checkStorageQuota(decodedToken.uid)
    
    return NextResponse.json({
      success: true,
      data: {
        usage,
        quota: quotaCheck.quota,
        usagePercentage: storageManagementHelpers.calculateUsagePercentage(
          usage.totalBytes, 
          quotaCheck.quota.maxBytes
        ),
        formattedUsage: {
          totalBytes: storageManagementHelpers.formatFileSize(usage.totalBytes),
          maxBytes: storageManagementHelpers.formatFileSize(quotaCheck.quota.maxBytes),
          fileCount: usage.fileCount,
          maxFiles: quotaCheck.quota.maxFiles
        }
      }
    })
  } catch (error) {
    logger.error('Error getting storage usage:', error)
    return NextResponse.json(
      { success: false, error: 'ストレージ使用量の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/storage/usage - ストレージ使用量を手動で更新（管理者用）
export async function POST(request: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await verifyIdToken(token)
    
    const body = await request.json()
    const { action, fileId, file } = body
    
    if (action === 'reset') {
      // 開発環境では誰でもリセット可能、本番環境では管理者のみ
      const isDevelopment = process.env.NODE_ENV === 'development'
      if (!isDevelopment && decodedToken.planId !== 'enterprise') {
        return NextResponse.json(
          { success: false, error: '権限がありません' },
          { status: 403 }
        )
      }
      
      const result = await storageManagementHelpers.resetUserStorageUsage(decodedToken.uid)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'ストレージ使用量をリセットしました'
      })
    } else if (action === 'add' && file) {
      // ファイルをストレージ使用量に追加
      const result = await storageManagementHelpers.addFileToStorageUsage(decodedToken.uid, file)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'ファイルをストレージ使用量に追加しました'
      })
    } else if (action === 'remove' && fileId) {
      // ファイルをストレージ使用量から削除
      const result = await storageManagementHelpers.removeFileFromStorageUsage(decodedToken.uid, fileId)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'ファイルをストレージ使用量から削除しました'
      })
    }
    
    return NextResponse.json(
      { success: false, error: '無効なアクションです' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error updating storage usage:', error)
    return NextResponse.json(
      { success: false, error: 'ストレージ使用量の更新に失敗しました' },
      { status: 500 }
    )
  }
}
