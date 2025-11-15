import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { requireAuth } from '@/lib/api/auth-helpers'
import { notFound, parseRequestBody, handleApiError, createForbiddenError } from '@/lib/core/error-handler'

// GET: プリセット詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { presetSlug } = await params
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
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/checklists/presets/[presetSlug]`
    )
  }
}

// PUT: プリセット更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { presetSlug } = await params
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
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/checklists/presets/[presetSlug]`
    )
  }
}

// DELETE: プリセット削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { presetSlug } = await params
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
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/checklists/presets/[presetSlug]`
    )
  }
}

