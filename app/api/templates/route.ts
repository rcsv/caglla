import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminAuth } from '@/lib/firebase/admin'
import { planSaveOperations } from '@/lib/travel/plan-save'

/**
 * テンプレートからプランを作成する
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { templateId, customizations }: { 
      templateId: string; 
      customizations?: any 
    } = await request.json()
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'テンプレートIDは必須です' },
        { status: 400 }
      )
    }

    // テンプレートからプランを作成
    const result = await planSaveOperations.createFromTemplate(templateId, userId, customizations)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Error creating from template:', error)
    return NextResponse.json(
      { error: 'テンプレートからのプラン作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 利用可能なテンプレート一覧を取得する
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    // テンプレート一覧を取得
    const { adminDb } = await import('@/lib/firebase/admin')
    const templatesSnapshot = await adminDb.collection('templates')
      .orderBy('created_at', 'desc')
      .get()
    
    const templates = templatesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json({
      success: true,
      data: templates
    })
  } catch (error) {
    logger.error('Error getting templates:', error)
    return NextResponse.json(
      { error: 'テンプレート一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}
