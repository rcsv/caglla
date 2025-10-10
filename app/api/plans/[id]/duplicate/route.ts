import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminAuth } from '@/lib/firebase/admin'
import { planSaveOperations } from '@/lib/travel/plan-save'

/**
 * プランを複製する
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

    const { id: sourceTripId } = await params
    const { newTitle }: { newTitle?: string } = await request.json()
    
    // プランを複製
    const result = await planSaveOperations.duplicatePlan(sourceTripId, userId, newTitle)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Error duplicating plan:', error)
    return NextResponse.json(
      { error: 'プランの複製に失敗しました' },
      { status: 500 }
    )
  }
}
