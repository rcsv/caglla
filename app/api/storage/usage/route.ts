import { NextRequest, NextResponse } from 'next/server'
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
    console.error('Error getting storage usage:', error)
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
    const { action, fileId } = body
    
    if (action === 'reset') {
      // 管理者のみストレージ使用量をリセット可能
      if (decodedToken.planId !== 'enterprise') {
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
    }
    
    return NextResponse.json(
      { success: false, error: '無効なアクションです' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating storage usage:', error)
    return NextResponse.json(
      { success: false, error: 'ストレージ使用量の更新に失敗しました' },
      { status: 500 }
    )
  }
}
