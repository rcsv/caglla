/**
 * Trip Replica Operations
 * 
 * Tripの複製機能を提供します。
 */

import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Trip } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Trip複製オプション
 */
export interface ReplicateOptions {
  title?: string
  startDate?: Date | string
  endDate?: Date | string
  accessLevel?: 'private' | 'shared' | 'public'
}

/**
 * Tripを複製します
 * 
 * @param sourceTripSlug - 元のTripスラッグまたはID
 * @param options - 複製オプション
 * @returns 複製されたTrip
 * @throws Error 複製に失敗した場合
 * 
 * @example
 * ```typescript
 * const replica = await replicateTrip('template-trip-slug', {
 *   title: '複製された旅行',
 *   startDate: '2024-06-01',
 *   endDate: '2024-06-03'
 * })
 * ```
 */
export async function replicateTrip(
  sourceTripSlug: string,
  options: ReplicateOptions = {}
): Promise<Trip> {
  try {
    logger.debug('Replicating trip', { sourceTripSlug, options })

    const body: Record<string, any> = {}
    if (options.title) body.title = options.title
    if (options.startDate) {
      body.startDate = options.startDate instanceof Date 
        ? options.startDate.toISOString() 
        : options.startDate
    }
    if (options.endDate) {
      body.endDate = options.endDate instanceof Date 
        ? options.endDate.toISOString() 
        : options.endDate
    }
    if (options.accessLevel) body.accessLevel = options.accessLevel

    const response = await makeAuthenticatedRequest(`/api/trip/${sourceTripSlug}/replica`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to replicate trip: ${response.status}`)
    }

    const result = await response.json()
    logger.debug('Trip replicated successfully', { 
      sourceTripSlug,
      replicaTripId: result.trip?.id 
    })
    return result.trip
  } catch (error) {
    logger.error('Error replicating trip:', error)
    throw error
  }
}

