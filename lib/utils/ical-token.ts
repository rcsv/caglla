/**
 * iCal公開用トークン管理
 */

import { randomUUID } from 'crypto'

/**
 * iCal公開用のトークンを生成（UUID v4）
 */
export function generateICalToken(): string {
  return randomUUID()
}

/**
 * トークンの検証（簡易版）
 */
export function validateICalToken(token: string | null | undefined): boolean {
  if (!token) return false
  
  // UUID v4のフォーマット検証（簡易版）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(token)
}

