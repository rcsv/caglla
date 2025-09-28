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

type TripPageCreator = {
  id: string
  name: string
  email: string
  avatar_url?: string
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
  creator?: TripPageCreator
}

export default function TripPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<TripPageTrip | null>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await makeAuthenticatedRequest(`/api/trip/${params.id}`)
        if (response.ok) {
          const tripData = await response.json()
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

  const toggleDayCollapse = (dayId: string) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dayId)) {
        newSet.delete(dayId)
      } else {
        newSet.add(dayId)
      }
      return newSet
    })
  }

  const collapseAllDays = () => {
    if (!trip?.days) return
    const allDayIds = new Set(trip.days.map(day => day.id))
    setCollapsedDays(allDayIds)
  }

  const expandAllDays = () => {
    setCollapsedDays(new Set())
  }

  // itinerariesのタイトルを生成する関数
  const generateItinerarySummary = (day: TripPageDay): string => {
    if (!day.itineraries || day.itineraries.length === 0) {
      return ''
    }
    
    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    return sortedItineraries.map(itinerary => itinerary.title).join(' → ')
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
      {/* Hero Header with Background Image */}
      <header className="relative h-[300px] md:h-[360px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: trip.image_url 
              ? `url(${trip.image_url})` 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {/* Dark Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        {/* Content Overlay */}
        <div className="relative h-full flex flex-col">
          {/* Top Navigation */}
          <div className="flex justify-between items-start p-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </Link>
            <TripEditor trip={trip as any} onUpdate={(updatedTrip: any) => setTrip(updatedTrip)} />
          </div>
          
          {/* Main Content - Positioned higher */}
          <div className="flex-1 flex items-start pt-8">
            <div className="w-full px-6">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                  {trip.title}
                </h1>
                
                {/* Date and Location */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                  <div className="flex items-center text-white">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-lg font-medium">
                      {trip.start_date && trip.end_date 
                        ? dateUtils.formatTripDateRange(trip.start_date, trip.end_date)
                        : '日付が設定されていません'
                      }
                    </span>
                  </div>
                  
                  {trip.destination && (
                    <div className="flex items-center text-white">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg font-medium">{trip.destination}</span>
                    </div>
                  )}
                </div>
                
                {/* Description */}
                {trip.description && (
                  <p className="text-white text-lg md:text-xl leading-relaxed drop-shadow-md max-w-2xl mb-2">
                    {trip.description}
                  </p>
                )}
                
                {/* Creator Info */}
                {trip.creator && (
                  <p className="text-white text-sm opacity-80 drop-shadow-md">
                    by {trip.creator.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Days */}
        {trip.days && trip.days.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">日程</h2>
              <div className="flex gap-2">
                <button
                  onClick={expandAllDays}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  全て展開
                </button>
                <button
                  onClick={collapseAllDays}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  全て折りたたみ
                </button>
              </div>
            </div>
            {trip.days.map((day) => {
              const isCollapsed = collapsedDays.has(day.id)
              const itinerarySummary = generateItinerarySummary(day)
              
              return (
                <div
                  key={day.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  {/* ヘッダー部分 - 常に表示 */}
                  <div 
                    className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleDayCollapse(day.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          第{day.day_number}日目
                        </h3>
                        <span className="text-gray-500">
                          {trip.start_date 
                            ? (() => {
                                const dayDate = new Date(trip.start_date)
                                dayDate.setDate(dayDate.getDate() + (day.day_number - 1))
                                return dateUtils.formatDate(dayDate)
                              })()
                            : '日付が設定されていません'
                          }
                        </span>
                        {/* 折りたたみアイコン */}
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      {/* 縮小表示時の情報 */}
                      {isCollapsed && (
                        <div className="text-sm text-gray-600">
                          {day.description && (
                            <p className="mb-1">{day.description}</p>
                          )}
                          {itinerarySummary && (
                            <p className="text-gray-500">{itinerarySummary}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 詳細部分 - 折りたたまれていない時のみ表示 */}
                  {!isCollapsed && (
                    <div className="px-6 pb-6">
                      <DayEditor 
                        day={day as any} 
                        itinerarySummary={itinerarySummary}
                        onUpdate={(updatedDay: any) => {
                          setTrip(prevTrip => {
                            if (!prevTrip) return prevTrip
                            return {
                              ...prevTrip,
                              days: prevTrip.days?.map(d => 
                                d.id === updatedDay.id ? updatedDay as any : d
                              ) || []
                            }
                          })
                        }} 
                      />

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
                  )}
                </div>
              )
            })}
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