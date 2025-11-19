/**
 * Day Operations
 * 
 * DayのCRUD操作を提供します。
 * コンポーネントから直接APIを呼び出す代わりに、このライブラリ関数を使用してください。
 */

import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Day } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Day作成の入力データ
 */
export interface CreateDayInput {
  trip_id: string
  day_number: number
  date?: Date | string
  description?: string
}

/**
 * Day更新の入力データ
 */
export interface UpdateDayInput {
  day_number?: number
  date?: Date | string
  description?: string
}

/**
 * Dayを作成します
 * 
 * @param tripSlug - TripスラッグまたはID
 * @returns 作成されたDay
 * @throws Error 作成に失敗した場合
 * 
 * @example
 * ```typescript
 * const day = await createDay('my-trip-slug')
 * ```
 */
export async function createDay(tripSlug: string): Promise<Day> {
  try {
    logger.debug('Creating day', { tripSlug })

    const response = await makeAuthenticatedRequest(`/api/trip/${tripSlug}/day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to create day: ${response.status}`)
    }

    const day = await response.json()
    logger.debug('Day created successfully', { dayId: day.id })
    return day
  } catch (error) {
    logger.error('Error creating day:', error)
    throw error
  }
}

/**
 * Dayを更新します
 * 
 * @param dayId - Day ID
 * @param data - Day更新データ
 * @returns 更新されたDay
 * @throws Error 更新に失敗した場合
 * 
 * @example
 * ```typescript
 * const updatedDay = await updateDay('day-id', {
 *   day_number: 2,
 *   date: '2024-06-02'
 * })
 * ```
 */
export async function updateDay(dayId: string, data: UpdateDayInput): Promise<Day> {
  try {
    logger.debug('Updating day', { dayId })

    const body: Record<string, any> = {}
    if (data.day_number !== undefined) body.day_number = data.day_number
    if (data.date !== undefined) {
      body.date = data.date instanceof Date 
        ? data.date.toISOString() 
        : data.date
    }
    if (data.description !== undefined) body.description = data.description

    const response = await makeAuthenticatedRequest(`/api/day/${dayId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to update day: ${response.status}`)
    }

    const day = await response.json()
    logger.debug('Day updated successfully', { dayId: day.id })
    return day
  } catch (error) {
    logger.error('Error updating day:', error)
    throw error
  }
}

/**
 * Dayを削除します
 * 
 * @param dayId - Day ID
 * @throws Error 削除に失敗した場合
 * 
 * @example
 * ```typescript
 * await deleteDay('day-id')
 * ```
 */
export async function deleteDay(dayId: string): Promise<void> {
  try {
    logger.debug('Deleting day', { dayId })

    const response = await makeAuthenticatedRequest(`/api/day/${dayId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to delete day: ${response.status}`)
    }

    logger.debug('Day deleted successfully', { dayId })
  } catch (error) {
    logger.error('Error deleting day:', error)
    throw error
  }
}

/**
 * Tripの日程範囲を更新します（Daysを自動生成）
 * 
 * @param tripSlug - TripスラッグまたはID
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns 更新されたTrip
 * @throws Error 更新に失敗した場合
 * 
 * @example
 * ```typescript
 * const updatedTrip = await updateDaysForTrip('my-trip-slug', new Date('2024-06-01'), new Date('2024-06-03'))
 * ```
 */
export async function updateDaysForTrip(
  tripSlug: string,
  startDate: Date | string,
  endDate: Date | string
): Promise<void> {
  try {
    logger.debug('Updating days for trip', { tripSlug, startDate, endDate })

    const body = {
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
    }

    const response = await makeAuthenticatedRequest(`/api/trip/${tripSlug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to update days for trip: ${response.status}`)
    }

    logger.debug('Days updated successfully for trip', { tripSlug })
  } catch (error) {
    logger.error('Error updating days for trip:', error)
    throw error
  }
}
