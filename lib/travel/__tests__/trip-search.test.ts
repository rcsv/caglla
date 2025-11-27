/**
 * Trip Search のテスト
 * 
 * Tripの検索・推奨機能のテスト
 */

import { getRecommendedTrips, searchTrips } from '@/lib/travel/trip-search'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import type { Trip } from '@/lib/core/types'

// makeAuthenticatedRequest をモック化
jest.mock('@/lib/api/helpers', () => ({
  makeAuthenticatedRequest: jest.fn(),
}))

const mockMakeAuthenticatedRequest = makeAuthenticatedRequest as jest.MockedFunction<
  typeof makeAuthenticatedRequest
>

describe('Trip Search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getRecommendedTrips', () => {
    it('should get recommended trips successfully', async () => {
      const mockTrips: Trip[] = [
        {
          id: 'trip-1',
          user_id: 'user-1',
          title: '推奨旅行1',
          status: 'PLANNING',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'trip-2',
          user_id: 'user-2',
          title: '推奨旅行2',
          status: 'PLANNING',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trips: mockTrips }),
      } as Response)

      const result = await getRecommendedTrips(10)

      expect(result.trips).toEqual(mockTrips)
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
        '/api/trips/recommended?limit=10',
        {
          method: 'GET',
        }
      )
    })

    it('should use default limit when not specified', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trips: [] }),
      } as Response)

      await getRecommendedTrips()

      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
        '/api/trips/recommended?limit=10',
        {
          method: 'GET',
        }
      )
    })

    it('should handle errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response)

      await expect(getRecommendedTrips(10)).rejects.toThrow('Server error')
    })
  })

  describe('searchTrips', () => {
    it('should search trips successfully', async () => {
      const mockTrips: Trip[] = [
        {
          id: 'trip-1',
          user_id: 'user-1',
          title: '東京旅行',
          status: 'PLANNING',
          access_level: 'public',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]

      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trips: mockTrips, nextCursor: 'cursor-123' }),
      } as Response)

      const result = await searchTrips('東京', { limit: 20 })

      expect(result.trips).toEqual(mockTrips)
      expect(result.nextCursor).toBe('cursor-123')
      expect(mockMakeAuthenticatedRequest).toHaveBeenCalledWith(
        expect.stringContaining('/api/trips/search'),
        {
          method: 'GET',
        }
      )
    })

    it('should include all search options in query string', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ trips: [] }),
      } as Response)

      await searchTrips('東京', {
        limit: 20,
        cursor: 'cursor-123',
        status: 'ACTIVE',
        accessLevel: 'public',
        destination: '日本',
      })

      const url = mockMakeAuthenticatedRequest.mock.calls[0][0] as string
      // URLSearchParamsは日本語を自動的にエンコードする
      expect(url).toContain('q=')
      expect(url).toContain('limit=20')
      expect(url).toContain('cursor=cursor-123')
      expect(url).toContain('status=ACTIVE')
      expect(url).toContain('accessLevel=public')
      expect(url).toContain('destination=')
      
      // URLデコードして確認
      const urlObj = new URL(url, 'http://localhost')
      expect(urlObj.searchParams.get('q')).toBe('東京')
      expect(urlObj.searchParams.get('destination')).toBe('日本')
    })

    it('should handle errors', async () => {
      mockMakeAuthenticatedRequest.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid query' }),
      } as Response)

      await expect(searchTrips('', { limit: 20 })).rejects.toThrow('Invalid query')
    })
  })
})

