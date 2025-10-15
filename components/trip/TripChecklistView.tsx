'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChecklistItem } from '@/lib/core/types'

interface TripChecklistViewProps {
  tripId?: string
}

export default function TripChecklistView({ tripId }: TripChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 取得
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!tripId) return
      try {
        setLoading(true)
        const res = await fetch(`/api/trips/${tripId}/checklist`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setItems(data.items || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchChecklist()
  }, [tripId])

  // 再生成
  const regenerate = async () => {
    if (!tripId) return
    try {
      setSaving(true)
      const res = await fetch(`/api/trips/${tripId}/checklist/generate`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } finally {
      setSaving(false)
    }
  }

  // 保存
  const persist = async (next: ChecklistItem[]) => {
    if (!tripId) return
    try {
      setSaving(true)
      const res = await fetch(`/api/trips/${tripId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: next })
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || next)
      } else {
        setItems(next)
      }
    } finally {
      setSaving(false)
    }
  }

  // トグル
  const toggle = (id: string) => {
    const next = items.map(i => i.id === id ? { ...i, done: !i.done } : i)
    setItems(next)
    persist(next)
  }

  // カスタム追加
  const [input, setInput] = useState('')
  const addCustom = () => {
    const t = input.trim()
    if (!t) return
    const next: ChecklistItem[] = [
      ...items,
      { id: `custom_${Date.now()}`, title: t, category: 'packing', done: false, isCustom: true }
    ]
    setItems(next)
    setInput('')
    persist(next)
  }

  const prepItems = useMemo(() => items.filter(i => i.category === 'preparation'), [items])
  const packItems = useMemo(() => items.filter(i => i.category === 'packing'), [items])

  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Travel Checklist</h2>
          <button
            onClick={regenerate}
            disabled={saving || !tripId}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? '生成中...' : 'チェックリストを再生成'}
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-gray-500">読み込み中...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {/* 行動系準備 */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">✈️ 行動系準備</div>
              <ul className="p-3 space-y-2">
                {prepItems.map(item => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" checked={!!item.done} onChange={() => toggle(item.id)} />
                    <span className={`flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.title}</span>
                  </li>
                ))}
                {prepItems.length === 0 && (
                  <li className="text-sm text-gray-500">該当項目はありません</li>
                )}
              </ul>
            </div>

            {/* パッキング系 */}
            <div className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700">🎒 パッキング系</div>
              <ul className="p-3 space-y-2">
                {packItems.map(item => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" checked={!!item.done} onChange={() => toggle(item.id)} />
                    <span className={`flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.title}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="カスタム項目を追加"
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addCustom} className="px-3 py-2 text-sm bg-gray-800 text-white rounded-md">追加</button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
