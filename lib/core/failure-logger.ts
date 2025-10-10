/**
 * 汎用失敗ログ管理システム
 * ローカルストレージにログを保存し、バッチ分析を提供
 */

import logger from '@/lib/core/logger'

export interface BaseFailureLog {
  id: string
  created_at: Date
  user_id?: string
  status: 'pending' | 'processed' | 'ignored'
}

export interface FailureLoggerConfig {
  storageKey: string
  batchSize: number
}

export class FailureLogger<T extends BaseFailureLog> {
  private config: FailureLoggerConfig

  constructor(storageKey: string, batchSize: number = 50) {
    this.config = {
      storageKey,
      batchSize
    }
  }

  /**
   * 失敗ログを保存
   */
  save(log: Omit<T, 'id'>): void {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return
    
    try {
      const existingLogs = this.getLogs()
      const newLog: T = {
        ...log,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      } as T
      
      existingLogs.push(newLog)
      localStorage.setItem(this.config.storageKey, JSON.stringify(existingLogs))
      
      // バッチサイズに達したら通知
      if (existingLogs.length >= this.config.batchSize) {
        logger.warn(`Failure logs reached batch size (${this.config.batchSize}) for key: ${this.config.storageKey}`)
      }
    } catch (error) {
      logger.error('Failed to save failure log:', error)
    }
  }

  /**
   * すべてのログを取得
   */
  getLogs(): T[] {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return []
    
    try {
      const logs = localStorage.getItem(this.config.storageKey)
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      logger.error('Failed to get failure logs:', error)
      return []
    }
  }

  /**
   * 保留中のログを取得
   */
  getPendingLogs(): T[] {
    return this.getLogs().filter(log => log.status === 'pending')
  }

  /**
   * ログをクリア
   */
  clear(): void {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.config.storageKey)
    } catch (error) {
      logger.error('Failed to clear failure logs:', error)
    }
  }

  /**
   * ログを処理済みとしてマーク
   */
  markAsProcessed(logIds: string[]): void {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return
    
    const logs = this.getLogs()
    const updatedLogs = logs.map(log => 
      logIds.includes(log.id) 
        ? { ...log, status: 'processed' as const }
        : log
    )
    
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(updatedLogs))
    } catch (error) {
      logger.error('Failed to update log status:', error)
    }
  }

  /**
   * ログを無視としてマーク
   */
  markAsIgnored(logIds: string[]): void {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return
    
    const logs = this.getLogs()
    const updatedLogs = logs.map(log => 
      logIds.includes(log.id) 
        ? { ...log, status: 'ignored' as const }
        : log
    )
    
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(updatedLogs))
    } catch (error) {
      logger.error('Failed to update log status:', error)
    }
  }

  /**
   * バッチサイズに達しているかチェック
   */
  shouldProcessBatch(): boolean {
    const pendingLogs = this.getPendingLogs()
    return pendingLogs.length >= this.config.batchSize
  }

  /**
   * ログ統計を取得
   */
  getStats(): {
    total: number
    pending: number
    processed: number
    ignored: number
  } {
    const logs = this.getLogs()
    return {
      total: logs.length,
      pending: logs.filter(log => log.status === 'pending').length,
      processed: logs.filter(log => log.status === 'processed').length,
      ignored: logs.filter(log => log.status === 'ignored').length
    }
  }
}

