import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { withAuth, badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

// POST: プリセット作成
export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  const body = await parseRequestBody<{
    title?: string
    description?: string
    tags?: string[]
    items?: any[]
    is_public?: boolean
  }>(request)
  const { title, description, tags, items, is_public } = body

  if (!title || !Array.isArray(items)) {
    return badRequest('title and items are required')
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
})

// GET: プリセット一覧取得
export const GET = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const sort = searchParams.get('sort') || 'popular' // popular | recent
  const requestedUserId = searchParams.get('user_id') // マイプリセットのみ取得

  let presetsQuery = adminDb.collection('checklist_presets')
    .where('is_public', '==', true)

  // マイプリセットのみ取得
  if (requestedUserId) {
    if (requestedUserId !== 'current') {
      return badRequest('Invalid user_id parameter')
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
  const presets = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data())

  // クライアント側で検索フィルタ（Firestoreの全文検索制限のため）
  let filteredPresets = presets
  if (query) {
    const lowerQuery = query.toLowerCase()
    filteredPresets = presets.filter((p: any) => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
    )
  }

  return NextResponse.json({ presets: filteredPresets })
})

