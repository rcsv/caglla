import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminAuth } from '@/lib/firebase/admin'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { adminDayOperations, adminTripOperations } from '@/lib/firebase/admin-operation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
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

    const { tripSlug } = await params

    const resolvedTrip = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolvedTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { id: tripId, trip } = resolvedTrip

    if (trip.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 既存の日程を取得して次のday_numberを決定
    const existingDays = await adminDayOperations.getDaysByTripId(tripId)
    const nextDayNumber = existingDays.length > 0 
      ? Math.max(...existingDays.map(d => d.day_number)) + 1 
      : 1

    const isTemplateTrip = Boolean(trip.is_template)
    const hasStartDate = Boolean(trip.start_date)

    let newDate: Date | undefined

    if (isTemplateTrip) {
      newDate = undefined
    } else if (existingDays.length > 0) {
      const lastDay = existingDays.find(d => d.day_number === Math.max(...existingDays.map(d => d.day_number)))
      if (lastDay?.date) {
        const lastDate = toDateOrNull(lastDay.date)
        if (!lastDate) {
          return NextResponse.json(
            { error: '最後の日程の日付が無効です' },
            { status: 400 }
          )
        }
        newDate = new Date(lastDate)
        newDate.setDate(newDate.getDate() + 1)
      } else if (hasStartDate) {
        const start = toDateOrNull(trip.start_date)
        newDate = start ? new Date(start) : new Date()
      } else {
        newDate = new Date()
      }
    } else {
      if (hasStartDate) {
        const start = toDateOrNull(trip.start_date)
        newDate = start ? new Date(start) : new Date()
      } else {
        newDate = new Date()
      }
    }

    const dayPayload: {
      trip_id: string
      day_number: number
      date?: Date
    } = {
      trip_id: tripId,
      day_number: nextDayNumber
    }

    if (newDate && !isTemplateTrip) {
      dayPayload.date = newDate
    }

    const newDay = await adminDayOperations.createDay(dayPayload)
    
    if (newDate && !isTemplateTrip) {
      await adminTripOperations.updateTrip(tripId, {
        end_date: newDate
      })
    }

    return NextResponse.json(newDay)
  } catch (error) {
    logger.error('Error creating day:', error)
    return NextResponse.json(
      { error: 'Failed to create day' },
      { status: 500 }
    )
  }
}
