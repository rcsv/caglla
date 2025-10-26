import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

import { generateICalToken } from '@/lib/utils/ical-token'
import { verifyAuthToken } from '@/lib/api/auth-helpers'

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
export async function POST(
  request: NextRequest,
  { params }: { params: { tripSlug: string } }
) {
  try {
    // 1. 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.uid

    // 2. Trip取得（id/slug 両対応の解決ヘルパー）
    const { adminTripOperations } = await import('@/lib/firebase/admin-operation')
    const resolved = await adminTripOperations.resolveTripByIdOrSlug(params.tripSlug)
    const resolvedTripId = resolved?.id || null

    if (!resolvedTripId) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const tripDoc = await db.collection('trips').doc(resolvedTripId).get()
    const trip = tripDoc.data()
    
    // 3. 所有権確認
    if (trip?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
  } catch (error) {
    console.error('iCal token generation error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

/**
 * DELETE: iCal公開を無効化
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripSlug: string } }
) {
  try {
    // 1. 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.uid

    // 2. Trip取得（tripSlugからtripIdへの解決）
    const resolvedTripId = await (async () => {
      // まずはドキュメントIDとして試す
      const byId = await db.collection('trips').doc(params.tripSlug).get()
      if (byId.exists) {
        return byId.id
      }
      // 見つからなければ slug で検索
      const bySlugSnap = await db
        .collection('trips')
        .where('slug', '==', params.tripSlug)
        .limit(1)
        .get()
      if (!bySlugSnap.empty) {
        return bySlugSnap.docs[0].id
      }
      return null
    })()

    if (!resolvedTripId) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const tripDoc = await db.collection('trips').doc(resolvedTripId).get()
    const trip = tripDoc.data()
    
    // 3. 所有権確認
    if (trip?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Tripを更新（無効化）
    await db.collection('trips').doc(resolvedTripId).update({
      ical_enabled: false,
      updated_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'iCal publishing disabled',
    })
  } catch (error) {
    console.error('iCal token deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

