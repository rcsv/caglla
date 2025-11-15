import { NextRequest, NextResponse } from 'next/server'
import { adminTripOperations } from '@/lib/firebase/admin-operation'
import { generateUniqueSlug, generateSlug } from '@/lib/utils/slug'
import logger from '@/lib/core/logger'
import type { Trip } from '@/lib/core/types'
import { requireAuth } from '@/lib/api/auth-helpers'
import { notFound, badRequest, parseRequestBody, handleApiError, createForbiddenError } from '@/lib/core/error-handler'
import { validateTripOwnership } from '@/lib/api/authorization-helpers'

type PublishRequestBody = {
  slug?: string | null
}

/**
 * DELETE: トリップ公開停止（unpublish）
 * 
 * 公開中のトリップを非公開（private）に戻します。
 * 所有者のみが実行可能です。
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { tripSlug } = await params

    // Trip解決と所有権チェック
    const ownership = await validateTripOwnership(tripSlug, userId)
    if (ownership instanceof NextResponse) {
      return ownership // エラーレスポンスをそのまま返す
    }
    const { tripId: resolvedTripId, trip } = ownership

    // 既に private の場合はエラーを返す（冪等性のため）
    if (trip.access_level === 'private') {
      return badRequest('Trip is already private')
    }

    const updatePayload: Record<string, unknown> = {
      access_level: 'private' as const
    }

    await adminTripOperations.updateTrip(resolvedTripId, updatePayload)

    const updatedTrip = await adminTripOperations.getTripById(resolvedTripId)

    logger.info('Trip unpublished', {
      tripId: resolvedTripId,
      slug: trip.slug,
      isTemplate: Boolean(trip.is_template)
    })

    return NextResponse.json({
      success: true,
      trip: updatedTrip ?? { ...trip, access_level: 'private' as const }
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/trip/[tripSlug]/publish`
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripSlug: string }> }
) {
  try {
    // 認証チェック
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) {
      return auth // 認証エラーをそのまま返す
    }
    const { userId } = auth

    const { tripSlug } = await params

    // Trip解決と所有権チェック
    const ownership = await validateTripOwnership(tripSlug, userId)
    if (ownership instanceof NextResponse) {
      return ownership // エラーレスポンスをそのまま返す
    }
    const { tripId: resolvedTripId, trip } = ownership

    const body = await parseRequestBody<PublishRequestBody>(request)

    const requestedSlug = body.slug?.trim()
    let finalSlug = trip.slug?.trim() || ''

    let cachedUserTrips: Trip[] | null = null
    const getUserTrips = async () => {
      if (!cachedUserTrips) {
        cachedUserTrips = await adminTripOperations.getTripsByUserId(userId)
      }
      return cachedUserTrips
    }

    if (requestedSlug && requestedSlug !== trip.slug) {
      // サーバー側でslug形式をバリデーション・正規化（防御的実装）
      const normalizedSlug = generateSlug(requestedSlug)
      if (normalizedSlug !== requestedSlug) {
        return badRequest('Invalid slug format')
      }

      const userTrips = await getUserTrips()
      const existingSlugs = userTrips
        .filter(existingTrip => existingTrip.id !== resolvedTripId)
        .map(existingTrip => existingTrip.slug)
        .filter((value): value is string => Boolean(value))

      if (existingSlugs.includes(normalizedSlug)) {
        // 409 Conflict は標準的なエラーレスポンスなので、そのまま返す
        return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
      }

      finalSlug = normalizedSlug
    }

    if (!finalSlug) {
      const userTrips = await getUserTrips()
      const existingSlugs = userTrips
        .filter(existingTrip => existingTrip.id !== resolvedTripId)
        .map(existingTrip => existingTrip.slug)
        .filter((value): value is string => Boolean(value))

      finalSlug = generateUniqueSlug(trip.title || 'trip', existingSlugs)
    }

    const updatePayload: Record<string, unknown> = {
      access_level: 'public' as const
    }

    if (finalSlug !== trip.slug) {
      updatePayload.slug = finalSlug
    }

    await adminTripOperations.updateTrip(resolvedTripId, updatePayload)

    const updatedTrip = await adminTripOperations.getTripById(resolvedTripId)

    logger.info('Trip published', {
      tripId: resolvedTripId,
      slugBefore: trip.slug,
      slugAfter: finalSlug,
      isTemplate: Boolean(trip.is_template)
    })

    return NextResponse.json({
      success: true,
      trip: updatedTrip ?? { ...trip, slug: finalSlug, access_level: 'public' as const }
    })
  } catch (error) {
    return handleApiError(
      error instanceof Error ? error : new Error(String(error)),
      `/api/trip/[tripSlug]/publish`
    )
  }
}

