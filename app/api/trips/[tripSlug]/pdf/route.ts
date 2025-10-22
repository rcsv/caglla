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
import { dateUtils } from '@/lib/utils/date'
import logger from '@/lib/core/logger'

interface SelectPdfErrorResponse {
  error: string
  status: number
}

interface TripPdfData {
  trip: Trip
  days: Day[]
  itinerariesByDay: Record<string, Itinerary[]>
}

/**
 * SelectPdf APIへのリクエストを実行
 */
async function callSelectPdfApi(params: {
  key: string
  url?: string
  html?: string
  base_url?: string
}): Promise<Response> {
  const response = await fetch('https://selectpdf.com/api2/convert/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  
  return response
}

/**
 * トリップデータをHTMLに変換
 */
function generateTripHtml(data: TripPdfData): string {
  const { trip, days, itinerariesByDay } = data
  
  // スタイリング
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
        line-height: 1.6;
        color: #333;
        padding: 40px;
        font-size: 12pt;
      }
      .header {
        border-bottom: 3px solid #2563eb;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .title { 
        font-size: 24pt;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 10px;
      }
      .trip-meta {
        color: #666;
        font-size: 11pt;
      }
      .day-section {
        page-break-inside: avoid;
        margin-bottom: 30px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        background: #f9fafb;
      }
      .day-header {
        font-size: 16pt;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #ddd;
      }
      .itinerary-item {
        margin-bottom: 15px;
        padding: 12px;
        background: white;
        border-left: 4px solid #3b82f6;
        border-radius: 4px;
      }
      .itinerary-time {
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 5px;
      }
      .itinerary-name {
        font-size: 13pt;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .itinerary-description {
        color: #666;
        font-size: 9pt;
        margin-bottom: 3px;
        line-height: 1.3;
      }
      .itinerary-note {
        color: #666;
        font-size: 10pt;
        margin-top: 5px;
        white-space: pre-wrap;
      }
      .itinerary-address {
        color: #888;
        font-size: 9pt;
        margin-top: 3px;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        text-align: center;
        color: #999;
        font-size: 9pt;
      }
      .no-itineraries {
        color: #999;
        font-style: italic;
        padding: 20px;
        text-align: center;
      }
    </style>
  `
  
  // ヘッダー
  const startDate = trip.start_date ? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date()) : '未定'
  const endDate = trip.end_date ? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date()) : '未定'
  
  const header = `
    <div class="header">
      <div class="title">${escapeHtml(trip.name || '無題の旅行')}</div>
      <div class="trip-meta">
        📅 ${startDate} 〜 ${endDate}
        ${trip.destination ? ` | 📍 ${escapeHtml(trip.destination)}` : ''}
      </div>
    </div>
  `
  
  // 日程セクション
  const daySections = days
    .sort((a, b) => {
      const dateA = toDateOrNull(a.date)
      const dateB = toDateOrNull(b.date)
      if (!dateA || !dateB) return 0
      return dateA.getTime() - dateB.getTime()
    })
    .map((day, index) => {
      const dayDate = toDateOrNull(day.date)
      const dayTitle = dayDate 
        ? `${dateUtils.formatDate(dayDate)} (${index + 1}日目)`
        : `${index + 1}日目`
      
      const itineraries = itinerariesByDay[day.id] || []
      const sortedItineraries = itineraries
        .sort((a, b) => {
          const timeA = a.start_time || ''
          const timeB = b.start_time || ''
          return timeA.localeCompare(timeB)
        })
      
      const itineraryItems = sortedItineraries.length > 0
        ? sortedItineraries.map(item => `
            <div class="itinerary-item">
              ${item.start_time ? `<div class="itinerary-time">⏰ ${item.start_time}</div>` : ''}
              <div class="itinerary-name">${escapeHtml(item.title || item.name || '無題の旅程')}</div>
              ${item.description ? `<div class="itinerary-description">${escapeHtml(item.description)}</div>` : ''}
              ${item.note ? `<div class="itinerary-note">${escapeHtml(item.note)}</div>` : ''}
              ${item.address ? `<div class="itinerary-address">📍 ${escapeHtml(item.address)}</div>` : ''}
            </div>
          `).join('')
        : '<div class="no-itineraries">予定なし</div>'
      
      return `
        <div class="day-section">
          <div class="day-header">${dayTitle}</div>
          ${itineraryItems}
        </div>
      `
    }).join('')
  
  // フッター
  const footer = `
    <div class="footer">
      Generated by Caglla Travel Manager | ${new Date().toLocaleDateString('ja-JP')}
    </div>
  `
  
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(trip.name || '無題の旅行')} - 旅程表</title>
      ${styles}
    </head>
    <body>
      ${header}
      ${daySections}
      ${footer}
    </body>
    </html>
  `
}

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
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
    dayIds: daysSnapshot.docs.map(doc => doc.id)
  })
  
  const days = daysSnapshot.docs.map(doc => ({
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

    const itineraries = itinerariesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Itinerary[]
    
    logger.debug('PDF API: itineraries found for day', { 
      dayId: day.id, 
      itinerariesCount: itineraries.length,
      itineraryNames: itineraries.map(i => i.name || i.title || 'No name'),
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
    const html = generateTripHtml(tripData)
    logger.debug('PDF API: HTML content generated', { 
      htmlLength: html.length,
      htmlPreview: html.substring(0, 500) + '...'
    })

    // 8. SelectPdf APIへのリクエスト
    const apiResponse = await callSelectPdfApi({
      key: apiKey,
      html,
      base_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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

