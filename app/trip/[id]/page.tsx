'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import TripEditor from '@/components/TripEditor'
import DayEditor from '@/components/DayEditor'
import AddScheduleModal from '@/components/AddScheduleModal'
import ScheduleCard from '@/components/ScheduleCard'
import SortableItineraryCard from '@/components/SortableItineraryCard'
import VenueInsertButton from '@/components/VenueInsertButton'
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
import { getZIndexClass, getZIndex } from '@/lib/z-index-layers'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function TripPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | undefined>(undefined)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [mapFocusMode, setMapFocusMode] = useState<'all' | 'day' | 'single'>('all') // マップフォーカスモード
  const [poiData, setPoiData] = useState<{
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null>(null)

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

  // Itineraryクリック時のハンドラー
  const handleItineraryClick = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    
    // 個別フォーカスモードに切り替え
    setMapFocusMode('single')
    
    // POIダイアログを更新（place_idがある場合）
    if (trip?.days) {
      for (const day of trip.days) {
        const itinerary = day.itineraries?.find(it => it.id === itineraryId)
        if (itinerary) {
          // 該当するItineraryが含まれる日程を展開
          setCollapsedDays(prev => {
            const newSet = new Set(prev)
            newSet.delete(day.id)
            return newSet
          })
          
          // POIダイアログを更新
          if (itinerary.place_data?.place_id) {
            setPoiData({
              placeId: itinerary.place_data.place_id,
              name: itinerary.title,
              location: {
                lat: itinerary.place_data.geometry!.location.lat,
                lng: itinerary.place_data.geometry!.location.lng
              },
              placeData: itinerary.place_data // Itinerariesに保存されているplace_dataを渡す
            })
          }
          break
        }
      }
    }
  }

  // 地図マーカークリック時のハンドラー
  const handleMapMarkerClick = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    
    // 個別フォーカスモードに切り替え
    setMapFocusMode('single')
    
    // 該当するItineraryが含まれる日程を探して展開・スクロール
    if (trip?.days) {
      for (const day of trip.days) {
        if (day.itineraries?.some(itinerary => itinerary.id === itineraryId)) {
          // 日程を展開
          setCollapsedDays(prev => {
            const newSet = new Set(prev)
            newSet.delete(day.id)
            return newSet
          })
          
          // 該当するItineraryにスクロール
          setTimeout(() => {
            const element = document.getElementById(`itinerary-${itineraryId}`)
            if (element) {
              element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
              })
            }
          }, 100)
          break
        }
      }
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
    setInsertAfterIndex(undefined) // 最後に追加
    setShowAddScheduleModal(true)
  }

  const handleInsertSchedule = (dayId: string, afterIndex: number) => {
    setSelectedDayId(dayId)
    setInsertAfterIndex(afterIndex) // 指定位置に挿入
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
        
        // tripの情報を再取得してend_dateの更新を反映
        const tripResponse = await makeAuthenticatedRequest(`/api/trip/${trip.id}`)
        if (tripResponse.ok) {
          const updatedTripData = await tripResponse.json()
          setTrip(updatedTripData)
        } else {
          // 再取得に失敗した場合は、ローカルで日程のみ追加
          setTrip(prevTrip => {
            if (!prevTrip) return prevTrip
            return {
              ...prevTrip,
              days: [...(prevTrip.days || []), newDay]
            }
          })
        }
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
    // 日程をクリックした時に選択状態をリセット
    setSelectedItineraryId(null)
  }

  // 日程クリック時の地図フィルタリング機能
  const handleDayClick = (dayId: string) => {
    if (selectedDayId === dayId) {
      // 同じ日程をクリックした場合はフィルタを解除
      setSelectedDayId(null)
      setMapFocusMode('all') // 全体表示に戻す
    } else {
      // 新しい日程を選択
      setSelectedDayId(dayId)
      setMapFocusMode('day') // 日程表示モードに切り替え
    }
    // Itinerary選択状態もリセット
    setSelectedItineraryId(null)
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

  // 選択された日程のItineraryを取得する関数
  const getFilteredItineraries = (): Itinerary[] => {
    if (!trip?.days) return []
    
    if (selectedDayId) {
      // 選択された日程のItineraryのみを返す
      const selectedDay = trip.days.find(day => day.id === selectedDayId)
      return selectedDay?.itineraries || []
    }
    
    // フィルタが選択されていない場合は全てのItineraryを返す
    return trip.days.flatMap(day => day.itineraries || [])
  }

  const handleScheduleAdded = async (newItinerary: any) => {
    if (!trip) return

    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      
      return {
        ...prevTrip,
        days: prevTrip.days?.map(day => {
          if (day.id === newItinerary.day_id) {
            const currentItineraries = day.itineraries || []
            
            if (insertAfterIndex !== undefined && insertAfterIndex >= 0) {
              // 指定位置に挿入
              const newItineraries = [...currentItineraries]
              newItineraries.splice(insertAfterIndex + 1, 0, newItinerary)
              return {
                ...day,
                itineraries: newItineraries
              }
            } else {
              // 最後に追加
              return {
                ...day,
                itineraries: [...currentItineraries, newItinerary]
              }
            }
          }
          return day
        }) || []
      }
    })
    
    // 挿入位置をリセット
    setInsertAfterIndex(undefined)
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

  // Drag and Drop ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !trip) return
    
    const activeId = active.id as string
    const overId = over.id as string
    
    // 同じ要素の場合は何もしない
    if (activeId === overId) return
    
    // アクティブなitineraryを検索
    const activeItinerary = findItineraryById(activeId)
    if (!activeItinerary) return
    
    // オーバーしたitineraryを検索
    const overItinerary = findItineraryById(overId)
    if (!overItinerary) return
    
    // 同じ日程内での移動のみ許可
    if (activeItinerary.day_id !== overItinerary.day_id) return
    
    const dayId = activeItinerary.day_id
    const day = trip.days?.find(d => d.id === dayId)
    if (!day || !day.itineraries) return
    
    // 現在の順序を取得
    const sortedItineraries = [...day.itineraries].sort((a, b) => a.sort_number - b.sort_number)
    const activeIndex = sortedItineraries.findIndex(item => item.id === activeId)
    const overIndex = sortedItineraries.findIndex(item => item.id === overId)
    
    if (activeIndex === -1 || overIndex === -1) return
    
    // 新しい順序を作成
    const newItineraries = [...sortedItineraries]
    const [removed] = newItineraries.splice(activeIndex, 1)
    newItineraries.splice(overIndex, 0, removed)
    
    // sort_numberを更新
    const updates = newItineraries.map((item, index) => ({
      id: item.id,
      day_id: dayId,
      sort_number: index + 1
    }))
    
    try {
      const response = await makeAuthenticatedRequest('/api/itineraries/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dayId: dayId,
          itineraryIds: updates.map(update => update.id)
        })
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
      } else {
        console.error('Failed to reorder itineraries')
        alert('順序の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error reordering itineraries:', error)
      alert('順序の更新に失敗しました')
    }
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dayId: dayId,
          itineraryIds: updates.map(update => update.id)
        })
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dayId: dayId,
          itineraryIds: updates.map(update => update.id)
        })
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
      {/* Left Navigation Menu - 768px以上のみ表示 */}
      {trip && (
        <div className="hidden md:block flex-shrink-0">
          <NavigationMenu 
            trip={trip} 
            onNavigateToSection={navigateToSection}
            onDayClick={handleDayClick}
            isCollapsed={!leftNavExpanded}
            onToggleCollapse={() => setLeftNavExpanded(!leftNavExpanded)}
          />
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 md:hidden ${getZIndexClass('MAIN_CONTENT')}`}
          style={{ zIndex: getZIndex('MAIN_CONTENT') }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu - 188px固定幅 */}
      <nav className={`fixed top-0 left-0 h-full w-[188px] bg-white border-r border-gray-200 transform transition-transform duration-300 ${getZIndexClass('LEFT_PANEL')} md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ zIndex: getZIndex('LEFT_PANEL') }}>
        {/* NavigationMenuと同じ内容を表示 - 幅を制限 */}
        {trip && (
          <div className="w-full h-full overflow-hidden">
            <NavigationMenu 
              trip={trip} 
              onNavigateToSection={(sectionId) => {
                navigateToSection(sectionId)
                setMobileMenuOpen(false) // メニューを閉じる
              }}
              onDayClick={(dayId) => {
                handleDayClick(dayId)
                setMobileMenuOpen(false) // メニューを閉じる
              }}
              isCollapsed={false} // モバイルでは常に展開
              onToggleCollapse={() => setMobileMenuOpen(false)} // 折りたたみボタンでメニューを閉じる
            />
          </div>
        )}
      </nav>

      {/* Main Content Pane - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide main-content-scrollable main-content-shadow">
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
                {/* ハンバーガーボタン（768px以下）- 左端フロート */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`md:hidden fixed top-4 left-4 ${getZIndexClass('MAIN_CONTENT', 1)} inline-flex items-center px-3 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-30`}
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
          {/* Summary Header - 折りたたみ可能 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSummaryCollapsed(!summaryCollapsed)}
            >
              <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${summaryCollapsed ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Summary Content - 折りたたまれていない時のみ表示 */}
            {!summaryCollapsed && (
              <div className="px-4 pb-4 space-y-6">
                {/* At a glance - 総移動距離と天気予報 */}
                <div id="at-a-glance">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">At a glance</h3>
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

                {/* Budget / Reservation - 旅行費用とホテル情報 */}
                <div id="budget-reservation">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Budget / Reservation</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Cost Summary */}
                    <TripCostDisplay itineraries={getAllItineraries()} />
                    
                    {/* Hotel Summary */}
                    <TripHotelDisplay />
                  </div>
                </div>
              </div>
            )}
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
                    className={`flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50 transition-colors ${selectedDayId === day.id ? 'bg-red-50 border-red-200' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDayClick(day.id)
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          #{day.day_number} | {trip.start_date 
                            ? (() => {
                                const dayDate = new Date(trip.start_date)
                                dayDate.setDate(dayDate.getDate() + (day.day_number - 1))
                                const month = dayDate.getMonth() + 1
                                const dayNum = dayDate.getDate()
                                const dayNames = ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.']
                                const dayName = dayNames[dayDate.getDay()]
                                return `${month}/${dayNum} ${dayName}`
                              })()
                            : '日付が設定されていません'
                          }
                        </h3>
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
                          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext 
                              items={day.itineraries.map(i => i.id)} 
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-0">
                                {day.itineraries.map((itinerary, index) => {
                                  const previousItinerary = index > 0 ? day.itineraries?.[index - 1] : null
                                  const nextItinerary = index < (day.itineraries?.length || 0) - 1 ? day.itineraries?.[index + 1] : null
                                  
                                  return (
                                    <div key={itinerary.id} className="relative">
                                      <SortableItineraryCard
                                        itinerary={itinerary}
                                        previousPlace={previousItinerary?.place_data}
                                        nextPlace={nextItinerary?.place_data}
                                        onUpdate={handleScheduleUpdated}
                                        onMoveUp={() => handleMoveUp(itinerary.id, day.id)}
                                        onMoveDown={() => handleMoveDown(itinerary.id, day.id)}
                                        onMoveToDay={handleMoveToDay}
                                        onDuplicateToDay={handleDuplicateToDay}
                                        onDelete={handleScheduleDelete}
                                        onItineraryClick={handleItineraryClick}
                                        isSelected={selectedItineraryId === itinerary.id}
                                        isFirst={index === 0}
                                        isLast={index === (day.itineraries?.length || 0) - 1}
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
                                          showInsertButton={true}
                                          onInsertVenue={() => handleInsertSchedule(day.id, index)}
                                        />
                                      )}
                                      
                                      {/* Venue間の挿入ボタン（距離表示がない場合のみ） */}
                                      {index < (day.itineraries?.length || 0) - 1 && 
                                       (!itinerary.place_data || !nextItinerary?.place_data || 
                                        itinerary.place_data.place_id === nextItinerary.place_data.place_id) && (
                                        <VenueInsertButton
                                          onInsert={() => handleInsertSchedule(day.id, index)}
                                          dayId={day.id}
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                                
                                {/* 最後のVenueの後に挿入ボタンを表示 */}
                                {day.itineraries.length > 0 && (
                                  <div className="flex justify-center py-4">
                                    <div className="relative flex items-center justify-center">
                                      {/* Gitタイムライン風の縦線（上側のみ） */}
                                      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gray-300 top-0"></div>
                                      
                                      {/* 挿入ボタン */}
                                      <button
                                        onClick={() => handleInsertSchedule(day.id, (day.itineraries?.length || 0) - 1)}
                                        className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm"
                                        title="最後にVenueを追加"
                                      >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12S21.1 14 20 14H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V14H4C2.9 14 2 13.1 2 12S2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
                                          <path 
                                            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" 
                                            fill="white"
                                            opacity="0.8"
                                            transform="scale(0.3) translate(20, 20)"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </SortableContext>
                          </DndContext>
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

      {/* Right Pane - Map Only (768px以上のみ表示) */}
      <div className="hidden md:block md:w-[335px] lg:w-[400px] xl:flex-1 flex-shrink-0">
        <div className="h-full bg-gray-100">
          <TripMap 
            itineraries={getFilteredItineraries()} 
            selectedItineraryId={selectedItineraryId}
            selectedDayId={selectedDayId}
            onItineraryClick={handleMapMarkerClick}
            onPoiDataUpdate={setPoiData}
            className="h-full"
            focusMode={mapFocusMode}
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
            setInsertAfterIndex(undefined)
          }}
          onScheduleAdded={handleScheduleAdded}
          insertAfterIndex={insertAfterIndex}
        />
      )}
    </div>
  )
}