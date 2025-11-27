import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import type { ReservationTemplate } from '@/lib/core/types'
import { composeMiddleware } from '@/lib/core/middleware'
import { authApi, withAuth, withBodyValidation } from '@/lib/api/middleware'
import { ReservationTemplateInputSchema } from '@/lib/schemas/reservation-template'

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
 * 
 * zod スキーマバリデーション + Context ミドルウェアの実験エンドポイント
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<ReservationTemplateInput>(request)
 * if (!body.name || !body.type) {
 *   return badRequest('Name and type are required')
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * const { name, type, description, ... } = ctx.body
 * ```
 */
export const POST = composeMiddleware(
  withAuth(),
  withBodyValidation(ReservationTemplateInputSchema)
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.body が保証されている（型推論が効く）
  const { userId: uid } = ctx.auth!
  
  // ctx.body の型を明示的に推論（zod スキーマから）
  type BodyType = z.infer<typeof ReservationTemplateInputSchema>
  const body = ctx.body as BodyType // zod スキーマでバリデーション済み & 型推論

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

