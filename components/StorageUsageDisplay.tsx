'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { StorageUsage, StorageQuota } from '@/lib/types'

interface StorageUsageDisplayProps {
  className?: string
  showDetails?: boolean
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
  showDetails = false 
}: StorageUsageDisplayProps) {
  const [storageData, setStorageData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchStorageUsage()
  }, [user])

  const fetchStorageUsage = async () => {
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
        setError(result.error || 'ストレージ使用量の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching storage usage:', error)
      setError('ストレージ使用量の取得に失敗しました')
    } finally {
      setLoading(false)
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
      </div>
    )
  }

  if (!storageData) {
    return null
  }

  const { usage, quota, usagePercentage, formattedUsage } = storageData

  return (
    <div className={`space-y-2 ${className}`}>
      {/* ストレージ使用量の概要 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          ストレージ使用量
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
          {usagePercentage.toFixed(1)}% 使用中
        </span>
        <span>
          {usage.fileCount} / {quota.maxFiles} ファイル
        </span>
      </div>

      {/* 詳細情報 */}
      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            プラン詳細
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            {quota.description}
          </p>
          
          {usagePercentage >= 80 && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
              ⚠️ ストレージ使用量が{usagePercentage >= 90 ? '90%' : '80%'}を超えています。
              {usagePercentage >= 90 && ' プランのアップグレードを検討してください。'}
            </div>
          )}

          {usagePercentage >= 100 && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
              🚫 ストレージ制限に達しています。ファイルを削除するか、プランをアップグレードしてください。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
