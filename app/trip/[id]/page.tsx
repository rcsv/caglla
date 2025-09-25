'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import TripEditor from '@/components/TripEditor'

interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
}

interface Day {
  id: string
  trip_id: string
  day_number: number
  date: string
  description?: string
  created_at: string
  updated_at: string
  itineraries: Itinerary[]
}

interface Trip {
  id: string
  user_id: string
  title: string
  description?: string
  destination?: string
  start_date?: string
  end_date?: string
  access_level: 'private' | 'public'
  created_at: string
  updated_at: string
  days: Day[]
}

export default function TripPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripLoading, setTripLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTrip()
    }
  }, [user, params.id])

  const fetchTrip = async () => {
    try {
      const response = await fetch(`/api/trip/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTrip(data)
      } else if (response.status === 404) {
        router.push('/home')
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error)
    } finally {
      setTripLoading(false)
    }
  }

  const handleDeleteTrip = async () => {
    if (!confirm('この旅行を削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      const response = await fetch(`/api/trip/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/home')
      } else {
        console.error('Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
    }
  }

  if (loading || tripLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user || !trip) {
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
              <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                trip.access_level === 'public' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {trip.access_level === 'public' ? '公開' : '非公開'}
              </span>
              <button
                onClick={handleDeleteTrip}
                className="text-red-600 hover:text-red-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Trip Info */}
        <div className="mb-8">
          <TripEditor 
            trip={trip} 
            onUpdate={(updatedTrip) => setTrip(updatedTrip)} 
          />
        </div>

        {/* Days */}
        {trip.days && trip.days.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">日程</h2>
            {trip.days.map((day) => (
              <div key={day.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    第{day.day_number}日目
                  </h3>
                  <span className="text-gray-500">
                    {new Date(day.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </span>
                </div>
                
                {day.description && (
                  <p className="text-gray-600 mb-4">{day.description}</p>
                )}

                {day.itineraries && day.itineraries.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">スケジュール</h4>
                    {day.itineraries.map((itinerary) => (
                      <div key={itinerary.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{itinerary.title}</h5>
                            {itinerary.description && (
                              <p className="text-gray-600 text-sm mt-1">{itinerary.description}</p>
                            )}
                            {itinerary.location && (
                              <p className="text-gray-500 text-sm mt-1">📍 {itinerary.location}</p>
                            )}
                          </div>
                          {(itinerary.start_time || itinerary.end_time) && (
                            <span className="text-gray-500 text-sm">
                              {itinerary.start_time && itinerary.end_time 
                                ? `${itinerary.start_time} - ${itinerary.end_time}`
                                : itinerary.start_time || itinerary.end_time
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>まだスケジュールがありません</p>
                    <Link
                      href={`/trip/${trip.id}/day/${day.id}/itinerary/new`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      スケジュールを追加
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ日程がありません</h3>
            <p className="text-gray-600 mb-6">旅行の日程を追加して、詳細な計画を立てましょう！</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
              日程を追加
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
