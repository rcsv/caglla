/**
 * Trip型定義のテスト
 * 
 * Phase 1-3: 型定義の整合性を検証
 * - Trip型の必須フィールド・オプショナルフィールドの検証
 * - Day型、Itinerary型の検証
 * - 新しく追加したフィールド（is_shared, shared_*）の検証
 * - 異なるTripタイプ（Private, Shared Private, Template）の型定義検証
 */

import type { Trip, Day, Itinerary } from '../trip'
import type { User } from '../user'
import type { TripSocialStats } from '../social'
import type { FirestoreDate } from '../common'

describe('Trip Type Definitions', () => {
  describe('Trip Interface', () => {
    it('should have required fields', () => {
      // 最小限の必須フィールドのみを持つTripオブジェクト
      const minimalTrip: Trip = {
        id: 'test-trip-1',
        user_id: 'test-user-1',
        title: 'Test Trip',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(minimalTrip.id).toBe('test-trip-1')
      expect(minimalTrip.user_id).toBe('test-user-1')
      expect(minimalTrip.title).toBe('Test Trip')
      expect(minimalTrip.status).toBe('PLANNING')
      expect(minimalTrip.access_level).toBe('private')
    })

    it('should support optional fields', () => {
      const fullTrip: Trip = {
        id: 'test-trip-2',
        user_id: 'test-user-2',
        title: 'Full Trip',
        slug: 'full-trip',
        description: 'Test description',
        destination: 'Tokyo',
        destination_place_id: 'place-123',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-07'),
        status: 'PLANNING',
        access_level: 'public',
        image_url: 'https://example.com/image.jpg',
        is_template: false,
        day_count: 7,
        likes_count: 10,
        liked_by_me: false,
        ical_public_token: 'token-123',
        ical_enabled: true,
        ical_last_accessed_at: new Date(),
        default_currency: 'JPY',
        published_at: new Date(),
        featured: false,
        trending_score: 0.5,
        social_stats: {
          likes_count: 10,
          comments_count: 3,
          shares_count: 2,
          views_count: 100,
          replicas_count: 5,
        },
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(fullTrip.slug).toBe('full-trip')
      expect(fullTrip.description).toBe('Test description')
      expect(fullTrip.destination).toBe('Tokyo')
      expect(fullTrip.is_template).toBe(false)
      expect(fullTrip.social_stats?.likes_count).toBe(10)
    })

    it('should support v3.0.0 shared private trip fields', () => {
      const sharedTrip: Trip = {
        id: 'test-trip-shared-1',
        user_id: 'test-user-1',
        title: 'Shared Private Trip',
        status: 'PLANNING',
        access_level: 'public',
        is_shared: true,
        shared_from_trip_id: 'trip-original-1',
        shared_start_month: 12,
        shared_start_year: 2024,
        shared_end_month: 12,
        shared_end_year: 2024,
        shared_month_label: '2024年12月',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(sharedTrip.is_shared).toBe(true)
      expect(sharedTrip.shared_from_trip_id).toBe('trip-original-1')
      expect(sharedTrip.shared_start_month).toBe(12)
      expect(sharedTrip.shared_start_year).toBe(2024)
      expect(sharedTrip.shared_end_month).toBe(12)
      expect(sharedTrip.shared_end_year).toBe(2024)
      expect(sharedTrip.shared_month_label).toBe('2024年12月')
    })

    it('should support v3.0.0 template plan fields', () => {
      const templateTrip: Trip = {
        id: 'test-trip-template-1',
        user_id: 'test-user-1',
        title: 'Template Plan',
        status: 'PLANNING',
        access_level: 'public',
        is_template: true,
        day_count: 5,
        shared_plan_type: 'business',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(templateTrip.is_template).toBe(true)
      expect(templateTrip.day_count).toBe(5)
      expect(templateTrip.shared_plan_type).toBe('business')
      expect(templateTrip.start_date).toBeUndefined()
      expect(templateTrip.end_date).toBeUndefined()
    })

    it('should support v3.0.0 shared members field', () => {
      const mockUser1: User = {
        id: 'user-1',
        auth_uid: 'auth-uid-1',
        name: 'User One',
        email: 'user1@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      }

      const mockUser2: User = {
        id: 'user-2',
        auth_uid: 'auth-uid-2',
        name: 'User Two',
        email: 'user2@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      }

      const privateTrip: Trip = {
        id: 'test-trip-private-1',
        user_id: 'test-user-1',
        title: 'Private Trip',
        status: 'PLANNING',
        access_level: 'private',
        shared_members: [mockUser1, mockUser2],
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(privateTrip.shared_members).toBeDefined()
      expect(privateTrip.shared_members?.length).toBe(2)
      expect(privateTrip.shared_members?.[0].name).toBe('User One')
      expect(privateTrip.shared_members?.[1].name).toBe('User Two')
    })

    it('should support creator field', () => {
      const creator: User = {
        id: 'creator-1',
        auth_uid: 'auth-uid-creator-1',
        name: 'Creator User',
        email: 'creator@example.com',
        slug: 'creator-user',
        profile_image_url: 'https://example.com/avatar.jpg',
        created_at: new Date(),
        updated_at: new Date(),
      }

      const trip: Trip = {
        id: 'test-trip-creator-1',
        user_id: 'creator-1',
        title: 'Trip with Creator',
        status: 'PLANNING',
        access_level: 'public',
        creator,
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(trip.creator).toBeDefined()
      expect(trip.creator?.name).toBe('Creator User')
      expect(trip.creator?.slug).toBe('creator-user')
    })

    it('should support days field with nested itineraries', () => {
      const itinerary: Itinerary = {
        id: 'itinerary-1',
        day_id: 'day-1',
        sort_number: 1,
        title: 'Morning Activity',
        description: 'Test activity',
        location: 'Tokyo',
        created_at: new Date(),
        updated_at: new Date(),
      }

      const day: Day = {
        id: 'day-1',
        trip_id: 'test-trip-1',
        day_number: 1,
        date: new Date('2024-01-01'),
        created_at: new Date(),
        updated_at: new Date(),
        itineraries: [itinerary],
      }

      const trip: Trip = {
        id: 'test-trip-1',
        user_id: 'test-user-1',
        title: 'Trip with Days',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
        days: [day],
      }

      expect(trip.days).toBeDefined()
      expect(trip.days?.length).toBe(1)
      expect(trip.days?.[0].day_number).toBe(1)
      expect(trip.days?.[0].itineraries?.length).toBe(1)
      expect(trip.days?.[0].itineraries?.[0].title).toBe('Morning Activity')
    })
  })

  describe('Day Interface', () => {
    it('should have required fields', () => {
      const day: Day = {
        id: 'day-1',
        trip_id: 'trip-1',
        day_number: 1,
        date: new Date('2024-01-01'),
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(day.id).toBe('day-1')
      expect(day.trip_id).toBe('trip-1')
      expect(day.day_number).toBe(1)
      expect(day.date).toBeInstanceOf(Date)
    })

    it('should support optional description field', () => {
      const day: Day = {
        id: 'day-2',
        trip_id: 'trip-1',
        day_number: 2,
        date: new Date('2024-01-02'),
        description: 'Second day description',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(day.description).toBe('Second day description')
    })

    it('should support optional itineraries field', () => {
      const day: Day = {
        id: 'day-3',
        trip_id: 'trip-1',
        day_number: 3,
        date: new Date('2024-01-03'),
        created_at: new Date(),
        updated_at: new Date(),
        itineraries: [],
      }

      expect(day.itineraries).toBeDefined()
      expect(Array.isArray(day.itineraries)).toBe(true)
    })

    it('should support FirestoreDate type for date field', () => {
      // Date型
      const day1: Day = {
        id: 'day-1',
        trip_id: 'trip-1',
        day_number: 1,
        date: new Date('2024-01-01'),
        created_at: new Date(),
        updated_at: new Date(),
      }
      expect(day1.date).toBeInstanceOf(Date)

      // string型（FirestoreDateとして許可）
      const day2: Day = {
        id: 'day-2',
        trip_id: 'trip-1',
        day_number: 2,
        date: '2024-01-01',
        created_at: new Date(),
        updated_at: new Date(),
      }
      expect(typeof day2.date).toBe('string')
    })
  })

  describe('Itinerary Interface', () => {
    it('should have required fields', () => {
      const itinerary: Itinerary = {
        id: 'itinerary-1',
        day_id: 'day-1',
        sort_number: 1,
        title: 'Activity',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(itinerary.id).toBe('itinerary-1')
      expect(itinerary.day_id).toBe('day-1')
      expect(itinerary.sort_number).toBe(1)
      expect(itinerary.title).toBe('Activity')
    })

    it('should support optional fields', () => {
      const itinerary: Itinerary = {
        id: 'itinerary-2',
        day_id: 'day-1',
        sort_number: 2,
        title: 'Full Activity',
        description: 'Activity description',
        location: 'Tokyo',
        place_id: 'place-123',
        start_time: '09:00',
        end_time: '17:00',
        timezone: 'Asia/Tokyo',
        cost_amount: 5000,
        cost_currency: 'JPY',
        activity_tag: null,
        reservation: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(itinerary.description).toBe('Activity description')
      expect(itinerary.location).toBe('Tokyo')
      expect(itinerary.place_id).toBe('place-123')
      expect(itinerary.start_time).toBe('09:00')
      expect(itinerary.end_time).toBe('17:00')
      expect(itinerary.timezone).toBe('Asia/Tokyo')
      expect(itinerary.cost_amount).toBe(5000)
      expect(itinerary.cost_currency).toBe('JPY')
    })

    it('should support null values for optional fields', () => {
      const itinerary: Itinerary = {
        id: 'itinerary-3',
        day_id: 'day-1',
        sort_number: 3,
        title: 'Activity with nulls',
        place_id: null,
        place_data: null,
        cost_amount: null,
        activity_tag: null,
        reservation: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(itinerary.place_id).toBeNull()
      expect(itinerary.place_data).toBeNull()
      expect(itinerary.cost_amount).toBeNull()
      expect(itinerary.activity_tag).toBeNull()
      expect(itinerary.reservation).toBeNull()
    })
  })

  describe('Trip Type Combinations', () => {
    it('should support private trip type', () => {
      const privateTrip: Trip = {
        id: 'trip-private-1',
        user_id: 'user-1',
        title: 'Private Trip',
        status: 'PLANNING',
        access_level: 'private',
        is_template: false,
        start_date: new Date('2024-12-15'),
        end_date: new Date('2024-12-18'),
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(privateTrip.access_level).toBe('private')
      expect(privateTrip.is_template).toBe(false)
      expect(privateTrip.is_shared).toBeUndefined()
      expect(privateTrip.start_date).toBeInstanceOf(Date)
      expect(privateTrip.end_date).toBeInstanceOf(Date)
    })

    it('should support shared private trip type', () => {
      const sharedTrip: Trip = {
        id: 'trip-shared-1',
        user_id: 'user-1',
        title: 'Shared Private Trip',
        status: 'PLANNING',
        access_level: 'public',
        is_template: false,
        is_shared: true,
        shared_from_trip_id: 'trip-private-1',
        shared_start_month: 12,
        shared_start_year: 2024,
        shared_end_month: 12,
        shared_end_year: 2024,
        shared_month_label: '2024年12月',
        // start_dateとend_dateは非表示（プライバシー保護）
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(sharedTrip.access_level).toBe('public')
      expect(sharedTrip.is_template).toBe(false)
      expect(sharedTrip.is_shared).toBe(true)
      expect(sharedTrip.shared_from_trip_id).toBe('trip-private-1')
      expect(sharedTrip.shared_start_month).toBe(12)
      expect(sharedTrip.shared_month_label).toBe('2024年12月')
    })

    it('should support template trip type', () => {
      const templateTrip: Trip = {
        id: 'trip-template-1',
        user_id: 'user-1',
        title: 'Template Plan',
        status: 'PLANNING',
        access_level: 'public',
        is_template: true,
        day_count: 5,
        shared_plan_type: 'user',
        // start_dateとend_dateは設定しない（テンプレート）
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(templateTrip.access_level).toBe('public')
      expect(templateTrip.is_template).toBe(true)
      expect(templateTrip.day_count).toBe(5)
      expect(templateTrip.shared_plan_type).toBe('user')
      expect(templateTrip.start_date).toBeUndefined()
      expect(templateTrip.end_date).toBeUndefined()
    })

    it('should support business template trip type', () => {
      const businessTemplate: Trip = {
        id: 'trip-template-business-1',
        user_id: 'user-business-1',
        title: 'Business Template',
        status: 'PLANNING',
        access_level: 'public',
        is_template: true,
        day_count: 7,
        shared_plan_type: 'business',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(businessTemplate.is_template).toBe(true)
      expect(businessTemplate.shared_plan_type).toBe('business')
    })
  })

  describe('Type Compatibility', () => {
    it('should be compatible with existing code patterns', () => {
      // 既存のコードパターン（最小限のフィールド）
      const minimal: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Trip',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      // 拡張されたフィールドを後から追加できる（後方互換性）
      const extended: Trip = {
        ...minimal,
        is_shared: false,
        shared_plan_type: 'user',
        social_stats: {
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          views_count: 0,
          replicas_count: 0,
        },
      }

      expect(extended.id).toBe('trip-1')
      expect(extended.is_shared).toBe(false)
      expect(extended.social_stats?.likes_count).toBe(0)
    })

    it('should support access_level with both AccessLevel and string literal types', () => {
      // AccessLevel型（'public' | 'private' | 'unlisted'）
      const trip1: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Trip 1',
        status: 'PLANNING',
        access_level: 'public',
        created_at: new Date(),
        updated_at: new Date(),
      }

      // 後方互換性のための文字列リテラル型（'private' | 'public'）
      const trip2: Trip = {
        id: 'trip-2',
        user_id: 'user-1',
        title: 'Trip 2',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      }

      expect(trip1.access_level).toBe('public')
      expect(trip2.access_level).toBe('private')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined optional fields', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Trip',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
        // オプショナルフィールドは未定義でも問題ない
      }

      expect(trip.slug).toBeUndefined()
      expect(trip.description).toBeUndefined()
      expect(trip.is_template).toBeUndefined()
      expect(trip.is_shared).toBeUndefined()
      expect(trip.shared_members).toBeUndefined()
    })

    it('should handle empty arrays for optional array fields', () => {
      const trip: Trip = {
        id: 'trip-1',
        user_id: 'user-1',
        title: 'Trip',
        status: 'PLANNING',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
        days: [],
        shared_members: [],
      }

      expect(trip.days).toEqual([])
      expect(trip.shared_members).toEqual([])
    })
  })
})

