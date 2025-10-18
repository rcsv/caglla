import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

// POST: プリセットを適用
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
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

