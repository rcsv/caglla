'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/common/Button'
import Loading from '@/components/common/Loading'

export default function HomePage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/home')
    }
  }, [user, loading, router])

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
                <span className="text-3xl font-bold text-white">C</span>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Caglla
              </h1>
              <p className="text-2xl text-gray-700 font-light mb-2">
                あなたの旅行を管理する
              </p>
              <p className="text-xl text-gray-600 font-light">
                シンプルで美しいアプリ
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="mb-16">
              <Button
                variant="primary"
                size="lg"
                onClick={signInWithGoogle}
                className="px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                leftIcon={(
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
              >
                Googleでログイン
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                無料で始められます
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              なぜCagllaを選ぶのか？
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              旅行計画を簡単に、美しく、効率的に管理できる機能を提供します
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <div className="text-4xl mb-6">🗺️</div>
                <h3 className="text-xl font-bold text-white mb-4">詳細な旅行計画</h3>
                <p className="text-blue-100 leading-relaxed">
                  日別の旅程、宿泊先、観光スポットまで、すべてを一箇所で管理。Google Mapsと連携した直感的な操作。
                </p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="group text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <div className="text-4xl mb-6">👥</div>
                <h3 className="text-xl font-bold text-white mb-4">チーム共有</h3>
                <p className="text-purple-100 leading-relaxed">
                  家族や友人と旅行プランを共有。リアルタイムで編集でき、みんなで一緒に計画を立てられます。
                </p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="group text-center">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-8 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <div className="text-4xl mb-6">📱</div>
                <h3 className="text-xl font-bold text-white mb-4">どこでもアクセス</h3>
                <p className="text-indigo-100 leading-relaxed">
                  スマートフォン、タブレット、PC。どのデバイスからでも美しく表示されるレスポンシブデザイン。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Left Side */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                旅行の思い出を<br />
                <span className="text-blue-600">永遠に</span> 保存
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                写真、メモ、ルート情報。旅行のすべての情報を整理して保存し、
                いつでも振り返ることができます。
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <span className="text-gray-700">写真とメモの自動整理</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <span className="text-gray-700">ルート最適化機能</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <span className="text-gray-700">天気情報の自動取得</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-full h-24 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg mb-3"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-full h-24 bg-gradient-to-br from-purple-200 to-purple-300 rounded-lg mb-3"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-full h-24 bg-gradient-to-br from-green-200 to-green-300 rounded-lg mb-3"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="w-full h-24 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg mb-3"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            今すぐ始めましょう
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            無料でアカウントを作成して、あなたの旅行を管理し始めましょう
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={signInWithGoogle}
            className="px-8 py-4 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            leftIcon={(
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
          >
            Googleでログイン
          </Button>
        </div>
      </div>
    </div>
  )
}
