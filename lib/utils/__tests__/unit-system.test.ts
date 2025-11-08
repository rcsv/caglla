import {
  getDefaultUnitSystem,
  getUserUnitSystem,
  getTemperatureUnit,
  getDistanceUnit,
} from '../unit-system'
import type { User } from '@/lib/core/types'

describe('unit-system utils', () => {
  describe('getDefaultUnitSystem', () => {
    it('returns metric when country code is undefined', () => {
      expect(getDefaultUnitSystem()).toBe('metric')
    })

    it('returns metric for Japan', () => {
      expect(getDefaultUnitSystem('JP')).toBe('metric')
    })

    it('returns imperial for United States', () => {
      expect(getDefaultUnitSystem('US')).toBe('imperial')
    })

    it('handles lowercase country codes', () => {
      expect(getDefaultUnitSystem('us')).toBe('imperial')
      expect(getDefaultUnitSystem('jp')).toBe('metric')
    })
  })

  describe('getUserUnitSystem', () => {
    it('respects user preference when set', () => {
      const user: Partial<User> = {
        preferences: {
          unit_system: 'imperial',
        },
      }

      expect(getUserUnitSystem(user as User)).toBe('imperial')
    })

    it('falls back to country code when preference is absent', () => {
      const user: Partial<User> = {
        preferences: {
          home_country_code: 'US',
        },
      }

      expect(getUserUnitSystem(user as User)).toBe('imperial')
    })

    it('returns metric when no preference or country is provided', () => {
      const user: Partial<User> = {
        preferences: {},
      }

      expect(getUserUnitSystem(user as User)).toBe('metric')
    })
  })

  describe('temperature and distance utilities', () => {
    it('returns Fahrenheit for imperial systems', () => {
      expect(getTemperatureUnit('imperial')).toBe('fahrenheit')
    })

    it('returns Celsius for metric systems', () => {
      expect(getTemperatureUnit('metric')).toBe('celsius')
    })

    it('returns distance unit matching the system', () => {
      expect(getDistanceUnit('metric')).toBe('metric')
      expect(getDistanceUnit('imperial')).toBe('imperial')
    })
  })
})

