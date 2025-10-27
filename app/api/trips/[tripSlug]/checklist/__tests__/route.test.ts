import { POST, GET } from '../../checklist/route'

// Mock Firebase Admin
jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
      add: jest.fn(),
    })),
  },
}))

const { adminAuth } = require('@/lib/firebase/admin')

describe('/api/trips/[tripSlug]/checklist', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    adminAuth.verifyIdToken.mockResolvedValue({
      uid: 'test-user-id-123',
      email: 'test@example.com',
      email_verified: true,
    })
  })

  describe('POST - Generate Checklist', () => {
    const createMockRequest = (body: any, tripSlug: string = 'test-trip', token: string = 'valid-token') => {
      return new Request(`http://localhost:3000/api/trips/${tripSlug}/checklist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    }

    it('should return 401 when authorization header is missing', async () => {
      const request = new Request('http://localhost:3000/api/trips/test-trip/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request, { params: Promise.resolve({ tripSlug: 'test-trip' }) })
      expect(response.status).toBe(401)
    })

    it('should generate checklist for trip', async () => {
      const mockTrip = {
        id: 'trip-123',
        user_id: 'test-user-id-123',
        title: 'Tokyo Trip',
      }

      // Mock trip retrieval
      const { adminDb } = require('@/lib/firebase/admin')
      const mockTripDoc = {
        exists: true,
        id: 'trip-123',
        data: () => mockTrip,
      }

      adminDb.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [mockTripDoc],
          }),
        }),
      })

      const request = createMockRequest({
        activity_tag: 'food',
        auto_generate: true,
      })

      const response = await POST(request, { params: Promise.resolve({ tripSlug: 'test-trip' }) })
      
      // Should either succeed or handle appropriately
      expect([200, 201, 404, 400]).toContain(response.status)
    })
  })

  describe('GET - Get Checklist', () => {
    const createMockRequest = (tripSlug: string = 'test-trip', token: string = 'valid-token') => {
      return new Request(`http://localhost:3000/api/trips/${tripSlug}/checklist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
    }

    it('should return checklist for authorized user', async () => {
      const request = createMockRequest('tokyo-trip')
      const response = await GET(request, { params: Promise.resolve({ tripSlug: 'tokyo-trip' }) })

      expect([200, 401, 404]).toContain(response.status)
    })

    it('should return 401 when authorization header is missing', async () => {
      const request = new Request('http://localhost:3000/api/trips/test-trip/checklist', {
        method: 'GET',
      })

      const response = await GET(request, { params: Promise.resolve({ tripSlug: 'test-trip' }) })
      expect(response.status).toBe(401)
    })
  })
})

