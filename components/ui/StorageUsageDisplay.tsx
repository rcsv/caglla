'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth'
import { StorageUsage, StorageQuota } from '@/lib/core/types'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { t } from '@/lib/i18n'

interface StorageUsageDisplayProps {
  className?: string
  showDetails?: boolean
  showDeleteButtons?: boolean
}

interface StorageData {
  usage: StorageUsage
  quota: StorageQuota
  usagePercentage: number
  formattedUsage: {
    totalBytes: string
    maxBytes: string
    fileCount: number
    maxFiles: number
  }
}

export default function StorageUsageDisplay({ 
  className = '', 
  showDetails = false,
  showDeleteButtons = false
}: StorageUsageDisplayProps) {
  const [storageData, setStorageData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchStorageUsage = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Firebase IDトークンを取得
      const token = await user.getIdToken()
      
      const response = await fetch('/api/storage/usage', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()

      if (result.success) {
        setStorageData(result.data)
      } else {
        setError(result.error || t('home.dashboard.storage.fetchError'))
      }
    } catch (error) {
      logger.error('Error fetching storage usage:', error)
      setError(t('home.dashboard.storage.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchStorageUsage()
  }, [user, fetchStorageUsage])

  const deleteFile = async (fileId: string) => {
    if (!user) return

    try {
      setDeleting(fileId)
      setError(null)

      // Firebase IDトークンを取得
      const token = await user.getIdToken()
      
      const response = await fetch('/api/storage/usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'remove', fileId }),
      })

      if (!response.ok) {
        throw new Error(t('home.dashboard.storage.deleteError'))
      }

      const result = await response.json()
      if (result.success) {
        // 使用量を再取得
        await fetchStorageUsage()
      } else {
        throw new Error(result.error || t('home.dashboard.storage.deleteError'))
      }
    } catch (error: any) {
      logger.error('Error deleting file:', error)
      setError(error.message || t('home.dashboard.storage.deleteError'))
    } finally {
      setDeleting(null)
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        {error}
        <button
          onClick={fetchStorageUsage}
          className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          {t('home.dashboard.storage.retry')}
        </button>
      </div>
    )
  }

  if (!storageData) {
    return null
  }

  const { usage, quota, usagePercentage, formattedUsage } = storageData

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ja-JP')
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ストレージ使用量の概要 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {t('home.dashboard.storage.title')}
        </span>
        <span className="text-sm font-medium">
          {formattedUsage.totalBytes} / {formattedUsage.maxBytes}
        </span>
      </div>

      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            usagePercentage >= 90 
              ? 'bg-red-500' 
              : usagePercentage >= 70 
                ? 'bg-yellow-500' 
                : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        ></div>
      </div>

      {/* 使用率とファイル数 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {t('home.dashboard.storage.inUse').replace('{percentage}', usagePercentage.toFixed(1))}
        </span>
        <span>
          {usage.fileCount} / {quota.maxFiles} {t('home.dashboard.storage.files')}
        </span>
      </div>

      {/* 詳細情報 */}
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {t('home.dashboard.storage.details.title')}
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            {quota.description}
          </p>
          
          {usagePercentage >= 80 && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800 flex items-center gap-1">
              <IconRenderer iconName="warning" className="w-3 h-3" color="#d97706" />
              {t('home.dashboard.storage.details.warning').replace('{percentage}', usagePercentage >= 90 ? '90' : '80')}
              {usagePercentage >= 90 && t('home.dashboard.storage.details.upgradeSuggestion')}
            </div>
          )}

          {usagePercentage >= 100 && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800 flex items-center gap-1">
              <IconRenderer iconName="prohibition" className="w-3 h-3" color="#dc2626" />
              {t('home.dashboard.storage.details.limitReached')}
            </div>
          )}

          {/* アップロード履歴 */}
          {usage.files && usage.files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('home.dashboard.storage.details.history')}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">{t('home.dashboard.storage.details.fileName')}</th>
                      <th className="text-left p-1">{t('home.dashboard.storage.details.size')}</th>
                      <th className="text-left p-1">{t('home.dashboard.storage.details.type')}</th>
                      <th className="text-left p-1">{t('home.dashboard.storage.details.dateTime')}</th>
                      {showDeleteButtons && <th className="text-left p-1">{t('home.dashboard.storage.details.action')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {usage.files.map((file) => (
                      <tr key={file.id} className="border-b">
                        <td className="p-1 font-mono text-xs truncate max-w-20" title={file.fileName}>
                          {file.fileName}
                        </td>
                        <td className="p-1">{formatBytes(file.fileSize)}</td>
                        <td className="p-1">
                          <span className={`px-1 py-0.5 rounded text-xs ${
                            file.isAvatar 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {file.isAvatar ? t('home.dashboard.storage.details.avatar') : t('home.dashboard.storage.details.tripImage')}
                          </span>
                        </td>
                        <td className="p-1 text-xs">{formatDate(file.uploadedAt)}</td>
                        {showDeleteButtons && (
                          <td className="p-1">
                            <button
                              onClick={() => deleteFile(file.id)}
                              disabled={deleting === file.id}
                              className={`px-2 py-1 rounded text-xs ${
                                deleting === file.id
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {deleting === file.id ? t('home.dashboard.storage.details.deleting') : t('home.dashboard.storage.details.delete')}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 更新ボタン */}
          <div className="mt-3">
            <button
              onClick={fetchStorageUsage}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              {t('home.dashboard.storage.details.refresh')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}