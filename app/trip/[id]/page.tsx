'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import TripEditor from '@/components/TripEditor'
import DayEditor from '@/components/DayEditor'
import AddScheduleModal from '@/components/AddScheduleModal'
import ScheduleCard from '@/components/ScheduleCard'
import VenueDistance from '@/components/VenueDistance'
import TripCostDisplay from '@/components/TripCostDisplay'
import TripDistanceDisplay from '@/components/TripDistanceDisplay'
import TripWeatherDisplay from '@/components/TripWeatherDisplay'
import TripHotelDisplay from '@/components/TripHotelDisplay'
import TripMap from '@/components/TripMap'
import NavigationMenu from '@/components/NavigationMenu'
import { dateUtils } from '@/lib/date-utils'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { Trip, Day, Itinerary, User } from '@/lib/firestore'

export default function TripPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // セクションへのナビゲーション機能
  const navigateToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

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

  const handleAddDay = async () => {
    if (!trip) return
    
    try {
      const response = await makeAuthenticatedRequest(`/api/trip/${trip.id}/day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const newDay = await response.json()
        setTrip(prevTrip => {
          if (!prevTrip) return prevTrip
          return {
            ...prevTrip,
            days: [...(prevTrip.days || []), newDay]
          }
        })
      } else {
        console.error('Failed to add day')
        alert('日程の追加に失敗しました')
      }
    } catch (error) {
      console.error('Error adding day:', error)
      alert('日程の追加に失敗しました')
    }
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
  const generateItinerarySummary = (day: Day): string => {
    if (!day.itineraries || day.itineraries.length === 0) {
      return ''
    }
    
    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    return sortedItineraries.map(itinerary => itinerary.title).join(' → ')
  }

  // すべてのItinerariesを収集する関数
  const getAllItineraries = (): Itinerary[] => {
    if (!trip || !trip.days) return []
    
    const allItineraries: Itinerary[] = []
    trip.days.forEach(day => {
      if (day.itineraries) {
        allItineraries.push(...day.itineraries)
      }
    })
    return allItineraries
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

  // 日程複製の処理
  const handleDuplicateToDay = async (itineraryId: string, targetDayId: string) => {
    if (!trip) return

    // 元のitineraryを検索
    const sourceDay = trip.days?.find(d => d.itineraries?.some(item => item.id === itineraryId))
    const targetDay = trip.days?.find(d => d.id === targetDayId)
    
    if (!sourceDay || !targetDay) return

    const originalItinerary = sourceDay.itineraries?.find(item => item.id === itineraryId)
    if (!originalItinerary) return

    // UIを更新（複製されたitineraryを移動先に追加）
    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      return {
        ...prevTrip,
        days: prevTrip.days?.map(d => {
          if (d.id === targetDayId) {
            // 移動先に追加（最後のsort_number + 1）
            const maxSortNumber = d.itineraries?.reduce((max, item) => 
              Math.max(max, item.sort_number), 0) || 0
            return {
              ...d,
              itineraries: [
                ...(d.itineraries || []),
                {
                  id: `temp-${Date.now()}`, // 一時的なID（APIレスポンスで更新される）
                  day_id: targetDayId,
                  sort_number: maxSortNumber + 1,
                  title: `${originalItinerary.title} (複製)`,
                  description: originalItinerary.description || '',
                  location: originalItinerary.location || '',
                  place_data: originalItinerary.place_data || null,
                  start_time: originalItinerary.start_time || '',
                  end_time: originalItinerary.end_time || '',
                  cost_amount: originalItinerary.cost_amount || null,
                  cost_currency: originalItinerary.cost_currency || 'JPY',
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ]
            }
          }
          return d
        }) || []
      }
    })
  }

  // 日程移動の処理
  const handleMoveToDay = async (itineraryId: string, targetDayId: string) => {
    if (!trip) return

    // 移動元の日程からitineraryを削除
    const sourceDay = trip.days?.find(d => d.itineraries?.some(item => item.id === itineraryId))
    const targetDay = trip.days?.find(d => d.id === targetDayId)
    
    if (!sourceDay || !targetDay) return

    const itineraryToMove = sourceDay.itineraries?.find(item => item.id === itineraryId)
    if (!itineraryToMove) return

    // UIを更新
    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      return {
        ...prevTrip,
        days: prevTrip.days?.map(d => {
          if (d.id === sourceDay.id) {
            // 移動元から削除
            return {
              ...d,
              itineraries: d.itineraries?.filter(item => item.id !== itineraryId) || []
            }
          } else if (d.id === targetDayId) {
            // 移動先に追加（最後のsort_number + 1）
            const maxSortNumber = d.itineraries?.reduce((max, item) => 
              Math.max(max, item.sort_number), 0) || 0
            return {
              ...d,
              itineraries: [
                ...(d.itineraries || []),
                {
                  ...itineraryToMove,
                  day_id: targetDayId,
                  sort_number: maxSortNumber + 1
                }
              ]
            }
          }
          return d
        }) || []
      }
    })
  }

  // 特定のitineraryをIDで検索
  const findItineraryById = (id: string): Itinerary | null => {
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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Navigation Menu */}
      {trip && (
        <NavigationMenu 
          trip={trip} 
          onNavigateToSection={navigateToSection}
          isCollapsed={!leftNavExpanded}
          onToggleCollapse={() => setLeftNavExpanded(!leftNavExpanded)}
        />
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <nav className={`fixed top-0 left-0 h-full w-48 bg-white border-r border-gray-200 transform transition-transform duration-300 z-50 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Close Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Menu Items */}
          <ul className="flex-1 p-4 space-y-2">
            <li className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-lg">🏠</span>
              <span className="ml-3 text-sm font-medium text-gray-700">Summary</span>
            </li>
            <li className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-lg">🧳</span>
              <span className="ml-3 text-sm font-medium text-gray-700">Itinerary</span>
            </li>
            <li className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <span className="text-lg">✅</span>
              <span className="ml-3 text-sm font-medium text-gray-700">Checklist</span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content Pane - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide main-content-scrollable left-pane-shadow">
        {/* Hero Header with Background Image */}
        <header className="relative h-[200px] md:h-[240px] overflow-hidden">
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
              <div className="flex items-center gap-4">
                {/* ハンバーガーボタン（768px以下） */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  戻る
                </Link>
              </div>
              <TripEditor 
                trip={trip as any} 
                onUpdate={(updatedTrip: any) => setTrip(updatedTrip)} 
                onDelete={() => router.push('/')}
              />
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
                  
                  {/* Privacy Status */}
                  <div className="flex items-center text-white text-sm opacity-80 drop-shadow-md mb-2">
                    <svg 
                      className="w-4 h-4 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      {trip.access_level === 'private' ? (
                        // Locked icon for private
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      ) : (
                        // Unlocked icon for public
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      )}
                    </svg>
                    <span>
                      {trip.access_level === 'private' ? '非公開' : '公開'}
                    </span>
                  </div>
                  
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

        {/* Summary Section */}
        <div className="px-4 py-4 space-y-6">
          {/* Summary - 総移動距離と天気予報 */}
          <div id="at-a-glance">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Distance Summary - 6/10 (60%) */}
              <div className="lg:col-span-6">
                <TripDistanceDisplay itineraries={getAllItineraries()} />
              </div>
              
              {/* Weather Summary - 4/10 (40%) */}
              <div className="lg:col-span-4">
                <TripWeatherDisplay 
                  destination={trip.destination}
                  startDate={trip.start_date ? (trip.start_date instanceof Date ? trip.start_date.toISOString().split('T')[0] : trip.start_date) : undefined}
                  endDate={trip.end_date ? (trip.end_date instanceof Date ? trip.end_date.toISOString().split('T')[0] : trip.end_date) : undefined}
                />
              </div>
            </div>
          </div>

          {/* Budget - 旅行費用とホテル情報 */}
          <div id="budget-reservation">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cost Summary */}
              <TripCostDisplay itineraries={getAllItineraries()} />
              
              {/* Hotel Summary */}
              <TripHotelDisplay />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 pb-4">
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
                  id={`day-${day.id}`}
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
                          <div className="space-y-0">
                            {day.itineraries.map((itinerary, index) => {
                              const previousItinerary = index > 0 ? day.itineraries?.[index - 1] : null
                              const nextItinerary = index < (day.itineraries?.length || 0) - 1 ? day.itineraries?.[index + 1] : null
                              
                              return (
                                <div key={itinerary.id} className="relative">
                                  <ScheduleCard
                                    itinerary={itinerary}
                                    previousPlace={previousItinerary?.place_data}
                                    nextPlace={nextItinerary?.place_data}
                                    onUpdate={handleScheduleUpdated}
                                    onMoveUp={() => handleMoveUp(itinerary.id, day.id)}
                                    onMoveDown={() => handleMoveDown(itinerary.id, day.id)}
                                    onMoveToDay={handleMoveToDay}
                                    onDuplicateToDay={handleDuplicateToDay}
                                    onDelete={handleScheduleDelete}
                                    availableDays={trip.days?.map(d => ({
                                      id: d.id,
                                      day_number: d.day_number,
                                      date: '' // Day型にdateプロパティがないため空文字列を設定
                                    })) || []}
                                  />
                                  
                                  {/* 次のVenueへの距離表示（最後のカード以外、かつ両方にplace_dataがある場合のみ） */}
                                  {itinerary.place_data && 
                                   nextItinerary?.place_data && 
                                   itinerary.place_data.place_id !== nextItinerary.place_data.place_id && (
                                    <VenueDistance 
                                      fromPlace={itinerary.place_data}
                                      toPlace={nextItinerary.place_data}
                                      mode="driving"
                                    />
                                  )}
                                </div>
                              )
                            })}
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
            
            {/* 日程追加ボタン */}
            <div className="mt-6 text-center">
              <button
                onClick={handleAddDay}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                日程を追加
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">まだ日程がありません</h3>
            <p className="text-gray-600 mb-6">旅行の日程を追加して、詳細な計画を立てましょう！</p>
            <button
              onClick={handleAddDay}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              日程を追加
            </button>
          </div>
        )}
        </main>
      </div>

      {/* Right Pane - Map Only (layout.cssのブレークポイントに準拠) */}
      <div className="hidden md:block md:w-[335px] lg:w-[400px] xl:flex-1 flex-shrink-0">
        <div className="h-full bg-gray-100">
          <TripMap 
            itineraries={getAllItineraries()} 
            className="h-full"
          />
        </div>
      </div>


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