/**
 * Open-Meteo Weather API integration
 * https://open-meteo.com/
 * 
 * Features:
 * - Free, no API key required
 * - 16-day weather forecast
 * - High accuracy
 * - No rate limits
 */

import type { WeatherData, WeatherForecast, WeatherSummary } from '@/lib/core/types'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'

// Re-export types for backward compatibility
export type { WeatherData, WeatherForecast, WeatherSummary }

/**
 * Get weather description by code (i18n対応)
 */
function getWeatherDescription(code: number): string {
  const key = `weather.code.${code}` as const
  return t(key) || t('weather.unknown')
}

export class WeatherApiHelpers {
  private static readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast'

  /**
   * Get weather forecast for a specific location and date range
   */
  static async getWeatherForecast(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string
  ): Promise<WeatherForecast> {
    // Validate date format (YYYY-MM-DD)
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD')
    }

    // Limit date range to 16 days from today (Open-Meteo limitation)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to midnight for date comparison
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 16)
    
    // Check if endDate is in the past (no weather forecast for past dates)
    if (endDateObj < today) {
      throw new Error('Weather forecast is not available for past dates')
    }
    
    // Adjust dates if they exceed the allowed range
    const adjustedStartDate = startDateObj > today ? startDateObj : today
    const adjustedEndDate = endDateObj > maxDate ? maxDate : endDateObj
    
    // Check if the date range is valid
    if (adjustedStartDate > adjustedEndDate) {
      throw new Error('Weather forecast is only available for dates within 16 days from today')
    }

    // Format dates properly
    const formattedStartDate = adjustedStartDate.toISOString().split('T')[0]
    const formattedEndDate = adjustedEndDate.toISOString().split('T')[0]

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant',
      timezone: 'Asia/Tokyo'
    })

    const url = `${this.BASE_URL}?${params}`
    logger.debug('Weather API request URL:', url)

    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Weather API error response:', errorText)
      
      // Parse error response for better error messages
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.reason) {
          throw new Error(`Weather API error: ${errorData.reason}`)
        }
      } catch (parseError) {
        // If parsing fails, use the original error text
      }
      
      if (response.status === 400) {
        throw new Error('Weather API request error: Invalid parameters or date range')
      } else if (response.status === 429) {
        throw new Error('Weather API rate limit exceeded. Please try again later.')
      } else if (response.status >= 500) {
        throw new Error('Weather API server error. Please try again later.')
      } else {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
      }
    }

    const data = await response.json()
    logger.debug('Weather API response:', data)
    return data
  }

  /**
   * Get weather forecast for a trip destination with fallback mechanisms
   */
  static async getTripWeather(
    destination: string,
    startDate: string,
    endDate: string
  ): Promise<WeatherSummary | null> {
    try {
      logger.debug('Getting weather for:', { destination, startDate, endDate })
      
      // First, get coordinates for the destination using a geocoding service
      const coordinates = await this.getCoordinatesForDestination(destination)
      
      if (!coordinates) {
        logger.warn(`Could not find coordinates for destination: ${destination}`)
        // Return a fallback summary indicating no weather data available
        return this.createFallbackWeatherSummary(destination, startDate, endDate)
      }

      logger.debug('Using coordinates:', coordinates)

      const forecast = await this.getWeatherForecast(
        coordinates.latitude,
        coordinates.longitude,
        startDate,
        endDate
      )

      const summary = this.calculateWeatherSummary(forecast, startDate, endDate)
      logger.debug('Weather summary calculated:', summary)
      return summary
    } catch (error) {
      logger.error('Error fetching weather data:', error)
      
      // Return a fallback summary with error information
      return this.createFallbackWeatherSummary(destination, startDate, endDate, error as Error)
    }
  }

  /**
   * Create a fallback weather summary when weather data is unavailable
   */
  private static createFallbackWeatherSummary(
    destination: string,
    startDate: string,
    endDate: string,
    error?: Error
  ): WeatherSummary {
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return {
      averageTemp: 0,
      minTemp: 0,
      maxTemp: 0,
      rainyDays: 0,
      totalPrecipitation: 0,
      averageWindSpeed: 0,
      dominantWeather: t('weather.empty.noData'),
      forecastDays: 0,
      availableDays: 0,
      isPartialForecast: true
    }
  }

  /**
   * Get coordinates for a destination using Google Geocoding API with fallback to Open-Meteo
   */
  private static async getCoordinatesForDestination(destination: string): Promise<{latitude: number, longitude: number} | null> {
    // Try Google Geocoding API first
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    if (googleApiKey) {
      try {
        const googleGeocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${googleApiKey}&language=en`
        logger.debug('Google Geocoding API request URL:', googleGeocodingUrl.replace(googleApiKey, '***'))
        
        const response = await fetch(googleGeocodingUrl)
        
        if (response.ok) {
          const data = await response.json()
          logger.debug('Google Geocoding API response status:', data.status)
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0]
            const location = result.geometry.location
            logger.debug('Found coordinates via Google:', location.lat, location.lng, 'for:', result.formatted_address)
            return {
              latitude: location.lat,
              longitude: location.lng
            }
          } else {
            logger.warn('Google Geocoding API returned no results:', data.status)
          }
        } else {
          logger.warn('Google Geocoding API request failed:', response.status)
        }
      } catch (error) {
        logger.error('Error with Google Geocoding API:', error)
      }
    } else {
      logger.warn('Google Places API key not found, falling back to Open-Meteo')
    }

    // Fallback to Open-Meteo Geocoding API
    try {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
      logger.debug('Open-Meteo Geocoding API request URL:', geocodingUrl)
      
      const response = await fetch(geocodingUrl)
      
      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Open-Meteo Geocoding API error response:', errorText)
        if (response.status === 403) {
          throw new Error('Open-Meteo Geocoding API access denied. Please check rate limits or try again later.')
        }
        throw new Error(`Open-Meteo Geocoding API error: ${response.status}`)
      }

      const data = await response.json()
      logger.debug('Open-Meteo Geocoding API response:', data)
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        logger.debug('Found coordinates via Open-Meteo:', result.latitude, result.longitude, 'for:', result.name)
        return {
          latitude: result.latitude,
          longitude: result.longitude
        }
      }

      logger.warn('No coordinates found for destination:', destination)
      return null
    } catch (error) {
      logger.error('Error geocoding destination with Open-Meteo:', error)
      return null
    }
  }

  /**
   * Calculate weather summary from forecast data
   */
  private static calculateWeatherSummary(
    forecast: WeatherForecast,
    startDate: string,
    endDate: string
  ): WeatherSummary {
    const { daily } = forecast
    const days = daily.time.length

    // Calculate date range
    const tripStart = new Date(startDate)
    const tripEnd = new Date(endDate)
    const tripDuration = Math.ceil((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Calculate statistics
    const temperatures = daily.temperature_2m_max.map((max, i) => (max + daily.temperature_2m_min[i]) / 2)
    const averageTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
    const minTemp = Math.min(...daily.temperature_2m_min)
    const maxTemp = Math.max(...daily.temperature_2m_max)
    
    const rainyDays = daily.weathercode.filter(code => 
      code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95 && code <= 99
    ).length
    
    const totalPrecipitation = daily.precipitation_sum.reduce((sum, precip) => sum + precip, 0)
    const averageWindSpeed = daily.windspeed_10m_max.reduce((sum, wind) => sum + wind, 0) / daily.windspeed_10m_max.length

    // Find dominant weather condition
    const weatherCounts: Record<number, number> = {}
    daily.weathercode.forEach(code => {
      weatherCounts[code] = (weatherCounts[code] || 0) + 1
    })
    
    const dominantWeatherCode = Object.keys(weatherCounts).reduce((a, b) => 
      weatherCounts[parseInt(a)] > weatherCounts[parseInt(b)] ? a : b
    )
    
    const dominantWeatherCodeNum = parseInt(dominantWeatherCode)
    const dominantWeather = getWeatherDescription(dominantWeatherCodeNum)

    return {
      averageTemp: Math.round(averageTemp * 10) / 10,
      minTemp: Math.round(minTemp),
      maxTemp: Math.round(maxTemp),
      rainyDays,
      totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
      averageWindSpeed: Math.round(averageWindSpeed * 10) / 10,
      dominantWeatherCode: dominantWeatherCodeNum,
      dominantWeather,
      forecastDays: days,
      availableDays: Math.min(days, tripDuration),
      isPartialForecast: days < tripDuration
    }
  }

  /**
   * Format weather summary for display (i18n対応)
   */
  static formatWeatherSummary(summary: WeatherSummary): string {
    const { averageTemp, minTemp, maxTemp, rainyDays, dominantWeather, isPartialForecast } = summary
    
    let result = `${dominantWeather} | ${t('weather.average')}${averageTemp}°C (${minTemp}°C${t('weather.range')}${maxTemp}°C)`
    
    if (rainyDays > 0) {
      result += ` | ${t('weather.rainyDays')}${rainyDays}${t('weather.days')}`
    }
    
    if (isPartialForecast) {
      result += ` | ※${summary.forecastDays}${t('weather.days')}${t('weather.only')}`
    }
    
    return result
  }

  /**
   * Get weather icon based on weather code
   */
  static getWeatherIcon(weatherCode: number): string {
    if (weatherCode === 0 || weatherCode === 1) return '☀️'
    if (weatherCode === 2 || weatherCode === 3) return '☁️'
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️'
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️'
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️'
    if (weatherCode >= 80 && weatherCode <= 82) return '⛈️'
    if (weatherCode >= 85 && weatherCode <= 86) return '🌨️'
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️'
    return '🌤️'
  }
}

export const weatherApiHelpers = new WeatherApiHelpers()
