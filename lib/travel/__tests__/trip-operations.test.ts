/**
 * Trip Operations のテスト
 * 
 * TripのCRUD操作のテスト
 */

import { createTrip, updateTrip, deleteTrip, getTrip } from '@/lib/travel/trip-operations'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Trip } from '@/lib/core/types'

// makeAuthenticatedRequest をモック化
jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(),
}))

const mockMakeAuthenticatedRequest = makeAuthenticatedRequest as jest.MockedFunction<
  typeof makeAuthenticatedRequest
>

describe('Trip Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      const mockTrip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: '東京旅行',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrip,
      } as Response)

      const result = await createTrip({
        title: '東京旅行',
        description: '2泊3日の東京旅行',
        destination: '東京',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        accessLevel: 'private',
      })

      expect(result).toEqual(mockTrip)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('東京旅行'),
      })
    })

    it('should handle creation errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      } as Response)

      await expect(
        createTrip({
          title: '東京旅行',
        })
      ).rejects.toThrow('Invalid request')
    })

    it('should convert Date objects to ISO strings', async () => {
      const startDate = new Date('2024-06-01')
      const endDate = new Date('2024-06-03')
      const mockTrip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: '東京旅行',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrip,
      } as Response)

      await createTrip({
        title: '東京旅行',
        startDate,
        endDate,
      })

      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(callBody.startDate).toBe(startDate.toISOString())
      expect(callBody.endDate).toBe(endDate.toISOString())
    })
  })

  describe('updateTrip', () => {
    it('should update a trip successfully', async () => {
      const mockTrip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: '更新されたタイトル',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrip,
      } as Response)

      const result = await updateTrip('trip-1', {
        title: '更新されたタイトル',
        description: '更新された説明',
      })

      expect(result).toEqual(mockTrip)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/trip/trip-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('更新されたタイトル'),
      })
    })

    it('should handle update errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Trip not found' }),
      } as Response)

      await expect(
        updateTrip('nonexistent-trip', {
          title: '新しいタイトル',
        })
      ).rejects.toThrow('Trip not found')
    })

    it('should handle isCancelled flag', async () => {
      const mockTrip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'キャンセルされた旅行',
        status: 'CANCELLED',
        access_level: 'private',
        is_cancelled: true,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrip,
      } as Response)

      await updateTrip('trip-1', {
        isCancelled: true,
      })

      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(callBody.isCancelled).toBe(true)
    })
  })

  describe('deleteTrip', () => {
    it('should delete a trip successfully', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await deleteTrip('trip-1')

      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/trip/trip-1', {
        method: 'DELETE',
      })
    })

    it('should handle delete errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Trip not found' }),
      } as Response)

      await expect(deleteTrip('nonexistent-trip')).rejects.toThrow('Trip not found')
    })
  })

  describe('getTrip', () => {
    it('should get a trip successfully', async () => {
      const mockTrip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: '東京旅行',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrip,
      } as Response)

      const result = await getTrip('trip-1')

      expect(result).toEqual(mockTrip)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith('/api/trip/trip-1', {
        method: 'GET',
      })
    })

    it('should return null for non-existent trip', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Trip not found' }),
      } as Response)

      const result = await getTrip('nonexistent-trip')

      expect(result).toBeNull()
    })

    it('should handle other errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response)

      await expect(getTrip('trip-1')).rejects.toThrow('Server error')
    })
  })
})

