import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { requireAuth } from '@/lib/api/auth-helpers'
import { badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

/**
 * プランをテンプレートとして保存する
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

    const { planSlug: tripId } = await params
    const body = await parseRequestBody<{ templateName?: string }>(request)
    const { templateName } = body
    
    if (!templateName) {
      return badRequest('テンプレート名は必須です')
    }

    // テンプレートとして保存
    await planSaveOperations.saveAsTemplate(tripId, templateName)
    
    return NextResponse.json({
      success: true,
      message: 'テンプレートとして保存しました'
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/plans/[planSlug]/template`
    )
  }
}
