import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { requireAuth } from '@/lib/api/auth-helpers'
import { parseRequestBody, handleApiError } from '@/lib/core/error-handler'

/**
 * プランを複製する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { planSlug: sourceTripId } = await params
    const body = await parseRequestBody<{ newTitle?: string }>(request)
    const { newTitle } = body
    
    // プランを複製
    const result = await planSaveOperations.duplicatePlan(sourceTripId, userId, newTitle)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/plans/[planSlug]/duplicate`
    )
  }
}
