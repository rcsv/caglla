'use client'
import logger from '@/lib/logger'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { getZIndexClass } from '@/lib/z-index-layers'
import type { User, UserPreferences, UserSettingsModalProps } from '@/lib/types'
import { CloseIcon } from '@/components/common/icons/CloseIcon'

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState<string | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData()
      // モーダルが開かれた時に状態をリセット
      setNameError(null)
      setNameSuccess(null)
      setHasUserInteracted(false)
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
      logger.error('Failed to fetch user data:', error)
    }
  }

  const checkSlugAvailability = async (name: string) => {
    if (!name.trim()) {
      setNameError(null)
      setNameSuccess(null)
      return
    }

    // 3文字以下の場合はエラー
    if (name.trim().length <= 3) {
      setNameError('名前は4文字以上で入力してください')
      setNameSuccess(null)
      return
    }

    setIsCheckingSlug(true)
    setNameError(null)
    setNameSuccess(null)

    try {
      const response = await fetch('/api/users/check-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ name })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.isAvailable) {
          setNameSuccess('この名前は使用可能です')
        } else {
          setNameError(data.message)
        }
      } else {
        setNameError('スラッグの確認に失敗しました')
      }
    } catch (error) {
      logger.error('Failed to check slug availability:', error)
      setNameError('スラッグの確認に失敗しました')
    } finally {
      setIsCheckingSlug(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setUserData(prev => prev ? { ...prev, name: newName } : null)
    
    // 既存のタイムアウトをクリア
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // ユーザーが入力したことを記録
    setHasUserInteracted(true)
    
    // デバウンス処理は行わない（フォーカス外れまで待機）
  }

  const handleNameBlur = () => {
    // フォーカスが外れた時のみチェッカーを起動
    if (hasUserInteracted && userData?.name) {
      checkSlugAvailability(userData.name)
    }
  }

  const handleSave = async () => {
    // エラーがある場合は保存を阻止
    if (nameError) {
      alert('名前の重複エラーを解決してから保存してください')
      return
    }

    setSaving(true)
    try {
      logger.debug('Saving user data:', {
        name: userData?.name,
        email: userData?.email,
        profile_image_url: userData?.profile_image_url,
        preferences
      })

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
      
      logger.debug('Save response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        logger.debug('Save successful:', data)
        setUserData(data.user)
        alert('設定を保存しました')
        onClose() // ダイアログを閉じる
      } else {
        const errorData = await response.json().catch(() => ({}))
        logger.error('Save failed:', response.status, errorData)
        alert(`設定の保存に失敗しました: ${errorData.error || '不明なエラー'}`)
      }
    } catch (error) {
      logger.error('Failed to save preferences:', error)
      alert('設定の保存に失敗しました: ネットワークエラー')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 overflow-y-auto ${getZIndexClass('USER_SETTINGS')}`}>
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
                  <input
                    type="text"
                    value={userData?.name || ''}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                      nameError 
                        ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                        : nameSuccess 
                        ? 'border-green-300 bg-green-50 focus:ring-green-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="名前を入力してください"
                    disabled={saving || isCheckingSlug}
                  />
                  {isCheckingSlug && (
                    <p className="mt-1 text-xs text-blue-600">スラッグの確認中...</p>
                  )}
                  {nameError && (
                    <p className="mt-1 text-xs text-red-600">{nameError}</p>
                  )}
                  {nameSuccess && !isCheckingSlug && (
                    <p className="mt-1 text-xs text-green-600">{nameSuccess}</p>
                  )}
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
              disabled={saving || isCheckingSlug || !!nameError}
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
