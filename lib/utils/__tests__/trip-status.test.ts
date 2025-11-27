/**
 * TripStatus計算関数のテスト
 */

import { getTripStatus } from '../trip-status'
import type { Trip } from '@/lib/core/types'

describe('getTripStatus', () => {
  const now = new Date('2024-06-15T12:00:00Z')

  describe('キャンセルされた旅行', () => {
    it('is_cancelled === true の場合は CANCELLED を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Cancelled Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: true,
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-06-10'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('CANCELLED')
    })

    it('キャンセルされた旅行は、日付に関係なく CANCELLED を返す', () => {
      const trip1: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Cancelled Future Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: true,
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-07-10'),
        created_at: now,
        updated_at: now,
      }

      const trip2: Trip = {
        id: 'trip-2',
        user_id: 'user-1',
        title: 'Cancelled Active Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: true,
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      const trip3: Trip = {
        id: 'trip-3',
        user_id: 'user-1',
        title: 'Cancelled Past Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: true,
        start_date: new Date('2024-05-01'),
        end_date: new Date('2024-05-10'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip1, now)).toBe('CANCELLED')
      expect(getTripStatus(trip2, now)).toBe('CANCELLED')
      expect(getTripStatus(trip3, now)).toBe('CANCELLED')
    })
  })

  describe('日付が未設定の旅行', () => {
    it('start_date が未設定の場合は PLANNING を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'No Start Date Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('PLANNING')
    })

    it('end_date が未設定の場合は PLANNING を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'No End Date Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-01'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('PLANNING')
    })

    it('両方の日付が未設定の場合は PLANNING を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'No Dates Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('PLANNING')
    })
  })

  describe('旅行中（ACTIVE）', () => {
    it('start_date <= 今日 <= end_date の場合は ACTIVE を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Active Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('ACTIVE')
    })

    it('今日が start_date と同日の場合は ACTIVE を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Start Today Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-15'),
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('ACTIVE')
    })

    it('今日が end_date と同日の場合は ACTIVE を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'End Today Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-15'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('ACTIVE')
    })

    it('start_date と end_date が同日で、今日も同じ日の場合は ACTIVE を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'One Day Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-15'),
        end_date: new Date('2024-06-15'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('ACTIVE')
    })
  })

  describe('完了（COMPLETED）', () => {
    it('end_date < 今日 の場合は COMPLETED を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Completed Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-05-01'),
        end_date: new Date('2024-05-10'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('COMPLETED')
    })

    it('end_date が昨日の場合は COMPLETED を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Ended Yesterday Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-14'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('COMPLETED')
    })
  })

  describe('計画中（PLANNING）', () => {
    it('start_date > 今日 の場合は PLANNING を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Future Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-07-10'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('PLANNING')
    })

    it('start_date が明日の場合は PLANNING を返す', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Start Tomorrow Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-16'),
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('PLANNING')
    })
  })

  describe('エッジケース', () => {
    it('is_cancelled が undefined の場合は日付から判定する', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Active Trip (undefined cancelled)',
        status: 'PLANNING',
        access_level: 'private',
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('ACTIVE')
    })

    it('is_cancelled が false の場合は日付から判定する', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Active Trip (false cancelled)',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-20'),
        created_at: now,
        updated_at: now,
      }

      expect(getTripStatus(trip, now)).toBe('ACTIVE')
    })

    it('referenceDate を指定できる（テスト用）', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Future Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_cancelled: false,
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-07-10'),
        created_at: now,
        updated_at: now,
      }

      // 基準日を未来に設定すると、旅行中になる
      const futureDate = new Date('2024-07-05')
      expect(getTripStatus(trip, futureDate)).toBe('ACTIVE')
    })
  })
})

