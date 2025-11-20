/**
 * Trip Operations
 * 
 * TripのCRUD操作を提供します。
 * コンポーネントから直接APIを呼び出す代わりに、このライブラリ関数を使用してください。
 */

import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Trip作成の入力データ
 */
export interface CreateTripInput {
  title: string
  description?: string
  destination?: string
  destinationPlaceId?: string
  startDate?: Date | string
  endDate?: Date | string
  accessLevel?: 'private' | 'shared' | 'public'
  imageUrl?: string
  isTemplate?: boolean
  defaultCurrency?: string
  dayCount?: number
}

/**
 * Trip更新の入力データ
 */
export interface UpdateTripInput {
  title?: string
  description?: string
  destination?: string
  destinationPlaceId?: string
  startDate?: Date | string
  endDate?: Date | string
  accessLevel?: 'private' | 'shared' | 'public'
  imageUrl?: string
  isTemplate?: boolean
  defaultCurrency?: string
  isCancelled?: boolean
}

/**
 * Tripを作成します
 * 
 * @param data - Trip作成データ
 * @returns 作成されたTrip
 * @throws Error 作成に失敗した場合
 * 
 * @example
 * ```typescript
 * const trip = await createTrip({
 *   title: '東京旅行',
 *   description: '2泊3日の東京旅行',
 *   destination: '東京',
 *   startDate: '2024-06-01',
 *   endDate: '2024-06-03',
 *   accessLevel: 'private'
 * })
 * ```
 */
export async function createTrip(data: CreateTripInput): Promise<Trip> {
  try {
    logger.debug('Creating trip', { title: data.title })

    // DateをISO文字列に変換
    const body: Record<string, any> = {
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.destination && { destination: data.destination }),
      ...(data.destinationPlaceId && { destinationPlaceId: data.destinationPlaceId }),
      ...(data.startDate && { 
        startDate: data.startDate instanceof Date 
          ? data.startDate.toISOString() 
          : data.startDate 
      }),
      ...(data.endDate && { 
        endDate: data.endDate instanceof Date 
          ? data.endDate.toISOString() 
          : data.endDate 
      }),
      ...(data.accessLevel && { accessLevel: data.accessLevel }),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.isTemplate !== undefined && { isTemplate: data.isTemplate }),
      ...(data.defaultCurrency && { defaultCurrency: data.defaultCurrency }),
      ...(data.dayCount && { dayCount: data.dayCount }),
    }

    const response = await makeAuthenticatedRequest('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const raw = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      const apiError = raw?.error ?? raw
      const details = apiError?.details

      const issues =
        Array.isArray(details?.errors) ? details.errors :
        Array.isArray(details) ? details :
        []

      const detailMessages =
        issues.length > 0
          ? issues
              .map((err: { path?: string | string[]; message?: string }) => {
                const path =
                  Array.isArray(err?.path) ? err.path.join('.') :
                  typeof err?.path === 'string' ? err.path :
                  ''
                if (path && err?.message) return `${path}: ${err.message}`
                return err?.message || path
              })
              .filter(Boolean)
              .join('; ')
          : undefined

      const message =
        detailMessages ||
        apiError?.message ||
        `Failed to create trip: ${response.status}`

      throw new Error(message)
    }

    const trip = await response.json()
    logger.debug('Trip created successfully', { tripId: trip.id })
    return trip
  } catch (error) {
    logger.error('Error creating trip:', error)
    throw error
  }
}

/**
 * Tripを更新します
 * 
 * @param tripIdOrSlug - Trip IDまたはスラッグ
 * @param data - Trip更新データ
 * @returns 更新されたTrip
 * @throws Error 更新に失敗した場合
 * 
 * @example
 * ```typescript
 * const updatedTrip = await updateTrip('my-trip-slug', {
 *   title: '更新されたタイトル',
 *   description: '更新された説明'
 * })
 * ```
 */
export async function updateTrip(tripIdOrSlug: string, data: UpdateTripInput): Promise<Trip> {
  try {
    logger.debug('Updating trip', { tripIdOrSlug })

    // DateをISO文字列に変換
    const body: Record<string, any> = {}
    if (data.title !== undefined) body.title = data.title
    if (data.description !== undefined) body.description = data.description
    if (data.destination !== undefined) body.destination = data.destination
    if (data.destinationPlaceId !== undefined) body.destinationPlaceId = data.destinationPlaceId
    if (data.startDate !== undefined) {
      body.startDate = data.startDate instanceof Date 
        ? data.startDate.toISOString() 
        : data.startDate
    }
    if (data.endDate !== undefined) {
      body.endDate = data.endDate instanceof Date 
        ? data.endDate.toISOString() 
        : data.endDate
    }
    if (data.accessLevel !== undefined) body.accessLevel = data.accessLevel
    if (data.imageUrl !== undefined) body.imageUrl = data.imageUrl
    if (data.isTemplate !== undefined) body.isTemplate = data.isTemplate
    if (data.defaultCurrency !== undefined) body.defaultCurrency = data.defaultCurrency
    if (data.isCancelled !== undefined) body.isCancelled = data.isCancelled

    const response = await makeAuthenticatedRequest(`/api/trip/${tripIdOrSlug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to update trip: ${response.status}`)
    }

    const trip = await response.json()
    logger.debug('Trip updated successfully', { tripId: trip.id })
    return trip
  } catch (error) {
    logger.error('Error updating trip:', error)
    throw error
  }
}

/**
 * Tripを削除します
 * 
 * @param tripIdOrSlug - Trip IDまたはスラッグ
 * @throws Error 削除に失敗した場合
 * 
 * @example
 * ```typescript
 * await deleteTrip('my-trip-slug')
 * ```
 */
export async function deleteTrip(tripIdOrSlug: string): Promise<void> {
  try {
    logger.debug('Deleting trip', { tripIdOrSlug })

    const response = await makeAuthenticatedRequest(`/api/trip/${tripIdOrSlug}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to delete trip: ${response.status}`)
    }

    logger.debug('Trip deleted successfully', { tripIdOrSlug })
  } catch (error) {
    logger.error('Error deleting trip:', error)
    throw error
  }
}

/**
 * Tripを取得します（スラッグまたはIDで）
 * 
 * @param tripIdOrSlug - Trip IDまたはスラッグ
 * @returns Tripオブジェクト、存在しない場合はnull
 * @throws Error 取得に失敗した場合
 * 
 * @example
 * ```typescript
 * const trip = await getTrip('my-trip-slug')
 * if (trip) {
 *   console.log(trip.title)
 * }
 * ```
 */
export async function getTrip(tripIdOrSlug: string): Promise<Trip | null> {
  try {
    logger.debug('Getting trip', { tripIdOrSlug })

    const response = await makeAuthenticatedRequest(`/api/trip/${tripIdOrSlug}`, {
      method: 'GET',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to get trip: ${response.status}`)
    }

    const trip = await response.json()
    logger.debug('Trip retrieved successfully', { tripId: trip.id })
    return trip
  } catch (error) {
    logger.error('Error getting trip:', error)
    throw error
  }
}
