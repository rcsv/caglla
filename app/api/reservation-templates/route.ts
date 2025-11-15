import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import type { ReservationTemplate, ReservationTemplateInput } from '@/lib/core/types'
import { badRequest, parseRequestBody } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

// Firebase Admin初期化
const db = getFirestore()

/**
 * GET /api/reservation-templates - ユーザーのテンプレート一覧を取得
 */
export const GET = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth が保証されている（authApi プリセットが認証チェックを実行）
  const { userId: uid } = ctx.auth!

    // テンプレート一覧を取得
    const templatesSnapshot = await db
      .collection('reservation_templates')
      .where('user_id', '==', uid)
      .orderBy('updated_at', 'desc')
      .get()

    const templates: ReservationTemplate[] = templatesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as ReservationTemplate[]

  return NextResponse.json({ templates })
})

/**
 * POST /api/reservation-templates - 新規テンプレートを作成
 */
export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth が保証されている（authApi プリセットが認証チェックを実行）
  const { userId: uid } = ctx.auth!

    const body = await parseRequestBody<ReservationTemplateInput>(request)

    // バリデーション
    if (!body.name || !body.type) {
      return badRequest('Name and type are required')
    }

    // テンプレート作成
    const templateData = {
      user_id: uid,
      name: body.name,
      description: body.description || '',
      type: body.type,
      reservation_site: body.reservation_site,
      airline: body.airline,
      departure_airport: body.departure_airport,
      arrival_airport: body.arrival_airport,
      notes: body.notes,
      use_count: 0,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }

    const docRef = await db.collection('reservation_templates').add(templateData)

  return NextResponse.json({ 
    success: true,
    id: docRef.id,
    template: {
      ...templateData,
      id: docRef.id,
    }
  })
})

