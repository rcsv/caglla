import { NextRequest, NextResponse } from 'next/server'
import { authApi } from '@/lib/api/middleware'
import type { Trip, User } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { getUserTripsWithBackwardCompatibility, encodeCursor } from '@/lib/firebase/trip-query-helpers'
import { adminDb } from '@/lib/firebase/admin'

type MyGuide = Trip

type MyGuidesResponse = {
  trips: MyGuide[]
  nextCursor?: string
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

export const GET = authApi(async (request: NextRequest, ctx): Promise<NextResponse<MyGuidesResponse>> => {
  const { userId } = ctx.auth!

  const { searchParams } = new URL(request.url)
  const limitParam = parseInt(searchParams.get('limit') ?? '20', 10)
  const limit = clamp(limitParam, 1, 50)
  const cursor = searchParams.get('cursor')
  const statusFilter = (searchParams.get('status') as 'draft' | 'published' | 'all' | null) ?? 'all'

  try {
    logger.debug('My Guides query params', {
      userId,
      limit,
      statusFilter,
      cursor,
    })

    // access_level フィルタをバックエンドで処理
    let accessLevel: string | undefined
    if (statusFilter === 'draft') {
      accessLevel = 'private'
    } else if (statusFilter === 'published') {
      // published の場合は 'in' クエリが必要だが、Firestore の制限により
      // クエリ分割方式では個別に処理する必要がある
      // 一旦 'all' として取得し、後でフィルタする（将来的に改善可能）
    }

    // 共通ヘルパーを使用してクエリ実行
    const { trips, lastDoc } = await getUserTripsWithBackwardCompatibility({
      userId,
      additionalFilters: {
        isTemplate: true,
        accessLevel: accessLevel, // draft の場合のみバックエンドでフィルタ
      },
      limit: accessLevel ? limit : limit * 2, // published の場合は多めに取得
      orderBy: {
        field: 'updated_at',
        direction: 'desc',
      },
    })

    // published の場合はクライアント側でフィルタ（将来的に改善）
    let filteredTrips = trips
    if (statusFilter === 'published') {
      filteredTrips = trips.filter(
        (trip) => trip.access_level === 'public' || trip.access_level === 'unlisted'
      )
      // limit に合わせて切り詰める
      filteredTrips = filteredTrips.slice(0, limit)
    }

    logger.debug('My Guides final result', {
      totalTrips: trips.length,
      afterFilter: filteredTrips.length,
    })

    // creator 情報を追加
    const tripsWithCreator = await Promise.all(
      filteredTrips.map(async (trip): Promise<Trip & { creator?: User }> => {
        let creator: User | undefined
        try {
          // trip.user_id は users コレクションのドキュメントID
          const userDoc = await adminDb.collection('users').doc(trip.user_id).get()
          if (userDoc.exists) {
            creator = {
              id: userDoc.id,
              ...userDoc.data(),
            } as User
          }
        } catch (error) {
          logger.error('Error fetching creator for trip', error, { tripId: trip.id })
        }
        return {
          ...trip,
          ...(creator ? { creator } : {}),
        }
      })
    )

    // カーソルをエンコード（lastDoc がある場合のみ）
    const nextCursor = lastDoc ? encodeCursor(lastDoc) : undefined

    return NextResponse.json(
      {
        trips: tripsWithCreator,
        nextCursor,
      },
      { status: 200 }
    )
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || 'UNKNOWN_ERROR'

    logger.error('Failed to fetch my guides', {
      error: errorMessage,
      errorCode,
      stack: error?.stack,
      userId,
    })

    // Firestore インデックスエラーの場合は、より分かりやすいメッセージを返す
    if (errorCode === 'failed-precondition' || errorMessage?.includes('index')) {
      return NextResponse.json(
        {
          trips: [],
          error: 'Firestore index required. Please create a composite index for trips collection: user_id (ascending), is_template (ascending), and updated_at (descending)',
          errorCode: 'INDEX_REQUIRED',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        trips: [],
        error: errorMessage,
        errorCode,
      },
      { status: 500 }
    )
  }
})

