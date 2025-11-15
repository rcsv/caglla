import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminDb } from '@/lib/firebase/admin'
import { adminTripOperations, adminDayOperations } from '@/lib/firebase/admin-operation'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import { notFound, badRequest, parseRequestBody, createForbiddenError } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!
  const { tripSlug } = ctx.params!

    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolved) {
      return notFound('Template trip')
    }

    const { id: templateTripId, trip: templateTrip } = resolved

    if (!templateTrip.is_template) {
      return badRequest('Trip is not marked as template')
    }

    if (templateTrip.access_level !== 'public' && templateTrip.user_id !== userId) {
      throw createForbiddenError('You do not have permission to access this template')
    }

    // バリデーションを先に実行（replica作成前に）
    const body = await parseRequestBody<{ startDate?: string }>(request)
    const startDateRaw = typeof body.startDate === 'string' ? body.startDate : ''
    const startDate = startDateRaw ? new Date(startDateRaw) : null

    if (startDate && Number.isNaN(startDate.getTime())) {
      return badRequest('Invalid start date')
    }

    // テンプレートのday_countを確認して、startDateの必要性を検証
    const templateDays = await adminDayOperations.getDaysByTripId(templateTripId)
    const derivedDayCount =
      templateTrip.day_count && templateTrip.day_count > 0
        ? templateTrip.day_count
        : templateDays.length

    if (derivedDayCount > 0 && !startDate) {
      return badRequest('Start date is required for this template')
    }

    // バリデーション通過後にreplicaを作成
    const replicaResult = await planSaveOperations.createReplicaFromTripTemplate(templateTripId, userId)

    const userTrips = await adminTripOperations.getTripsByUserId(userId)
    const existingSlugs = userTrips
      .map((trip) => trip.slug)
      .filter((slug): slug is string => Boolean(slug))

    const newSlug = generateUniqueSlug(replicaResult.trip.title, existingSlugs)

    const updatePayload: Record<string, unknown> = {
      slug: newSlug,
      access_level: 'private',
      is_template: false,
      likes_count: 0,
      ...(derivedDayCount > 0 ? { day_count: derivedDayCount } : {}),
    }

    let endDate: Date | null = null
    if (startDate) {
      endDate = new Date(startDate)
      if (derivedDayCount > 0) {
        endDate.setDate(startDate.getDate() + derivedDayCount - 1)
      }
      updatePayload.start_date = startDate
      updatePayload.end_date = endDate
    }

    await adminTripOperations.updateTrip(replicaResult.trip.id, updatePayload)

    if (startDate && replicaResult.days.length > 0) {
      const sortedDays = [...replicaResult.days].sort((a, b) => {
        const aNum = typeof a.day_number === 'number' ? a.day_number : 0
        const bNum = typeof b.day_number === 'number' ? b.day_number : 0
        return aNum - bNum
      })
      await Promise.all(
        sortedDays.map((day, index) => {
          const dateForDay = new Date(startDate)
          dateForDay.setDate(startDate.getDate() + index)
          return adminDb
            .collection(COLLECTIONS.DAYS)
            .doc(day.id)
            .update({
              date: dateForDay,
              updated_at: new Date()
            })
            .catch((error: unknown) => {
              logger.error('Failed to set date on replicated day', { error, dayId: day.id })
            })
        })
      )
    }

    try {
      const checklistDoc = await adminDb.collection('trip_checklists').doc(templateTripId).get()
      if (checklistDoc.exists) {
        const checklistData = checklistDoc.data() || {}
        const now = new Date()
        await adminDb.collection('trip_checklists').doc(replicaResult.trip.id).set({
          ...checklistData,
          id: replicaResult.trip.id,
          trip_id: replicaResult.trip.id,
          created_at: now,
          updated_at: now,
          last_generated_at: checklistData.last_generated_at ?? now,
        })
      }
    } catch (error) {
      logger.error('Failed to copy checklist for replica', error)
    }

    const latestTrip = await adminTripOperations.getTripById(replicaResult.trip.id)

    return NextResponse.json({
      success: true,
      trip: latestTrip
        ? {
            id: latestTrip.id,
            slug: latestTrip.slug,
            access_level: latestTrip.access_level,
            start_date: latestTrip.start_date,
            end_date: latestTrip.end_date
          }
        : {
        id: replicaResult.trip.id,
        slug: newSlug,
        access_level: 'private',
        start_date: startDate ?? null,
        end_date: endDate ?? null
      },
    })
})

