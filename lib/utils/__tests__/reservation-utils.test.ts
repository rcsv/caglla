import { validateReservationInfo } from '../reservation-utils'
import type { ReservationInfo } from '@/lib/core/types'
import { t } from '@/lib/i18n'

describe('validateReservationInfo', () => {
  it('should validate flight reservation', () => {
    const reservation: Partial<ReservationInfo> = {
      type: 'flight',
      flight_number: 'NH123',
      departure_airport: 'NRT',
      arrival_airport: 'JFK',
      departure_at: new Date('2024-01-01T10:00:00'),
      arrival_at: new Date('2024-01-01T14:00:00'),
    }

    const result = validateReservationInfo(reservation)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return errors for missing flight fields', () => {
    const reservation: Partial<ReservationInfo> = {
      type: 'flight',
      // Missing flight_number, departure_airport, etc.
    }

    const result = validateReservationInfo(reservation)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should validate hotel reservation', () => {
    const reservation: Partial<ReservationInfo> = {
      type: 'hotel',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-05'),
    }

    const result = validateReservationInfo(reservation)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should return error for invalid date range', () => {
    const reservation: Partial<ReservationInfo> = {
      type: 'hotel',
      start_date: new Date('2024-01-05'), // After end_date
      end_date: new Date('2024-01-01'),
    }

    const result = validateReservationInfo(reservation)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(t('reservation.validation.endAfterStart'))
  })

  it('should return error for invalid reservation URL', () => {
    const reservation: Partial<ReservationInfo> = {
      type: 'flight',
      reservation_url: 'http://insecure-url.com', // Not https
    }

    const result = validateReservationInfo(reservation)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(t('reservation.validation.reservationUrl'))
  })
})

