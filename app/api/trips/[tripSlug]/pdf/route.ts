/**
 * PDF Export API
 * SelectPdf REST APIを使用してトリップ旅程をPDFとして生成
 * 
 * Authentication: Bearer token required
 * Authorization: Trip owner only
 * Plan Requirements: Backpacker以上
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { Trip, Day, Itinerary } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { generateMagazinePdfHtml, type TripPdfData } from '@/lib/utils/magazine-pdf-template'
import logger from '@/lib/core/logger'

interface SelectPdfErrorResponse {
  error: string
  status: number
}

// TripPdfData型はmagazine-pdf-templateからインポート

/**
 * SelectPdf APIへのリクエストを実行
 */
async function callSelectPdfApi(params: {
  key: string
  url?: string
  html?: string
  base_url?: string
  page_numbers?: boolean
  page_numbers_template?: string
  page_numbers_font_size?: number
  page_numbers_font_color?: string
  page_numbers_position?: string
  page_numbers_alignment?: string
}): Promise<Response> {
  const response = await fetch('https://selectpdf.com/api2/convert/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  
  return response
}

/**
 * トリップデータをHTMLに変換（旅行雑誌風PDF用）
 */
function generatePdfHtml(data: TripPdfData): string {
  return generateMagazinePdfHtml(data)
}

/**
 * ユーザーの認証・認可チェック
 */
async function authenticateUser(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get('authorization')
  logger.debug('PDF API: auth header check', { hasHeader: !!authHeader, startsWithBearer: authHeader?.startsWith('Bearer ') })
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.error('PDF API: missing or invalid auth header')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  logger.debug('PDF API: token extracted', { tokenLength: token.length })
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    logger.debug('PDF API: token verified', { userId: decodedToken.uid })
    return { userId: decodedToken.uid }
  } catch (error) {
    logger.error('PDF API: token verification failed:', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

/**
 * トリップの所有権確認とデータ取得
 */
async function validateTripOwnership(
  tripId: string,
  userId: string
): Promise<{ trip: Trip; days: Day[] } | NextResponse> {
  const tripRef = adminDb.collection('trips').doc(tripId)
  const tripDoc = await tripRef.get()

  if (!tripDoc.exists) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  const trip = { id: tripDoc.id, ...tripDoc.data() } as Trip
  logger.debug('PDF API: trip data retrieved', { tripUserId: trip.user_id, authUserId: userId })

  if (trip.user_id !== userId) {
    logger.error('PDF API: trip ownership check failed', { tripUserId: trip.user_id, authUserId: userId })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 日程データを取得（独立したコレクションから）
  const daysSnapshot = await adminDb
    .collection('days')
    .where('trip_id', '==', trip.id)
    .orderBy('day_number', 'asc')
    .get()
    
  logger.debug('PDF API: days collection query result', { 
    tripId: trip.id, 
    daysCount: daysSnapshot.size,
    dayIds: daysSnapshot.docs.map((doc: any) => doc.id)
  })
  
  const days = daysSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  })) as Day[]

  return { trip, days }
}

/**
 * プラン制限のチェック
 */
async function checkPlanRestrictions(userId: string): Promise<NextResponse | null> {
  logger.debug('PDF API: checking plan restrictions', { userId })
  
  // google_idフィールドでユーザーを検索
  const userQuery = await adminDb.collection('users').where('google_id', '==', userId).limit(1).get()
  logger.debug('PDF API: user query result', { exists: !userQuery.empty, size: userQuery.size })
  
  if (userQuery.empty) {
    logger.error('PDF API: user document not found by google_id', { userId })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userDoc = userQuery.docs[0]
  const userData = userDoc.data()
  logger.debug('PDF API: user data retrieved', { userData })
  
  const userPlan = userData?.planId || 'season_traveler'
  logger.debug('PDF API: user plan determined', { userPlan })

  // PDF Export は Backpacker 以上のプランが必要
  if (userPlan === 'season_traveler') {
    logger.error('PDF API: plan restriction failed - season_traveler plan', { userPlan })
    return NextResponse.json(
      { 
        error: 'Upgrade Required',
        message: 'PDF Export requires Backpacker plan or higher'
      },
      { status: 403 }
    )
  }

  logger.debug('PDF API: plan restriction check passed', { userPlan })
  return null
}

/**
 * 全旅程データを取得
 */
async function fetchTripData(trip: Trip, days: Day[]): Promise<TripPdfData> {
  const itinerariesByDay: Record<string, Itinerary[]> = {}
  logger.debug('PDF API: fetching trip data', { tripId: trip.id, daysCount: days.length })

  // 各日程の旅程アイテムを取得（独立したコレクションから）
  for (const day of days) {
    logger.debug('PDF API: fetching itineraries for day', { dayId: day.id, dayDate: day.date })
    
    const itinerariesSnapshot = await adminDb
      .collection('itineraries')
      .where('day_id', '==', day.id)
      .orderBy('sort_number', 'asc')
      .get()

    const itineraries = itinerariesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Itinerary[]
    
    logger.debug('PDF API: itineraries found for day', { 
      dayId: day.id, 
      itinerariesCount: itineraries.length,
      itineraryNames: itineraries.map(i => i.title || 'No name'),
      sampleItinerary: itineraries[0] // 最初の旅程アイテムの構造を確認
    })
    
    itinerariesByDay[day.id] = itineraries
  }

  logger.debug('PDF API: trip data fetch completed', { 
    totalDays: days.length,
    totalItineraries: Object.values(itinerariesByDay).flat().length
  })

  return { trip, days, itinerariesByDay }
}

/**
 * GET /api/trips/[tripSlug]/pdf
 * トリップをPDFとしてエクスポート
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tripSlug: string } }
) {
  try {
    const { tripSlug } = params
    logger.debug('PDF API: request received', { tripSlug })

    // 1. 認証チェック
    const authResult = await authenticateUser(request)
    if ('userId' in authResult === false) {
      logger.error('PDF API: authentication failed')
      return authResult // NextResponse (error)
    }
    const { userId } = authResult
    logger.debug('PDF API: authentication successful', { userId })

    // 2. プラン制限チェック
    const planError = await checkPlanRestrictions(userId)
    if (planError) {
      logger.error('PDF API: plan restriction check failed')
      return planError
    }
    logger.debug('PDF API: plan restriction check passed')

    // 3. tripSlug（またはdocument id）から実ドキュメントIDを解決
    const resolvedTripId = await (async () => {
      // まずはドキュメントIDとして試す
      logger.debug('PDF API: resolving trip id (try as document id)', { tryId: tripSlug })
      const byId = await adminDb.collection('trips').doc(tripSlug).get()
      logger.debug('PDF API: doc by id result', { exists: byId.exists })
      if (byId.exists) {
        logger.debug('PDF API: resolved by document id', { tripId: byId.id })
        return byId.id
      }
      // 見つからなければ slug で検索
      logger.debug('PDF API: resolving trip id (query by slug)', { slug: tripSlug })
      const bySlugSnap = await adminDb
        .collection('trips')
        .where('slug', '==', tripSlug)
        .limit(1)
        .get()
      logger.debug('PDF API: query by slug result', { empty: bySlugSnap.empty, size: bySlugSnap.size })
      if (!bySlugSnap.empty) {
        const foundId = bySlugSnap.docs[0].id
        logger.debug('PDF API: resolved by slug', { tripId: foundId })
        return foundId
      }
      return null
    })()

    if (!resolvedTripId) {
      logger.error('PDF API: Trip not found after resolution', { tripSlug })
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // 4. トリップの所有権確認
    const ownershipResult = await validateTripOwnership(resolvedTripId, userId)
    if ('trip' in ownershipResult === false) {
      logger.error('PDF API: ownership validation failed', { resolvedTripId, userId })
      return ownershipResult // NextResponse (error)
    }
    const { trip, days } = ownershipResult
    logger.debug('PDF API: ownership validated', { tripId: trip.id, tripUserId: (trip as any).user_id, userId, dayCount: days.length })

    // 5. SelectPdf APIキーの確認
    const apiKey = process.env.SELECTPDF_API_KEY
    if (!apiKey) {
      logger.error('SELECTPDF_API_KEY is not configured')
      return NextResponse.json(
        { error: 'PDF export is not available' },
        { status: 503 }
      )
    }

    // 6. トリップデータの取得
    const tripData = await fetchTripData(trip, days)

    // 7. HTMLの生成
    const html = generatePdfHtml(tripData)
    logger.debug('PDF API: HTML content generated', { 
      htmlLength: html.length,
      htmlPreview: html.substring(0, 500) + '...'
    })

    // 8. SelectPdf APIへのリクエスト
    const apiResponse = await callSelectPdfApi({
      key: apiKey,
      html,
      base_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      page_numbers: false, // ページ番号を無効化
      page_numbers_template: '', // ページ番号テンプレートを空に
      page_numbers_font_size: 0, // フォントサイズを0に
      page_numbers_font_color: 'transparent', // 透明色に設定
      page_numbers_position: 'none', // 位置を無効化
      page_numbers_alignment: 'none' // 配置を無効化
    })

    // 9. エラーハンドリング
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      logger.error('SelectPdf API error:', {
        status: apiResponse.status,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: 'PDF generation failed',
          details: errorText
        },
        { status: apiResponse.status }
      )
    }

    // 10. PDF返却
    const pdfBuffer = Buffer.from(await apiResponse.arrayBuffer())
    const filename = `${trip.slug || trip.id}_itinerary.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    logger.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

