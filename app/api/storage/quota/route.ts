import { NextRequest, NextResponse } from 'next/server'
import { storageManagementHelpers } from '@/lib/storage-management'
import { verifyIdToken } from '@/lib/firebase-admin'

// GET /api/storage/quota - ユーザーのストレージ制限情報を取得
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
    
    const quotaCheck = await storageManagementHelpers.checkStorageQuota(decodedToken.uid)
    
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
  } catch (error) {
    console.error('Error getting storage quota:', error)
    return NextResponse.json(
      { success: false, error: 'ストレージ制限情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/storage/quota - ファイルアップロード前の制限チェック
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
    const { fileSize } = body
    
    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { success: false, error: '無効なファイルサイズです' },
        { status: 400 }
      )
    }
    
    const quotaCheck = await storageManagementHelpers.checkStorageQuota(decodedToken.uid, fileSize)
    
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
  } catch (error) {
    console.error('Error checking storage quota:', error)
    return NextResponse.json(
      { success: false, error: 'ストレージ制限の確認に失敗しました' },
      { status: 500 }
    )
  }
}
