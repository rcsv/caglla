'use client'

import { useEffect, useState } from 'react'
import { ChecklistPreset } from '@/lib/core/types'
import { useAuth } from '@/lib/contexts/auth'

interface PresetLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onApply?: () => void
}

export default function PresetLibraryModal({ 
  isOpen, 
  onClose, 
  tripId,
  onApply 
}: PresetLibraryModalProps) {
  const { getIdToken } = useAuth()
  const [presets, setPresets] = useState<ChecklistPreset[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'popular' | 'recent'>('popular')

  useEffect(() => {
    if (isOpen) {
      fetchPresets()
    }
  }, [isOpen, query, sort])

  const fetchPresets = async () => {
    try {
      setLoading(true)
      const token = await getIdToken()
      const response = await fetch(
        `/api/checklists/presets?query=${encodeURIComponent(query)}&sort=${sort}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = async (presetId: string) => {
    try {
      const token = await getIdToken()
      const response = await fetch(`/api/trips/${tripId}/checklist/apply-preset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preset_id: presetId })
      })

      if (response.ok) {
        onApply?.()
        onClose()
      } else {
        alert('プリセットの適用に失敗しました')
      }
    } catch (error) {
      alert('プリセットの適用に失敗しました')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col p-6 zidx-float-modal-content">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          チェックリストプリセットを選択
        </h2>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワード、タグで検索..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'popular' | 'recent')}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="popular">人気順</option>
            <option value="recent">新着順</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-gray-500">読み込み中...</div>
          ) : presets.length === 0 ? (
            <div className="text-gray-500">プリセットが見つかりません</div>
          ) : (
            presets.map(preset => (
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
                      使用回数: {preset.usage_count || 0}回 • 
                      {preset.items?.length || 0}項目
                    </div>
                  </div>
                  <button
                    onClick={() => applyPreset(preset.id)}
                    className="ml-4 px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    適用
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

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

