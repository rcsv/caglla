import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import logger from '@/lib/core/logger'

// GET: プリセット詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: presetId } = await params
    const ref = adminDb.collection('checklist_presets').doc(presetId)
    const doc = await ref.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = doc.data()

    // 公開プリセットまたは自分のプリセットのみ閲覧可能
    if (!preset?.is_public && preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(preset)
  } catch (error) {
    logger.error('Failed to fetch preset', error)
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 })
  }
}

// PUT: プリセット更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: presetId } = await params
    const ref = adminDb.collection('checklist_presets').doc(presetId)
    const doc = await ref.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = doc.data()
    if (preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, tags, items, is_public } = body

    await ref.update({
      title: title || preset.title,
      description: description !== undefined ? description : preset.description,
      tags: tags || preset.tags,
      items: items || preset.items,
      is_public: is_public !== undefined ? is_public : preset.is_public,
      updated_at: new Date()
    })

    const updated = await ref.get()
    return NextResponse.json(updated.data())
  } catch (error) {
    logger.error('Failed to update preset', error)
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 })
  }
}

// DELETE: プリセット削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: presetId } = await params
    const ref = adminDb.collection('checklist_presets').doc(presetId)
    const doc = await ref.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    const preset = doc.data()
    if (preset?.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete preset', error)
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 })
  }
}

