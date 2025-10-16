'use client'

import { useEffect, useState } from 'react'
import { ChecklistPreset } from '@/lib/core/types'
import { useAuth } from '@/lib/contexts/auth'

interface MyPresetsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyPresetsModal({ isOpen, onClose }: MyPresetsModalProps) {
  const { getIdToken } = useAuth()
  const [presets, setPresets] = useState<ChecklistPreset[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchMyPresets()
    }
  }, [isOpen])

  const fetchMyPresets = async () => {
    try {
      setLoading(true)
      const token = await getIdToken()
      const response = await fetch('/api/checklists/presets?user_id=current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const deletePreset = async (presetId: string) => {
    if (!confirm('このプリセットを削除しますか？')) return

    try {
      const token = await getIdToken()
      const response = await fetch(`/api/checklists/presets/${presetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        setPresets(prev => prev.filter(p => p.id !== presetId))
      }
    } catch (error) {
      alert('削除に失敗しました')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 zidx-float-modal-content">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          マイプリセット
        </h2>

        {loading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : presets.length === 0 ? (
          <div className="text-gray-500">プリセットがありません</div>
        ) : (
          <div className="space-y-3">
            {presets.map(preset => (
              <div key={preset.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{preset.title}</h3>
                    {preset.description && (
                      <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                    )}
                    {preset.tags && preset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {preset.tags.map(tag => (
                          <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {preset.is_public ? '公開' : '非公開'} • 
                      使用回数: {preset.usage_count || 0}回 • 
                      {preset.items?.length || 0}項目
                    </div>
                  </div>
                  <button
                    onClick={() => deletePreset(preset.id)}
                    className="ml-4 text-xs text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

