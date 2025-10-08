'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import ImageUpload from '@/components/ui/ImageUpload'
import StorageUsageDisplay from '@/components/ui/StorageUsageDisplay'
import { StorageUsage, StorageQuota, StorageFile } from '@/lib/types'

interface StorageTestData {
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

export default function StorageTestPage() {
  const [storageData, setStorageData] = useState<StorageTestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null)
  const [testFileId, setTestFileId] = useState<string | null>(null)
  const [uploadHistory, setUploadHistory] = useState<StorageFile[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchStorageData()
  }, [user])

  const fetchStorageData = async () => {
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
        setUploadHistory(result.data.usage.files)
      } else {
        setError(result.error || 'ストレージ使用量の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching storage data:', error)
      setError('ストレージ使用量の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (imageUrl: string | null) => {
    setTestImageUrl(imageUrl)
    // ストレージデータを再取得
    fetchStorageData()
  }

  const handleFileIdChange = (fileId: string | null) => {
    setTestFileId(fileId)
  }

  const handleRemoveImage = async () => {
    if (testImageUrl) {
      try {
        const token = await user.getIdToken()
        
        const response = await fetch('/api/storage/usage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'remove',
            fileId: testFileId
          })
        })

        const result = await response.json()
        if (result.success) {
          setTestImageUrl(null)
          setTestFileId(null)
          fetchStorageData()
        } else {
          setError(result.error || 'ファイルの削除に失敗しました')
        }
      } catch (error) {
        console.error('Error removing file:', error)
        setError('ファイルの削除に失敗しました')
      }
    }
  }

  const testQuotaCheck = async (fileSize: number) => {
    try {
      const token = await user.getIdToken()
      
      const response = await fetch('/api/storage/quota', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileSize })
      })

      const result = await response.json()
      if (result.success) {
        alert(`ファイルサイズ: ${(fileSize / 1024 / 1024).toFixed(2)}MB\nアップロード可能: ${result.data.canUpload ? 'はい' : 'いいえ'}\n${result.data.error || ''}`)
      } else {
        alert(`エラー: ${result.error}`)
      }
    } catch (error) {
      console.error('Error testing quota:', error)
      alert('制限チェックのテストに失敗しました')
    }
  }

  const resetStorage = async () => {
    if (!confirm('ストレージ使用量をリセットしますか？この操作は元に戻せません。')) {
      return
    }

    try {
      const token = await user.getIdToken()
      
      const response = await fetch('/api/storage/usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' })
      })

      const result = await response.json()
      if (result.success) {
        alert('ストレージ使用量をリセットしました')
        setTestImageUrl(null)
        setTestFileId(null)
        fetchStorageData()
      } else {
        alert(`エラー: ${result.error}`)
      }
    } catch (error) {
      console.error('Error resetting storage:', error)
      alert('ストレージのリセットに失敗しました')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ストレージテストページ
            </h1>
            <p className="text-gray-600">
              ログインが必要です。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ストレージテストページ
          </h1>
          <p className="text-gray-600 mb-6">
            ファイルアップロード時のストレージ使用量追跡機能をテストできます。
          </p>

          {/* ストレージ使用量表示 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              現在のストレージ使用量
            </h2>
            <StorageUsageDisplay showDetails={true} showDeleteButtons={true} />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* テスト用画像アップロード */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              テスト用画像アップロード
            </h2>
            <ImageUpload
              currentImageUrl={testImageUrl}
              onImageChange={handleImageChange}
              onFileIdChange={handleFileIdChange}
              disabled={loading}
            />
            
            {testImageUrl && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">アップロード情報</h3>
                <p className="text-sm text-blue-700">
                  ファイルID: {testFileId}
                </p>
                <button
                  onClick={handleRemoveImage}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
                >
                  テスト画像を削除
                </button>
              </div>
            )}
          </div>

          {/* 制限チェックテスト */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              ストレージ制限チェックテスト
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => testQuotaCheck(1024 * 1024)} // 1MB
                className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
              >
                1MBファイルの制限チェック
              </button>
              <button
                onClick={() => testQuotaCheck(10 * 1024 * 1024)} // 10MB
                className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
              >
                10MBファイルの制限チェック
              </button>
              <button
                onClick={() => testQuotaCheck(100 * 1024 * 1024)} // 100MB
                className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
              >
                100MBファイルの制限チェック
              </button>
            </div>
          </div>

          {/* アップロード履歴 */}
          {uploadHistory.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                アップロード履歴
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ファイル名
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        サイズ
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        タイプ
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アップロード日時
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        種類
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {uploadHistory.map((file) => (
                      <tr key={file.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {file.fileName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {file.fileType}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(file.uploadedAt).toLocaleString('ja-JP')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {file.isAvatar ? 'アバター' : file.tripId ? '旅行画像' : 'その他'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 管理機能 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              管理機能
            </h2>
            <div className="space-y-2">
              <button
                onClick={fetchStorageData}
                disabled={loading}
                className="mr-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 disabled:opacity-50"
              >
                {loading ? '更新中...' : 'データを更新'}
              </button>
              <button
                onClick={resetStorage}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
              >
                ストレージ使用量をリセット
              </button>
            </div>
          </div>

          {/* デバッグ情報 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              デバッグ情報
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(storageData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
