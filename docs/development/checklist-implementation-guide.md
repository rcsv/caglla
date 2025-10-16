# チェックリスト機能 実装ガイド

このドキュメントは、[チェックリスト機能仕様書](../specifications/checklist-feature-specification.md)に基づいた実装の手順と技術的な詳細を記載しています。

---

## 実装フェーズ

### Phase 1: 基本UI改善（MVP）

#### タスク 1.1: メインコンテンツでの全幅表示

**目的**: チェックリスト選択時に地図を非表示にし、メインコンテンツを全幅表示

**変更ファイル**:
- `app/[userSlug]/[tripSlug]/page.tsx`
- `components/trip/TripRightPane.tsx`

**実装内容**:

```typescript
// app/[userSlug]/[tripSlug]/page.tsx

// 現在の実装
{currentView === 'itinerary' && (
  <TripItineraryView ... />
)}

// ✅ 追加
{currentView === 'checklist' && (
  <TripChecklistView tripId={trip.id} />
)}
```

```typescript
// components/trip/TripRightPane.tsx

// 現在の実装
export default function TripRightPane({ ... }) {
  return (
    <div className="hidden md:block right-pane-responsive flex-shrink-0">
      <div className="h-full bg-gray-100">
        {currentView === 'checklist' ? (
          <Checklist />  // ← 簡易版コンポーネント
        ) : (
          <TripMap ... />
        )}
      </div>
    </div>
  )
}

// ✅ 修正後
export default function TripRightPane({ ... }) {
  // チェックリストビューの場合は右ペイン自体を非表示
  if (currentView === 'checklist') {
    return null
  }

  return (
    <div className="hidden md:block right-pane-responsive flex-shrink-0">
      <div className="h-full bg-gray-100">
        <TripMap ... />
      </div>
    </div>
  )
}
```

**CSSの調整**:
```css
/* app/globals.css */

/* チェックリストビュー時にメインコンテンツを全幅表示 */
.main-content-full-width {
  width: 100%;
  max-width: 100%;
}
```

---

#### タスク 1.2: カテゴリー選択UIの改善

**目的**: 手動でアイテムを追加する際、Preparing / Packing のカテゴリーを選択できるようにする

**変更ファイル**:
- `components/trip/TripChecklistView.tsx`

**実装内容**:

```typescript
// components/trip/TripChecklistView.tsx

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
      category: selectedCategory,  // ← ユーザーが選択したカテゴリー
      done: false, 
      isCustom: true 
    }
  ]
  setItems(next)
  setInput('')
  persist(next)
}

// UIコンポーネント
<div className="flex items-center gap-2 p-3 border-t">
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
    placeholder="カスタム項目を追加"
    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <button 
    onClick={addCustom} 
    className="px-3 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900"
  >
    追加
  </button>
</div>
```

---

#### タスク 1.3: アイテム削除機能

**目的**: カスタムアイテムのみ削除可能にする

**実装内容**:

```typescript
// components/trip/TripChecklistView.tsx

const removeItem = (id: string) => {
  const next = items.filter(i => i.id !== id)
  setItems(next)
  persist(next)
}

// UIコンポーネント
{items.map(item => (
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
        削除
      </button>
    )}
  </li>
))}
```

---

### Phase 2: プリセット基本機能

#### タスク 2.1: Firestore型定義の追加

**変更ファイル**:
- `lib/core/types.ts`

**実装内容**:

```typescript
// lib/core/types.ts

export interface ChecklistPresetItem {
  title: string
  description?: string
  category: 'preparation' | 'packing'
  priority?: 'high' | 'medium' | 'low'
}

export interface ChecklistPreset {
  id: string
  user_id: string
  title: string
  description?: string
  tags?: string[]
  items: ChecklistPresetItem[]
  is_public: boolean
  created_at: FirestoreDate
  updated_at: FirestoreDate
  usage_count?: number
}
```

---

#### タスク 2.2: プリセット作成API

**新規ファイル**:
- `app/api/checklists/presets/route.ts`

**実装内容**:

```typescript
// app/api/checklists/presets/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

// POST: プリセット作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const body = await request.json()
    const { title, description, tags, items, is_public } = body

    if (!title || !Array.isArray(items)) {
      return NextResponse.json({ error: 'title and items are required' }, { status: 400 })
    }

    const presetRef = adminDb.collection('checklist_presets').doc()
    const preset = {
      id: presetRef.id,
      user_id: userId,
      title,
      description: description || '',
      tags: tags || [],
      items,
      is_public: is_public || false,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0
    }

    await presetRef.set(preset)

    return NextResponse.json(preset, { status: 201 })
  } catch (error) {
    logger.error('Failed to create preset', error)
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 })
  }
}

// GET: プリセット一覧取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const sort = searchParams.get('sort') || 'popular' // popular | recent
    const requestedUserId = searchParams.get('user_id') // マイプリセットのみ取得

    let presetsQuery = adminDb.collection('checklist_presets')
      .where('is_public', '==', true)

    // マイプリセットのみ取得
    if (requestedUserId) {
      if (requestedUserId !== 'current') {
        return NextResponse.json({ error: 'Invalid user_id parameter' }, { status: 400 })
      }
      presetsQuery = adminDb.collection('checklist_presets')
        .where('user_id', '==', userId)
    }

    // ソート
    if (sort === 'popular') {
      presetsQuery = presetsQuery.orderBy('usage_count', 'desc')
    } else if (sort === 'recent') {
      presetsQuery = presetsQuery.orderBy('created_at', 'desc')
    }

    const snapshot = await presetsQuery.limit(50).get()
    const presets = snapshot.docs.map(doc => doc.data())

    // クライアント側で検索フィルタ（Firestoreの全文検索制限のため）
    let filteredPresets = presets
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredPresets = presets.filter(p => 
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      )
    }

    return NextResponse.json({ presets: filteredPresets })
  } catch (error) {
    logger.error('Failed to fetch presets', error)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
}
```

---

#### タスク 2.3: プリセット詳細API

**新規ファイル**:
- `app/api/checklists/presets/[id]/route.ts`

**実装内容**:

```typescript
// app/api/checklists/presets/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

// GET: プリセット詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: presetId } = await params
    const ref = adminDb.collection('checklist_presets').doc(presetId)
    const doc = await ref.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = doc.data()

    // 公開プリセットまたは自分のプリセットのみ閲覧可能
    if (!preset?.is_public && preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(preset)
  } catch (error) {
    logger.error('Failed to fetch preset', error)
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 })
  }
}

// PUT: プリセット更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: presetId } = await params
    const ref = adminDb.collection('checklist_presets').doc(presetId)
    const doc = await ref.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = doc.data()
    if (preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, tags, items, is_public } = body

    await ref.update({
      title: title || preset.title,
      description: description !== undefined ? description : preset.description,
      tags: tags || preset.tags,
      items: items || preset.items,
      is_public: is_public !== undefined ? is_public : preset.is_public,
      updated_at: new Date()
    })

    const updated = await ref.get()
    return NextResponse.json(updated.data())
  } catch (error) {
    logger.error('Failed to update preset', error)
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 })
  }
}

// DELETE: プリセット削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: presetId } = await params
    const ref = adminDb.collection('checklist_presets').doc(presetId)
    const doc = await ref.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = doc.data()
    if (preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete preset', error)
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 })
  }
}
```

---

#### タスク 2.4: プリセット適用API

**新規ファイル**:
- `app/api/trips/[id]/checklist/apply-preset/route.ts`

**実装内容**:

```typescript
// app/api/trips/[id]/checklist/apply-preset/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

// POST: プリセットを適用
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: tripId } = await params
    const body = await request.json()
    const { preset_id } = body

    if (!preset_id) {
      return NextResponse.json({ error: 'preset_id is required' }, { status: 400 })
    }

    // プリセットを取得
    const presetRef = adminDb.collection('checklist_presets').doc(preset_id)
    const presetDoc = await presetRef.get()

    if (!presetDoc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = presetDoc.data()

    // 公開プリセットまたは自分のプリセットのみ適用可能
    if (!preset?.is_public && preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 現在のチェックリストを取得
    const checklistRef = adminDb.collection('trip_checklists').doc(tripId)
    const checklistDoc = await checklistRef.get()
    const existingItems = checklistDoc.exists ? checklistDoc.data()?.items || [] : []

    // プリセットのアイテムを追加（重複チェック）
    const existingTitles = new Set(existingItems.map((item: any) => item.title))
    const newItems = preset.items
      .filter((item: any) => !existingTitles.has(item.title))
      .map((item: any) => ({
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        done: false,
        isCustom: false
      }))

    const updatedItems = [...existingItems, ...newItems]

    // チェックリストを更新
    await checklistRef.set({
      id: tripId,
      trip_id: tripId,
      items: updatedItems,
      updated_at: new Date()
    }, { merge: true })

    // プリセットの使用回数をインクリメント
    await presetRef.update({
      usage_count: (preset.usage_count || 0) + 1
    })

    const updated = await checklistRef.get()
    return NextResponse.json(updated.data())
  } catch (error) {
    logger.error('Failed to apply preset', error)
    return NextResponse.json({ error: 'Failed to apply preset' }, { status: 500 })
  }
}
```

---

#### タスク 2.5: プリセット作成モーダル

**新規ファイル**:
- `components/modals/ChecklistPresetModal.tsx`

**実装内容**:

```typescript
// components/modals/ChecklistPresetModal.tsx

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
```

---

#### タスク 2.6: マイプリセット管理画面

**新規ファイル**:
- `components/modals/MyPresetsModal.tsx`

**実装内容**:

```typescript
// components/modals/MyPresetsModal.tsx

'use client'

import { useEffect, useState } from 'react'
import { ChecklistPreset } from '@/lib/core/types'

interface MyPresetsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MyPresetsModal({ isOpen, onClose }: MyPresetsModalProps) {
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
      const response = await fetch('/api/checklists/presets?user_id=current')
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
      const response = await fetch(`/api/checklists/presets/${presetId}`, {
        method: 'DELETE'
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
```

---

### Phase 3: プリセット共有機能

#### タスク 3.1: プリセット検索・適用モーダル

**新規ファイル**:
- `components/modals/PresetLibraryModal.tsx`

**実装内容**:

```typescript
// components/modals/PresetLibraryModal.tsx

'use client'

import { useEffect, useState } from 'react'
import { ChecklistPreset } from '@/lib/core/types'

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
      const response = await fetch(
        `/api/checklists/presets?query=${encodeURIComponent(query)}&sort=${sort}`
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
      const response = await fetch(`/api/trips/${tripId}/checklist/apply-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
```

---

#### タスク 3.2: TripChecklistViewへのモーダル統合

**変更ファイル**:
- `components/trip/TripChecklistView.tsx`

**実装内容**:

```typescript
// components/trip/TripChecklistView.tsx

import ChecklistPresetModal from '@/components/modals/ChecklistPresetModal'
import MyPresetsModal from '@/components/modals/MyPresetsModal'
import PresetLibraryModal from '@/components/modals/PresetLibraryModal'

export default function TripChecklistView({ tripId }: TripChecklistViewProps) {
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [showMyPresetsModal, setShowMyPresetsModal] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)

  // ...既存のコード...

  return (
    <div className="px-4 py-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Travel Checklist</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLibraryModal(true)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              プリセットを適用
            </button>
            <button
              onClick={() => setShowMyPresetsModal(true)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              マイプリセット
            </button>
            <button
              onClick={() => setShowPresetModal(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              プリセットとして保存
            </button>
            <button
              onClick={regenerate}
              disabled={saving || !tripId}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              {saving ? '生成中...' : 'チェックリストを再生成'}
            </button>
          </div>
        </div>

        {/* ...既存のチェックリスト表示... */}
      </div>

      {/* モーダル */}
      <ChecklistPresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        currentItems={items}
        onSuccess={() => fetchChecklist()}
      />
      <MyPresetsModal
        isOpen={showMyPresetsModal}
        onClose={() => setShowMyPresetsModal(false)}
      />
      <PresetLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        tripId={tripId || ''}
        onApply={() => fetchChecklist()}
      />
    </div>
  )
}
```

---

## Firestore Security Rules

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // trip_checklists
    match /trip_checklists/{tripId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/trips/$(tripId)).data.user_id == request.auth.uid;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/trips/$(tripId)).data.user_id == request.auth.uid;
    }

    // checklist_presets
    match /checklist_presets/{presetId} {
      // 公開プリセットは全員が閲覧可能
      allow read: if resource.data.is_public == true || 
        (request.auth != null && resource.data.user_id == request.auth.uid);
      
      // 作成は認証済みユーザーのみ
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
      
      // 編集・削除は作成者のみ
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

---

## Firestore Indexes

**firestore.indexes.json**:

```json
{
  "indexes": [
    {
      "collectionGroup": "checklist_presets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "is_public", "order": "ASCENDING" },
        { "fieldPath": "usage_count", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "checklist_presets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "is_public", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "checklist_presets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "user_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**デプロイコマンド**:
```bash
firebase deploy --only firestore:indexes
```

---

## テスト計画

### Phase 1のテスト

1. **チェックリスト表示テスト**:
   - チェックリストメニューをクリックして、メインコンテンツが全幅表示されることを確認
   - Preparing / Packing の2カラム表示を確認
   - モバイルでは1カラム表示を確認

2. **手動追加テスト**:
   - カテゴリー選択ドロップダウンの動作確認
   - アイテム追加後、即座にFirestoreに保存されることを確認
   - カスタムアイテムに削除ボタンが表示されることを確認

3. **チェックボックステスト**:
   - チェックボックスのトグル動作を確認
   - 完了アイテムが取り消し線 + グレーアウトされることを確認
   - Firestoreに即座に保存されることを確認

### Phase 2のテスト

1. **プリセット作成テスト**:
   - モーダルからプリセットを作成
   - Firestoreの`checklist_presets`コレクションに保存されることを確認
   - 公開/非公開設定が正しく反映されることを確認

2. **マイプリセット管理テスト**:
   - 自分のプリセット一覧が表示されることを確認
   - プリセット削除が正しく動作することを確認

3. **プリセット適用テスト**:
   - プリセット適用後、チェックリストにアイテムが追加されることを確認
   - 重複アイテムが追加されないことを確認
   - `usage_count`がインクリメントされることを確認

### Phase 3のテスト

1. **プリセット検索テスト**:
   - キーワード検索が正しく動作することを確認
   - タグ検索が正しく動作することを確認
   - ソート（人気順/新着順）が正しく動作することを確認

2. **権限テスト**:
   - 公開プリセットが全ユーザーに表示されることを確認
   - 非公開プリセットが作成者のみに表示されることを確認
   - 他人のプリセットを編集・削除できないことを確認

---

## パフォーマンス最適化

### 楽観的更新（Optimistic Update）

チェックボックスのトグルやアイテム追加時に、Firestoreへの保存を待たずにUIを更新します。

```typescript
const toggle = (id: string) => {
  // 即座にUIを更新
  const next = items.map(i => i.id === id ? { ...i, done: !i.done } : i)
  setItems(next)
  
  // バックグラウンドで保存
  persist(next).catch(error => {
    // エラー時は元に戻す
    setItems(items)
    alert('保存に失敗しました')
  })
}
```

### Firestore読み取りの最適化

- プリセット一覧は`limit(50)`で制限
- キャッシュを活用（React StateやFirestoreのキャッシュ）
- 不要な再取得を避ける（useEffectの依存配列を最適化）

---

## まとめ

このガイドに従って段階的に実装を進めることで、チェックリスト機能を効率的に構築できます。

**実装の進め方**:
1. Phase 1（MVP）から開始し、基本的なUI/UXを確立
2. Phase 2でプリセット機能の基盤を構築
3. Phase 3でシェア機能を追加し、ユーザー間の価値創出を実現

各フェーズの完了後、テスト計画に従って動作確認を行い、次のフェーズに進んでください。

