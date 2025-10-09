'use client'

import { useAuth } from '@/lib/auth-context'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import AddScheduleModal from '@/components/modals/AddScheduleModal'
import Loading from '@/components/common/Loading'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { Trip, Day, Itinerary } from '@/lib/firestore'
import { getTripBySlugs } from '@/lib/slug-data-helpers'
import { dateUtils } from '@/lib/date-utils'
import { DragEndEvent } from '@dnd-kit/core'
import TripPageLayout from '@/components/trip/TripPageLayout'
import TripHeroSection from '@/components/trip/TripHeroSection'
import TripSummaryView from '@/components/trip/TripSummaryView'
import TripItineraryView from '@/components/trip/TripItineraryView'
import TripChecklistView from '@/components/trip/TripChecklistView'
import TripRightPane from '@/components/trip/TripRightPane'

export default function SlugBasedTripPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { userSlug, tripSlug } = useParams<{ userSlug: string; tripSlug: string }>()
  const searchParams = useSearchParams()
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

  // クエリ: view / day を読み取り（デフォルトは summary）
  const currentView = (searchParams.get('view') as 'summary' | 'itinerary' | 'checklist') || 'summary'
  const queryDayParam = searchParams.get('day')

  // クエリ→状態の同期
  useEffect(() => {
    if (currentView === 'itinerary') {
      if (queryDayParam && trip?.days) {
        // まず日付形式（yyyy-mm-dd）として試行
        try {
          const queryDate = dateUtils.fromUrlDateString(queryDayParam)
          const matchingDay = trip.days.find(day => 
            dateUtils.isSameDay(day.date, queryDate)
          )
          if (matchingDay) {
            setSelectedDayId(matchingDay.id)
            setMapFocusMode('day')
            return
          }
        } catch (error) {
          // 日付形式でない場合は、IDベースの検索を試行（後方互換性）
          const matchingDay = trip.days.find(day => day.id === queryDayParam)
          if (matchingDay) {
            setSelectedDayId(matchingDay.id)
            setMapFocusMode('day')
            return
          }
        }
        
        // どちらでも見つからない場合
        setSelectedDayId(null)
        setMapFocusMode('all')
      } else {
        setSelectedDayId(null)
        setMapFocusMode('all')
      }
    }
    if (currentView === 'summary') {
      setSelectedDayId(null)
      setMapFocusMode('all')
    }
    if (currentView === 'checklist') {
      setSelectedItineraryId(null)
      setMapFocusMode('all')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, queryDayParam, trip])

  // クエリ更新ヘルパー
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // セクションへのナビゲーション機能
  const navigateToSection = (sectionId: string) => {
    // viewクエリを同期
    if (sectionId === 'checklist') {
      updateQuery({ view: 'checklist', day: null })
      return
    }
    // Summary内のアンカー
    updateQuery({ view: 'summary', day: null })
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

  // 旅行データを取得
  useEffect(() => {
    const fetchTrip = async () => {
      if (!userSlug || !tripSlug) {
        setTripLoading(false)
        return
      }

      try {
        setTripLoading(true)
        const tripData = await getTripBySlugs(userSlug, tripSlug)
        
        if (!tripData) {
          // 旅行が見つからない場合はnotFound()を呼び出し
          notFound()
          return
        }
        
        setTrip(tripData)
      } catch (error) {
        console.error('旅行データの取得に失敗しました:', error)
        notFound()
      } finally {
        setTripLoading(false)
      }
    }

    fetchTrip()
  }, [userSlug, tripSlug, router])

  // 旅行データ読み込み後の初期クエリパラメータ同期
  useEffect(() => {
    if (!trip || !queryDayParam) return
    
    // 日付パラメータが指定されている場合は該当する日を選択
    // まず日付形式（yyyy-mm-dd）として試行
    try {
      const queryDate = dateUtils.fromUrlDateString(queryDayParam)
      const day = trip.days?.find(d => dateUtils.isSameDay(d.date, queryDate))
      if (day) {
        setSelectedDayId(day.id)
        setMapFocusMode('day')
        return
      }
    } catch (error) {
      // 日付形式でない場合は、IDベースの検索を試行（後方互換性）
      const day = trip.days?.find(d => d.id === queryDayParam)
      if (day) {
        setSelectedDayId(day.id)
        setMapFocusMode('day')
      }
    }
  }, [trip, queryDayParam])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleAddSchedule = (dayId: string) => {
    setSelectedDayId(dayId)
    setInsertAfterIndex(undefined) // 最後に追加
    setShowAddScheduleModal(true)
  }

  const handleInsertSchedule = (dayId: string, afterIndex: number) => {
    console.log(`handleInsertSchedule called: dayId=${dayId}, afterIndex=${afterIndex}`)
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
      updateQuery({ view: 'itinerary', day: null })
    } else {
      // 新しい日程を選択
      setSelectedDayId(dayId)
      setMapFocusMode('day') // 日程表示モードに切り替え
      
      // 日付ベースのURLパラメータを生成
      if (trip?.days) {
        const day = trip.days.find(d => d.id === dayId)
        if (day) {
          const dateString = dateUtils.toUrlDateString(day.date)
          updateQuery({ view: 'itinerary', day: dateString })
        }
      }
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

    // サーバー側では新規挿入時に、挿入位置以降の sort_number を +1 しています。
    // フロント側でも即時に同じ見た目になるよう、既存配列の該当要素を +1 してから
    // 新規要素をマージし、sort_number 昇順で並べ替えます。
    setTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      
      return {
        ...prevTrip,
        days: prevTrip.days?.map(day => {
          if (day.id === newItinerary.day_id) {
            const currentItineraries = day.itineraries || []

            // 既存要素のうち、挿入位置(= 新規の sort_number)以上のものを +1
            const adjustedExisting = currentItineraries.map(item => {
              return item.sort_number >= newItinerary.sort_number
                ? { ...item, sort_number: item.sort_number + 1 }
                : item
            })

            // 新規要素を加えて昇順に整列
            const sortedItineraries = [...adjustedExisting, newItinerary]
              .sort((a, b) => a.sort_number - b.sort_number)
            
            return {
              ...day,
              itineraries: sortedItineraries
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
        // UIから削除し、sort_numberを再番号付け
        setTrip(prevTrip => {
          if (!prevTrip) return prevTrip
          return {
            ...prevTrip,
            days: prevTrip.days?.map(day => {
              const filteredItineraries = day.itineraries?.filter(itinerary => itinerary.id !== itineraryId) || []
              
              // sort_numberを再番号付け（1から連番）
              const renumberedItineraries = filteredItineraries
                .sort((a, b) => a.sort_number - b.sort_number)
                .map((itinerary, index) => ({
                  ...itinerary,
                  sort_number: index + 1
                }))
              
              return {
                ...day,
                itineraries: renumberedItineraries
              }
            }) || []
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
    return <Loading fullScreen size="lg" message="読み込み中..." />
  }

  if (!user || !trip) {
    return null
  }

  return (
    <TripPageLayout
      trip={trip}
      leftNavExpanded={leftNavExpanded}
      onToggleLeftNav={() => setLeftNavExpanded(!leftNavExpanded)}
      mobileMenuOpen={mobileMenuOpen}
      onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      onNavigateToSection={navigateToSection}
      onDayClick={handleDayClick}
      rightPane={
        <TripRightPane
          trip={trip}
          currentView={currentView}
          selectedItineraryId={selectedItineraryId}
          selectedDayId={selectedDayId}
          mapFocusMode={mapFocusMode}
          poiData={poiData}
          onItineraryClick={handleMapMarkerClick}
          onPoiDataUpdate={setPoiData}
          getFilteredItineraries={getFilteredItineraries}
        />
      }
    >
      {/* Hero Header with Background Image - show only in summary view */}
      {currentView === 'summary' && (
        <TripHeroSection
          trip={trip}
          onUpdateTrip={setTrip}
          onDeleteTrip={() => router.push('/')}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
      )}

      {/* Summary Section（view=summary のとき表示）*/}
      {currentView === 'summary' && (
        <TripSummaryView
          trip={trip}
          summaryCollapsed={summaryCollapsed}
          onToggleSummary={() => setSummaryCollapsed(!summaryCollapsed)}
          getAllItineraries={getAllItineraries}
        />
      )}

      {/* Itinerary List（view=itinerary のとき表示）*/}
      {currentView === 'itinerary' && (
        <TripItineraryView
          trip={trip}
          collapsedDays={collapsedDays}
          selectedDayId={selectedDayId}
          selectedItineraryId={selectedItineraryId}
          onToggleDayCollapse={toggleDayCollapse}
          onDayClick={handleDayClick}
          onAddSchedule={handleAddSchedule}
          onInsertSchedule={handleInsertSchedule}
          onAddDay={handleAddDay}
          onScheduleUpdated={handleScheduleUpdated}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onMoveToDay={handleMoveToDay}
          onDuplicateToDay={handleDuplicateToDay}
          onScheduleDelete={handleScheduleDelete}
          onItineraryClick={handleItineraryClick}
          onDragEnd={handleDragEnd}
          onUpdateTrip={setTrip}
          expandAllDays={expandAllDays}
          collapseAllDays={collapseAllDays}
        />
      )}

      {/* Checklist（モバイルではメインに表示）*/}
      {currentView === 'checklist' && (
        <TripChecklistView />
      )}

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
    </TripPageLayout>
  )
}
