'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect } from 'react'
import { CountryGroup } from '@/lib/travel/country/utils'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { getCountryFlag } from '@/lib/utils/country-flags'
import { t } from '@/lib/i18n'

interface CountryStatsSimpleProps {
  userId: string
  className?: string
}

export default function CountryStatsSimple({ userId, className = '' }: CountryStatsSimpleProps) {
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalTrips, setTotalTrips] = useState(0)
  const [totalCountries, setTotalCountries] = useState(0)

  useEffect(() => {
    fetchCountryStats()
  }, [userId])

  const fetchCountryStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await makeAuthenticatedRequest('/api/trips?groupByCountry=true')
      if (response.ok) {
        const data = await response.json()
        setCountryGroups(data.trips || [])
        setTotalTrips(data.totalTrips || 0)
        setTotalCountries(data.totalCountries || 0)
      } else {
        throw new Error('Failed to fetch country stats')
      }
    } catch (err) {
      logger.error('Error fetching country stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch country stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 bg-gray-200 rounded w-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-red-600 text-center">
          <p>{t('home.dashboard.countryStats.error')}</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchCountryStats}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('home.dashboard.countryStats.retry')}
          </button>
        </div>
      </div>
    )
  }

  if (countryGroups.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <PinIcon className="w-5 h-5" color="#374151" />
          {t('home.dashboard.countryStats.title')}
        </h3>
        <p className="text-gray-500 text-center">{t('home.dashboard.countryStats.empty')}</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <PinIcon className="w-5 h-5" color="#374151" />
          {t('home.dashboard.countryStats.title')}
        </h3>
        <div className="text-sm text-gray-500">
          {t('home.dashboard.countryStats.summary')
            .replace('{totalTrips}', String(totalTrips))
            .replace('{totalCountries}', String(totalCountries))}
        </div>
      </div>

      <div className="space-y-4">
        {countryGroups.slice(0, 5).map((group, index) => (
          <div key={group.countryCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full text-sm font-semibold">
                {index + 1}
              </div>
              <div className="text-2xl">
                {getCountryFlag(group.countryCode)}
              </div>
              <div>
                <div className="font-medium text-gray-800">{group.countryNameJa}</div>
                <div className="text-sm text-gray-500">{group.countryName}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-emerald-600">{group.tripCount}</span>
              <span className="text-sm text-gray-500">{t('home.dashboard.countryStats.times')}</span>
            </div>
          </div>
        ))}
      </div>

      {countryGroups.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              // 詳細表示のロジックをここに追加
              logger.debug('Show detailed country stats')
            }}
            className="w-full text-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            {t('home.dashboard.countryStats.viewDetails')}
          </button>
        </div>
      )}
    </div>
  )
}
