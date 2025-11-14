import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { generateUniqueSlug } from '@/lib/utils/slug'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'

type PublishRequestBody = {
  slug?: string | null
}

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
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { id: resolvedTripId, trip } = resolved

    if (trip.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: PublishRequestBody = await request.json().catch(() => ({} as PublishRequestBody))

    const requestedSlug = body.slug?.trim()
    let finalSlug = trip.slug?.trim() || ''

    let cachedUserTrips: Trip[] | null = null
    const getUserTrips = async () => {
      if (!cachedUserTrips) {
        cachedUserTrips = await adminTripOperations.getTripsByUserId(userId)
      }
      return cachedUserTrips
    }

    if (requestedSlug && requestedSlug !== trip.slug) {
      const userTrips = await getUserTrips()
      const existingSlugs = userTrips
        .filter(existingTrip => existingTrip.id !== resolvedTripId)
        .map(existingTrip => existingTrip.slug)
        .filter((value): value is string => Boolean(value))

      if (existingSlugs.includes(requestedSlug)) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }

      finalSlug = requestedSlug
    }

    if (!finalSlug) {
      const userTrips = await getUserTrips()
      const existingSlugs = userTrips
        .filter(existingTrip => existingTrip.id !== resolvedTripId)
        .map(existingTrip => existingTrip.slug)
        .filter((value): value is string => Boolean(value))

      finalSlug = generateUniqueSlug(trip.title || 'trip', existingSlugs)
    }

    const updatePayload: Record<string, unknown> = {
      access_level: 'public' as const
    }

    if (finalSlug !== trip.slug) {
      updatePayload.slug = finalSlug
    }

    await adminTripOperations.updateTrip(resolvedTripId, updatePayload)

    const updatedTrip = await adminTripOperations.getTripById(resolvedTripId)

    logger.info('Trip published', {
      tripId: resolvedTripId,
      slugBefore: trip.slug,
      slugAfter: finalSlug,
      isTemplate: Boolean(trip.is_template)
    })

    return NextResponse.json({
      success: true,
      trip: updatedTrip ?? { ...trip, slug: finalSlug, access_level: 'public' as const }
    })
  } catch (error) {
    logger.error('Error publishing trip', error)
    return NextResponse.json({ error: 'Failed to publish trip' }, { status: 500 })
  }
}

