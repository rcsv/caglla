'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect } from 'react'
import { WeatherApiHelpers, WeatherSummary } from '@/lib/api/weather'
import Card from '@/components/common/Card'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import { t } from '@/lib/i18n'

interface TripWeatherDisplayProps {
  destination?: string
  startDate?: string
  endDate?: string
  className?: string
}

export default function TripWeatherDisplay({ 
  destination, 
  startDate, 
  endDate, 
  className = '' 
}: TripWeatherDisplayProps) {
  const [weatherData, setWeatherData] = useState<WeatherSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!destination || !startDate || !endDate) {
        setWeatherData(null)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const weather = await WeatherApiHelpers.getTripWeather(destination, startDate, endDate)
        setWeatherData(weather)
      } catch (err) {
        logger.error('Error fetching weather:', err)
        setError(t('weather.error.fetchFailed'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [destination, startDate, endDate])

  if (isLoading) {
    return (
      <Card title={<div className="text-lg font-medium text-gray-800 flex items-center"><IconRenderer iconName="cloud" className="w-5 h-5 mr-2" color="#ca8a04" />{t('weather.title')}</div>} className={className}>
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
            <span>{t('weather.loading')}</span>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card title={<div className="text-lg font-medium text-gray-800 flex items-center"><IconRenderer iconName="cloud" className="w-5 h-5 mr-2" color="#ca8a04" />{t('weather.title')}</div>} className={`${className} relative min-h-[200px]`}>
        
        {/* エラーオーバーレイ */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <div className="text-red-500 text-sm mb-2 font-medium">
              {error}
            </div>
            <p className="text-gray-500 text-xs">
              {t('weather.error.fetchFailed')}
            </p>
            <div className="mt-3 text-xs text-gray-400">
              <p>{t('weather.hint.forecastLimit')}</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!weatherData || weatherData.dominantWeather === t('weather.empty.noData')) {
    return (
      <Card title={<div className="text-lg font-medium text-gray-800 flex items-center"><IconRenderer iconName="cloud" className="w-5 h-5 mr-2" color="#ca8a04" />{t('weather.title')}</div>} className={`${className} relative min-h-[200px]`}>
        
        {/* データなしオーバーレイ */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-3">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              {!destination || !startDate || !endDate 
                ? t('weather.empty.noDestination')
                : t('weather.empty.noData')
              }
            </p>
            <div className="text-xs text-gray-400">
              <p>{t('weather.hint.forecastLimit')}</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const { 
    averageTemp, 
    minTemp, 
    maxTemp, 
    rainyDays, 
    totalPrecipitation, 
    averageWindSpeed,
    dominantWeather,
    isPartialForecast,
    availableDays,
    forecastDays
  } = weatherData

  // TODO: 天気名判定ロジックはdominantWeatherCodeを使用するように修正が必要
  // 現状はi18n化された文字列で判定しているため、言語に依存しない判定が必要
  const weatherIcon = WeatherApiHelpers.getWeatherIcon(weatherData.dominantWeatherCode ?? 0)

  return (
    <Card title={<div className="text-lg font-medium text-gray-800 flex items-center"><IconRenderer iconName="cloud" className="w-5 h-5 mr-2" color="#ca8a04" />{t('weather.title')}</div>} className={`min-h-[200px] ${className}`}>
      {isPartialForecast && (
        <div className="mb-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
          {t('weather.partialForecast')}
        </div>
      )}
      
      <div className="space-y-3">
        {/* メイン天気情報 */}
        <div className="flex items-center justify-between py-3 px-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{weatherIcon}</div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {dominantWeather}
              </div>
              <div className="text-sm text-gray-600">
                {destination}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">
              {averageTemp}°C
            </div>
            <div className="text-xs text-gray-500">
              {minTemp}°C〜{maxTemp}°C
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-gray-600 mb-1">{t('weather.rainyDays')}</div>
            <div className="font-medium">
              {rainyDays}{t('weather.days')}
              {totalPrecipitation > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({totalPrecipitation}mm)
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-gray-600 mb-1">{t('weather.averageWindSpeed')}</div>
            <div className="font-medium">
              {averageWindSpeed}km/h
            </div>
          </div>
        </div>

        {/* 予報期間の注意 */}
        {isPartialForecast && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-xs text-orange-600">
                <p className="font-medium">{t('weather.constraint.title')}</p>
                <p>
                  {t('weather.constraint.message').replace('{forecastDays}', String(forecastDays))}
                  {t('weather.constraint.remainingDays').replace('{remainingDays}', String(availableDays - forecastDays))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ヒント */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M2 11a10 10 0 0 1 20 0c0 3.38-1.88 6.31-4.67 7.86-.23.13-.33.39-.33.64V20H7v-.5c0-.25-.1-.51-.33-.64C3.88 17.31 2 14.38 2 11z" />
            </svg>
            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t('weather.forecastedBy')}</a>
          </p>
        </div>
      </div>
    </Card>
  )
}



