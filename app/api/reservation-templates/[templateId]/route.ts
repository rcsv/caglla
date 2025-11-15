import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import type { ReservationTemplateInput } from '@/lib/core/types'
import { notFound, badRequest, createForbiddenError, parseRequestBody } from '@/lib/core/error-handler'
import { authApi } from '@/lib/api/middleware'

// Firebase Admin初期化
const db = getFirestore()

/**
 * PUT /api/reservation-templates/[templateId] - テンプレート更新
 */
export const PUT = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
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

    const body = await parseRequestBody<ReservationTemplateInput>(request)

    // バリデーション
    if (!body.name || !body.type) {
      return badRequest('Name and type are required')
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
export const DELETE = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
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
export const POST = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth, ctx.params が保証されている（authApi プリセットが認証チェックを実行）
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

