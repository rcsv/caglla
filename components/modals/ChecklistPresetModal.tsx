'use client'

import { useState } from 'react'
import { ChecklistItem } from '@/lib/core/types'

interface ChecklistPresetModalProps {
  isOpen: boolean
  onClose: () => void
  currentItems: ChecklistItem[]
  onSuccess?: () => void
}

export default function ChecklistPresetModal({ 
  isOpen, 
  onClose, 
  currentItems,
  onSuccess 
}: ChecklistPresetModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    try {
      setSaving(true)
      
      // カスタムフラグを削除してプリセット用のアイテムに変換
      const presetItems = currentItems.map(item => ({
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority
      }))

      const response = await fetch('/api/checklists/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          items: presetItems,
          is_public: isPublic
        })
      })

      if (response.ok) {
        onSuccess?.()
        onClose()
        setTitle('')
        setDescription('')
        setTags('')
        setIsPublic(false)
      } else {
        alert('プリセットの保存に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 zidx-float-modal-content">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          チェックリストをプリセットとして保存
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 冬の北海道旅行"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: スキー・温泉旅行向けのチェックリスト"
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例: winter, hokkaido, skiing"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="is_public" className="text-sm text-gray-700">
              公開する（他のユーザーが利用可能）
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

