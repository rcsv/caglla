import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { adminDayOperations, adminTripOperations } from '@/lib/firestore-admin-operations'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: tripId } = await params
    const body = await request.json()
    
    // 既存の日程を取得して次のday_numberを決定
    const existingDays = await adminDayOperations.getDaysByTripId(tripId)
    const nextDayNumber = existingDays.length > 0 
      ? Math.max(...existingDays.map(d => d.day_number)) + 1 
      : 1

    // 新しい日程の日付を計算（最後の日程の翌日）
    let newDate: Date
    if (existingDays.length > 0) {
      const lastDay = existingDays.find(d => d.day_number === Math.max(...existingDays.map(d => d.day_number)))
      if (lastDay) {
        newDate = new Date(lastDay.date)
        newDate.setDate(newDate.getDate() + 1)
      } else {
        newDate = new Date()
      }
    } else {
      newDate = new Date()
    }

    // 新しい日程を作成
    const newDay = await adminDayOperations.createDay({
      trip_id: tripId,
      day_number: nextDayNumber,
      date: newDate
    })

    // tripのend_dateを新しい日程の日付に更新
    await adminTripOperations.updateTrip(tripId, {
      end_date: newDate
    })

    return NextResponse.json(newDay)
  } catch (error) {
    console.error('Error creating day:', error)
    return NextResponse.json(
      { error: 'Failed to create day' },
      { status: 500 }
    )
  }
}
