'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Trip } from '@/lib/types'

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [publicTrips, setPublicTrips] = useState<Trip[]>([])
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user, params.id])

  const fetchUserProfile = async () => {
    try {
      // In a real app, you would fetch user profile from API
      // For now, we'll use the current user's data
      if (user && user.uid === params.id) {
        setProfileUser({
          id: user.uid,
          name: user.displayName || 'ユーザー',
          email: user.email,
          photoURL: user.photoURL
        })
        
        // Fetch user's public trips
        const response = await fetch(`/api/trips?userId=${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setPublicTrips(data.trips.filter((trip: Trip) => trip.access_level === 'public'))
        }
      } else {
        // Fetch other user's profile
        // This would require additional API endpoints
        router.push('/home')
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user || !profileUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* User Profile */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-6">
            {profileUser.photoURL ? (
              <img
                src={profileUser.photoURL}
                alt={profileUser.name}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-600">
                  {profileUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profileUser.name}</h2>
              <p className="text-gray-600">{profileUser.email}</p>
            </div>
          </div>
        </div>

        {/* Public Trips */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">公開された旅行</h3>
          
          {publicTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✈️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">まだ公開された旅行がありません</h4>
              <p className="text-gray-600">旅行を作成して、他のユーザーと共有しましょう！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trip/${trip.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 p-6"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {trip.title}
                  </h4>
                  
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
                      📅 {new Date(trip.start_date).toLocaleDateString('ja-JP')} - {new Date(trip.end_date).toLocaleDateString('ja-JP')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
