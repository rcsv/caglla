import { ReservationInfo, ReservationType, ReservationSite } from '@/lib/core/types'
import { toDate, toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { t } from '@/lib/i18n'
import { ClientReservationInfoSchema } from '@/lib/schemas/reservation'
import { z } from 'zod'

/**
 * 予約情報のバリデーション（zod スキーマベース）
 * 
 * Phase 5: validateReservationInfo → ReservationSchema に完全移行
 * 
 * Before:
 * ```typescript
 * export function validateReservationInfo(reservation: Partial<ReservationInfo>): { isValid: boolean; errors: string[] } {
 *   const errors: string[] = []
 *   if (!reservation.type) {
 *     errors.push(t('reservation.validation.typeRequired'))
 *   }
 *   // ... 多くの if 文バリデーション
 *   return { isValid: errors.length === 0, errors }
 * }
 * ```
 * 
 * After:
 * ```typescript
 * // zod スキーマでバリデーションし、エラーメッセージを i18n 対応に変換
 * ```
 * 
 * 注意: エラーメッセージは既存の i18n 関数 `t()` を使用して変換する必要があるため、
 * zod のエラーメッセージを i18n キーにマッピング
 */
export function validateReservationInfo(reservation: Partial<ReservationInfo>): { isValid: boolean; errors: string[] } {
  // zod スキーマでバリデーション
  const result = ClientReservationInfoSchema.safeParse(reservation)
  
  if (result.success) {
    return {
      isValid: true,
      errors: []
    }
  }

  // zod エラーを i18n 対応のエラーメッセージに変換
  const errors: string[] = []
  
  // ZodError の issues プロパティを使用
  for (const error of result.error.issues) {
    const path = error.path.join('.')
    
    // i18n キーへのマッピング
    if (path === 'type') {
      errors.push(t('reservation.validation.typeRequired'))
    } else if (path === 'flight_number') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.flightNumberRequired'))
      } else {
        errors.push(t('reservation.validation.flightNumber'))
      }
    } else if (path === 'departure_airport') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.departureAirportRequired'))
      } else {
        errors.push(t('reservation.validation.airportCode'))
      }
    } else if (path === 'arrival_airport') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.arrivalAirportRequired'))
      } else {
        errors.push(t('reservation.validation.airportCode'))
      }
    } else if (path === 'departure_at') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.departureDateRequired'))
      } else {
        errors.push(t('reservation.validation.invalidDepartureOrArrival'))
      }
    } else if (path === 'arrival_at') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.arrivalDateRequired'))
      } else if (error.message?.includes('after departure')) {
        errors.push(t('reservation.validation.arrivalAfterDeparture'))
      } else {
        errors.push(t('reservation.validation.invalidDepartureOrArrival'))
      }
    } else if (path === 'start_date') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.startDateRequired'))
      } else {
        errors.push(t('reservation.validation.invalidStartOrEnd'))
      }
    } else if (path === 'end_date') {
      if (error.code === z.ZodIssueCode.custom && error.message?.includes('required')) {
        errors.push(t('reservation.validation.endDateRequired'))
      } else if (error.message?.includes('after start')) {
        errors.push(t('reservation.validation.endAfterStart'))
      } else {
        errors.push(t('reservation.validation.invalidStartOrEnd'))
      }
    } else if (path === 'reservation_url') {
      errors.push(t('reservation.validation.reservationUrl'))
    } else {
      // その他のエラーは zod のメッセージを使用（フォールバック）
      errors.push(error.message || 'Validation error')
    }
  }

  return {
    isValid: false,
    errors
  }
}

/**
 * 許可された予約サイトURLかチェック
 */
export function isAllowedReservationUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    
    // HTTPS のみ許可
    if (parsedUrl.protocol !== 'https:') {
      return false
    }

    // ホスト名が存在し、最低限の形式を満たしていれば許可
    return Boolean(parsedUrl.hostname)
  } catch {
    return false
  }
}

/**
 * 予約タイプの表示名を取得（i18n対応）
 */
export function getReservationTypeLabel(type: ReservationType): string {
  const labelMap: Record<ReservationType, string> = {
    flight: t('reservation.type.flight'),
    rental_car: t('reservation.type.rentalCar'),
    hotel: t('reservation.type.hotel'),
    dining: t('reservation.type.dining'),
    other: t('reservation.type.other')
  }
  return labelMap[type] || type
}

/**
 * 予約サイトの表示名を取得（i18n対応）
 */
export function getReservationSiteLabel(site: ReservationSite): string {
  const labelMap: Record<ReservationSite, string> = {
    expedia: t('reservation.site.expedia'),
    booking_com: t('reservation.site.bookingCom'),
    agoda: t('reservation.site.agoda'),
    trivago: t('reservation.site.trivago'),
    airbnb: t('reservation.site.airbnb'),
    kayak: t('reservation.site.kayak'),
    skyscanner: t('reservation.site.skyscanner'),
    tripadvisor: t('reservation.site.tripadvisor'),
    opentable: t('reservation.site.opentable'),
    tabelog: t('reservation.site.tabelog'),
    hot_pepper: t('reservation.site.hotPepper'),
    ana: t('reservation.site.ana'),
    jal: t('reservation.site.jal'),
    rakuten_travel: t('reservation.site.rakutenTravel'),
    jalan: t('reservation.site.jalan'),
    other: t('reservation.site.other')
  }
  return labelMap[site] || site
}

/**
 * 予約タイプのアイコンを取得
 */
export function getReservationTypeIcon(type: ReservationType): string {
  const icons: Record<ReservationType, string> = {
    flight: '✈️',
    rental_car: '🚗',
    hotel: '🏨',
    dining: '🍽️',
    other: '📋'
  }
  return icons[type] || '📋'
}

/**
 * 空港コードのバリデーション（zod スキーマベース）
 * 
 * Phase 5: validateAirportCode → zod regex に吸収
 * 
 * 後方互換性のため、既存の関数シグネチャを維持しつつ、内部実装を zod スキーマに移行
 */
export function validateAirportCode(code: string): boolean {
  const result = AirportCodeSchema.safeParse(code)
  return result.success
}

/**
 * 便名のバリデーション（zod スキーマベース）
 * 
 * Phase 5: validateFlightNumber → zod regex に吸収
 * 
 * 後方互換性のため、既存の関数シグネチャを維持しつつ、内部実装を zod スキーマに移行
 */
export function validateFlightNumber(flightNumber: string): boolean {
  const result = FlightNumberSchema.safeParse(flightNumber)
  return result.success
}

/**
 * 予約情報のサマリーを生成（場所名は外部から提供）
 */
export function generateReservationSummary(reservation: ReservationInfo, placeName?: string): string {
  if (reservation.type === 'flight') {
    const flightNumber = reservation.flight_number || ''
    const departure = reservation.departure_airport || ''
    const arrival = reservation.arrival_airport || ''
    return `${flightNumber} ${departure}→${arrival}`
  } else {
    const name = placeName || '場所未設定'
    const start = reservation.start_date ? toDateOrNull(reservation.start_date) : null
    const end = reservation.end_date ? toDateOrNull(reservation.end_date) : null
    const startDate = start ? start.toLocaleDateString('ja-JP') : ''
    const endDate = end ? end.toLocaleDateString('ja-JP') : ''
    
    if (startDate && endDate) {
      return `${name} (${startDate} - ${endDate})`
    } else if (startDate) {
      return `${name} (${startDate})`
    } else {
      return name
    }
  }
}

/**
 * 予約情報をFirestore用に変換
 */
export function convertReservationForFirestore(reservation: ReservationInfo): any {
  const now = new Date()
  
  return {
    ...reservation,
    created_at: reservation.created_at || now,
    updated_at: now
  }
}

/**
 * Firestoreから取得した予約情報をクライアント用に変換
 */
export function convertReservationFromFirestore(data: any): ReservationInfo {
  return {
    ...data,
    // FirestoreのTimestampをDateに変換（安全）
    start_date: toDateOrNull(data.start_date) || data.start_date,
    end_date: toDateOrNull(data.end_date) || data.end_date,
    departure_at: toDateOrNull(data.departure_at) || data.departure_at,
    arrival_at: toDateOrNull(data.arrival_at) || data.arrival_at,
    created_at: toDateOrNull(data.created_at) || data.created_at,
    updated_at: toDateOrNull(data.updated_at) || data.updated_at
  }
}
