import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminAuth } from '@/lib/firebase/admin'
import { planSaveOperations } from '@/lib/travel/plan-save'

/**
 * プランをテンプレートとして保存する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { id: tripId } = await params
    const { templateName }: { templateName: string } = await request.json()
    
    if (!templateName) {
      return NextResponse.json(
        { error: 'テンプレート名は必須です' },
        { status: 400 }
      )
    }

    // テンプレートとして保存
    await planSaveOperations.saveAsTemplate(tripId, templateName)
    
    return NextResponse.json({
      success: true,
      message: 'テンプレートとして保存しました'
    })
  } catch (error) {
    logger.error('Error saving as template:', error)
    return NextResponse.json(
      { error: 'テンプレートの保存に失敗しました' },
      { status: 500 }
    )
  }
}
