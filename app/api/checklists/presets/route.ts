import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

// POST: プリセット作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const body = await request.json()
    const { title, description, tags, items, is_public } = body

    if (!title || !Array.isArray(items)) {
      return NextResponse.json({ error: 'title and items are required' }, { status: 400 })
    }

    const presetRef = adminDb.collection('checklist_presets').doc()
    const preset = {
      id: presetRef.id,
      user_id: userId,
      title,
      description: description || '',
      tags: tags || [],
      items,
      is_public: is_public || false,
      created_at: new Date(),
      updated_at: new Date(),
      usage_count: 0
    }

    await presetRef.set(preset)

    return NextResponse.json(preset, { status: 201 })
  } catch (error) {
    logger.error('Failed to create preset', error)
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 })
  }
}

// GET: プリセット一覧取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const sort = searchParams.get('sort') || 'popular' // popular | recent
    const requestedUserId = searchParams.get('user_id') // マイプリセットのみ取得

    let presetsQuery = adminDb.collection('checklist_presets')
      .where('is_public', '==', true)

    // マイプリセットのみ取得
    if (requestedUserId) {
      if (requestedUserId !== 'current') {
        return NextResponse.json({ error: 'Invalid user_id parameter' }, { status: 400 })
      }
      presetsQuery = adminDb.collection('checklist_presets')
        .where('user_id', '==', userId)
    }

    // ソート
    if (sort === 'popular') {
      presetsQuery = presetsQuery.orderBy('usage_count', 'desc')
    } else if (sort === 'recent') {
      presetsQuery = presetsQuery.orderBy('created_at', 'desc')
    }

    const snapshot = await presetsQuery.limit(50).get()
    const presets = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data())

    // クライアント側で検索フィルタ（Firestoreの全文検索制限のため）
    let filteredPresets = presets
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredPresets = presets.filter((p: any) => 
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
      )
    }

    return NextResponse.json({ presets: filteredPresets })
  } catch (error) {
    logger.error('Failed to fetch presets', error)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
}

