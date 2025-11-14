/**
 * テストヘルパーの動作確認テスト
 * 
 * Phase 0: テスト基盤整備の確認用テスト
 */

import {
  createMockTrip,
  createMockPublicTrip,
  createMockTemplateTrip,
  createMockDay,
  createMockItinerary,
  createMockUserData,
  createMockTrips,
  createMockSocialStats,
} from '../test-data'
import {
  createMockUser,
  createMockUsers,
  createAuthHeader,
  createUnauthenticatedHeader,
} from '../test-auth'

describe('Test Helpers', () => {
  describe('test-data', () => {
    describe('createMockTrip', () => {
      it('should create a default trip', () => {
        const trip = createMockTrip()
        expect(trip.id).toBe('test-trip-1')
        expect(trip.user_id).toBe('test-user-1')
        expect(trip.title).toBe('Test Trip')
        expect(trip.access_level).toBe('private')
        expect(trip.is_template).toBe(false)
      })

      it('should create a trip with overrides', () => {
        const trip = createMockTrip({ title: 'Custom Trip', access_level: 'public' })
        expect(trip.title).toBe('Custom Trip')
        expect(trip.access_level).toBe('public')
      })
    })

    describe('createMockPublicTrip', () => {
      it('should create a public trip', () => {
        const trip = createMockPublicTrip()
        expect(trip.access_level).toBe('public')
      })
    })

    describe('createMockTemplateTrip', () => {
      it('should create a template trip', () => {
        const trip = createMockTemplateTrip()
        expect(trip.is_template).toBe(true)
        expect(trip.day_count).toBe(5)
        expect(trip.access_level).toBe('public')
      })
    })

    describe('createMockDay', () => {
      it('should create a default day', () => {
        const day = createMockDay()
        expect(day.trip_id).toBe('test-trip-1')
        expect(day.day_number).toBe(1)
        expect(day.date).toBeInstanceOf(Date)
      })

      it('should create a day with custom tripId', () => {
        const day = createMockDay('custom-trip-1')
        expect(day.trip_id).toBe('custom-trip-1')
      })
    })

    describe('createMockItinerary', () => {
      it('should create a default itinerary', () => {
        const itinerary = createMockItinerary()
        expect(itinerary.day_id).toBe('test-day-1')
        expect(itinerary.trip_id).toBe('test-trip-1')
        expect(itinerary.title).toBe('Test Itinerary')
        expect(itinerary.sort_number).toBe(1)
      })
    })

    describe('createMockUserData', () => {
      it('should create a default user', () => {
        const user = createMockUserData()
        expect(user.id).toBe('test-user-1')
        expect(user.email).toBe('test-user-1@test.example.com')
        expect(user.name).toBe('Test User test-user-1')
      })
    })

    describe('createMockTrips', () => {
      it('should create multiple trips', () => {
        const trips = createMockTrips(3)
        expect(trips).toHaveLength(3)
        expect(trips[0].id).toBe('test-trip-1')
        expect(trips[1].id).toBe('test-trip-2')
        expect(trips[2].id).toBe('test-trip-3')
      })

      it('should create trips with overrides', () => {
        const trips = createMockTrips(2, { access_level: 'public' })
        expect(trips.every(t => t.access_level === 'public')).toBe(true)
      })
    })

    describe('createMockSocialStats', () => {
      it('should create default social stats', () => {
        const stats = createMockSocialStats()
        expect(stats.likes_count).toBe(0)
        expect(stats.comments_count).toBe(0)
        expect(stats.shares_count).toBe(0)
        expect(stats.views_count).toBe(0)
        expect(stats.replicas_count).toBe(0)
      })

      it('should create social stats with overrides', () => {
        const stats = createMockSocialStats({ likes_count: 10, comments_count: 5 })
        expect(stats.likes_count).toBe(10)
        expect(stats.comments_count).toBe(5)
        expect(stats.shares_count).toBe(0) // デフォルト値
      })
    })
  })

  describe('test-auth', () => {
    describe('createMockUser', () => {
      it('should create a default user', () => {
        const user = createMockUser()
        expect(user.uid).toBe('test-user-1')
        expect(user.email).toBe('test-user-1@test.example.com')
        expect(user.displayName).toBe('Test User test-user-1')
      })

      it('should create a user with custom uid', () => {
        const user = createMockUser('custom-user-1')
        expect(user.uid).toBe('custom-user-1')
        expect(user.email).toBe('custom-user-1@test.example.com')
      })
    })

    describe('createMockUsers', () => {
      it('should create multiple users', () => {
        const users = createMockUsers(3)
        expect(users).toHaveLength(3)
        expect(users[0].uid).toBe('test-user-1')
        expect(users[1].uid).toBe('test-user-2')
        expect(users[2].uid).toBe('test-user-3')
      })
    })

    describe('createAuthHeader', () => {
      it('should create auth header with userId', () => {
        const header = createAuthHeader('test-user-1')
        expect(header.authorization).toContain('Bearer')
        expect(header.authorization).toContain('test-user-1')
      })
    })

    describe('createUnauthenticatedHeader', () => {
      it('should create empty header', () => {
        const header = createUnauthenticatedHeader()
        expect(header.authorization).toBeUndefined()
      })
    })
  })
})

