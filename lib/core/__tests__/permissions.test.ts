/**
 * 権限管理システムのテスト
 * 
 * Phase 1-1: 型定義と権限管理システム（テストファースト）
 */

import {
  canViewTrip,
  canEditTrip,
  canEditTripById,
  canEditTripByIds,
  canEditTrips,
  canCommentOnTrip,
  canLikeTrip,
  canCollaborateOnTrip,
} from '../permissions'
import { createMockTrip, createMockPublicTrip } from '@/lib/__tests__/helpers'
import type { User } from 'firebase/auth'
import type { UserId, TripId } from '@/lib/core/types/identity'
import { asUserId, asTripId } from '@/lib/core/types/identity'

// モックUserオブジェクトを作成
function createMockAuthUser(uid: string): User {
  return {
    uid,
    email: `${uid}@test.example.com`,
    displayName: `Test User ${uid}`,
    emailVerified: true,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn(),
    getIdToken: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
  } as unknown as User
}

describe('canViewTrip', () => {
  it('should allow viewing public trips without authentication', () => {
    const trip = createMockPublicTrip()
    expect(canViewTrip(trip, null)).toBe(true)
  })

  it('should allow viewing public trips with authentication', () => {
    const userId = asUserId('user1')
    const trip = createMockPublicTrip({ user_id: 'user2' })
    expect(canViewTrip(trip, userId)).toBe(true)
  })

  it('should deny viewing private trips without authentication', () => {
    const trip = createMockTrip({ access_level: 'private', user_id: 'user1' })
    expect(canViewTrip(trip, null)).toBe(false)
  })

  it('should allow viewing private trips by owner', () => {
    const userId = asUserId('user1')
    const trip = createMockTrip({ access_level: 'private', user_id: 'user1' })
    expect(canViewTrip(trip, userId)).toBe(true)
  })

  it('should deny viewing private trips by non-owner', () => {
    const userId = asUserId('user1')
    const trip = createMockTrip({ access_level: 'private', user_id: 'user2' })
    expect(canViewTrip(trip, userId)).toBe(false)
  })

  it('should deny viewing when trip is null', () => {
    expect(canViewTrip(null, asUserId('user1'))).toBe(false)
    expect(canViewTrip(null, null)).toBe(false)
  })
})

describe('canEditTrip', () => {
  it('should allow editing when user is the owner', () => {
    const user = createMockAuthUser('user1')
    const trip = createMockTrip({ user_id: 'user1' })
    
    expect(canEditTrip(user, trip)).toBe(true)
  })

  it('should deny editing when user is not the owner', () => {
    const user = createMockAuthUser('user1')
    const trip = createMockTrip({ user_id: 'user2' })
    
    expect(canEditTrip(user, trip)).toBe(false)
  })

  it('should deny editing when user is null', () => {
    const trip = createMockTrip({ user_id: 'user1' })
    
    expect(canEditTrip(null, trip)).toBe(false)
  })

  it('should deny editing when trip is null', () => {
    const user = createMockAuthUser('user1')
    
    expect(canEditTrip(user, null)).toBe(false)
  })

  it('should deny editing when both user and trip are null', () => {
    expect(canEditTrip(null, null)).toBe(false)
  })
})

describe('canEditTripById', () => {
  it('should allow editing when userId matches trip owner', () => {
    const userId = asUserId('user1')
    const trip = createMockTrip({ user_id: 'user1' })
    
    expect(canEditTripById(userId, trip)).toBe(true)
  })

  it('should deny editing when userId does not match trip owner', () => {
    const userId = asUserId('user1')
    const trip = createMockTrip({ user_id: 'user2' })
    
    expect(canEditTripById(userId, trip)).toBe(false)
  })

  it('should deny editing when trip is null', () => {
    const userId = asUserId('user1')
    
    expect(canEditTripById(userId, null)).toBe(false)
  })
})

describe('canEditTripByIds', () => {
  it('should allow editing when userId matches tripUserId', () => {
    const userId = asUserId('user1')
    const tripId = asTripId('trip1')
    const tripUserId = asUserId('user1')
    
    expect(canEditTripByIds(userId, tripId, tripUserId)).toBe(true)
  })

  it('should deny editing when userId does not match tripUserId', () => {
    const userId = asUserId('user1')
    const tripId = asTripId('trip1')
    const tripUserId = asUserId('user2')
    
    expect(canEditTripByIds(userId, tripId, tripUserId)).toBe(false)
  })
})

describe('canEditTrips', () => {
  it('should correctly map permissions for multiple trips', () => {
    const user = createMockAuthUser('user1')
    const trips = [
      createMockTrip({ id: 'trip1', user_id: 'user1' }),
      createMockTrip({ id: 'trip2', user_id: 'user2' }),
      createMockTrip({ id: 'trip3', user_id: 'user1' }),
    ]
    
    const permissions = canEditTrips(user, trips)
    
    expect(permissions.get('trip1')).toBe(true)
    expect(permissions.get('trip2')).toBe(false)
    expect(permissions.get('trip3')).toBe(true)
  })

  it('should return all false when user is null', () => {
    const trips = [
      createMockTrip({ id: 'trip1', user_id: 'user1' }),
      createMockTrip({ id: 'trip2', user_id: 'user2' }),
    ]
    
    const permissions = canEditTrips(null, trips)
    
    expect(permissions.get('trip1')).toBe(false)
    expect(permissions.get('trip2')).toBe(false)
  })

  it('should handle empty trips array', () => {
    const user = createMockAuthUser('user1')
    const trips: typeof createMockTrip[] = []
    
    const permissions = canEditTrips(user, trips)
    
    expect(permissions.size).toBe(0)
  })
})

describe('canCommentOnTrip', () => {
  it('should allow commenting on public trips', () => {
    const userId = asUserId('user1')
    const trip = createMockPublicTrip({ user_id: 'user2' })
    
    expect(canCommentOnTrip(trip, userId)).toBe(true)
  })

  it('should deny commenting on private trips', () => {
    const userId = asUserId('user1')
    const trip = createMockTrip({ access_level: 'private', user_id: 'user2' })
    
    expect(canCommentOnTrip(trip, userId)).toBe(false)
  })

  it('should deny commenting when user is null', () => {
    const trip = createMockPublicTrip()
    expect(canCommentOnTrip(trip, null)).toBe(false)
  })

  it('should deny commenting when trip is null', () => {
    const userId = asUserId('user1')
    expect(canCommentOnTrip(null, userId)).toBe(false)
  })
})

describe('canLikeTrip', () => {
  it('should allow liking public trips by other users', () => {
    const userId = asUserId('user1')
    const trip = createMockPublicTrip({ user_id: 'user2' })
    
    expect(canLikeTrip(trip, userId)).toBe(true)
  })

  it('should deny liking own trips', () => {
    const userId = asUserId('user1')
    const trip = createMockPublicTrip({ user_id: 'user1' })
    
    expect(canLikeTrip(trip, userId)).toBe(false)
  })

  it('should deny liking private trips', () => {
    const userId = asUserId('user1')
    const trip = createMockTrip({ access_level: 'private', user_id: 'user2' })
    
    expect(canLikeTrip(trip, userId)).toBe(false)
  })

  it('should deny liking when user is null', () => {
    const trip = createMockPublicTrip()
    expect(canLikeTrip(trip, null)).toBe(false)
  })

  it('should deny liking when trip is null', () => {
    const userId = asUserId('user1')
    expect(canLikeTrip(null, userId)).toBe(false)
  })
})

describe('canCollaborateOnTrip', () => {
  it('should allow collaboration when user is the owner (current behavior)', () => {
    const user = createMockAuthUser('user1')
    const trip = createMockTrip({ user_id: 'user1' })
    
    expect(canCollaborateOnTrip(user, trip)).toBe(true)
  })

  it('should deny collaboration when user is not the owner', () => {
    const user = createMockAuthUser('user1')
    const trip = createMockTrip({ user_id: 'user2' })
    
    expect(canCollaborateOnTrip(user, trip)).toBe(false)
  })

  it('should deny collaboration when user is null', () => {
    const trip = createMockTrip({ user_id: 'user1' })
    
    expect(canCollaborateOnTrip(null, trip)).toBe(false)
  })
})

