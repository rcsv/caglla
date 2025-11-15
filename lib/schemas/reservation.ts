/**
 * 予約情報（Reservation）スキーマ
 * 
 * zod スキーマとして定義し、型推論とバリデーションを一元管理
 */

import { z } from 'zod'
import { isAllowedReservationUrl, validateAirportCode, validateFlightNumber } from '@/lib/utils/reservation-utils'

/**
 * 空港コードのバリデーション（zod regex）
 */
const AirportCodeSchema = z.string().regex(/^[A-Z]{3}$/, {
  message: 'Invalid airport code. Must be 3 uppercase letters (e.g., NRT, LAX)'
})

/**
 * 便名のバリデーション（zod regex）
 */
const FlightNumberSchema = z.string().regex(/^[A-Z]{2,3}[0-9]{1,4}$/, {
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

