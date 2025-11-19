/**
 * Itinerary Operations
 * 
 * ItineraryのCRUD操作を提供します。
 * コンポーネントから直接APIを呼び出す代わりに、このライブラリ関数を使用してください。
 */

import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Itinerary, PlaceData, ActivityTag } from '@/lib/core/types'
import logger from '@/lib/core/logger'

/**
 * Itinerary作成の入力データ
 */
export interface CreateItineraryInput {
  day_id: string
  title: string
  description?: string
  location?: string
  place_id?: string
  place_data?: PlaceData
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number
  cost_currency?: string
  activity_tag?: ActivityTag
  insert_after_index?: number
}

/**
 * Itinerary更新の入力データ
 */
export interface UpdateItineraryInput {
  title?: string
  description?: string
  location?: string
  place_id?: string
  place_data?: PlaceData
  start_time?: string
  end_time?: string
  timezone?: string
  cost_amount?: number
  cost_currency?: string
  activity_tag?: ActivityTag
  sort_number?: number
  day_id?: string // reorder時に使用
}

/**
 * Itineraryを作成します
 * 
 * @param data - Itinerary作成データ
 * @returns 作成されたItinerary
 * @throws Error 作成に失敗した場合
 * 
 * @example
 * ```typescript
 * const itinerary = await createItinerary({
 *   day_id: 'day-id',
 *   title: '東京タワー観光',
 *   place_id: 'ChIJxxxxx'
 * })
 * ```
 */
export async function createItinerary(data: CreateItineraryInput): Promise<Itinerary> {
  try {
    logger.debug('Creating itinerary', { day_id: data.day_id, title: data.title })

    const body: Record<string, any> = {
      day_id: data.day_id,
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.location && { location: data.location }),
      ...(data.place_id && { place_id: data.place_id }),
      ...(data.place_data && { place_data: data.place_data }),
      ...(data.start_time && { start_time: data.start_time }),
      ...(data.end_time && { end_time: data.end_time }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.cost_amount !== undefined && { cost_amount: data.cost_amount }),
      ...(data.cost_currency && { cost_currency: data.cost_currency }),
      ...(data.activity_tag && { activity_tag: data.activity_tag }),
      ...(data.insert_after_index !== undefined && { insert_after_index: data.insert_after_index }),
    }

    const response = await makeAuthenticatedRequest('/api/itineraries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to create itinerary: ${response.status}`)
    }

    const itinerary = await response.json()
    logger.debug('Itinerary created successfully', { itineraryId: itinerary.id })
    return itinerary
  } catch (error) {
    logger.error('Error creating itinerary:', error)
    throw error
  }
}

/**
 * Itineraryを更新します
 * 
 * @param itineraryId - Itinerary ID
 * @param data - Itinerary更新データ
 * @returns 更新されたItinerary
 * @throws Error 更新に失敗した場合
 * 
 * @example
 * ```typescript
 * const updatedItinerary = await updateItinerary('itinerary-id', {
 *   title: '更新されたタイトル',
 *   description: '更新された説明'
 * })
 * ```
 */
export async function updateItinerary(
  itineraryId: string,
  data: UpdateItineraryInput
): Promise<Itinerary> {
  try {
    logger.debug('Updating itinerary', { itineraryId })

    const body: Record<string, any> = {}
    if (data.title !== undefined) body.title = data.title
    if (data.description !== undefined) body.description = data.description
    if (data.location !== undefined) body.location = data.location
    if (data.place_id !== undefined) body.place_id = data.place_id
    if (data.place_data !== undefined) body.place_data = data.place_data
    if (data.start_time !== undefined) body.start_time = data.start_time
    if (data.end_time !== undefined) body.end_time = data.end_time
    if (data.timezone !== undefined) body.timezone = data.timezone
    if (data.cost_amount !== undefined) body.cost_amount = data.cost_amount
    if (data.cost_currency !== undefined) body.cost_currency = data.cost_currency
    if (data.activity_tag !== undefined) body.activity_tag = data.activity_tag
    if (data.sort_number !== undefined) body.sort_number = data.sort_number
    if (data.day_id !== undefined) body.day_id = data.day_id

    const response = await makeAuthenticatedRequest(`/api/itineraries/${itineraryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to update itinerary: ${response.status}`)
    }

    const itinerary = await response.json()
    logger.debug('Itinerary updated successfully', { itineraryId: itinerary.id })
    return itinerary
  } catch (error) {
    logger.error('Error updating itinerary:', error)
    throw error
  }
}

/**
 * Itineraryを削除します
 * 
 * @param itineraryId - Itinerary ID
 * @throws Error 削除に失敗した場合
 * 
 * @example
 * ```typescript
 * await deleteItinerary('itinerary-id')
 * ```
 */
export async function deleteItinerary(itineraryId: string): Promise<void> {
  try {
    logger.debug('Deleting itinerary', { itineraryId })

    const response = await makeAuthenticatedRequest(`/api/itineraries/${itineraryId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to delete itinerary: ${response.status}`)
    }

    logger.debug('Itinerary deleted successfully', { itineraryId })
  } catch (error) {
    logger.error('Error deleting itinerary:', error)
    throw error
  }
}

/**
 * Itineraryを挿入します（指定位置に挿入）
 * 
 * @param dayId - Day ID
 * @param data - Itinerary作成データ
 * @param insertAfterIndex - 挿入位置（このインデックスの後に挿入、未指定の場合は最後に追加）
 * @returns 作成されたItinerary
 * @throws Error 挿入に失敗した場合
 * 
 * @example
 * ```typescript
 * const itinerary = await insertItinerary('day-id', {
 *   day_id: 'day-id',
 *   title: '新しい旅程',
 *   place_id: 'ChIJxxxxx'
 * }, 2) // 3番目の位置に挿入（インデックス2の後）
 * ```
 */
export async function insertItinerary(
  dayId: string,
  data: Omit<CreateItineraryInput, 'day_id' | 'insert_after_index'>,
  insertAfterIndex?: number
): Promise<Itinerary> {
  return createItinerary({
    ...data,
    day_id: dayId,
    insert_after_index: insertAfterIndex,
  })
}

/**
 * Itineraryの順序を変更します
 * 
 * @param dayId - Day ID
 * @param itineraryIds - 新しい順序のItinerary ID配列
 * @returns 更新されたItinerary配列
 * @throws Error 順序変更に失敗した場合
 * 
 * @example
 * ```typescript
 * const reordered = await reorderItineraries('day-id', ['id1', 'id3', 'id2'])
 * ```
 */
export async function reorderItineraries(
  dayId: string,
  itineraryIds: string[]
): Promise<Itinerary[]> {
  try {
    logger.debug('Reordering itineraries', { dayId, itineraryIds })

    const response = await makeAuthenticatedRequest('/api/itineraries/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        day_id: dayId,
        itinerary_ids: itineraryIds,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `Failed to reorder itineraries: ${response.status}`)
    }

    const result = await response.json()
    logger.debug('Itineraries reordered successfully', { dayId })
    return result.itineraries || []
  } catch (error) {
    logger.error('Error reordering itineraries:', error)
    throw error
  }
}
