import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import { verifyAuthToken } from '@/lib/api/auth-helpers'
import type { ReservationTemplateInput } from '@/lib/core/types'

// Firebase Admin初期化（ビルド時対応）
function getFirestoreInstance() {
  // ビルド時はFirestoreインスタンスを返さない
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }
  return getFirestore()
}

const db = getFirestoreInstance()

/**
 * PUT /api/reservation-templates/[templateId] - テンプレート更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // ビルド時は早期リターン
    if (!db) {
      return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 })
    }

    // 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // テンプレート取得
    const templateDoc = await db
      .collection('reservation_templates')
      .doc(params.templateId)
      .get()

    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateDoc.data()

    // 所有権確認
    if (template?.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as ReservationTemplateInput

    // バリデーション
    if (!body.name || !body.type) {
      return NextResponse.json({ 
        error: 'Name and type are required' 
      }, { status: 400 })
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
      .doc(params.templateId)
      .update(updateData)

    return NextResponse.json({ 
      success: true,
      template: {
        ...template,
        ...updateData,
        id: params.templateId,
      }
    })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/reservation-templates/[templateId] - テンプレート削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // ビルド時は早期リターン
    if (!db) {
      return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 })
    }

    // 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // テンプレート取得
    const templateDoc = await db
      .collection('reservation_templates')
      .doc(params.templateId)
      .get()

    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateDoc.data()

    // 所有権確認
    if (template?.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // テンプレート削除
    await db
      .collection('reservation_templates')
      .doc(params.templateId)
      .delete()

    return NextResponse.json({ 
      success: true,
      message: 'Template deleted',
    })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

/**
 * POST /api/reservation-templates/[templateId]/use - テンプレート使用（統計更新）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // ビルド時は早期リターン
    if (!db) {
      return NextResponse.json({ error: 'Service unavailable during build' }, { status: 503 })
    }

    // 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // テンプレート取得
    const templateDoc = await db
      .collection('reservation_templates')
      .doc(params.templateId)
      .get()

    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateDoc.data()

    // 所有権確認
    if (template?.user_id !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 使用回数と最終使用日時を更新
    await db
      .collection('reservation_templates')
      .doc(params.templateId)
      .update({
        use_count: FieldValue.increment(1),
        last_used_at: FieldValue.serverTimestamp(),
      })

    return NextResponse.json({ 
      success: true,
    })
  } catch (error) {
    console.error('Use template error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

