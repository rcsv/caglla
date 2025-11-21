import { NextRequest, NextResponse } from 'next/server'
import { authApi } from '@/lib/api/middleware'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { Trip, TripSocialStats } from '@/lib/core/types'
import logger from '@/lib/core/logger'

type MySharedTrip = Trip

type MySharesResponse = {
  trips: MySharedTrip[]
  nextCursor?: string
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

export const GET = authApi(async (request: NextRequest, ctx): Promise<NextResponse<MySharesResponse>> => {
  const { userId } = ctx.auth!

  const { searchParams } = new URL(request.url)
  const limitParam = parseInt(searchParams.get('limit') ?? '20', 10)
  const limit = clamp(limitParam, 1, 50)
  const cursor = searchParams.get('cursor')
  const templateFilter = (searchParams.get('template') as 'include' | 'only' | 'exclude' | null) ?? 'exclude'

  try {
    const tripsRef = adminDb.collection(COLLECTIONS.TRIPS)

    let query: FirebaseFirestore.Query = tripsRef
      .where('user_id', '==', userId)
      .where('access_level', 'in', ['public', 'unlisted'])
      .orderBy('updated_at', 'desc')
      .limit(limit)

    if (cursor) {
      const cursorDoc = await tripsRef.doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      } else {
        logger.warn('my-shares cursor doc not found; ignoring cursor', { cursor, userId })
      }
    }

    const snapshot = await query.get()
    let trips: MySharedTrip[] = snapshot.docs.map((doc): MySharedTrip => {
      const data = doc.data() as Trip
      const socialStats: TripSocialStats =
        data.social_stats ?? {
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          views_count: 0,
          replicas_count: 0,
        }

      return {
        id: doc.id,
        ...data,
        social_stats: socialStats,
      } as Trip
    })

    // テンプレートフィルタ（デフォルト: exclude）
    if (templateFilter === 'exclude') {
      trips = trips.filter((trip) => trip.is_template !== true)
    } else if (templateFilter === 'only') {
      trips = trips.filter((trip) => trip.is_template === true)
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1]

    return NextResponse.json(
      {
        trips,
        nextCursor: lastDoc ? lastDoc.id : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Failed to fetch my shared trips', { error, userId })
    return NextResponse.json(
      {
        trips: [],
      },
      { status: 500 }
    )
  }
})

