import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import { notFound, createForbiddenError } from '@/lib/core/error-handler'
import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth, withParams, withBodyValidation } from '@/lib/api/middleware'
import { ReservationTemplateInputSchema } from '@/lib/schemas/reservation-template'

// Firebase Admin初期化
const db = getFirestore()

/**
 * PUT /api/reservation-templates/[templateId] - テンプレート更新
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
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
 * // すべての if 文バリデーションが消える
 * ```
 */
export const PUT = composeMiddleware(
  withAuth(),
  withParams(),
  withBodyValidation(ReservationTemplateInputSchema)
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params, ctx.body が保証されている（型推論が効く）
  const { userId: uid } = ctx.auth!
  const { templateId } = ctx.params!
  
  // zod スキーマでバリデーション済み & 型推論
  type BodyType = z.infer<typeof ReservationTemplateInputSchema>
  const body = ctx.body as BodyType

  // テンプレート取得
  const templateDoc = await db
    .collection('reservation_templates')
    .doc(templateId)
    .get()

  if (!templateDoc.exists) {
    return notFound('Template')
  }

  const template = templateDoc.data()

  // 所有権確認
  if (template?.user_id !== uid) {
    throw createForbiddenError('You do not own this template')
  }

  // テンプレート更新
  const updateData = {
    name: body.name,
    description: body.description || '',
    type: body.type,
    reservation_site: body.reservation_site,
    airline: body.airline,
    departure_airport: body.departure_airport,
    arrival_airport: body.arrival_airport,
    notes: body.notes,
    updated_at: FieldValue.serverTimestamp(),
  }

  await db
    .collection('reservation_templates')
    .doc(templateId)
    .update(updateData)

  return NextResponse.json({ 
    success: true,
    template: {
      ...template,
      ...updateData,
      id: templateId,
    }
  })
})

/**
 * DELETE /api/reservation-templates/[templateId] - テンプレート削除
 */
export const DELETE = composeMiddleware(
  withAuth(),
  withParams()
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（型推論が効く）
  const { userId: uid } = ctx.auth!
  const { templateId } = ctx.params!

  // テンプレート取得
  const templateDoc = await db
    .collection('reservation_templates')
    .doc(templateId)
    .get()

  if (!templateDoc.exists) {
    return notFound('Template')
  }

  const template = templateDoc.data()

  // 所有権確認
  if (template?.user_id !== uid) {
    throw createForbiddenError('You do not own this template')
  }

  // テンプレート削除
  await db
    .collection('reservation_templates')
    .doc(templateId)
    .delete()

  return NextResponse.json({ 
    success: true,
    message: 'Template deleted',
  })
})

/**
 * POST /api/reservation-templates/[templateId]/use - テンプレート使用（統計更新）
 */
export const POST = composeMiddleware(
  withAuth(),
  withParams()
)(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（型推論が効く）
  const { userId: uid } = ctx.auth!
  const { templateId } = ctx.params!

  // テンプレート取得
  const templateDoc = await db
    .collection('reservation_templates')
    .doc(templateId)
    .get()

  if (!templateDoc.exists) {
    return notFound('Template')
  }

  const template = templateDoc.data()

  // 所有権確認
  if (template?.user_id !== uid) {
    throw createForbiddenError('You do not own this template')
  }

  // 使用回数と最終使用日時を更新
  await db
    .collection('reservation_templates')
    .doc(templateId)
    .update({
      use_count: FieldValue.increment(1),
      last_used_at: FieldValue.serverTimestamp(),
    })

  return NextResponse.json({ 
    success: true,
  })
})

