/**
 * 天気関連の型定義
 */

// ============================================================================
// 天気関連
// ============================================================================

/**
 * 天気データ（1日分）
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

/**
 * 天気予報（複数日）
 */
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

/**
 * 天気サマリー
 */
export interface WeatherSummary {
  averageTemp: number
  minTemp: number
  maxTemp: number
  rainyDays: number
  totalPrecipitation: number
  averageWindSpeed: number
  dominantWeatherCode?: number
  dominantWeather: string
  forecastDays: number
  availableDays: number
  isPartialForecast: boolean
}

