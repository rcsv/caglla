import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import logger from '@/lib/core/logger'
import { notFound, createForbiddenError } from '@/lib/core/error-handler'
import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth, withParams, withBodyValidation } from '@/lib/api/middleware'
import { ApplyChecklistPresetSchema } from '@/lib/schemas/checklist'

/**
 * POST: プリセットを適用
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{ preset_id?: string }>(request)
 * if (!preset_id) {
 *   return badRequest('preset_id is required')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * // すべての if 文バリデーションが消える
 * ```
 */
export const POST = composeMiddleware(
  withAuth(),
  withParams(),
  withBodyValidation(ApplyChecklistPresetSchema)
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params, ctx.body が保証されている（型推論が効く）
  const { userId } = ctx.auth!
  const { tripSlug: tripId } = ctx.params!
  
  // zod スキーマでバリデーション済み & 型推論
  type BodyType = z.infer<typeof ApplyChecklistPresetSchema>
  const body = ctx.body as BodyType
  const { preset_id } = body

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
    await checklistRef.set(
      {
        id: tripId,
        trip_id: tripId,
        items: updatedItems,
        updated_at: new Date()
      },
      { merge: true }
    )

    // Trip.stats.checklists を updatedItems.length に同期
    try {
      const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
      await tripRef.update({
        'stats.checklists': updatedItems.length
      } as any)
    } catch (e) {
      logger.warn('Failed to update trip.stats.checklists after preset apply', {
        tripId,
        error: e
      })
    }

    // プリセットの使用回数をインクリメント
    await presetRef.update({
      usage_count: (preset.usage_count || 0) + 1
    })

  const updated = await checklistRef.get()
  return NextResponse.json(updated.data())
})

