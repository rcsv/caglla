import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { checklistGenerator } from '@/lib/checklist-generator'
import logger from '@/lib/core/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    // Trip取得（既存のGET /api/trip/[id]のロジックを再利用）
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const tripRes = await fetch(`${base}/api/trip/${tripId}`, {
      cache: 'no-store'
    })
    if (!tripRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
    }
    const trip = await tripRes.json()

    // チェックリスト生成
    const items = await checklistGenerator.generateTripChecklist(trip)

    // 保存: trip_checklists/{tripId}
    const checklistRef = adminDb.collection('trip_checklists').doc(tripId)
    await checklistRef.set({
      id: tripId,
      trip_id: tripId,
      items,
      last_generated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }, { merge: true })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    logger.error('Failed to generate checklist', error)
    return NextResponse.json({ error: 'Failed to generate checklist' }, { status: 500 })
  }
}


