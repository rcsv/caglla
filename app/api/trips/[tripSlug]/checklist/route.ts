import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import { badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

// GET: 取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params
    const tripId = tripSlug
    const ref = adminDb.collection('trip_checklists').doc(tripId)
    const doc = await ref.get()
    if (!doc.exists) {
      return NextResponse.json({ items: [] })
    }
    return NextResponse.json(doc.data())
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/trips/[tripSlug]/checklist'
    )
  }
}

// PUT: 更新（itemsの部分更新や完了状態変更、カスタム項目の追加など）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params
    const tripId = tripSlug
    const body = await parseRequestBody<{
      items?: any[]
    }>(request)
    const { items } = body
    if (!Array.isArray(items)) {
      return badRequest('items array required')
    }

    const ref = adminDb.collection('trip_checklists').doc(tripId)
    await ref.set({
      id: tripId,
      trip_id: tripId,
      items,
      updated_at: new Date()
    }, { merge: true })

    const updated = await ref.get()
    return NextResponse.json(updated.data())
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      '/api/trips/[tripSlug]/checklist'
    )
  }
}


