/**
 * Firestore Timestamp変換ユーティリティ
 * FirestoreDate型（Timestamp | Date | string）をDate型に統一的に変換
 */

import type { FirestoreDate } from '@/lib/core/types'

/**
 * FirestoreDateをDate型に変換
 * @param timestamp FirestoreDate (Timestamp | Date | string)
 * @returns Date オブジェクト
 */
export function toDate(timestamp: FirestoreDate | undefined | null): Date {
  if (!timestamp) {
    throw new Error('Invalid timestamp: undefined or null')
  }

  // 既にDate型の場合
  if (timestamp instanceof Date) {
    return timestamp
  }

  // string型の場合
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${timestamp}`)
    }
    return date
  }

  // Firestore Timestamp型の場合（toDateメソッドを持つ）
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate()
    }
  }

  throw new Error(`Unsupported timestamp type: ${typeof timestamp}`)
}

/**
 * FirestoreDateをDate型に安全に変換（nullを許容）
 * @param timestamp FirestoreDate (Timestamp | Date | string) | undefined | null
 * @returns Date オブジェクト または null
 */
export function toDateOrNull(timestamp: FirestoreDate | undefined | null): Date | null {
  if (!timestamp) {
    return null
  }

  try {
    return toDate(timestamp)
  } catch (error) {
    return null
  }
}

/**
 * 複数のFirestoreDateを一括でDate型に変換
 * @param timestamps FirestoreDate配列
 * @returns Date配列
 */
export function toDates(timestamps: (FirestoreDate | undefined | null)[]): Date[] {
  return timestamps
    .map(toDateOrNull)
    .filter((date): date is Date => date !== null)
}

/**
 * オブジェクト内のFirestoreDateフィールドを一括でDate型に変換
 * @param obj オブジェクト
 * @param dateFields 変換対象のフィールド名配列
 * @returns 変換後のオブジェクト
 */
export function convertDatesInObject<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const converted = { ...obj }

  for (const field of dateFields) {
    if (converted[field]) {
      try {
        converted[field] = toDate(converted[field] as FirestoreDate) as any
      } catch (error) {
        // 変換に失敗した場合はそのまま残す
      }
    }
  }

  return converted
}

/**
 * Firestore ドキュメントの標準的な日付フィールドを変換
 * @param doc Firestoreドキュメントデータ
 * @returns 変換後のドキュメント
 */
export function convertStandardDates<T extends Record<string, any>>(doc: T): T {
  return convertDatesInObject(doc, ['created_at', 'updated_at', 'start_date', 'end_date', 'date'] as (keyof T)[])
}

/**
 * 日付の妥当性チェック
 * @param date 任意の値
 * @returns 有効な日付かどうか
 */
export function isValidDate(date: any): boolean {
  if (!date) return false

  try {
    const converted = toDate(date)
    return !isNaN(converted.getTime())
  } catch (error) {
    return false
  }
}

