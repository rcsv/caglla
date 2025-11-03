'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChecklistItem } from '@/lib/core/types'
import ChecklistPresetModal from '@/components/modals/ChecklistPresetModal'
import MyPresetsModal from '@/components/modals/MyPresetsModal'
import PresetLibraryModal from '@/components/modals/PresetLibraryModal'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { t } from '@/lib/i18n'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'

interface TripChecklistViewProps {
  tripId?: string
}

export default function TripChecklistView({ tripId }: TripChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [showMyPresetsModal, setShowMyPresetsModal] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)

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
      const res = await makeAuthenticatedRequest(`/api/trips/${tripId}/checklist/generate`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      } else {
        console.error('Failed to regenerate checklist', await res.text())
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
  const [selectedCategory, setSelectedCategory] = useState<'preparation' | 'packing'>('packing')
  
  const addCustom = () => {
    const t = input.trim()
    if (!t) return
    const next: ChecklistItem[] = [
      ...items,
      { 
        id: `custom_${Date.now()}`, 
        title: t, 
        category: selectedCategory,
        done: false, 
        isCustom: true 
      }
    ]
    setItems(next)
    setInput('')
    persist(next)
  }

  // アイテム削除
  const removeItem = (id: string) => {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    persist(next)
  }

  const prepItems = useMemo(() => items.filter(i => i.category === 'preparation'), [items])
  const packItems = useMemo(() => items.filter(i => i.category === 'packing'), [items])

  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{t('checklist.title')}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowLibraryModal(true)}
              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              {t('checklist.applyPreset')}
            </button>
            <button
              onClick={() => setShowMyPresetsModal(true)}
              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              {t('checklist.myPresets')}
            </button>
            <button
              onClick={() => setShowPresetModal(true)}
              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              {t('checklist.saveAsPreset')}
            </button>
            <button
              onClick={regenerate}
              disabled={saving || !tripId}
              className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('checklist.regenerating') : t('checklist.regenerate')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-gray-500">{t('checklist.loading')}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            {/* 行動系準備 */}
            <div id="checklist-preparing" className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700 flex items-center gap-2">
                <IconRenderer iconName="airplane" className="w-4 h-4" color="#3b82f6" />
                {t('checklist.preparing.title')}
              </div>
              <ul className="p-3 space-y-2">
                {prepItems.map(item => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4" 
                      checked={!!item.done} 
                      onChange={() => toggle(item.id)} 
                    />
                    <span className={`flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.title}
                    </span>
                    {item.isCustom && (
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        {t('checklist.delete')}
                      </button>
                    )}
                  </li>
                ))}
                {prepItems.length === 0 && (
                  <li className="text-sm text-gray-500">{t('checklist.noItems')}</li>
                )}
              </ul>
            </div>

            {/* パッキング系 */}
            <div id="checklist-packing" className="border border-gray-200 rounded-lg">
              <div className="px-3 py-2 border-b text-sm font-medium text-gray-700 flex items-center gap-2">
                <IconRenderer iconName="backpack" className="w-4 h-4" color="#ef4444" />
                {t('checklist.packing.title')}
              </div>
              <ul className="p-3 space-y-2">
                {packItems.map(item => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4" 
                      checked={!!item.done} 
                      onChange={() => toggle(item.id)} 
                    />
                    <span className={`flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.title}
                    </span>
                    {item.isCustom && (
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        {t('checklist.delete')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* カスタム項目追加 */}
        {!loading && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'preparation' | 'packing')}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="preparation">Preparing</option>
                <option value="packing">Packing</option>
              </select>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                placeholder={t('checklist.addCustom.placeholder')}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={addCustom} 
                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                {t('checklist.addCustom.add')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* モーダル */}
      <ChecklistPresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        currentItems={items}
        onSuccess={() => {
          // プリセット保存成功時
          alert(t('checklist.preset.saveSuccess'))
        }}
      />
      <MyPresetsModal
        isOpen={showMyPresetsModal}
        onClose={() => setShowMyPresetsModal(false)}
      />
      <PresetLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        tripId={tripId || ''}
        onApply={() => {
          // プリセット適用成功時、チェックリストを再取得
          const fetchChecklist = async () => {
            if (!tripId) return
            try {
              const res = await fetch(`/api/trips/${tripId}/checklist`, { cache: 'no-store' })
              if (res.ok) {
                const data = await res.json()
                setItems(data.items || [])
              }
            } catch (error) {
              console.error('Failed to fetch checklist', error)
            }
          }
          fetchChecklist()
          alert(t('checklist.preset.applySuccess'))
        }}
      />
    </div>
  )
}
