'use client'

import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { getCachedPlaceImage, imageCacheManager } from '@/lib/storage/image-cache'
import { placesApiHelpers } from '@/lib/api/google/places'

export default function ImageCacheTestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testPhotoReference, setTestPhotoReference] = useState('CmRaAAAA...') // 実際のphoto_referenceに置き換え

  const handleTestCache = async () => {
    if (!testPhotoReference.trim()) {
      setError('Photo referenceを入力してください')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const googlePhotoUrl = placesApiHelpers.getPhotoUrl(testPhotoReference, 300)
      
      console.log('Testing image cache with:', {
        photoReference: testPhotoReference,
        googlePhotoUrl
      })

      const startTime = Date.now()
      const cachedImage = await getCachedPlaceImage(testPhotoReference, googlePhotoUrl, {
        width: 300,
        height: 300,
        quality: 80
      })
      const endTime = Date.now()

      setResult({
        ...cachedImage,
        loadTime: endTime - startTime,
        googlePhotoUrl
      })

      console.log('Cache result:', cachedImage)
    } catch (err) {
      console.error('Cache test failed:', err)
      setError(err instanceof Error ? err.message : 'キャッシュテストに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = () => {
    imageCacheManager.clearMemoryCache()
    setResult(null)
    console.log('Memory cache cleared')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Google Places API 画像キャッシュテスト
          </h1>

          <div className="space-y-6">
            {/* テスト入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Reference
              </label>
              <input
                type="text"
                value={testPhotoReference}
                onChange={(e) => setTestPhotoReference(e.target.value)}
                placeholder="Photo referenceを入力してください"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ボタン */}
            <div className="flex space-x-4">
              <Button
                onClick={handleTestCache}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {loading ? 'テスト中...' : 'キャッシュテスト'}
              </Button>
              
              <Button
                onClick={handleClearCache}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                メモリキャッシュクリア
              </Button>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800 font-medium">エラー</div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
              </div>
            )}

            {/* 結果表示 */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-green-800 font-medium mb-2">テスト結果</div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">キャッシュ状態:</span>{' '}
                    <span className={result.cached ? 'text-green-600' : 'text-orange-600'}>
                      {result.cached ? 'キャッシュ済み' : '新規キャッシュ'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">読み込み時間:</span> {result.loadTime}ms
                  </div>
                  <div>
                    <span className="font-medium">キャッシュキー:</span>{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs">
                      {result.cacheKey}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">画像URL:</span>{' '}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs break-all"
                    >
                      {result.url}
                    </a>
                  </div>
                </div>

                {/* 画像プレビュー */}
                <div className="mt-4">
                  <div className="font-medium text-green-800 mb-2">画像プレビュー</div>
                  <div className="relative w-32 h-32 border border-gray-300 rounded overflow-hidden">
                    <img
                      src={result.url}
                      alt="キャッシュされた画像"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = result.googlePhotoUrl
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 使用説明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-blue-800 font-medium mb-2">使用方法</div>
              <div className="text-blue-600 text-sm space-y-1">
                <div>1. Google Places APIから取得したphoto_referenceを入力</div>
                <div>2. 「キャッシュテスト」ボタンをクリック</div>
                <div>3. 初回はGoogle APIから取得してキャッシュ、2回目以降はキャッシュから取得</div>
                <div>4. Firebase Storageに画像が保存され、以降は課金されません</div>
              </div>
            </div>

            {/* 技術仕様 */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="text-gray-800 font-medium mb-2">技術仕様</div>
              <div className="text-gray-600 text-sm space-y-1">
                <div>• 画像サイズ: 300x300px</div>
                <div>• 品質: 80%</div>
                <div>• フォーマット: JPEG</div>
                <div>• ストレージ: Firebase Storage</div>
                <div>• キャッシュキー形式: places-photos/{`{photoReference}_{width}x{height}_q{quality}.jpg`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
