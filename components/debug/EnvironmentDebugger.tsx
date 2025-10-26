'use client'

import { useState, useEffect } from 'react'

interface EnvironmentStatus {
  variable: string
  value: string | undefined
  status: 'available' | 'missing' | 'error'
  source: 'client' | 'server'
}

export default function EnvironmentDebugger() {
  const [envStatus, setEnvStatus] = useState<EnvironmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [serverEnvStatus, setServerEnvStatus] = useState<EnvironmentStatus[]>([])

  // クライアント側の環境変数をチェック
  useEffect(() => {
    const clientEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      'NEXT_PUBLIC_GOOGLE_MAP_ID',
      'NEXT_PUBLIC_APP_URL',
    ]

    const clientStatus: EnvironmentStatus[] = clientEnvVars.map(varName => ({
      variable: varName,
      value: process.env[varName],
      status: process.env[varName] ? 'available' : 'missing',
      source: 'client'
    }))

    setEnvStatus(clientStatus)
    setLoading(false)
  }, [])

  // サーバー側の環境変数をチェック
  useEffect(() => {
    const checkServerEnv = async () => {
      try {
        const response = await fetch('/api/debug/env-status')
        if (response.ok) {
          const data = await response.json()
          setServerEnvStatus(data.envStatus || [])
        } else {
          setServerEnvStatus([{
            variable: 'Server Environment Check',
            value: 'Failed to fetch',
            status: 'error',
            source: 'server'
          }])
        }
      } catch (error) {
        setServerEnvStatus([{
          variable: 'Server Environment Check',
          value: `Error: ${error}`,
          status: 'error',
          source: 'server'
        }])
      }
    }

    checkServerEnv()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100'
      case 'missing': return 'text-red-600 bg-red-100'
      case 'error': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✅'
      case 'missing': return '❌'
      case 'error': return '⚠️'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">🔍 環境変数デバッグ</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">🔍 環境変数デバッグ</h2>
      
      {/* クライアント側環境変数 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-600">📱 クライアント側環境変数</h3>
        <div className="space-y-2">
          {envStatus.map((env, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getStatusIcon(env.status)}</span>
                <span className="font-mono text-sm">{env.variable}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(env.status)}`}>
                  {env.status}
                </span>
                {env.value && (
                  <span className="text-xs text-gray-500 font-mono">
                    {env.value.length > 20 ? `${env.value.substring(0, 20)}...` : env.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* サーバー側環境変数 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-green-600">🖥️ サーバー側環境変数</h3>
        <div className="space-y-2">
          {serverEnvStatus.map((env, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getStatusIcon(env.status)}</span>
                <span className="font-mono text-sm">{env.variable}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(env.status)}`}>
                  {env.status}
                </span>
                {env.value && (
                  <span className="text-xs text-gray-500 font-mono">
                    {env.value.length > 20 ? `${env.value.substring(0, 20)}...` : env.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Firebase設定の状態 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-purple-600">🔥 Firebase設定状態</h3>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">Firebase Client Config</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
              }`}>
                {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Available' : 'Missing'}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <div>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Not Set'}</div>
              <div>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caglla-fb (fallback)'}</div>
              <div>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'caglla-fb.firebaseapp.com (fallback)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* リフレッシュボタン */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 リフレッシュ
        </button>
      </div>
    </div>
  )
}
