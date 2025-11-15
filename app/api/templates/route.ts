import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/core/logger'
import { adminDb } from '@/lib/firebase/admin'
import { planSaveOperations } from '@/lib/travel/plan-save'
import { withAuth, badRequest, parseRequestBody, handleApiError } from '@/lib/core/error-handler'

/**
 * テンプレートからプランを作成する
 */
export const POST = withAuth(async (request: NextRequest, auth) => {
  const { userId } = auth

  const body = await parseRequestBody<{ 
    templateId?: string; 
    customizations?: any 
  }>(request)
  const { templateId, customizations } = body
  
  if (!templateId) {
    return badRequest('テンプレートIDは必須です')
  }

    // テンプレートからプランを作成
    const result = await planSaveOperations.createFromTemplate(templateId, userId, customizations)
    
  return NextResponse.json({
    success: true,
    data: result
  })
})

/**
 * 利用可能なテンプレート一覧を取得する
 */
export const GET = withAuth(async (request: NextRequest, auth) => {
  // テンプレート一覧を取得
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
})
