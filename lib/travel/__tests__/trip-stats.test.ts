/**
 * Trip Stats のテスト
 * 
 * Tripの統計・集計機能のテスト
 */

import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers/test-data'
import type { Trip } from '@/lib/core/types'
import { calculateTripStats } from '@/lib/travel/trip-stats'

describe('Trip Stats', () => {
  describe('calculateTripStats', () => {
    it('should calculate basic statistics', () => {
      const privateTrip = createMockTrip({
        id: 'private-1',
        access_level: 'private',
      })

      const publicTrip = createMockPublicTrip({
        id: 'public-1',
        access_level: 'public',
      })

      const templateTrip = createMockPublicTrip({
        id: 'template-1',
        access_level: 'public',
        is_template: true,
      })

      const trips: Trip[] = [privateTrip, publicTrip, templateTrip]

      const stats = calculateTripStats(trips)

      expect(stats.total).toBe(3)
      expect(stats.private).toBe(1)
      expect(stats.public).toBe(2)
      expect(stats.templates).toBe(1)
    })

    it('should calculate status-based statistics', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const planningTrip = createMockTrip({
        id: 'planning-1',
        start_date: tomorrow,
        end_date: nextWeek,
      })

      const activeTrip = createMockTrip({
        id: 'active-1',
        start_date: yesterday,
        end_date: tomorrow,
      })

      const completedTrip = createMockTrip({
        id: 'completed-1',
        start_date: new Date('2024-01-01'),
        end_date: yesterday,
      })

      const cancelledTrip = createMockTrip({
        id: 'cancelled-1',
        start_date: tomorrow,
        end_date: nextWeek,
        is_cancelled: true,
      })

      const trips: Trip[] = [planningTrip, activeTrip, completedTrip, cancelledTrip]

      const stats = calculateTripStats(trips, today)

      expect(stats.total).toBe(4)
      expect(stats.planning).toBeGreaterThanOrEqual(1)
      expect(stats.active).toBeGreaterThanOrEqual(1)
      expect(stats.completed).toBeGreaterThanOrEqual(1)
      expect(stats.cancelled).toBe(1)
    })

    it('should handle empty array', () => {
      const trips: Trip[] = []

      const stats = calculateTripStats(trips)

      expect(stats.total).toBe(0)
      expect(stats.private).toBe(0)
      expect(stats.public).toBe(0)
      expect(stats.templates).toBe(0)
      expect(stats.planning).toBe(0)
      expect(stats.active).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.cancelled).toBe(0)
    })

    it('should handle trips without dates', () => {
      const tripWithoutDates = createMockTrip({
        id: 'no-dates-1',
        start_date: undefined,
        end_date: undefined,
      })

      const trips: Trip[] = [tripWithoutDates]

      const stats = calculateTripStats(trips)

      expect(stats.total).toBe(1)
      expect(stats.planning).toBe(1) // 日付がない場合は計画中
    })

    it('should accept custom reference date', () => {
      const referenceDate = new Date('2024-06-15')

      const activeTrip = createMockTrip({
        id: 'active-1',
        start_date: new Date('2024-06-10'),
        end_date: new Date('2024-06-20'),
      })

      const trips: Trip[] = [activeTrip]

      const stats = calculateTripStats(trips, referenceDate)

      expect(stats.total).toBe(1)
      expect(stats.active).toBe(1)
    })

    it('should correctly count templates', () => {
      const templateTrip1 = createMockPublicTrip({
        id: 'template-1',
        is_template: true,
      })

      const templateTrip2 = createMockPublicTrip({
        id: 'template-2',
        is_template: true,
      })

      const regularTrip = createMockPublicTrip({
        id: 'regular-1',
        is_template: false,
      })

      const trips: Trip[] = [templateTrip1, templateTrip2, regularTrip]

      const stats = calculateTripStats(trips)

      expect(stats.total).toBe(3)
      expect(stats.templates).toBe(2)
    })
  })
})

