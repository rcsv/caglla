import { useState, useRef, useCallback } from 'react'
import logger from '@/lib/core/logger'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'

interface UpdateResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * 汎用的なエンティティ編集フック
 * 
 * AbortControllerで競合するリクエストをキャンセルし、
 * 楽観更新+ロールバックでUXを向上させる
 * 
 * @param entity - 編集対象のエンティティ（idフィールド必須）
 * @param apiPath - APIパス（例: 'trips', 'days', 'users'）
 * @param onUpdate - 更新成功時のコールバック
 * @param options - オプション設定
 */
export function useEntityEditor<T extends { id: string }>(
  entity: T,
  apiPath: string,
  onUpdate?: (updated: T) => void,
  options?: {
    idField?: keyof T  // デフォルト: 'id'
    method?: 'PUT' | 'PATCH'  // デフォルト: 'PUT'
  }
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  
  // 現在進行中のリクエストを管理
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 楽観更新のためのロールバック用データ
  const previousDataRef = useRef<T>(entity)
  
  const idField = options?.idField || ('id' as keyof T)
  const method = options?.method || 'PUT'
  
  /**
   * 単一フィールドの更新
   */
  const updateField = useCallback(async (
    field: keyof T, 
    value: any,
    updateOptions: { optimistic?: boolean } = {}
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
    if (updateOptions.optimistic) {
      const optimisticData = { ...entity, [field]: value }
      onUpdate?.(optimisticData)
    }
    
    // 現在の状態を保存（ロールバック用）
    previousDataRef.current = entity
    
    setIsSaving(true)
    setLastError(null)
    
    try {
      const entityId = entity[idField] as string
      const response = await makeAuthenticatedRequest(`/api/${apiPath}/${entityId}`, {
        method,
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
      if (updateOptions.optimistic) {
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
  }, [entity, apiPath, onUpdate, idField, method])
  
  /**
   * 複数フィールドの一括更新
   */
  const updateFields = useCallback(async (
    updates: Partial<T>,
    updateOptions: { optimistic?: boolean } = {}
  ): Promise<UpdateResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    if (updateOptions.optimistic) {
      const optimisticData = { ...entity, ...updates }
      onUpdate?.(optimisticData)
    }
    
    previousDataRef.current = entity
    
    setIsSaving(true)
    setLastError(null)
    
    try {
      const entityId = entity[idField] as string
      const response = await makeAuthenticatedRequest(`/api/${apiPath}/${entityId}`, {
        method,
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
      
      if (updateOptions.optimistic) {
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
  }, [entity, apiPath, onUpdate, idField, method])
  
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

