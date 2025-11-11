/**
 * PDFデザインプレビューページ
 * 開発者向けのPDFデザイン確認ツール
 * 
 * URL: /dev-tools/pdf-preview/[tripSlug]
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth'
import logger from '@/lib/core/logger'
import Loading from '@/components/common/Loading'
import { t } from '@/lib/i18n'

export default function PdfPreviewPage() {
  const { tripSlug } = useParams()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !user || !tripSlug) return

    const loadPreview = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const token = await user.getIdToken()
        if (!token) {
          throw new Error('認証トークンの取得に失敗しました')
        }

        // プレビューAPIのURLを生成
        const apiUrl = `/api/trips/${tripSlug}/preview`
        const fullUrl = `${window.location.origin}${apiUrl}`
        
        logger.debug('PDF Preview: generating preview URL', { 
          tripSlug, 
          apiUrl, 
          fullUrl 
        })

        setPreviewUrl(fullUrl)
        
        // 認証ヘッダー付きでプレビューを開く
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'プレビューの読み込みに失敗しました')
        }

        // プレビューを新しいタブで開く
        const previewWindow = window.open('', '_blank')
        if (previewWindow) {
          const html = await response.text()
          previewWindow.document.write(html)
          previewWindow.document.close()
        }

      } catch (err) {
        logger.error('PDF Preview: error loading preview', err)
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreview()
  }, [user, tripSlug, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="md" color="blue" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 mt-4">
            {t('loading.message')}
          </h1>
          <p className="text-gray-600">認証状態を確認しています…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ログインが必要です
          </h1>
          <p className="text-gray-600">
            プレビュー機能を使用するにはログインしてください。
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="md" color="blue" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2 mt-4">
            {t('loading.message')}
          </h1>
          <p className="text-gray-600">
            トリップ: {tripSlug}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            プレビューの読み込みに失敗しました
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 再試行
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          プレビューが開かれました
        </h1>
        <p className="text-gray-600 mb-6">
          新しいタブでPDFデザインのプレビューが表示されています。
        </p>
        
        <div className="bg-white p-4 rounded-lg border mb-6">
          <h3 className="font-bold text-gray-900 mb-2">プレビューURL</h3>
          <code className="text-sm text-gray-600 break-all">
            {previewUrl}
          </code>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              if (previewUrl) {
                window.open(previewUrl, '_blank')
              }
            }}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔗 プレビューを再表示
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← 戻る
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>💡 プレビューでは以下の機能が利用できます：</p>
          <ul className="text-left mt-2 space-y-1">
            <li>• 🖨️ 印刷プレビュー（PDF出力時の見た目確認）</li>
            <li>• 🔄 リロード（最新データで更新）</li>
            <li>• ❌ 閉じる（プレビューを閉じる）</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
