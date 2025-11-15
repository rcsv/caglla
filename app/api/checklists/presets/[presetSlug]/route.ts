import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { notFound, parseRequestBody, createForbiddenError } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

// GET: プリセット詳細取得
export const GET = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!
  const { presetSlug } = ctx.params!
    const ref = adminDb.collection('checklist_presets').doc(presetSlug)
    const doc = await ref.get()

    if (!doc.exists) {
      return notFound('Preset')
    }

    const preset = doc.data()

    // 公開プリセットまたは自分のプリセットのみ閲覧可能
    if (!preset?.is_public && preset?.user_id !== userId) {
      throw createForbiddenError('You do not have permission to access this preset')
    }

  return NextResponse.json(preset)
})

// PUT: プリセット更新
export const PUT = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!
  const { presetSlug } = ctx.params!
    const ref = adminDb.collection('checklist_presets').doc(presetSlug)
    const doc = await ref.get()

    if (!doc.exists) {
      return notFound('Preset')
    }

    const preset = doc.data()
    if (preset?.user_id !== userId) {
      throw createForbiddenError('You do not own this preset')
    }

    const body = await parseRequestBody<{
      title?: string
      description?: string
      tags?: string[]
      items?: any[]
      is_public?: boolean
    }>(request)
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
})

// DELETE: プリセット削除
export const DELETE = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!
  const { presetSlug } = ctx.params!
    const ref = adminDb.collection('checklist_presets').doc(presetSlug)
    const doc = await ref.get()

    if (!doc.exists) {
      return notFound('Preset')
    }

    const preset = doc.data()
    if (preset?.user_id !== userId) {
      throw createForbiddenError('You do not own this preset')
    }

  await ref.delete()
  return NextResponse.json({ success: true })
})

