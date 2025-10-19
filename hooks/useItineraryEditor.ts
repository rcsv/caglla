import { useState, useRef, useCallback } from 'react'
import { Itinerary } from '@/lib/core/types'
import logger from '@/lib/core/logger'

interface UpdateResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 旅程編集用カスタムフック
 * 
 * AbortControllerで競合するリクエストをキャンセルし、
 * 楽観更新+ロールバックでUXを向上させる
 * 
 * @param itinerary - 編集対象のItinerary
 * @param onUpdate - 更新成功時のコールバック
 */
export function useItineraryEditor(
  itinerary: Itinerary, 
  onUpdate?: (updated: Itinerary) => void
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  
  // 現在進行中のリクエストを管理
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 楽観更新のためのロールバック用データ
  const previousDataRef = useRef<Itinerary>(itinerary)
  
  /**
   * 単一フィールドの更新
   */
  const updateField = useCallback(async (
    field: string, 
    value: any,
    options: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    // 既存のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      logger.debug('Previous request aborted')
    }
    
    // 新しいAbortControllerを作成
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    // 楽観更新の場合は即座にUIを更新
    if (options.optimistic) {
      const optimisticData = { ...itinerary, [field]: value }
      onUpdate?.(optimisticData as Itinerary)
    }
    
    // 現在の状態を保存（ロールバック用）
    previousDataRef.current = itinerary
    
    setIsSaving(true)
    setLastError(null)
    
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }
      
      const updated = await response.json()
      
      // 成功時は最新データで更新
      onUpdate?.(updated)
      
      return { success: true, data: updated }
    } catch (error: any) {
      // AbortErrorは無視
      if (error.name === 'AbortError') {
        logger.debug('Request was aborted')
        return { success: false, error: 'aborted' }
      }
      
      // エラー時はロールバック
      if (options.optimistic) {
        onUpdate?.(previousDataRef.current)
      }
      
      const errorMessage = error.message || 'Update failed'
      setLastError(errorMessage)
      logger.error('Update error:', error)
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
      abortControllerRef.current = null
    }
  }, [itinerary, onUpdate])
  
  /**
   * 複数フィールドの一括更新
   */
  const updateFields = useCallback(async (
    updates: Record<string, any>,
    options: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    if (options.optimistic) {
      const optimisticData = { ...itinerary, ...updates }
      onUpdate?.(optimisticData as Itinerary)
    }
    
    previousDataRef.current = itinerary
    
    setIsSaving(true)
    setLastError(null)
    
    try {
      const response = await fetch(`/api/itineraries/${itinerary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }
      
      const updated = await response.json()
      onUpdate?.(updated)
      
      return { success: true, data: updated }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'aborted' }
      }
      
      if (options.optimistic) {
        onUpdate?.(previousDataRef.current)
      }
      
      const errorMessage = error.message || 'Update failed'
      setLastError(errorMessage)
      logger.error('Batch update error:', error)
      
      return { success: false, error: errorMessage }
    } finally {
      setIsSaving(false)
      abortControllerRef.current = null
    }
  }, [itinerary, onUpdate])
  
  /**
   * クリーンアップ（コンポーネントのアンマウント時に呼ぶ）
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  
  return { 
    updateField, 
    updateFields,
    cleanup,
    isSaving, 
    lastError 
  }
}

