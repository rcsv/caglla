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

export interface WeatherData {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  weathercode: number
  precipitation_sum: number
  windspeed_10m_max: number
  winddirection_10m_dominant: number
}

export interface WeatherForecast {
  latitude: number
  longitude: number
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weathercode: number[]
    precipitation_sum: number[]
    windspeed_10m_max: number[]
    winddirection_10m_dominant: number[]
  }
  daily_units: {
    temperature_2m_max: string
    temperature_2m_min: string
    weathercode: string
    precipitation_sum: string
    windspeed_10m_max: string
    winddirection_10m_dominant: string
  }
}

export interface WeatherSummary {
  averageTemp: number
  minTemp: number
  maxTemp: number
  rainyDays: number
  totalPrecipitation: number
  averageWindSpeed: number
  dominantWeather: string
  forecastDays: number
  availableDays: number
  isPartialForecast: boolean
}

// Weather code to description mapping
const WEATHER_CODES: Record<number, string> = {
  0: '晴れ',
  1: '主に晴れ',
  2: '部分的に曇り',
  3: '曇り',
  45: '霧',
  48: '霧氷',
  51: '軽い霧雨',
  53: '霧雨',
  55: '濃い霧雨',
  56: '軽い凍る霧雨',
  57: '凍る霧雨',
  61: '軽い雨',
  63: '雨',
  65: '大雨',
  66: '軽い凍る雨',
  67: '凍る雨',
  71: '軽い雪',
  73: '雪',
  75: '大雪',
  77: '雪の粒',
  80: '軽いにわか雨',
  81: 'にわか雨',
  82: '激しいにわか雨',
  85: '軽いにわか雪',
  86: 'にわか雪',
  95: '雷雨',
  96: '雹を伴う雷雨',
  99: '激しい雹を伴う雷雨'
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

    // Format dates properly
    const formattedStartDate = startDateObj.toISOString().split('T')[0]
    const formattedEndDate = endDateObj.toISOString().split('T')[0]

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant',
      timezone: 'Asia/Tokyo'
    })

    const url = `${this.BASE_URL}?${params}`
    console.log('Weather API request URL:', url)

    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Weather API error response:', errorText)
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Weather API response:', data)
    return data
  }

  /**
   * Get weather forecast for a trip destination
   */
  static async getTripWeather(
    destination: string,
    startDate: string,
    endDate: string
  ): Promise<WeatherSummary | null> {
    try {
      console.log('Getting weather for:', { destination, startDate, endDate })
      
      // First, get coordinates for the destination using a geocoding service
      const coordinates = await this.getCoordinatesForDestination(destination)
      
      if (!coordinates) {
        console.warn(`Could not find coordinates for destination: ${destination}`)
        return null
      }

      console.log('Using coordinates:', coordinates)

      const forecast = await this.getWeatherForecast(
        coordinates.latitude,
        coordinates.longitude,
        startDate,
        endDate
      )

      const summary = this.calculateWeatherSummary(forecast, startDate, endDate)
      console.log('Weather summary calculated:', summary)
      return summary
    } catch (error) {
      console.error('Error fetching weather data:', error)
      return null
    }
  }

  /**
   * Get coordinates for a destination using Open-Meteo's geocoding API
   */
  private static async getCoordinatesForDestination(destination: string): Promise<{latitude: number, longitude: number} | null> {
    try {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=ja&format=json`
      console.log('Geocoding API request URL:', geocodingUrl)
      
      const response = await fetch(geocodingUrl)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Geocoding API error response:', errorText)
        throw new Error(`Geocoding API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Geocoding API response:', data)
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        console.log('Found coordinates:', result.latitude, result.longitude, 'for:', result.name)
        return {
          latitude: result.latitude,
          longitude: result.longitude
        }
      }

      console.warn('No coordinates found for destination:', destination)
      return null
    } catch (error) {
      console.error('Error geocoding destination:', error)
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
    
    const dominantWeather = WEATHER_CODES[parseInt(dominantWeatherCode)] || '不明'

    return {
      averageTemp: Math.round(averageTemp * 10) / 10,
      minTemp: Math.round(minTemp),
      maxTemp: Math.round(maxTemp),
      rainyDays,
      totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
      averageWindSpeed: Math.round(averageWindSpeed * 10) / 10,
      dominantWeather,
      forecastDays: days,
      availableDays: Math.min(days, tripDuration),
      isPartialForecast: days < tripDuration
    }
  }

  /**
   * Format weather summary for display
   */
  static formatWeatherSummary(summary: WeatherSummary): string {
    const { averageTemp, minTemp, maxTemp, rainyDays, dominantWeather, isPartialForecast } = summary
    
    let result = `${dominantWeather} | 平均${averageTemp}°C (${minTemp}°C〜${maxTemp}°C)`
    
    if (rainyDays > 0) {
      result += ` | 雨の日${rainyDays}日`
    }
    
    if (isPartialForecast) {
      result += ` | ※${summary.forecastDays}日分のみ`
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
