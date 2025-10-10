import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminTripOperations } from '@/lib/firebase/admin-operation'

// ランダムな公開旅行を返すAPI（認証不要）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '6', 10) || 6, 1), 24)

    const publicTrips = await adminTripOperations.getPublicTrips()

    // シャッフルして上位N件
    for (let i = publicTrips.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[publicTrips[i], publicTrips[j]] = [publicTrips[j], publicTrips[i]]
    }

    return NextResponse.json({ trips: publicTrips.slice(0, limit) })
  } catch (error) {
    logger.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}


