/**
 * Day Operations のテスト
 * 
 * DayのCRUD操作のテスト
 */

import { createDay, updateDay, deleteDay, updateDaysForTrip } from '@/lib/travel/day-operations'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Day } from '@/lib/core/types'

// makeAuthenticatedRequest をモック化
jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(),
}))

const mockMakeAuthenticatedRequest = makeAuthenticatedRequest as jest.MockedFunction<
  typeof makeAuthenticatedRequest
>

describe('Day Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDay', () => {
    it('should create a day successfully', async () => {
      const mockDay: Day = {
        id: 'day-1',
        trip_id: 'trip-1',
        day_number: 1,
        date: new Date('2024-06-01'),
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDay,
      } as Response)

      const result = await createDay('trip-slug')

      expect(result).toEqual(mockDay)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/trip/trip-slug/day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('should handle creation errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      } as Response)

      await expect(createDay('trip-slug')).rejects.toThrow('Invalid request')
    })
  })

  describe('updateDay', () => {
    it('should update a day successfully', async () => {
      const mockDay: Day = {
        id: 'day-1',
        trip_id: 'trip-1',
        day_number: 2,
        date: new Date('2024-06-02'),
        description: '更新された説明',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDay,
      } as Response)

      const result = await updateDay('day-1', {
        day_number: 2,
        date: '2024-06-02',
        description: '更新された説明',
      })

      expect(result).toEqual(mockDay)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/day/day-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('2024-06-02'),
      })
    })

    it('should convert Date objects to ISO strings', async () => {
      const date = new Date('2024-06-02')
      const mockDay: Day = {
        id: 'day-1',
        trip_id: 'trip-1',
        day_number: 1,
        date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDay,
      } as Response)

      await updateDay('day-1', {
        date,
      })

      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(callBody.date).toBe(date.toISOString())
    })

    it('should handle update errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Day not found' }),
      } as Response)

      await expect(
        updateDay('nonexistent-day', {
          day_number: 2,
        })
      ).rejects.toThrow('Day not found')
    })
  })

  describe('deleteDay', () => {
    it('should delete a day successfully', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await deleteDay('day-1')

      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/day/day-1', {
        method: 'DELETE',
      })
    })

    it('should handle delete errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Day not found' }),
      } as Response)

      await expect(deleteDay('nonexistent-day')).rejects.toThrow('Day not found')
    })
  })

  describe('updateDaysForTrip', () => {
    it('should update days for trip successfully', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await updateDaysForTrip('trip-slug', '2024-06-01', '2024-06-03')

      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/trip/trip-slug', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('2024-06-01'),
      })
    })

    it('should convert Date objects to ISO strings', async () => {
      const startDate = new Date('2024-06-01')
      const endDate = new Date('2024-06-03')

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await updateDaysForTrip('trip-slug', startDate, endDate)

      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(callBody.startDate).toBe(startDate.toISOString())
      expect(callBody.endDate).toBe(endDate.toISOString())
    })

    it('should handle update errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Trip not found' }),
      } as Response)

      await expect(updateDaysForTrip('nonexistent-trip', '2024-06-01', '2024-06-03')).rejects.toThrow(
        'Trip not found'
      )
    })
  })
})

