import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { planSaveOperations } from '@/lib/travel/plan-save'
//import { generateUniqueSlug } from '@/lib/slug-utils'
import { generateUniqueSlug } from '@/lib/utils/slug'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { tripSlug } = await params

    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)
    if (!resolved) {
      return NextResponse.json({ error: 'Template trip not found' }, { status: 404 })
    }

    const { id: templateTripId, trip: templateTrip } = resolved

    if (!templateTrip.is_template) {
      return NextResponse.json({ error: 'Trip is not marked as template' }, { status: 400 })
    }

    if (templateTrip.access_level !== 'public' && templateTrip.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const replicaResult = await planSaveOperations.createReplicaFromTripTemplate(templateTripId, userId)

    const userTrips = await adminTripOperations.getTripsByUserId(userId)
    const existingSlugs = userTrips
      .map((trip) => trip.slug)
      .filter((slug): slug is string => Boolean(slug))

    const newSlug = generateUniqueSlug(replicaResult.trip.title, existingSlugs)

    const derivedDayCount =
      templateTrip.day_count && templateTrip.day_count > 0
        ? templateTrip.day_count
        : replicaResult.days.length

    await adminTripOperations.updateTrip(replicaResult.trip.id, {
      slug: newSlug,
      access_level: 'private',
      is_template: false,
      likes_count: 0,
      ...(derivedDayCount > 0 ? { day_count: derivedDayCount } : {}),
    })

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
      trip: latestTrip ? { id: latestTrip.id, slug: latestTrip.slug, access_level: latestTrip.access_level } : {
        id: replicaResult.trip.id,
        slug: newSlug,
        access_level: 'private',
      },
    })
  } catch (error) {
    logger.error('Error creating replica trip:', error)
    return NextResponse.json({ error: 'Failed to create replica trip' }, { status: 500 })
  }
}

