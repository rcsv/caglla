import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import { generateUniqueSlug } from '@/lib/utils/slug'
import type { User } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { notFound, withAuth as withAuthLegacy } from '@/lib/core/error-handler'
import { composeMiddleware } from '@/lib/core/middleware'
import { withAuth, withBodyValidation } from '@/lib/api/middleware'
import { CreateUserSchema } from '@/lib/schemas/user'
import { authApi } from '@/lib/api/middleware'

/**
 * POST /api/users - ユーザー作成・更新
 * 
 * zod スキーマバリデーション + Context ミドルウェアで移行済み
 * 
 * Before:
 * ```typescript
 * const body = await parseRequestBody<{...}>(request)
 * ```
 * 
 * After:
 * ```typescript
 * // ctx.body が型安全 & バリデ済み
 * ```
 */
export const POST = composeMiddleware(
  withAuth(),
  withBodyValidation(CreateUserSchema)
)(async (request: NextRequest, ctx) => {
  try {
    // ctx.auth, ctx.body が保証されている（型推論が効く）
    const { userId, decodedToken } = ctx.auth!
    
    // zod スキーマでバリデーション済み & 型推論
    type BodyType = z.infer<typeof CreateUserSchema>
    const body = ctx.body as BodyType
    const { 
      name, 
      email, 
      profile_image_url, 
      bio,
      gender,
      preferences 
    } = body

    // 既存ユーザーをチェック（auth_uid で検索、後方互換性のため google_id もチェック）
    // Phase 1-1.5: 認証プロバイダーマルチ対応化
    const existingUser = await adminUserOperations.getUserByAuthUid(userId)
    
    let userData: Omit<User, 'id' | 'created_at' | 'updated_at'>
    
    if (existingUser) {
      // 既存ユーザーの場合：Google情報は参照せず、既存データを保持
      // 名前が明示的に変更された場合のみ更新
      let userName = existingUser.name
      let userSlug = existingUser.slug
      
      if (name && name !== existingUser.name) {
        userName = name
        userSlug = generateUniqueSlug(name, [])
        logger.debug('User name changed, generating new slug', {
          oldName: existingUser.name,
          newName: userName,
          oldSlug: existingUser.slug,
          newSlug: userSlug
        })
      } else {
        logger.debug('Existing user, keeping current data', {
          name: userName,
          slug: userSlug
        })
      }
      
      userData = {
        auth_uid: userId, // Firebase Auth UID（必須）
        google_id: userId, // 後方互換性のため保持（Google認証の場合）
        name: userName,
        slug: userSlug,
        email: existingUser.email, // 既存のemailを保持
        profile_image_url: profile_image_url || existingUser.profile_image_url, // 画像更新を許可
        bio: bio !== undefined ? bio : existingUser.bio, // bio更新を許可
        gender: gender !== undefined ? gender : existingUser.gender, // gender更新を許可
        preferences: preferences || existingUser.preferences || {}
      }
    } else {
      // 新規ユーザーの場合のみ：Google情報を使用
      const userName = name || decodedToken.name || 'ユーザー'
      const userSlug = generateUniqueSlug(userName, [])
      
      logger.debug('New user, using Google info', {
        name: userName,
        email: decodedToken.email,
        slug: userSlug
      })
      
      userData = {
        auth_uid: userId, // Firebase Auth UID（必須）
        google_id: userId, // 後方互換性のため保持（Google認証の場合）
        name: userName,
        slug: userSlug,
        email: email || decodedToken.email || '',
        profile_image_url: profile_image_url || decodedToken.picture,
        bio: bio || '',
        gender: gender || 'prefer_not_to_say',
        preferences: preferences || {},
        planId: 'season_traveler' // 新規ユーザーはデフォルトで無料プラン
      }
    }

    const user = await adminUserOperations.createOrUpdateUser(userData)
    
    logger.info('User saved successfully', {
      userId: user.id,
      name: user.name,
      slug: user.slug
    })
    
    return NextResponse.json({ user })
  } catch (error: any) {
    logger.error('POST /api/users failed', {
      message: error?.message,
      stack: error?.stack
    })
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 })
  }
})

/**
 * 実験: Context 累積型ミドルウェアパターンへの移行
 * 
 * Before (旧方式):
 * ```typescript
 * export const GET = withAuth(async (request: NextRequest, auth) => {
 *   const { userId } = auth
 *   // ...
 * })
 * ```
 * 
 * After (新方式 - 標準プリセット使用):
 * ```typescript
 * export const GET = authApi(async (request, ctx) => {
 *   // ctx.auth が保証されている
 *   const { userId } = ctx.auth!
 *   // ...
 * })
 * ```
 */
export const GET = authApi(async (request: NextRequest, ctx) => {
  // ctx.auth が保証されている（authApi プリセットが認証チェックを実行）
  const { userId } = ctx.auth!

  // Get user data（auth_uid で検索、後方互換性のため google_id もチェック）
  // Phase 1-1.5: 認証プロバイダーマルチ対応化
  const user = await adminUserOperations.getUserByAuthUid(userId)
  
  if (!user) {
    return notFound('User')
  }
  
  return NextResponse.json({ user })
})
