'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import AvatarUpload from './AvatarUpload'
import type { User, UserPreferences, UserSettingsModalProps } from '@/lib/types'
import { CloseIcon } from '@/components/common/icons/CloseIcon'

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData()
    }
  }, [isOpen, user])

  const fetchUserData = async () => {
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
      console.error('Failed to fetch user data:', error)
    }
  }

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
        onClose()
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      alert('設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">ユーザー設定</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">名前</label>
                  <p className="mt-1 text-sm text-gray-900">{userData?.name || '読み込み中...'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="mt-1 text-sm text-gray-900">{userData?.email || '読み込み中...'}</p>
                </div>
                {userData && (
                  <div>
                    <AvatarUpload
                      currentImageUrl={userData.profile_image_url}
                      onImageChange={(imageUrl) => setUserData(prev => prev ? { ...prev, profile_image_url: imageUrl || undefined } : null)}
                      userId={userData.id}
                      disabled={saving}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">設定</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">通貨</label>
                  <input
                    type="text"
                    value={preferences.currency || ''}
                    onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: JPY, USD, EUR"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">ホーム住所</label>
                  <input
                    type="text"
                    value={preferences.home_address || ''}
                    onChange={(e) => setPreferences(prev => ({ ...prev, home_address: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: 東京都渋谷区..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">タイムゾーン</label>
                  <input
                    type="text"
                    value={preferences.timezone || ''}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: Asia/Tokyo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">言語</label>
                  <input
                    type="text"
                    value={preferences.language || ''}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: ja, en, zh"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">テーマ</label>
                  <select
                    value={preferences.theme || 'light'}
                    onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
