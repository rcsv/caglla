'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/auth'

export default function DevToolsIndex() {
  const { user, loading } = useAuth()

  // 認証チェック
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">認証が必要です</h1>
          <p className="text-gray-600">このページにアクセスするにはログインが必要です。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">開発者ツール</h1>
        <p className="text-gray-600">Caglla Travel Manager の開発・テスト用ツール</p>
        <div className="mt-2 text-sm text-blue-600">
          ログインユーザー: {user.displayName || user.email}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* スケジュール挿入テスト */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">スケジュール挿入テスト</h2>
          <p className="text-gray-600 mb-4">
            新しいスケジュール挿入機能の動作確認を行います。
          </p>
          <Link 
            href="/dev-tools/schedule-insertion"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            テストを実行
          </Link>
        </div>

        {/* ルート最適化テスト */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">ルート最適化テスト</h2>
          <p className="text-gray-600 mb-4">
            ルート最適化機能の動作確認を行います。
          </p>
          <Link 
            href="/test/route-optimization"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            テストを実行
          </Link>
        </div>

        {/* プラン制限テスト */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">プラン制限テスト</h2>
          <p className="text-gray-600 mb-4">
            プラン制限機能の動作確認を行います。
          </p>
          <Link 
            href="/test/plan-limits"
            className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
          >
            テストを実行
          </Link>
        </div>

        {/* ストレージテスト */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">ストレージテスト</h2>
          <p className="text-gray-600 mb-4">
            ストレージ使用量の確認を行います。
          </p>
          <Link 
            href="/test/storage"
            className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
          >
            テストを実行
          </Link>
        </div>

        {/* タイムゾーンテスト */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">タイムゾーンテスト</h2>
          <p className="text-gray-600 mb-4">
            タイムゾーン機能の動作確認を行います。
          </p>
          <Link 
            href="/test/timezone-experiment"
            className="inline-block bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
          >
            テストを実行
          </Link>
        </div>

        {/* プラン変更テスト */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-3">プラン変更テスト</h2>
          <p className="text-gray-600 mb-4">
            プラン変更機能の動作確認を行います。
          </p>
          <Link 
            href="/test/plan-change"
            className="inline-block bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
          >
            テストを実行
          </Link>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意事項:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• これらのツールは開発・テスト目的で使用してください</li>
          <li>• 実際のデータベースに影響を与える可能性があります</li>
          <li>• テスト後は必要に応じてテストデータを削除してください</li>
          <li>• 本番環境での使用は慎重に行ってください</li>
        </ul>
      </div>
    </div>
  )
}
