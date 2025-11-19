/**
 * Trip Search Operations
 * 
 * Tripの検索・推奨機能を提供します。
 */

import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Trip, TripStatus } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Trip検索オプション
 */
export interface SearchOptions {
  limit?: number
  cursor?: string
  status?: TripStatus
  accessLevel?: 'private' | 'shared' | 'public'
  destination?: string
}

/**
 * 推奨Tripを取得します
 * 
 * @param limit - 取得件数の上限（デフォルト: 10）
 * @returns 推奨Trip配列
 * @throws Error 取得に失敗した場合
 * 
 * @example
 * ```typescript
 * const recommended = await getRecommendedTrips(5)
 * ```
 */
export async function getRecommendedTrips(limit: number = 10): Promise<{ trips: Trip[] }> {
  try {
    logger.debug('Getting recommended trips', { limit })

    const response = await makeAuthenticatedRequest(`/api/trips/recommended?limit=${limit}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to get recommended trips: ${response.status}`)
    }

    const result = await response.json()
    logger.debug('Recommended trips retrieved successfully', { count: result.trips?.length || 0 })
    return result
  } catch (error) {
    logger.error('Error getting recommended trips:', error)
    throw error
  }
}

/**
 * Tripを検索します（将来実装用）
 * 
 * @param query - 検索クエリ
 * @param options - 検索オプション
 * @returns 検索結果（Trip配列と次のカーソル）
 * @throws Error 検索に失敗した場合
 * 
 * @example
 * ```typescript
 * const result = await searchTrips('東京', { limit: 20, accessLevel: 'public' })
 * ```
 */
export async function searchTrips(
  query: string,
  options: SearchOptions = {}
): Promise<{ trips: Trip[]; nextCursor?: string }> {
  try {
    logger.debug('Searching trips', { query, options })

    const params = new URLSearchParams({
      q: query,
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.cursor && { cursor: options.cursor }),
      ...(options.status && { status: options.status }),
      ...(options.accessLevel && { accessLevel: options.accessLevel }),
      ...(options.destination && { destination: options.destination }),
    })

    const response = await makeAuthenticatedRequest(`/api/trips/search?${params.toString()}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to search trips: ${response.status}`)
    }

    const result = await response.json()
    logger.debug('Trips search completed successfully', { 
      count: result.trips?.length || 0,
      hasNext: !!result.nextCursor
    })
    return result
  } catch (error) {
    logger.error('Error searching trips:', error)
    throw error
  }
}

