import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

// GET: 取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { id: tripId } = await params
    const ref = adminDb.collection('trip_checklists').doc(tripId)
    const doc = await ref.get()
    if (!doc.exists) {
      return NextResponse.json({ items: [] })
    }
    return NextResponse.json(doc.data())
  } catch (error) {
    logger.error('Failed to fetch checklist', error)
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
  }
}

// PUT: 更新（itemsの部分更新や完了状態変更、カスタム項目の追加など）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { id: tripId } = await params
    const body = await request.json()
    const { items } = body
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items array required' }, { status: 400 })
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
    logger.error('Failed to update checklist', error)
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
  }
}


