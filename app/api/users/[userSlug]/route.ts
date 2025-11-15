import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { adminUserOperations } from '@/lib/firebase/admin-operation'
import { adminResolveUserIdFromSlug } from '@/lib/auth/identity-helpers'
import { asUserSlug, asUserId } from '@/lib/core/types/identity'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { COLLECTIONS } from '@/lib/firebase/firestore'
import type { User } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { requireAuth } from '@/lib/api/auth-helpers'
import { notFound, badRequest, parseRequestBody, handleApiError, createForbiddenError } from '@/lib/core/error-handler'

/**
 * GET: 他のユーザーの公開情報を取得
 * 
 * 認証不要で、指定された userSlug のユーザー情報を取得します。
 * ただし、email などのプライベート情報は除外されます。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userSlug: string } }
) {
  try {
    const { userSlug } = params

    if (!userSlug) {
      return badRequest('User slug is required')
    }

    const typedUserSlug = asUserSlug(userSlug)

    // userSlug からユーザーを取得
    const querySnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .where('slug', '==', typedUserSlug)
      .limit(1)
      .get()

    if (querySnapshot.empty) {
      return notFound('User')
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data() as User

    // 公開情報のみを返す（email などのプライベート情報は除外）
    const publicUserData = {
      id: userDoc.id,
      name: userData.name,
      slug: userData.slug,
      profile_image_url: userData.profile_image_url,
      bio: userData.bio,
      // email は返さない（プライバシー保護）
      // google_id は返さない（セキュリティ上）
      // preferences は返さない（プライバシー保護）
      // planId は返さない（プライバシー保護）
    }

    return NextResponse.json({ user: publicUserData })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/users/[userSlug]`
    )
  }
}

/**
 * PUT: ユーザー情報更新（userSlug での明示的指定）
 * 
 * 認証済みユーザーが自分の情報を更新します。
 * userSlug で対象ユーザーを指定しますが、認証済みユーザー自身の情報のみ更新可能です。
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId: authenticatedUserId } = auth

    const { userSlug } = await params

    if (!userSlug) {
      return badRequest('User slug is required')
    }

    const typedUserSlug = asUserSlug(userSlug)

    // userSlug から userId を解決
    const resolvedUserId = await adminResolveUserIdFromSlug(typedUserSlug)
    if (!resolvedUserId) {
      return notFound('User')
    }

    // 認証済みユーザーが自分自身の情報を更新しようとしているか確認
    const authenticatedUserIdTyped = asUserId(authenticatedUserId)
    if (resolvedUserId !== authenticatedUserIdTyped) {
      throw createForbiddenError('You can only update your own information')
    }

    // 既存ユーザーを取得
    const existingUser = await adminUserOperations.getUserByGoogleId(authenticatedUserId)
    if (!existingUser) {
      return notFound('User')
    }

    // リクエストボディを解析
    const body = await parseRequestBody<{
      name?: string
      profile_image_url?: string
      bio?: string
      gender?: string
      preferences?: Record<string, any>
    }>(request)
    const {
      name,
      profile_image_url,
      bio,
      gender,
      preferences
    } = body

    // 更新データを構築
    const updateData: Partial<User> = {}

    // 名前が変更された場合は slug も更新
    if (name && name !== existingUser.name) {
      updateData.name = name
      // 既存のトリップのslugとの重複を避けるため、ユーザー一覧を取得
      const usersSnapshot = await adminDb
        .collection(COLLECTIONS.USERS)
        .get()
      const existingSlugs = usersSnapshot.docs
        .map(doc => doc.data().slug)
        .filter((value): value is string => Boolean(value) && value !== existingUser.slug)
      updateData.slug = generateUniqueSlug(name, existingSlugs)
      logger.debug('User name changed, generating new slug', {
        oldName: existingUser.name,
        newName: name,
        oldSlug: existingUser.slug,
        newSlug: updateData.slug
      })
    }

    // その他のフィールドの更新
    if (profile_image_url !== undefined) {
      updateData.profile_image_url = profile_image_url || existingUser.profile_image_url
    }
    if (bio !== undefined) {
      updateData.bio = bio
    }
    if (gender !== undefined) {
      updateData.gender = gender
    }
    if (preferences !== undefined) {
      updateData.preferences = preferences || existingUser.preferences || {}
    }

    // 更新が空の場合はエラーを返す
    if (Object.keys(updateData).length === 0) {
      return badRequest('No fields to update')
    }

    // ユーザー情報を更新
    await adminUserOperations.updateUser(existingUser.id, updateData)

    // 更新後のユーザー情報を取得
    const updatedUser = await adminUserOperations.getUserByGoogleId(authenticatedUserId)
    if (!updatedUser) {
      return notFound('User not found after update')
    }

    logger.info('User updated successfully', {
      userId: updatedUser.id,
      name: updatedUser.name,
      slug: updatedUser.slug
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/users/[userSlug]`
    )
  }
}

