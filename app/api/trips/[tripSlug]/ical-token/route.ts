import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

import { generateICalToken } from '@/lib/utils/ical-token'
import { tripApi } from '@/lib/api/middleware'

// Firebase Admin初期化
const db = getFirestore()
const auth = getAuth()

/**
 * iCal公開トークン生成・取得API
 * POST /api/trips/[tripId]/ical-token - トークン生成・有効化
 * DELETE /api/trips/[tripId]/ical-token - トークン無効化
 */

/**
 * POST: iCal公開トークンを生成して有効化
 */
export const POST = tripApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
  const { userId } = ctx.auth!
  const { tripId: resolvedTripId, trip } = ctx.trip!
  const { tripSlug } = ctx.params!

    // 4. ユーザープラン確認（Backpacker以上）
    // usersコレクションはgoogle_idで管理しているため、uidで検索する
    const userQuery = await db
      .collection('users')
      .where('google_id', '==', userId)
      .limit(1)
      .get()
    const userData = userQuery.empty ? undefined : userQuery.docs[0].data()
    // 後方互換: planId と plan の両方に対応
    const userPlan = (userData?.planId || userData?.plan || 'season_traveler') as string
    
    if (userPlan === 'season_traveler') {
      return NextResponse.json({ 
        error: 'iCal publishing requires Backpacker or higher plan',
        required_plan: 'backpacker'
      }, { status: 403 })
    }

    // 5. トークン生成（既存の場合は再利用）
    let token = trip?.ical_public_token
    
    if (!token) {
      token = generateICalToken()
    }

    // 6. Tripを更新
    await db.collection('trips').doc(resolvedTripId).update({
      ical_public_token: token,
      ical_enabled: true,
      updated_at: new Date(),
    })

    // 7. iCal URLを生成
    const baseUrl = request.headers.get('origin') || 'https://caglla.app'
    const icalUrl = `${baseUrl}/api/trips/${resolvedTripId}/ical?token=${token}&type=trip`
    const reservationsUrl = `${baseUrl}/api/trips/${resolvedTripId}/ical?token=${token}&type=reservations`

  return NextResponse.json({
    success: true,
    token,
    urls: {
      trip: icalUrl,
      reservations: reservationsUrl,
    },
  })
})

/**
 * DELETE: iCal公開を無効化
 */
export const DELETE = tripApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.trip, ctx.params が保証されている（tripApi プリセットが認証・所有権チェックを実行）
  const { userId } = ctx.auth!
  const { tripId: resolvedTripId, trip } = ctx.trip!
  const { tripSlug } = ctx.params!

    // 4. Tripを更新（無効化）
    await db.collection('trips').doc(resolvedTripId).update({
      ical_enabled: false,
      updated_at: new Date(),
    })

  return NextResponse.json({
    success: true,
    message: 'iCal publishing disabled',
  })
})

