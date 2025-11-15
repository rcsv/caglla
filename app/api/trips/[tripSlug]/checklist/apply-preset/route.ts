import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { badRequest, notFound, parseRequestBody, createForbiddenError } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

// POST: プリセットを適用
export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!
  const { tripSlug: tripId } = ctx.params!
    const body = await parseRequestBody<{ preset_id?: string }>(request)
    const { preset_id } = body

    if (!preset_id) {
      return badRequest('preset_id is required')
    }

    // プリセットを取得
    const presetRef = adminDb.collection('checklist_presets').doc(preset_id)
    const presetDoc = await presetRef.get()

    if (!presetDoc.exists) {
      return notFound('Preset')
    }

    const preset = presetDoc.data()

    // 公開プリセットまたは自分のプリセットのみ適用可能
    if (!preset?.is_public && preset?.user_id !== userId) {
      throw createForbiddenError('You do not have permission to use this preset')
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
})

