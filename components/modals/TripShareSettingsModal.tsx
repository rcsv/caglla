'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth'
import { Icon } from '@iconify/react'
import { CloseIcon } from '@/components/common/icons/CloseIcon'
import { getZIndexClass } from '@/lib/core/z-index'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'

interface TripShareSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip | null
  onSuccess?: () => void
}

type AccessLevel = 'public' | 'unlisted' | 'private'

export default function TripShareSettingsModal({
  isOpen,
  onClose,
  trip,
  onSuccess,
}: TripShareSettingsModalProps) {
  const { user } = useAuth()
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('private')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && trip) {
      setAccessLevel((trip.access_level as AccessLevel) || 'private')
      setError(null)
    }
  }, [isOpen, trip])

  if (!isOpen || !trip) return null

  const handleSave = async () => {
    if (!user || !trip.slug) {
      setError('Trip information is missing')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const token = await user.getIdToken()

      // access_level に応じて適切な API を呼び出す
      if (accessLevel === 'private') {
        // 非公開にする（DELETE /api/trip/[tripSlug]/publish）
        const response = await fetch(`/api/trip/${trip.slug}/publish`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to unpublish trip: ${response.status}`)
        }
      } else if (accessLevel === 'public' || accessLevel === 'unlisted') {
        // 公開またはリンク限定公開にする（POST /api/trip/[tripSlug]/publish）
        // ただし、unlisted の場合は別の API が必要かもしれない
        // 現時点では public のみ対応
        if (accessLevel === 'unlisted') {
          setError('Unlisted access level is not yet supported')
          setSaving(false)
          return
        }

        const response = await fetch(`/api/trip/${trip.slug}/publish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to publish trip: ${response.status}`)
        }
      }

      logger.info('Trip share settings updated', {
        tripId: trip.id,
        tripSlug: trip.slug,
        accessLevel,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      logger.error('Failed to update trip share settings', err)
      setError(err.message || 'Failed to update share settings')
    } finally {
      setSaving(false)
    }
  }

  const accessLevelOptions: Array<{ value: AccessLevel; label: string; description: string }> = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can view this trip',
    },
    {
      value: 'unlisted',
      label: 'Shared link',
      description: 'Only people with the link can view',
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Only you can view this trip',
    },
  ]

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}
      style={{ zIndex: getZIndexClass('modal') }}
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">公開設定を編集</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-4">
          {/* Trip 情報 */}
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Trip</h3>
            <p className="text-base font-semibold text-gray-900">{trip.title || 'Untitled Trip'}</p>
            {trip.destination && (
              <p className="text-sm text-gray-600 mt-1">{trip.destination}</p>
            )}
          </div>

          {/* アクセスレベル選択 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">公開範囲</h3>
            <div className="space-y-2">
              {accessLevelOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    accessLevel === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessLevel"
                    value={option.value}
                    checked={accessLevel === option.value}
                    onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                    className="mt-0.5 mr-3 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && (
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
            )}
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

