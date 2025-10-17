import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { checklistGenerator } from '@/lib/checklist-generator'
import logger from '@/lib/core/logger'
import { adminAuth } from '@/lib/firebase/admin'
import { User } from '@/lib/core/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // ユーザー情報取得
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = userDoc.data() as User

    // Trip取得（既存のGET /api/trip/[id]のロジックを再利用）
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const tripRes = await fetch(`${base}/api/trip/${tripId}`, {
      cache: 'no-store'
    })
    if (!tripRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
    }
    const trip = await tripRes.json()

    // チェックリスト生成（ユーザー情報も渡す）
    const items = await checklistGenerator.generateTripChecklist(trip, user)

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


