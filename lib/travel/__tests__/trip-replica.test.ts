/**
 * Trip Replica のテスト
 * 
 * Tripの複製機能のテスト
 */

import { replicateTrip } from '@/lib/travel/trip-replica'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Trip } from '@/lib/core/types'

// makeAuthenticatedRequest をモック化
jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(),
}))

const mockMakeAuthenticatedRequest = makeAuthenticatedRequest as jest.MockedFunction<
  typeof makeAuthenticatedRequest
>

describe('Trip Replica', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('replicateTrip', () => {
    it('should replicate a trip successfully', async () => {
      const mockTrip: Trip = {
        id: 'replica-trip-1',
        user_id: 'user-1',
        title: '複製された旅行',
        status: 'PLANNING',
        access_level: 'private',
        slug: 'replica-trip-slug',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trip: mockTrip }),
      } as Response)

      const result = await replicateTrip('template-trip-slug', {
        title: '複製された旅行',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
      })

      expect(result).toEqual(mockTrip)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
        '/api/trip/template-trip-slug/replica',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('複製された旅行'),
        }
      )
    })

    it('should convert Date objects to ISO strings', async () => {
      const startDate = new Date('2024-06-01')
      const endDate = new Date('2024-06-03')
      const mockTrip: Trip = {
        id: 'replica-trip-1',
        user_id: 'user-1',
        title: '複製された旅行',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trip: mockTrip }),
      } as Response)

      await replicateTrip('template-trip-slug', {
        startDate,
        endDate,
      })

      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(callBody.startDate).toBe(startDate.toISOString())
      expect(callBody.endDate).toBe(endDate.toISOString())
    })

    it('should replicate with all options', async () => {
      const mockTrip: Trip = {
        id: 'replica-trip-1',
        user_id: 'user-1',
        title: '複製された旅行',
        status: 'PLANNING',
        access_level: 'shared',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trip: mockTrip }),
      } as Response)

      await replicateTrip('template-trip-slug', {
        title: '複製された旅行',
        startDate: '2024-06-01',
        endDate: '2024-06-03',
        accessLevel: 'shared',
      })

      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(callBody.title).toBe('複製された旅行')
      expect(callBody.startDate).toBe('2024-06-01')
      expect(callBody.endDate).toBe('2024-06-03')
      expect(callBody.accessLevel).toBe('shared')
    })

    it('should replicate without options', async () => {
      const mockTrip: Trip = {
        id: 'replica-trip-1',
        user_id: 'user-1',
        title: 'テンプレートから複製',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, trip: mockTrip }),
      } as Response)

      const result = await replicateTrip('template-trip-slug')

      expect(result).toEqual(mockTrip)
      const callBody = JSON.parse(
        (mockMakeAuthenticatedRequest.mock.calls[0][1] as RequestInit).body as string
      )
      expect(Object.keys(callBody)).toHaveLength(0)
    })

    it('should handle replication errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Template trip not found' }),
      } as Response)

      await expect(replicateTrip('nonexistent-trip')).rejects.toThrow('Template trip not found')
    })

    it('should handle validation errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Start date is required for this template' }),
      } as Response)

      await expect(replicateTrip('template-trip-slug', {})).rejects.toThrow(
        'Start date is required for this template'
      )
    })
  })
})

