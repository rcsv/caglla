'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import TripEditor from '@/components/TripEditor'
import DayEditor from '@/components/DayEditor'
import AddScheduleModal from '@/components/AddScheduleModal'
import ScheduleCard from '@/components/ScheduleCard'
import { dateUtils } from '@/lib/date-utils'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'

// TripPage専用の型定義
type TripPageItinerary = {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  place_data?: any
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
}

type TripPageDay = {
  id: string
  trip_id: string
  day_number: number
  description?: string
  created_at: string
  updated_at: string
  itineraries?: TripPageItinerary[]
}

type TripPageTrip = {
  id: string
  user_id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  status: string
  created_at: string
  updated_at: string
  days?: TripPageDay[]
}

export default function TripPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<TripPageTrip | null>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await makeAuthenticatedRequest(`/api/trips/${params.id}`)
        if (response.ok) {
          const tripData = await response.json()
          console.log('Fetched trip data:', tripData)
          console.log('Start date:', tripData.start_date)
          console.log('End date:', tripData.end_date)
          setTrip(tripData)
        } else {
          console.error('Failed to fetch trip')
        }
      } catch (error) {
        console.error('Error fetching trip:', error)
      } finally {
        setTripLoading(false)
      }
    }

    if (user) {
      fetchTrip()
    }
  }, [user, params.id])

  const handleAddSchedule = (dayId: string) => {
    setSelectedDayId(dayId)
    setShowAddScheduleModal(true)
  }

  const handleScheduleAdded = async (newItinerary: any) => {
    if (!trip) return

    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      
      return {
        ...prevTrip,
        days: prevTrip.days?.map(day => {
          if (day.id === newItinerary.day_id) {
            return {
              ...day,
              itineraries: [...(day.itineraries || []), newItinerary]
            }
          }
          return day
        }) || []
      }
    })
  }

  const handleScheduleUpdated = async (updatedItinerary: any) => {
    if (!trip) return

    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      
      return {
        ...prevTrip,
        days: prevTrip.days?.map(day => {
          if (day.id === updatedItinerary.day_id) {
            return {
              ...day,
              itineraries: day.itineraries?.map(itinerary => 
                itinerary.id === updatedItinerary.id ? updatedItinerary : itinerary
              ) || []
            }
          }
          return day
        }) || []
      }
    })
  }

  const handleScheduleDelete = async (itineraryId: string) => {
    try {
      const response = await makeAuthenticatedRequest(`/api/itineraries/${itineraryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // UIから削除
        setTrip(prevTrip => {
          if (!prevTrip) return prevTrip
          return {
            ...prevTrip,
            days: prevTrip.days?.map(day => ({
              ...day,
              itineraries: day.itineraries?.filter(itinerary => itinerary.id !== itineraryId) || []
            })) || []
          }
        })
      } else {
        console.error('Failed to delete itinerary')
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error)
      alert('削除に失敗しました')
    }
  }

  // 特定のitineraryをIDで検索
  const findItineraryById = (id: string): TripPageItinerary | null => {
    if (!trip) return null
    
    for (const day of trip.days || []) {
      const itinerary = day.itineraries?.find(i => i.id === id)
      if (itinerary) return itinerary
    }
    return null
  }

  // 上下移動の処理
  const handleMoveUp = async (itineraryId: string, dayId: string) => {
    if (!trip) return

    const day = trip.days?.find(d => d.id === dayId)
    if (!day || !day.itineraries) return

    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    const currentIndex = sortedItineraries.findIndex(item => item.id === itineraryId)
    
    if (currentIndex <= 0) return // 既に最初の要素

    // 前の要素と入れ替え
    const newItineraries = [...sortedItineraries]
    const temp = newItineraries[currentIndex]
    newItineraries[currentIndex] = newItineraries[currentIndex - 1]
    newItineraries[currentIndex - 1] = temp

    // sort_numberを更新
    const updates = newItineraries.map((item, index) => ({
      id: item.id,
      day_id: dayId,
      sort_number: index + 1
    }))

    try {
      const response = await makeAuthenticatedRequest('/api/itineraries/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      })

      if (response.ok) {
        // UIを更新
        setTrip(prevTrip => {
          if (!prevTrip) return prevTrip
          return {
            ...prevTrip,
            days: prevTrip.days?.map(d => {
              if (d.id === dayId) {
                return {
                  ...d,
                  itineraries: newItineraries.map((item, index) => ({
                    ...item,
                    sort_number: index + 1
                  }))
                }
              }
              return d
            }) || []
          }
        })
      }
    } catch (error) {
      console.error('Error moving up:', error)
    }
  }

  const handleMoveDown = async (itineraryId: string, dayId: string) => {
    if (!trip) return

    const day = trip.days?.find(d => d.id === dayId)
    if (!day || !day.itineraries) return

    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    const currentIndex = sortedItineraries.findIndex(item => item.id === itineraryId)
    
    if (currentIndex >= sortedItineraries.length - 1) return // 既に最後の要素

    // 次の要素と入れ替え
    const newItineraries = [...sortedItineraries]
    const temp = newItineraries[currentIndex]
    newItineraries[currentIndex] = newItineraries[currentIndex + 1]
    newItineraries[currentIndex + 1] = temp

    // sort_numberを更新
    const updates = newItineraries.map((item, index) => ({
      id: item.id,
      day_id: dayId,
      sort_number: index + 1
    }))

    try {
      const response = await makeAuthenticatedRequest('/api/itineraries/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      })

      if (response.ok) {
        // UIを更新
        setTrip(prevTrip => {
          if (!prevTrip) return prevTrip
          return {
            ...prevTrip,
            days: prevTrip.days?.map(d => {
              if (d.id === dayId) {
                return {
                  ...d,
                  itineraries: newItineraries.map((item, index) => ({
                    ...item,
                    sort_number: index + 1
                  }))
                }
              }
              return d
            }) || []
          }
        })
      }
    } catch (error) {
      console.error('Error moving down:', error)
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
              <p className="text-gray-600 mt-1">
                {trip.start_date && trip.end_date 
                  ? `${dateUtils.formatDate(trip.start_date)} - ${dateUtils.formatDate(trip.end_date)}`
                  : '日付が設定されていません'
                }
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                戻る
              </Link>
              <TripEditor trip={trip as any} onUpdate={(updatedTrip: any) => setTrip(updatedTrip)} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Trip Description */}
        {trip.description && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">旅行の説明</h2>
            <p className="text-gray-700">{trip.description}</p>
          </div>
        )}

        {/* Days */}
        {trip.days && trip.days.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">日程</h2>
            {trip.days.map((day) => (
              <div
                key={day.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    第{day.day_number}日目
                  </h3>
                  <span className="text-gray-500">
                    {trip.start_date 
                      ? dateUtils.formatDate(
                          new Date(trip.start_date).getTime() + (day.day_number - 1) * 24 * 60 * 60 * 1000
                        )
                      : '日付が設定されていません'
                    }
                  </span>
                </div>

                <DayEditor day={day as any} onUpdate={(updatedDay: any) => {
                  setTrip(prevTrip => {
                    if (!prevTrip) return prevTrip
                    return {
                      ...prevTrip,
                      days: prevTrip.days?.map(d => 
                        d.id === updatedDay.id ? updatedDay as any : d
                      ) || []
                    }
                  })
                }} />

                {day.itineraries && day.itineraries.length > 0 ? (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">スケジュール</h4>
                      <button
                        onClick={() => handleAddSchedule(day.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Venue / Point of Interest を追加
                      </button>
                    </div>
                    <div className="space-y-3">
                      {day.itineraries.map((itinerary, index) => (
                        <ScheduleCard
                          key={itinerary.id}
                          itinerary={itinerary}
                          onUpdate={handleScheduleUpdated}
                          onMoveUp={() => handleMoveUp(itinerary.id, day.id)}
                          onMoveDown={() => handleMoveDown(itinerary.id, day.id)}
                          onDelete={handleScheduleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>まだスケジュールがありません</p>
                    <button
                      onClick={() => handleAddSchedule(day.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Venue / Point of Interest を追加
                    </button>
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
          </div>
        )}
      </main>

      {/* Add Schedule Modal */}
      {showAddScheduleModal && selectedDayId && (
        <AddScheduleModal
          isOpen={showAddScheduleModal}
          dayId={selectedDayId!}
          onClose={() => {
            setShowAddScheduleModal(false)
            setSelectedDayId(null)
          }}
          onScheduleAdded={handleScheduleAdded}
        />
      )}
    </div>
  )
}