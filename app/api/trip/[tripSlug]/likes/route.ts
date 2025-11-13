import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import logger from '@/lib/core/logger'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { COLLECTIONS } from '@/lib/firebase/firestore'

interface LikeState {
  likesCount: number
  likedByMe: boolean
}

function normalizeCount(count: unknown): number {
  if (typeof count === 'number' && Number.isFinite(count)) {
    return Math.max(0, Math.floor(count))
  }
  return 0
}

async function resolveAuthUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const idToken = authHeader.split('Bearer ')[1]
  if (!idToken) return null

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    return decoded.uid
  } catch (error) {
    logger.warn('Failed to verify ID token for trip likes endpoint', error)
    return null
  }
}

async function fetchLikeState(
  tripId: string,
  userId: string | null
): Promise<LikeState> {
  const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
  const tripSnap = await tripRef.get()

  if (!tripSnap.exists) {
    throw new Error('Trip not found')
  }

  const data = tripSnap.data()
  const likesCount = normalizeCount(data?.likes_count)

  if (!userId) {
    return { likesCount, likedByMe: false }
  }

  const likeDoc = await tripRef.collection('likes').doc(userId).get()
  return {
    likesCount,
    likedByMe: likeDoc.exists
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    const { tripSlug } = await params
    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)

    if (!resolved) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { id: tripId, trip } = resolved

    if (trip.access_level !== 'public') {
      return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
    }

    const userId = await resolveAuthUserId(request)
    const likeState = await fetchLikeState(tripId, userId)

    return NextResponse.json(likeState)
  } catch (error) {
    logger.error('Failed to fetch trip like state', error)
    return NextResponse.json(
      { error: 'Failed to fetch like state' },
      { status: 500 }
    )
  }
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
    if (!idToken) {
      return NextResponse.json({ error: 'Invalid authorization header' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const userId = decoded.uid

    const { tripSlug } = await params
    const resolved = await adminTripOperations.resolveTripByIdOrSlug(tripSlug)

    if (!resolved) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const { id: tripId, trip } = resolved

    if (trip.access_level !== 'public') {
      return NextResponse.json({ error: 'Likes available only for public trips' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action === 'like' || body?.action === 'unlike' ? body.action : 'toggle'

    const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId)
    const likeRef = tripRef.collection('likes').doc(userId)

    const result = await adminDb.runTransaction(async (tx) => {
      const [tripSnap, likeSnap] = await Promise.all([tx.get(tripRef), tx.get(likeRef)])

      if (!tripSnap.exists) {
        throw new Error('Trip not found during transaction')
      }

      const currentCount = normalizeCount(tripSnap.data()?.likes_count)
      const currentlyLiked = likeSnap.exists

      let nextLiked = currentlyLiked
      let nextCount = currentCount

      if ((action === 'like' || action === 'toggle') && !currentlyLiked) {
        tx.set(likeRef, { created_at: new Date() })
        tx.update(tripRef, { likes_count: FieldValue.increment(1) })
        nextLiked = true
        nextCount = currentCount + 1
      } else if ((action === 'unlike' || action === 'toggle') && currentlyLiked) {
        tx.delete(likeRef)
        tx.update(tripRef, { likes_count: FieldValue.increment(-1) })
        nextLiked = false
        nextCount = Math.max(0, currentCount - 1)
      }

      return {
        likesCount: nextCount,
        likedByMe: nextLiked
      }
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    logger.error('Failed to toggle trip like', error)
    const status =
      error instanceof Error && error.message.includes('Trip not found') ? 404 : 500
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status }
    )
  }
}

