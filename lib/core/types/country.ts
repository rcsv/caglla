/**
 * 国・ブラウザ情報関連の型定義
 */

import type { FirestoreDate } from './common'

// ============================================================================
// 国関連
// ============================================================================

/**
 * 国の座標
 */
export interface CountryCoordinate {
  countryCode: string
  countryName: string
  countryNameJa: string
  lat: number
  lng: number
}

/**
 * 国別グループ
 */
export interface CountryGroup {
  countryCode: string
  countryName: string
  countryNameJa: string
  tripCount: number
  trips: Array<{
    id: string
    title: string
    destination?: string
    startDate?: FirestoreDate
    endDate?: FirestoreDate
    imageUrl?: string
  }>
}

// ============================================================================
// ブラウザ情報
// ============================================================================

/**
 * ブラウザ情報
 */
export interface BrowserInfo {
  currency: string
  timezone: string
  language: string
  homeAddress?: string
}

