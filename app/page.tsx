'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Caglla
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            あなたの旅行を管理する、シンプルで美しいアプリ
          </p>
          
          <div className="max-w-md mx-auto">
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 border border-gray-300 rounded-lg shadow-sm transition duration-200 flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Googleでログイン</span>
            </button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-3xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold mb-2">旅行計画</h3>
                <p className="text-gray-600">詳細な旅程を作成し、旅行を計画しましょう</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-3xl mb-4">👥</div>
                <h3 className="text-lg font-semibold mb-2">共有機能</h3>
                <p className="text-gray-600">家族や友人と旅行プランを共有できます</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-3xl mb-4">📱</div>
                <h3 className="text-lg font-semibold mb-2">モバイル対応</h3>
                <p className="text-gray-600">どこからでもアクセスできるレスポンシブデザイン</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
