import { dateUtils } from '../date'
import type { FirestoreDate } from '@/lib/core/types'

describe('dateUtils', () => {
  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      const date = new Date('2024-01-01')
      expect(dateUtils.isValidDate(date)).toBe(true)
    })

    it('should return false for invalid date', () => {
      expect(dateUtils.isValidDate(new Date('invalid'))).toBe(false)
    })

    it('should return false for null', () => {
      expect(dateUtils.isValidDate(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(dateUtils.isValidDate(undefined)).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01')
      const result = dateUtils.formatDate(date)
      expect(result).toContain('2024')
      expect(result).toContain('1')
    })

    it('should return error message for invalid date', () => {
      expect(dateUtils.formatDate(null as any)).toBe('日付が設定されていません')
    })

    it('should use custom format options', () => {
      const date = new Date('2024-01-01')
      const result = dateUtils.formatDate(date, { year: 'numeric', month: 'short' })
      expect(result).toContain('2024')
      expect(result).toContain('1')
    })
  })

  describe('formatDateRange', () => {
    it('should format date range correctly', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-03')
      const result = dateUtils.formatDateRange(startDate, endDate)
      expect(result).toBeTruthy()
    })

    it('should return error message for invalid dates', () => {
      expect(dateUtils.formatDateRange(null as any, null as any)).toBe('日付が設定されていません')
    })

    it('should format same date correctly', () => {
      const date = new Date('2024-01-01')
      const result = dateUtils.formatDateRange(date, date)
      expect(result).toBe('1/1')
    })
  })

  describe('sortTripsByDate', () => {
    it('should sort trips into future and past correctly', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const trips = [
        { id: '1', start_date: yesterday } as any,
        { id: '2', start_date: tomorrow } as any,
        { id: '3', start_date: today } as any,
      ]

      const result = dateUtils.sortTripsByDate(trips)
      expect(result.futureTrips.length).toBeGreaterThan(0)
      expect(result.pastTrips.length).toBeGreaterThan(0)
    })

    it('should handle empty array', () => {
      const result = dateUtils.sortTripsByDate([])
      expect(result.futureTrips).toEqual([])
      expect(result.pastTrips).toEqual([])
    })
  })
})

