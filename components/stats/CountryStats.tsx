'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect } from 'react'
import { CountryGroup } from '@/lib/travel/country/utils'
import CountryMap from '@/components/CountryMap'
import TripCard from '@/components/tripcard/TripCard'
import Loading from '@/components/common/Loading'
import type { Trip } from '@/lib/core/types'

interface CountryStatsProps {
  userId: string
  className?: string
}

export default function CountryStats({ userId, className = '' }: CountryStatsProps) {
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([])
  const [recommendedTrips, setRecommendedTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalTrips, setTotalTrips] = useState(0)
  const [totalCountries, setTotalCountries] = useState(0)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get Firebase ID token
      const { auth } = await import('@/lib/firebase/client')
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const idToken = await user.getIdToken()
      
      // Fetch country stats and recommended trips in parallel
      const [countryResponse, recommendedResponse] = await Promise.all([
        fetch('/api/trips?groupByCountry=true', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/trips/recommendations?limit=6', { cache: 'no-store' })
      ])

      if (!countryResponse.ok) {
        throw new Error('Failed to fetch country stats')
      }

      const countryData = await countryResponse.json()
      setCountryGroups(countryData.trips || [])
      setTotalTrips(countryData.totalTrips || 0)
      setTotalCountries(countryData.totalCountries || 0)

      // Handle recommended trips
      if (recommendedResponse.ok) {
        const recommendedData = await recommendedResponse.json()
        setRecommendedTrips(recommendedData.trips || [])
      }
    } catch (err) {
      logger.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-red-600 text-center">
          <p>エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-8">
        {/* 国別統計とマップ */}
        {countryGroups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 国別統計リスト */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">国別統計</h3>
                <div className="text-sm text-gray-500">
                  {totalTrips}回の旅行 • {totalCountries}カ国
                </div>
              </div>

              <div className="space-y-4">
                {countryGroups.map((group, index) => (
                  <div key={group.countryCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{group.countryNameJa}</div>
                        <div className="text-sm text-gray-500">{group.countryName}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-emerald-600">{group.tripCount}</span>
                      <span className="text-sm text-gray-500">回</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 詳細表示ボタン */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    // 詳細表示のロジックをここに追加
                    logger.debug('Show detailed country stats')
                  }}
                  className="w-full text-center text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  詳細を見る →
                </button>
              </div>
            </div>

            {/* Google Map */}
            <CountryMap countryGroups={countryGroups} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">国別統計</h3>
            <p className="text-gray-500 text-center">まだ旅行がありません</p>
          </div>
        )}

        {/* おすすめ旅行計画 */}
        {recommendedTrips.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">おすすめ旅行計画</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedTrips.map(trip => (
                <TripCard key={trip.id} trip={trip} variant="imageFull" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
