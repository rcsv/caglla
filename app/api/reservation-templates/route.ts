import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

import { verifyAuthToken } from '@/lib/api/auth-helpers'
import type { ReservationTemplate, ReservationTemplateInput } from '@/lib/core/types'

// Firebase Admin初期化（ビルド時対応）
function getFirestoreInstance() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }
  return getFirestore()
}

const db = getFirestoreInstance()

/**
 * GET /api/reservation-templates - ユーザーのテンプレート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // テンプレート一覧を取得
    const templatesSnapshot = await db
      .collection('reservation_templates')
      .where('user_id', '==', user.uid)
      .orderBy('updated_at', 'desc')
      .get()

    const templates: ReservationTemplate[] = templatesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as ReservationTemplate[]

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

/**
 * POST /api/reservation-templates - 新規テンプレートを作成
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as ReservationTemplateInput

    // バリデーション
    if (!body.name || !body.type) {
      return NextResponse.json({ 
        error: 'Name and type are required' 
      }, { status: 400 })
    }

    // テンプレート作成
    const templateData = {
      user_id: user.uid,
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
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error' 
    }, { status: 500 })
  }
}

