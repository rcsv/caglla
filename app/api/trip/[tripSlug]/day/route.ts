import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { adminDayOperations, adminTripOperations } from '@/lib/firebase/admin-operation'
import { requireAuth } from '@/lib/api/auth-helpers'
import { notFound, badRequest, handleApiError, createForbiddenError } from '@/lib/core/error-handler'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { tripSlug } = await params

    const resolvedTrip = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolvedTrip) {
      return notFound('Trip')
    }

    const { id: tripId, trip } = resolvedTrip

    if (trip.user_id !== userId) {
      throw createForbiddenError('You do not own this trip')
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
          return badRequest('最後の日程の日付が無効です')
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
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/trip/[tripSlug]/day`
    )
  }
}
