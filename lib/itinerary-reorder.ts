/**
 * Itineraryの並び替え機能
 */

export interface ReorderItinerariesRequest {
  dayId: string
  itineraryIds: string[]
}

export interface ReorderItinerariesResponse {
  success: boolean
  message: string
  reorderedCount: number
}

/**
 * itineraryの順序を更新する
 */
export const reorderItineraries = async (
  dayId: string,
  itineraryIds: string[]
): Promise<ReorderItinerariesResponse> => {
  try {
    const response = await fetch('/api/itineraries/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dayId,
        itineraryIds
      }),
      signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Reorder API error: ${response.status}`)
    }

    const result: ReorderItinerariesResponse = await response.json()
    return result
  } catch (error) {
    console.error('Error reordering itineraries:', error)
    // デモ環境では、サーバーエラーでもクライアントサイドの更新は成功として扱う
    if (error instanceof Error && error.message.includes('server update skipped')) {
      return {
        success: true,
        message: 'Client-side reordering completed',
        reorderedCount: itineraryIds.length
      }
    }
    throw error
  }
}

/**
 * 最適化された順序でitineraryを並び替える
 */
export const applyOptimizedOrder = async (
  dayId: string,
  itineraries: any[],
  optimizedOrder: number[]
): Promise<void> => {
  try {
    console.log('applyOptimizedOrder called with:', {
      dayId,
      itinerariesCount: itineraries.length,
      optimizedOrder
    })

    // 有効なitinerary（場所データがあるもの）をフィルタリング
    const validItineraries = itineraries.filter(
      itinerary => itinerary.place_data?.geometry?.location
    )

    console.log('Valid itineraries:', validItineraries.map(it => ({ id: it.id, name: it.place_data?.name })))

    if (validItineraries.length !== optimizedOrder.length) {
      throw new Error(`Optimized order length (${optimizedOrder.length}) does not match valid itineraries count (${validItineraries.length})`)
    }

    // 最適化された順序でitineraryを並び替え
    const reorderedItineraries = optimizedOrder.map(index => validItineraries[index])
    
    console.log('Reordered itineraries:', reorderedItineraries.map(it => ({ id: it.id, name: it.place_data?.name })))
    
    // itineraryのIDを取得
    const itineraryIds = reorderedItineraries.map(itinerary => itinerary.id)

    console.log('Itinerary IDs to reorder:', itineraryIds)

    // サーバーに並び替えを送信
    const result = await reorderItineraries(dayId, itineraryIds)
    console.log('Reorder result:', result)
  } catch (error) {
    console.error('Error applying optimized order:', error)
    throw error
  }
}

/**
 * itineraryの順序を手動で並び替える
 */
export const manualReorderItineraries = async (
  dayId: string,
  itineraries: any[],
  fromIndex: number,
  toIndex: number
): Promise<void> => {
  try {
    // 配列をコピー
    const reorderedItineraries = [...itineraries]
    
    // 要素を移動
    const [movedItem] = reorderedItineraries.splice(fromIndex, 1)
    reorderedItineraries.splice(toIndex, 0, movedItem)
    
    // 新しい順序でIDを取得
    const itineraryIds = reorderedItineraries.map(itinerary => itinerary.id)
    
    // サーバーに並び替えを送信
    await reorderItineraries(dayId, itineraryIds)
  } catch (error) {
    console.error('Error manually reordering itineraries:', error)
    throw error
  }
}
