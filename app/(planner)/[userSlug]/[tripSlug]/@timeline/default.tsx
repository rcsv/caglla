 'use client'

import TripItineraryView from '@/components/trip/TripItineraryView'
import TripSummaryView from '@/components/trip/TripSummaryView'
import TripChecklistView from '@/components/trip/TripChecklistView'
import TripHeroSection from '@/components/trip/TripHeroSection'
import AddScheduleModal from '@/components/modals/AddScheduleModal'
import ExportDataModal from '@/components/modals/ExportDataModal'
import TemplateReplicaModal from '@/components/modals/TemplateReplicaModal'
import TripEditor from '@/components/trip/TripEditor'
import { useCallback, useRef, useState, useMemo } from 'react'
import Loading from '@/components/common/Loading'
import { useAuth } from '@/lib/contexts/auth'
import { useUserData } from '@/lib/contexts/user-data'
import { useSubscription } from '@/lib/contexts/subscription'
import { canEditTrip } from '@/lib/core/permissions'
import { useTrip } from '../TripProvider'
import { useTripUrlState } from '../useTripUrlState'
import { dispatchPOIOpen } from '../poi-events'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { exportTripToPdf, canExportToPdf } from '@/lib/utils/export-helpers'
import { t } from '@/lib/i18n'
import logger from '@/lib/core/logger'
import { useRouter } from 'next/navigation'
import { DragEndEvent } from '@dnd-kit/core'
import type { Itinerary } from '@/lib/core/types'
import type { PlaceData } from '@/lib/core/types'

/**
 * Timeline Default Slot
 * 
 * Phase 3: page.tsxのロジック移行（v3.0.0）
 * 
 * TripProviderからTripデータを取得し、useTripUrlStateでURL状態を管理します。
 * 3つのビュー（Summary, Itinerary, Checklist）を条件付きレンダリングで切り替えます。
 * モーダル管理と編集機能を実装します。
 */
export default function TimelineDefault() {
  const { trip, loading, error, updateTrip, refreshTrip } = useTrip()
  const { user } = useAuth()
  const { removeTrip, userData } = useUserData()
  const { subscriptionStatus } = useSubscription()
  const router = useRouter()
  const userPlan = subscriptionStatus.plan?.id || 'season_traveler'
  
  const {
    currentView,
    selectedDayId,
    selectedItineraryId,
    setSelectedDayId,
    setSelectedItineraryId,
    updateQuery,
  } = useTripUrlState()

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [loadingDayIds, setLoadingDayIds] = useState<Set<string>>(new Set())
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const isProgrammaticScrollRef = useRef(false)
  const scrollToItineraryRef = useRef<((itineraryId: string) => void) | null>(null)

  // モーダル管理
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showEditBaseInfoModal, setShowEditBaseInfoModal] = useState(false)
  const [showReplicaModal, setShowReplicaModal] = useState(false)
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | undefined>(undefined)
  const [replicaLoading, setReplicaLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [pdfExporting, setPdfExporting] = useState(false)

  const onToggleDayCollapse = (dayId: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      if (next.has(dayId)) next.delete(dayId)
      else next.add(dayId)
      return next
    })
  }
  
  const onDayClick = (dayId: string) => {
    if (selectedDayId === dayId) {
      setSelectedDayId(null)
      updateQuery({ sd: null, mf: 'all' })
    } else {
      setSelectedDayId(dayId)
      setSelectedItineraryId(null)
      updateQuery({ sd: dayId, si: null, mf: 'day' })
    }
  }
  
  const onItineraryClickSync = (id: string) => {
    setSelectedItineraryId(id)
    updateQuery({ si: id, mf: 'single' })
    
    // POIデータを取得してCustomEventで@mapに通知
    if (trip?.days) {
      for (const day of trip.days) {
        const itinerary = day.itineraries?.find(it => it.id === id)
        if (itinerary) {
          const placeData = itinerary.place_data as PlaceData | undefined
          if (placeData?.place_id) {
            dispatchPOIOpen({
              placeId: placeData.place_id,
              name: itinerary.title,
              location: {
                lat: placeData.geometry?.location?.lat || 0,
                lng: placeData.geometry?.location?.lng || 0,
              },
              placeData: placeData,
            })
          } else if (itinerary.place_id) {
            // place_idのみがある場合（place_dataがまだキャッシュされていない）
            dispatchPOIOpen({
              placeId: itinerary.place_id,
              name: itinerary.title,
              location: { lat: 0, lng: 0 },
              placeData: undefined,
            })
          }
          break
        }
      }
    }
  }

  // すべてのItinerariesを収集する関数
  const getAllItineraries = useCallback((): Itinerary[] => {
    if (!trip || !trip.days) return []
    
    const allItineraries: Itinerary[] = []
    trip.days.forEach(day => {
      if (day.itineraries) {
        allItineraries.push(...day.itineraries)
      }
    })
    return allItineraries
  }, [trip])

  // モーダルハンドラー
  const handleOpenReplicaModal = () => {
    if (!trip || !user) return
    setShowReplicaModal(true)
  }

  const handleReplicaConfirm = async (startDate: string) => {
    if (!trip || !user) return

    try {
      setReplicaLoading(true)
      const response = await makeAuthenticatedRequest(`/api/trip/${trip.slug || trip.id}/replica`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || t('trip.template.replicateFailed'))
        return
      }

      const data = await response.json()
      const newTrip = data.trip
      if (!newTrip) {
        alert(t('trip.template.replicateFailed'))
        return
      }

      const targetSlug = newTrip.slug || newTrip.id
      const targetUserSlug = userData?.slug || user.uid

      if (!targetSlug || !targetUserSlug) {
        alert(t('trip.template.replicateFailed'))
        return
      }

      setShowReplicaModal(false)
      router.push(`/${targetUserSlug}/${targetSlug}`)
    } catch (error) {
      logger.error('Replica creation failed:', error)
      alert(t('trip.template.replicateFailed'))
    } finally {
      setReplicaLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!trip || !user) return

    const previousSlug = trip.slug

    try {
      setPublishLoading(true)
      const slugOrId = trip.slug || trip.id

      const response = await makeAuthenticatedRequest(`/api/trip/${slugOrId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || t('trip.publish.failed'))
        return
      }

      const data = await response.json()
      const publishedTrip = data.trip

      if (!publishedTrip?.id) {
        alert(t('trip.publish.failed'))
        return
      }

      const refreshedResponse = await makeAuthenticatedRequest(`/api/trip/${publishedTrip.id}`)
      if (!refreshedResponse.ok) {
        alert(t('trip.publish.failed'))
        return
      }

      const refreshedTrip = await refreshedResponse.json()
      updateTrip(refreshedTrip)
      await refreshTrip()
      alert(t('trip.publish.success'))

      const newSlug = refreshedTrip.slug || publishedTrip.slug || previousSlug
      const creatorSlug = refreshedTrip.creator?.slug || userData?.slug || user.uid
      if (newSlug && creatorSlug && newSlug !== previousSlug) {
        router.replace(`/${creatorSlug}/${newSlug}`)
      }
    } catch (error) {
      logger.error('Trip publish failed:', error)
      alert(t('trip.publish.failed'))
    } finally {
      setPublishLoading(false)
    }
  }

  const handlePdfExport = async () => {
    if (!trip || !user) return

    if (!canExportToPdf(userPlan)) {
      alert(t('tripSlugPage.pdfRequiresBackpacker'))
      return
    }

    try {
      setPdfExporting(true)
      const token = await user.getIdToken()
      logger.debug('PDF Export: token obtained', { tokenLength: token.length })

      await exportTripToPdf(trip.slug || trip.id, token, (message) => {
        logger.debug('PDF Export:', message)
      })

      logger.info('PDF export completed successfully')
    } catch (error: any) {
      logger.error('PDF export failed:', error)
      alert(error.message || t('tripSlugPage.pdfExportFailed'))
    } finally {
      setPdfExporting(false)
    }
  }

  // 編集機能ハンドラー
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
      setLoadingDayIds(prev => new Set(prev).add('new-day'))
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
          updateTrip(updatedTripData)
          await refreshTrip()
        } else {
          // 再取得に失敗した場合は、ローカルで日程のみ追加
          updateTrip(prevTrip => ({
            ...prevTrip,
            days: [...(prevTrip.days || []), newDay]
          }))
        }
      } else {
        logger.error('Failed to add day')
        alert(t('tripSlugPage.addDayFailed'))
      }
    } catch (error) {
      logger.error('Error adding day:', error)
      alert(t('tripSlugPage.addDayFailed'))
    } finally {
      setLoadingDayIds(prev => {
        const next = new Set(prev)
        next.delete('new-day')
        return next
      })
    }
  }

  const handleScheduleAdded = async (newItinerary: any) => {
    if (!trip) return

    // サーバー側では挿入位置に応じて後続の sort_number を +1 済みだが、
    // ローカル状態は古いままなので、同様の再番号付けを適用してから追加する
    updateTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      
      return {
        ...prevTrip,
        days: prevTrip.days?.map(day => {
          if (day.id === newItinerary.day_id) {
            const currentItineraries = day.itineraries || []

            // 後続（newItinerary.sort_number 以上）の既存要素を +1 して重複を解消
            const updatedExisting = currentItineraries.map(item => {
              if (item.id === newItinerary.id) return item
              if ((item.sort_number || 0) >= (newItinerary.sort_number || 0)) {
                return { ...item, sort_number: (item.sort_number || 0) + 1 }
              }
              return item
            })

            // 新規を統合して sort_number 順に整列
            const sortedItineraries = [...updatedExisting, newItinerary]
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
    
    // 新規作成されたItineraryを選択し、地図にフォーカス
    setSelectedItineraryId(newItinerary.id)
    updateQuery({ si: newItinerary.id, mf: 'single' })

    // POIDialogを表示（place_dataがある場合）
    if (newItinerary.place_data?.place_id) {
      dispatchPOIOpen({
        placeId: newItinerary.place_data.place_id,
        name: newItinerary.title,
        location: {
          lat: newItinerary.place_data.geometry!.location.lat,
          lng: newItinerary.place_data.geometry!.location.lng
        },
        placeData: newItinerary.place_data
      })
    } else if (newItinerary.place_id) {
      // place_idのみがある場合（place_dataは後で取得される）
      dispatchPOIOpen({
        placeId: newItinerary.place_id,
        name: newItinerary.title,
        location: { lat: 0, lng: 0 },
        placeData: undefined
      })
    }
  }

  const handleScheduleUpdated = async (updatedItinerary: any) => {
    if (!trip) return

    updateTrip(prevTrip => {
      if (!prevTrip) return prevTrip
      
      return {
        ...prevTrip,
        days: prevTrip.days?.map(day => {
          if (day.id === updatedItinerary.day_id) {
            return {
              ...day,
              itineraries: day.itineraries?.map(itinerary => {
                if (itinerary.id === updatedItinerary.id) {
                  // 既存のplace_dataを保持しつつ、更新されたフィールドをマージ
                  return {
                    ...itinerary,
                    ...updatedItinerary,
                    // place_dataは既存のものを保持（APIレスポンスに含まれていない場合）
                    place_data: updatedItinerary.place_data || itinerary.place_data
                  }
                }
                return itinerary
              }) || []
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
        updateTrip(prevTrip => {
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
        await refreshTrip()
      } else {
        logger.error('Failed to delete itinerary')
        alert(t('common.deleteFailed'))
      }
    } catch (error) {
      logger.error('Error deleting itinerary:', error)
      alert(t('common.deleteFailed'))
    }
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
        updateTrip(prevTrip => {
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
        await refreshTrip()
      }
    } catch (error) {
      logger.error('Error moving up:', error)
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
        updateTrip(prevTrip => {
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
        await refreshTrip()
      }
    } catch (error) {
      logger.error('Error moving down:', error)
    }
  }

  const handleMoveToDay = async (itineraryId: string, targetDayId: string) => {
    if (!trip) return

    // 移動元の日程からitineraryを削除
    const sourceDay = trip.days?.find(d => d.itineraries?.some(item => item.id === itineraryId))
    const targetDay = trip.days?.find(d => d.id === targetDayId)
    
    if (!sourceDay || !targetDay) return

    const itineraryToMove = sourceDay.itineraries?.find(item => item.id === itineraryId)
    if (!itineraryToMove) return

    // UIを更新
    updateTrip(prevTrip => {
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
    await refreshTrip()
  }

  const handleDuplicateToDay = async (itineraryId: string, targetDayId: string) => {
    if (!trip) return

    // 元のitineraryを検索
    const sourceDay = trip.days?.find(d => d.itineraries?.some(item => item.id === itineraryId))
    const targetDay = trip.days?.find(d => d.id === targetDayId)
    
    if (!sourceDay || !targetDay) return

    const originalItinerary = sourceDay.itineraries?.find(item => item.id === itineraryId)
    if (!originalItinerary) return

    // UIを更新（複製されたitineraryを移動先に追加）
    updateTrip(prevTrip => {
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
    await refreshTrip()
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
        updateTrip(prevTrip => {
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
        await refreshTrip()
      } else {
        logger.error('Failed to reorder itineraries')
        alert(t('tripSlugPage.orderUpdateFailed'))
      }
    } catch (error) {
      logger.error('Error reordering itineraries:', error)
      alert('順序の更新に失敗しました')
    }
  }

  // ルート最適化による並び替え処理
  const handleReorderItineraries = async (dayId: string, reorderedItineraries: Itinerary[]) => {
    if (!trip) return

    try {
      // sort_numberを更新
      const updates = reorderedItineraries.map((item, index) => ({
        id: item.id,
        day_id: dayId,
        sort_number: index + 1
      }))

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
        updateTrip(prevTrip => {
          if (!prevTrip) return prevTrip
          return {
            ...prevTrip,
            days: prevTrip.days?.map(d => {
              if (d.id === dayId) {
                return {
                  ...d,
                  itineraries: reorderedItineraries.map((item, index) => ({
                    ...item,
                    sort_number: index + 1
                  }))
                }
              }
              return d
            }) || []
          }
        })
        await refreshTrip()
    } else {
        logger.error('Failed to reorder itineraries')
        alert(t('tripSlugPage.orderUpdateFailed'))
      }
    } catch (error) {
      logger.error('Error reordering itineraries:', error)
      alert('順序の更新に失敗しました')
    }
  }

  const expandAllDays = () => {
    setCollapsedDays(new Set())
  }

  const collapseAllDays = () => {
    if (!trip?.days) return
    setCollapsedDays(new Set(trip.days.map(d => d.id)))
  }

  // tripがnullの場合、ローディングまたはエラー表示
  if (!trip) {
    if (loading) {
      return <Loading className="py-6" />
    }
    if (error === 'not-found') {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>Trip not found</p>
        </div>
      )
    }
    if (error === 'forbidden') {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>Access forbidden</p>
        </div>
      )
    }
    return <Loading className="py-6" />
  }

  // 所有者判定：userData.idとtrip.user_idを比較（userDataが存在する場合）
  // または、canEditTripを使用（userDataが存在しない場合のフォールバック）
  const isOwner = Boolean(
    userData?.id && trip?.user_id && userData.id === trip.user_id
  ) || Boolean(user && canEditTrip(user, trip))
  const canEdit = Boolean(
    userData?.id && trip?.user_id && userData.id === trip.user_id
  ) || Boolean(user && canEditTrip(user, trip))
  const isTemplateTrip = trip?.is_template
  const canPublishTrip = canEdit && !isTemplateTrip && trip?.access_level !== 'public'
  
  if (trip.access_level !== 'public' && !isOwner) {
    return (
      <div className="p-4 text-gray-500">
        This trip is private. Timeline is not available.
      </div>
    )
  }

  const templateDayCount = useMemo(() => {
    if (!trip?.days) return 0
    return trip.days.length
  }, [trip?.days])

  return (
    <>
    <div className="p-0">
        {/* Summary View */}
        {currentView === 'summary' && (
          <>
            <TripHeroSection
              trip={trip}
              canEdit={canEdit}
              canReplica={isTemplateTrip && trip.access_level === 'public' && Boolean(user)}
              onReplica={isTemplateTrip ? handleOpenReplicaModal : undefined}
              replicaLoading={replicaLoading}
              canPublish={canPublishTrip}
              onPublish={canPublishTrip ? handlePublish : undefined}
              publishLoading={publishLoading}
              onUpdateTrip={() => setShowEditBaseInfoModal(true)}
              onDeleteTrip={() => {
                removeTrip(trip.id)
                router.push('/home')
              }}
            />
            <TripSummaryView
              trip={trip}
              summaryCollapsed={summaryCollapsed}
              onToggleSummary={() => setSummaryCollapsed(!summaryCollapsed)}
              getAllItineraries={getAllItineraries}
            />
          </>
        )}

        {/* Itinerary View */}
        {currentView === 'itinerary' && (
      <TripItineraryView
        trip={trip}
            canEdit={canEdit}
        collapsedDays={collapsedDays}
        selectedDayId={selectedDayId}
        selectedItineraryId={selectedItineraryId}
        loadingDayIds={loadingDayIds}
        onToggleDayCollapse={onToggleDayCollapse}
        onDayClick={onDayClick}
            onAddSchedule={handleAddSchedule}
            onInsertSchedule={handleInsertSchedule}
            onAddDay={handleAddDay}
            onScheduleUpdated={handleScheduleUpdated}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onMoveToDay={handleMoveToDay}
            onDuplicateToDay={handleDuplicateToDay}
            onScheduleDelete={handleScheduleDelete}
        onItineraryClick={onItineraryClickSync}
            onDragEnd={handleDragEnd}
            onUpdateTrip={() => setShowEditBaseInfoModal(true)}
            onReorderItineraries={handleReorderItineraries}
            expandAllDays={expandAllDays}
            collapseAllDays={collapseAllDays}
        scrollSyncEnabled={false}
        onScrollSyncEnabledChange={() => {}}
        isProgrammaticScrollRef={isProgrammaticScrollRef}
        scrollToItineraryRef={scrollToItineraryRef}
      />
        )}

        {/* Checklist View */}
        {currentView === 'checklist' && (
          <TripChecklistView tripId={trip.id} readOnly={!canEdit} />
        )}
    </div>

      {/* Modals */}
      <TemplateReplicaModal
        isOpen={showReplicaModal}
        onClose={() => {
          if (replicaLoading) return
          setShowReplicaModal(false)
        }}
        onConfirm={handleReplicaConfirm}
        dayCount={templateDayCount}
        loading={replicaLoading}
        templateTitle={trip.title}
      />

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

      {showExportModal && (
        <ExportDataModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          trip={trip}
        />
      )}

      {showEditBaseInfoModal && trip && (
        <TripEditor
          trip={trip}
          onUpdate={async (updatedTrip) => {
            updateTrip(updatedTrip)
            await refreshTrip()
            setShowEditBaseInfoModal(false)
          }}
          onDelete={() => {
            removeTrip(trip.id)
            router.push('/home')
          }}
          onClose={() => setShowEditBaseInfoModal(false)}
          hideDestinationEdit={true}
          initialEditing={true}
          hideEditButton={true}
          disableDateFields={Boolean(trip.is_template)}
          disablePublishControls={Boolean(trip.is_template)}
        />
      )}
    </>
  )
}
