import { timezoneUtils } from '../timezone'
import type { PlaceData } from '@/lib/core/types'

describe('timezoneUtils', () => {
  describe('getTimezoneFromPlace', () => {
    it('should detect timezone from city name', () => {
      const placeData: PlaceData = {
        place_id: 'test-123',
        name: 'Tokyo',
        formatted_address: 'Tokyo, Japan'
      }

      const timezone = timezoneUtils.getTimezoneFromPlace(placeData)
      expect(timezone).toBe('Asia/Tokyo')
    })

    it('should detect timezone from Honolulu', () => {
      const placeData: PlaceData = {
        place_id: 'test-456',
        name: 'Honolulu',
        formatted_address: 'Honolulu, HI, USA'
      }

      const timezone = timezoneUtils.getTimezoneFromPlace(placeData)
      expect(timezone).toBe('Pacific/Honolulu')
    })

    it('should detect timezone from address with country code', () => {
      const placeData: PlaceData = {
        place_id: 'test-789',
        name: 'Tokyo Tower',
        formatted_address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo, Japan',
        address_components: [
          {
            types: ['country'],
            short_name: 'JP'
          }
        ]
      }

      const timezone = timezoneUtils.getTimezoneFromPlace(placeData)
      expect(timezone).toBe('Asia/Tokyo')
    })

    it('should return UTC for unknown place', () => {
      const placeData: PlaceData = {
        place_id: 'test-unknown',
        name: 'Unknown Place',
        formatted_address: 'Unknown Address'
      }

      const timezone = timezoneUtils.getTimezoneFromPlace(placeData)
      expect(timezone).toBe('UTC')
    })

    it('should detect timezone from formatted address', () => {
      const placeData: PlaceData = {
        place_id: 'test-address',
        name: 'Random Place',
        formatted_address: '123 Main St, New York, NY, USA'
      }

      const timezone = timezoneUtils.getTimezoneFromPlace(placeData)
      expect(timezone).toBe('America/New_York')
    })

    it('should handle place with country code but no city', () => {
      const placeData: PlaceData = {
        place_id: 'test-country',
        name: 'Some Place',
        formatted_address: 'Some Address',
        address_components: [
          {
            types: ['country'],
            short_name: 'JP'
          }
        ]
      }

      const timezone = timezoneUtils.getTimezoneFromPlace(placeData)
      expect(timezone).toBe('Asia/Tokyo')
    })

    it('should handle different US cities correctly', () => {
      const losAngelesPlace: PlaceData = {
        place_id: 'test-la',
        name: 'Los Angeles Airport',
        formatted_address: 'Los Angeles, CA, USA'
      }

      expect(timezoneUtils.getTimezoneFromPlace(losAngelesPlace)).toBe('America/Los_Angeles')

      const newYorkPlace: PlaceData = {
        place_id: 'test-ny',
        name: 'New York',
        formatted_address: 'New York, NY, USA'
      }

      expect(timezoneUtils.getTimezoneFromPlace(newYorkPlace)).toBe('America/New_York')
    })

    it('should handle Asian cities', () => {
      const seoulPlace: PlaceData = {
        place_id: 'test-seoul',
        name: 'Seoul',
        formatted_address: 'Seoul, South Korea'
      }

      expect(timezoneUtils.getTimezoneFromPlace(seoulPlace)).toBe('Asia/Seoul')

      const bangkokPlace: PlaceData = {
        place_id: 'test-bkk',
        name: 'Bangkok',
        formatted_address: 'Bangkok, Thailand'
      }

      expect(timezoneUtils.getTimezoneFromPlace(bangkokPlace)).toBe('Asia/Bangkok')
    })

    it('should handle European cities', () => {
      const londonPlace: PlaceData = {
        place_id: 'test-london',
        name: 'London',
        formatted_address: 'London, UK'
      }

      expect(timezoneUtils.getTimezoneFromPlace(londonPlace)).toBe('Europe/London')

      const parisPlace: PlaceData = {
        place_id: 'test-paris',
        name: 'Paris',
        formatted_address: 'Paris, France'
      }

      expect(timezoneUtils.getTimezoneFromPlace(parisPlace)).toBe('Europe/Paris')
    })
  })
})

