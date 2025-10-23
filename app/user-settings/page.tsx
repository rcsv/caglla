'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/ui/AvatarUpload'
import type { User, UserPreferences } from '@/lib/core/types'

export default function UserSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userData, setUserData] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
        setPreferences(data.user.preferences || {})
      }
    } catch (error) {
      logger.error('Failed to fetch user data:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user, fetchUserData])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          name: userData?.name,
          email: userData?.email,
          profile_image_url: userData?.profile_image_url,
          preferences
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
        alert('設定を保存しました')
      }
    } catch (error) {
      logger.error('Failed to save preferences:', error)
      alert('設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

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

  if (!user || !userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ユーザー設定</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">名前</label>
              <p className="mt-1 text-sm text-gray-900">{userData.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
              <p className="mt-1 text-sm text-gray-900">{userData.email}</p>
            </div>
            <div>
              <AvatarUpload
                currentImageUrl={userData.profile_image_url}
                onImageChange={(imageUrl) => setUserData(prev => prev ? { ...prev, profile_image_url: imageUrl || undefined } : null)}
                userId={userData.id}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">通貨</label>
              <input
                type="text"
                value={preferences.currency || ''}
                onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: JPY, USD, EUR"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">ホーム住所</label>
              <input
                type="text"
                value={preferences.home_address || ''}
                onChange={(e) => setPreferences(prev => ({ ...prev, home_address: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 東京都渋谷区..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">タイムゾーン</label>
              <input
                type="text"
                value={preferences.timezone || ''}
                onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: Asia/Tokyo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">言語</label>
              <input
                type="text"
                value={preferences.language || ''}
                onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: ja, en, zh"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">テーマ</label>
              <select
                value={preferences.theme || 'light'}
                onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={preferences.notifications || false}
                onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700">
                通知を受け取る
              </label>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
