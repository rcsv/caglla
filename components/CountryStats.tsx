'use client'

import { useState, useEffect } from 'react'
import { CountryGroup } from '@/lib/country-utils'
import CountryMap from './CountryMap'

interface CountryStatsProps {
  userId: string
  className?: string
}

export default function CountryStats({ userId, className = '' }: CountryStatsProps) {
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

      // Get Firebase ID token
      const { auth } = await import('@/lib/firebase')
      const user = auth.currentUser
      if (!user) {
        throw new Error('User not authenticated')
      }

      const idToken = await user.getIdToken()
      
      const response = await fetch('/api/trips?groupByCountry=true', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch country stats')
      }

      const data = await response.json()
      setCountryGroups(data.trips || [])
      setTotalTrips(data.totalTrips || 0)
      setTotalCountries(data.totalCountries || 0)
    } catch (err) {
      console.error('Error fetching country stats:', err)
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
          <p>エラーが発生しました</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchCountryStats}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (countryGroups.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">国別統計</h3>
        <p className="text-gray-500 text-center">まだ旅行がありません</p>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* デスクトップでは横並び、モバイルでは縦並び */}
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
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{group.countryNameJa}</div>
                    <div className="text-sm text-gray-500">{group.countryName}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-blue-600">{group.tripCount}</span>
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
                console.log('Show detailed country stats')
              }}
              className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              詳細を見る →
            </button>
          </div>
        </div>

        {/* Google Map */}
        <CountryMap countryGroups={countryGroups} />
      </div>
    </div>
  )
}
