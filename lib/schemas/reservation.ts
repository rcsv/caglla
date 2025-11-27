/**
 * 予約情報（Reservation）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'
import { isAllowedReservationUrl } from '@/lib/utils/reservation-utils'

/**
 * 空港コードのバリデーションスキーマ（zod regex）
 * 
 * Phase 5: validateAirportCode → zod regex に吸収
 * 
 * 注意: lib/utils/reservation-utils.ts の validateAirportCode 関数と共通の定義を使用
 */
export const AirportCodeSchema = z.string().regex(/^[A-Z]{3}$/, {
  message: 'Invalid airport code. Must be 3 uppercase letters (e.g., NRT, LAX)'
})

/**
 * 便名のバリデーションスキーマ（zod regex）
 * 
 * Phase 5: validateFlightNumber → zod regex に吸収
 * 
 * 注意: lib/utils/reservation-utils.ts の validateFlightNumber 関数と共通の定義を使用
 */
export const FlightNumberSchema = z.string().regex(/^[A-Z]{2,3}[0-9]{1,4}$/, {
  message: 'Invalid flight number format (e.g., NH123, JAL456)'
})

/**
 * 予約タイプ
 */
export const ReservationTypeSchema = z.enum(['flight', 'rental_car', 'hotel', 'dining', 'other'])

/**
 * 予約サイト
 */
export const ReservationSiteSchema = z.enum([
  'expedia',
  'booking_com',
  'agoda',
  'trivago',
  'airbnb',
  'kayak',
  'skyscanner',
  'tripadvisor',
  'opentable',
  'tabelog',
  'hot_pepper',
  'ana',
  'jal',
  'rakuten_travel',
  'jalan',
  'other'
])

/**
 * 飛行機予約のスキーマ
 */
export const FlightReservationSchema = z.object({
  type: z.literal('flight'),
  flight_number: FlightNumberSchema,
  departure_airport: AirportCodeSchema,
  arrival_airport: AirportCodeSchema,
  departure_at: z.string().datetime({ message: 'Invalid departure datetime format' }),
  arrival_at: z.string().datetime({ message: 'Invalid arrival datetime format' }),
  reservation_site: ReservationSiteSchema.optional(),
  airline: z.string().optional(),
  reservation_url: z.string().url().refine(
    isAllowedReservationUrl,
    { message: 'Invalid reservation URL. Only HTTPS URLs from allowed sites are permitted' }
  ).optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    const departure = new Date(data.departure_at)
    const arrival = new Date(data.arrival_at)
    return departure.getTime() < arrival.getTime()
  },
  {
    message: 'Arrival time must be after departure time',
    path: ['arrival_at']
  }
)

/**
 * その他の予約（ホテル、レンタカー、食事、その他）のスキーマ
 */
export const OtherReservationSchema = z.object({
  type: z.enum(['rental_car', 'hotel', 'dining', 'other']),
  start_date: z.string().datetime({ message: 'Invalid start datetime format' }),
  end_date: z.string().datetime({ message: 'Invalid end datetime format' }),
  reservation_site: ReservationSiteSchema.optional(),
  reservation_url: z.string().url().refine(
    isAllowedReservationUrl,
    { message: 'Invalid reservation URL. Only HTTPS URLs from allowed sites are permitted' }
  ).optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return start.getTime() < end.getTime()
  },
  {
    message: 'End date must be after start date',
    path: ['end_date']
  }
)

/**
 * 予約情報のスキーマ（discriminated union）
 */
export const ReservationSchema = z.discriminatedUnion('type', [
  FlightReservationSchema,
  OtherReservationSchema
])

/**
 * 型推論
 */
export type ReservationInput = z.infer<typeof ReservationSchema>

// ============================================================================
// クライアント側用スキーマ（FirestoreDate 対応）
// ============================================================================

/**
 * FirestoreDate スキーマ（Date、Firestore Timestamp、string のいずれかを受け入れる）
 * 
 * Phase 5: validateReservationInfo → ReservationSchema に移行
 * 
 * クライアント側の `ReservationInfo` は `FirestoreDate` 型を使用するため、
 * これに対応した zod スキーマが必要
 */
const FirestoreDateSchema: z.ZodType<any> = z.union([
  z.date(),
  z.string(),
  z.any().refine(
    (val) => {
      // Firestore Timestamp オブジェクト（toDate() メソッドを持つ）
      if (val && typeof val === 'object' && typeof val.toDate === 'function') {
        return true
      }
      // Date オブジェクト
      if (val instanceof Date) {
        return true
      }
      // string（ISO 8601形式）
      if (typeof val === 'string') {
        const date = new Date(val)
        return !isNaN(date.getTime())
      }
      return false
    },
    { message: 'Invalid date format' }
  )
])

/**
 * クライアント側用の飛行機予約スキーマ（FirestoreDate 対応）
 */
const ClientFlightReservationSchema = z.object({
  type: z.literal('flight'),
  flight_number: FlightNumberSchema.optional(),
  departure_airport: AirportCodeSchema.optional(),
  arrival_airport: AirportCodeSchema.optional(),
  departure_at: FirestoreDateSchema.optional(),
  arrival_at: FirestoreDateSchema.optional(),
  reservation_site: ReservationSiteSchema.optional(),
  airline: z.string().optional(),
  reservation_url: z.string().url().refine(
    isAllowedReservationUrl,
    { message: 'Invalid reservation URL. Only HTTPS URLs from allowed sites are permitted' }
  ).optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    if (data.departure_at && data.arrival_at) {
      const departure = data.departure_at instanceof Date 
        ? data.departure_at 
        : (typeof data.departure_at === 'object' && data.departure_at?.toDate ? data.departure_at.toDate() : new Date(data.departure_at))
      const arrival = data.arrival_at instanceof Date 
        ? data.arrival_at 
        : (typeof data.arrival_at === 'object' && data.arrival_at?.toDate ? data.arrival_at.toDate() : new Date(data.arrival_at))
      return departure.getTime() < arrival.getTime()
    }
    return true
  },
  {
    message: 'Arrival time must be after departure time',
    path: ['arrival_at']
  }
)

/**
 * クライアント側用のその他の予約スキーマ（FirestoreDate 対応）
 */
const ClientOtherReservationSchema = z.object({
  type: z.enum(['rental_car', 'hotel', 'dining', 'other']),
  start_date: FirestoreDateSchema.optional(),
  end_date: FirestoreDateSchema.optional(),
  reservation_site: ReservationSiteSchema.optional(),
  reservation_url: z.string().url().refine(
    isAllowedReservationUrl,
    { message: 'Invalid reservation URL. Only HTTPS URLs from allowed sites are permitted' }
  ).optional(),
  notes: z.string().optional()
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      const start = data.start_date instanceof Date 
        ? data.start_date 
        : (typeof data.start_date === 'object' && data.start_date?.toDate ? data.start_date.toDate() : new Date(data.start_date))
      const end = data.end_date instanceof Date 
        ? data.end_date 
        : (typeof data.end_date === 'object' && data.end_date?.toDate ? data.end_date.toDate() : new Date(data.end_date))
      return start.getTime() < end.getTime()
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['end_date']
  }
)

/**
 * クライアント側用の予約情報スキーマ（Partial<ReservationInfo> 対応）
 * 
 * Phase 5: validateReservationInfo → ReservationSchema に移行
 * 
 * 注意: `Partial<ReservationInfo>` を受け取るため、すべてのフィールドがオプショナル
 * ただし、`type` が存在する場合、その type に応じた必須フィールドをチェック
 * 
 * `passthrough()` を使用して、すべてのフィールドを受け入れつつ、
 * `superRefine()` で条件付きバリデーションを実行
 */
export const ClientReservationInfoSchema = z.object({
  type: ReservationTypeSchema.optional(),
  flight_number: FlightNumberSchema.optional(),
  departure_airport: AirportCodeSchema.optional(),
  arrival_airport: AirportCodeSchema.optional(),
  departure_at: FirestoreDateSchema.optional(),
  arrival_at: FirestoreDateSchema.optional(),
  start_date: FirestoreDateSchema.optional(),
  end_date: FirestoreDateSchema.optional(),
  reservation_site: ReservationSiteSchema.optional(),
  airline: z.string().optional(),
  reservation_url: z.string().url().refine(
    isAllowedReservationUrl,
    { message: 'Invalid reservation URL. Only HTTPS URLs from allowed sites are permitted' }
  ).optional(),
  notes: z.string().optional()
}).passthrough().superRefine((data, ctx) => {
  // type が必須
  if (!data.type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reservation type is required',
      path: ['type']
    })
    return // type がない場合は他のチェックをスキップ
  }
  
  // type が存在する場合、その type に応じた必須フィールドをチェック
  if (data.type === 'flight') {
    if (!data.flight_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Flight number is required for flight reservations',
        path: ['flight_number']
      })
    }
    if (!data.departure_airport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Departure airport is required for flight reservations',
        path: ['departure_airport']
      })
    }
    if (!data.arrival_airport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Arrival airport is required for flight reservations',
        path: ['arrival_airport']
      })
    }
    if (!data.departure_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Departure date is required for flight reservations',
        path: ['departure_at']
      })
    }
    if (!data.arrival_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Arrival date is required for flight reservations',
        path: ['arrival_at']
      })
    }
    
    // 日時の論理チェック
    if (data.departure_at && data.arrival_at) {
      const departure = data.departure_at instanceof Date 
        ? data.departure_at 
        : (typeof data.departure_at === 'object' && data.departure_at?.toDate ? data.departure_at.toDate() : new Date(data.departure_at))
      const arrival = data.arrival_at instanceof Date 
        ? data.arrival_at 
        : (typeof data.arrival_at === 'object' && data.arrival_at?.toDate ? data.arrival_at.toDate() : new Date(data.arrival_at))
      
      if (departure.getTime() >= arrival.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Arrival time must be after departure time',
          path: ['arrival_at']
        })
      }
    }
  } else if (['rental_car', 'hotel', 'dining', 'other'].includes(data.type)) {
    if (!data.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date is required',
        path: ['start_date']
      })
    }
    if (!data.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date is required',
        path: ['end_date']
      })
    }
    
    // 日時の論理チェック
    if (data.start_date && data.end_date) {
      const start = data.start_date instanceof Date 
        ? data.start_date 
        : (typeof data.start_date === 'object' && data.start_date?.toDate ? data.start_date.toDate() : new Date(data.start_date))
      const end = data.end_date instanceof Date 
        ? data.end_date 
        : (typeof data.end_date === 'object' && data.end_date?.toDate ? data.end_date.toDate() : new Date(data.end_date))
      
      if (start.getTime() >= end.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be after start date',
          path: ['end_date']
        })
      }
    }
  }
})

