'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { dateUtils } from '@/lib/date-utils'
import UserSettingsModal from '@/components/UserSettingsModal'
import CountryStats from '@/components/CountryStats'
import type { Trip } from '@/lib/types'

export default function HomePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(true)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTrips()
    }
  }, [user])

  const fetchTrips = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      } else if (response.status === 401) {
        console.error('Authentication failed')
        router.push('/')
      } else {
        console.error('Failed to fetch trips:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setTripsLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Caglla</h1>
              <span className="text-gray-500">こんにちは、{user.displayName || user.email}さん</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>設定</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">あなたの旅行</h2>
          <Link
            href="/trip/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            新しい旅行を作成
          </Link>
        </div>

        {tripsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">旅行を読み込み中...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ旅行がありません</h3>
            <p className="text-gray-600 mb-6">最初の旅行を作成して、素晴らしい冒険を始めましょう！</p>
            <Link
              href="/trip/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              旅行を作成
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 国別統計 */}
            <CountryStats userId={user.uid} />
            
            {/* 旅行一覧 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">旅行一覧</h3>
              {(() => {
                const { futureTrips, pastTrips } = dateUtils.sortTripsByDate(trips)
                
                const TripCard = ({ trip, isPastTrip = false }: { trip: Trip, isPastTrip?: boolean }) => (
                  <Link
                    key={trip.id}
                    href={`/trip/${trip.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 p-6"
                  >
                    {trip.image_url && (
                      <div className="mb-4">
                        <div className={`relative w-full h-32 rounded-lg overflow-hidden ${
                          isPastTrip ? 'shadow-inner-burned' : ''
                        }`}>
                          <img
                            src={trip.image_url}
                            alt={trip.title}
                            className={`w-full h-32 object-cover rounded-lg ${
                              isPastTrip ? 'sepia filter-grayscale-20' : ''
                            }`}
                            style={isPastTrip ? {
                              filter: 'sepia(0.3) contrast(1.1) brightness(0.9)'
                            } : {}}
                          />
                          {isPastTrip && (
                            <div 
                              className="absolute inset-0 rounded-lg pointer-events-none"
                              style={{
                                boxShadow: 'inset 0 0 20px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(160, 82, 45, 0.2), inset 0 0 60px rgba(139, 69, 19, 0.1)'
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {trip.title}
                      </h3>
                      <div className={`flex items-center px-2 py-1 text-xs rounded-full ${
                        trip.access_level === 'public' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <svg 
                          className="w-3 h-3 mr-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          {trip.access_level === 'public' ? (
                            // Unlocked icon for public
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          ) : (
                            // Locked icon for private
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          )}
                        </svg>
                        <span>
                          {trip.access_level === 'public' ? '公開' : '非公開'}
                        </span>
                      </div>
                    </div>
                    
                    {trip.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                    
                    {trip.destination && (
                      <p className="text-gray-500 text-sm mb-3">
                        📍 {trip.destination}
                      </p>
                    )}
                    
                    {trip.start_date && trip.end_date && (
                      <p className="text-gray-500 text-sm">
                        📅 {(() => {
                          const { futureTrips, pastTrips } = dateUtils.sortTripsByDate([trip])
                          if (futureTrips.length > 0) {
                            return dateUtils.formatFutureTripDate(trip.start_date, trip.end_date)
                          } else if (pastTrips.length > 0) {
                            return dateUtils.formatPastTripDate(trip.start_date, trip.end_date)
                          } else {
                            return dateUtils.formatDateRange(trip.start_date, trip.end_date)
                          }
                        })()}
                      </p>
                    )}
                  </Link>
                )

                return (
                  <div className="space-y-8">
                    {/* 次の旅行プラン */}
                    {futureTrips.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                            次の旅行プラン
                          </span>
                          <span className="text-gray-500 text-sm">
                            {futureTrips.length}件
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {futureTrips.map((trip) => (
                            <TripCard key={trip.id} trip={trip} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 思い出 */}
                    {pastTrips.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                            思い出
                          </span>
                          <span className="text-gray-500 text-sm">
                            {pastTrips.length}件
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {pastTrips.map((trip) => (
                            <TripCard key={trip.id} trip={trip} isPastTrip={true} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 日付が設定されていない旅行 */}
                    {trips.filter(trip => !trip.start_date).length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                            その他
                          </span>
                          <span className="text-gray-500 text-sm">
                            {trips.filter(trip => !trip.start_date).length}件
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {trips.filter(trip => !trip.start_date).map((trip) => (
                            <TripCard key={trip.id} trip={trip} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </main>

      {/* User Settings Modal */}
      <UserSettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </div>
  )
}
