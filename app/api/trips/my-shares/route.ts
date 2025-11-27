import { NextRequest, NextResponse } from 'next/server'
import { authApi } from '@/lib/api/middleware'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { getUserTripsWithBackwardCompatibility, encodeCursor } from '@/lib/firebase/trip-query-helpers'

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
    logger.debug('My Shares query params', {
      userId,
      limit,
      templateFilter,
      cursor,
    })

    // 共通ヘルパーを使用してクエリ実行
    // access_level は Firestore の 'in' クエリ制限により、クライアント側でフィルタ
    const { trips, lastDoc } = await getUserTripsWithBackwardCompatibility({
      userId,
      additionalFilters: {
        // template フィルタはクライアント側で処理（将来的に改善可能）
        isTemplate: templateFilter === 'only' ? true : templateFilter === 'exclude' ? false : undefined,
      },
      limit: limit * 2, // access_level フィルタで減る可能性があるため、多めに取得
      orderBy: {
        field: 'updated_at',
        direction: 'desc',
      },
    })

    // access_level でフィルタ（Firestore の 'in' クエリ制限を回避）
    let filteredTrips = trips.filter(
      (trip) => trip.access_level === 'public' || trip.access_level === 'unlisted'
    )

    // テンプレートフィルタ（デフォルト: exclude）
    if (templateFilter === 'exclude') {
      filteredTrips = filteredTrips.filter((trip) => trip.is_template !== true)
    } else if (templateFilter === 'only') {
      filteredTrips = filteredTrips.filter((trip) => trip.is_template === true)
    }

    // limit に合わせて切り詰める（フィルタで減った分を考慮）
    filteredTrips = filteredTrips.slice(0, limit)

    logger.debug('My Shares final result', {
      totalTrips: trips.length,
      afterAccessLevelFilter: filteredTrips.length,
      afterTemplateFilter: filteredTrips.length,
    })

    // カーソルをエンコード（lastDoc がある場合のみ）
    const nextCursor = lastDoc ? encodeCursor(lastDoc) : undefined

    return NextResponse.json(
      {
        trips: filteredTrips,
        nextCursor,
      },
      { status: 200 }
    )
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || 'UNKNOWN_ERROR'

    logger.error('Failed to fetch my shared trips', {
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
          error: 'Firestore index required. Please create a composite index for trips collection: user_id (ascending) and updated_at (descending)',
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

