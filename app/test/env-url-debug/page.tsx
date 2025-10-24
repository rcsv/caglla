'use client'

import { useState, useEffect } from 'react'
import { getEnvironmentInfo } from '@/lib/utils/app-url'

/**
 * 環境変数デバッグページ
 * APP_URLの自動切り替え動作を確認するためのテストページ
 */
export default function EnvironmentDebugPage() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setEnvInfo(getEnvironmentInfo())
  }, [])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 環境変数デバッグ</h1>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">現在の環境情報</h2>
        <div className="space-y-2">
          <div><strong>Node Environment:</strong> {envInfo?.nodeEnv}</div>
          <div><strong>App URL:</strong> <code className="bg-white px-2 py-1 rounded">{envInfo?.appUrl}</code></div>
          <div><strong>Vercel URL:</strong> {envInfo?.vercelUrl || '未設定'}</div>
          <div><strong>Firebase App Hosting URL:</strong> {envInfo?.firebaseAppHostingUrl || '未設定'}</div>
          <div><strong>明示的なAPP_URL:</strong> {envInfo?.explicitAppUrl || '未設定'}</div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">🎯 APP_URL自動切り替えルール</h2>
        <div className="space-y-2 text-sm">
          <div><strong>1. 優先順位:</strong> NEXT_PUBLIC_APP_URL環境変数 > 自動判定</div>
          <div><strong>2. 本番環境:</strong> Firebase App Hosting → Vercel → デフォルト本番URL</div>
          <div><strong>3. 開発環境:</strong> http://localhost:3000</div>
          <div><strong>4. その他:</strong> http://localhost:3000</div>
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">✅ 使用方法</h2>
        <div className="space-y-2 text-sm">
          <div><strong>APIルート:</strong> <code>import {`{ generateTripUrl }`} from '@/lib/utils/app-url'</code></div>
          <div><strong>トリップURL生成:</strong> <code>generateTripUrl(userSlug, tripSlug)</code></div>
          <div><strong>環境情報取得:</strong> <code>getEnvironmentInfo()</code></div>
        </div>
      </div>
    </div>
  )
}
