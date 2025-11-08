'use client'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'

import { useAuth } from '@/lib/contexts/auth'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import AddScheduleModal from '@/components/modals/AddScheduleModal'
import ExportDataModal from '@/components/modals/ExportDataModal'
import ICalPublishModal from '@/components/modals/ICalPublishModal'
import Loading from '@/components/common/Loading'
import { Icon } from '@iconify/react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { Trip, Day, Itinerary } from '@/lib/core/types'
import { getTripBySlugs } from '@/lib/travel/slug-helpers'
import { dateUtils } from '@/lib/utils/date'
import { DragEndEvent } from '@dnd-kit/core'
import TripPageLayout from '@/components/trip/TripPageLayout'
import TripHeroSection from '@/components/trip/TripHeroSection'
import TripSummaryView from '@/components/trip/TripSummaryView'
import TripItineraryView from '@/components/trip/TripItineraryView'
import TripChecklistView from '@/components/trip/TripChecklistView'
import TripRightPane from '@/components/trip/TripRightPane'
import TripEditor from '@/components/trip/TripEditor'
import { getCachedPlaces } from '@/lib/travel/places-cache'
import { useUserData } from '@/lib/contexts/user-data'
import { useSubscription } from '@/lib/contexts/subscription'
import { exportTripToPdf, canExportToPdf } from '@/lib/utils/export-helpers'

export default function SlugBasedTripPage() {
  const { user, loading, logout } = useAuth()
  const { removeTrip, userData } = useUserData()
  const { subscriptionStatus } = useSubscription()
  const userPlan = subscriptionStatus.plan?.id || 'season_traveler'
  const router = useRouter()
  const { userSlug, tripSlug } = useParams<{ userSlug: string; tripSlug: string }>()
  const searchParams = useSearchParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showICalPublishModal, setShowICalPublishModal] = useState(false)
  const [showEditBaseInfoModal, setShowEditBaseInfoModal] = useState(false)
  const [pdfExporting, setPdfExporting] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [insertAfterIndex, setInsertAfterIndex] = useState<number | undefined>(undefined)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [leftNavExpanded, setLeftNavExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [mapFocusMode, setMapFocusMode] = useState<'all' | 'day' | 'single'>('all')
  const [poiData, setPoiData] = useState<{
    placeId: string
    name: string
    location: { lat: number; lng: number }
    placeData?: any
  } | null>(null)
  const [missingPlaceDataCache, setMissingPlaceDataCache] = useState<Map<string, any>>(new Map())
  const [refreshKey, setRefreshKey] = useState(0) // 追加: trip を再取得するためのキー
  const [scrollSyncEnabled, setScrollSyncEnabled] = useState(false) // スクロール連動の有効/無効（デフォルト無効）
  const isProgrammaticScrollRef = useRef(false) // プログラムによるスクロール中かどうか
  const scrollToItineraryRef = useRef<((itineraryId: string) => void) | null>(null) // Itineraryへのスクロール関数
  const [loadingDayIds, setLoadingDayIds] = useState<Set<string>>(new Set()) // 日程ごとのローディング状態

  // クエリ: view / day / section を読み取り（デフォルトは summary）
  const currentView = (searchParams.get('view') as 'summary' | 'itinerary' | 'checklist') || 'summary'
  const queryDayParam = searchParams.get('day')
  const querySectionParam = searchParams.get('section')

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

  // PDF エクスポート
  const handlePdfExport = async () => {
    if (!trip || !user) return
    
    const userPlan = userData?.planId || 'season_traveler'
    
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
      
      // 成功通知（オプション）
      logger.info('PDF export completed successfully')
    } catch (error: any) {
      logger.error('PDF export failed:', error)
      alert(error.message || t('tripSlugPage.pdfExportFailed'))
    } finally {
      setPdfExporting(false)
    }
  }

  // PDF プレビュー
  const handlePdfPreview = () => {
    if (!trip) return
    
    // 開発者ツールページに遷移
    const previewUrl = `/dev-tools/pdf-preview/${trip.slug || trip.id}`
    window.open(previewUrl, '_blank')
  }

  // セクションへのナビゲーション機能
  const navigateToSection = (sectionId: string) => {
    // チェックリスト関連
    if (sectionId === 'checklist') {
      updateQuery({ view: 'checklist', day: null, section: null })
      return
    }
    if (sectionId === 'checklist-preparing' || sectionId === 'checklist-packing') {
      const section = sectionId.replace('checklist-', '')
      updateQuery({ view: 'checklist', day: null, section })
      return
    }
    // Summary内の各セクション
    updateQuery({ view: 'summary', day: null })
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // Itineraryクリック時のハンドラー（Venue表示用）
  const handleItineraryClick = (itineraryId: string) => {
    // クリック時は常にVenueを地図に表示する（スクロール連動とは独立）
    setSelectedItineraryId(itineraryId)
    setMapFocusMode('single')
    if (trip?.days) {
      for (const day of trip.days) {
        const itinerary = day.itineraries?.find(it => it.id === itineraryId)
        if (itinerary) {
          // クリックされたItineraryが属するDayを選択状態に設定
          setSelectedDayId(day.id)

          setCollapsedDays(prev => {
            const newSet = new Set(prev)
            newSet.delete(day.id)
            return newSet
          })

          // POIダイアログを更新
          let placeData = itinerary.place_data
          
          // missingPlaceDataCacheから補完
          if (!placeData && itinerary.place_id && missingPlaceDataCache.has(itinerary.place_id)) {
            placeData = missingPlaceDataCache.get(itinerary.place_id)
          }
          
          if (placeData?.place_id) {
            setPoiData({
              placeId: placeData.place_id,
              name: itinerary.title,
              location: {
                lat: placeData.geometry!.location.lat,
                lng: placeData.geometry!.location.lng
              },
              placeData: placeData
            })
          } else if (itinerary.place_id) {
            // place_idのみがある場合（place_dataがまだキャッシュされていない）
            setPoiData({
              placeId: itinerary.place_id,
              name: itinerary.title,
              location: { lat: 0, lng: 0 }, // 位置情報は後でAPIから取得
              placeData: undefined // place_dataは後でAPIから取得
            })
          }
          break
        }
      }
    }
  }

  // 地図マーカークリック時のハンドラー（Venue表示用）
  const handleMapMarkerClick = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    
    // 個別フォーカスモードに切り替え
    setMapFocusMode('single')
    
    // 該当するItineraryが含まれる日程を探して展開
    if (trip?.days) {
      for (const day of trip.days) {
        if (day.itineraries?.some(itinerary => itinerary.id === itineraryId)) {
          // 日程を展開
          setCollapsedDays(prev => {
            const newSet = new Set(prev)
            newSet.delete(day.id)
            return newSet
          })
          
          // 日程展開後、DOM更新を待ってからスクロール
          // setTimeoutで少し遅延を入れることで、DOM更新を確実に待つ
          setTimeout(() => {
            if (scrollToItineraryRef.current) {
              scrollToItineraryRef.current(itineraryId)
            }
          }, 100) // 100msの遅延でDOM更新を待つ
          
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
        logger.debug('Fetching trip data:', { userSlug, tripSlug })
        const tripData = await getTripBySlugs(userSlug, tripSlug)
        
        if (!tripData) {
          logger.error('Trip not found:', { userSlug, tripSlug })
          // 旅行が見つからない場合はnotFound()を呼び出し
          notFound()
          return
        }
        
        logger.debug('Trip data found:', { tripId: tripData.id, title: tripData.title })
        
        setTrip(tripData)
        
        // place_idがあるがplace_dataがないItineraryを検出し、必要に応じてデータを取得
        if (tripData.days) {
          const missingPlaceIds: string[] = []
          tripData.days.forEach(day => {
            day.itineraries?.forEach(itinerary => {
              if (itinerary.place_id && !itinerary.place_data) {
                missingPlaceIds.push(itinerary.place_id)
              }
            })
          })
          
          // 不足しているplace_dataを並列で取得
          if (missingPlaceIds.length > 0) {
            const placeDataPromises = missingPlaceIds.map(async (placeId) => {
              try {
                const response = await makeAuthenticatedRequest('/api/places/details', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ placeId })
                })
                
                if (response.ok) {
                  const data = await response.json()
                  return { placeId, placeData: data.result }
                }
              } catch (error) {
                logger.error(`Failed to fetch place data for ${placeId}:`, error)
              }
              return null
            })
            
            const results = await Promise.all(placeDataPromises)
            const newCache = new Map<string, any>()
            
            results.forEach(result => {
              if (result) {
                newCache.set(result.placeId, result.placeData)
              }
            })
            
            setMissingPlaceDataCache(newCache)
          }
        }
      } catch (error) {
        logger.error(t('tripSlugPage.fetchTripFailed'), error)
        notFound()
      } finally {
        setTripLoading(false)
      }
    }

    fetchTrip()
  }, [userSlug, tripSlug, router, refreshKey])

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

  // Checklistのサブセクション（Preparing/Packing）へスクロール
  useEffect(() => {
    if (currentView !== 'checklist') return
    if (!querySectionParam) return
    const targetId = `checklist-${querySectionParam}`
    const element = document.getElementById(targetId)
    if (element) {
      // checklistビュー描画直後のため少し遅延してスクロール
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [currentView, querySectionParam])

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
    // logger.debug(`handleInsertSchedule called: dayId=${dayId}, afterIndex=${afterIndex}`)
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
        logger.error('Failed to add day')
        alert(t('tripSlugPage.addDayFailed'))
      }
    } catch (error) {
      logger.error('Error adding day:', error)
      alert(t('tripSlugPage.addDayFailed'))
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


  // すべてのItinerariesを収集する関数（missingPlaceDataCacheから補完）
  const getAllItineraries = (): Itinerary[] => {
    if (!trip || !trip.days) return []
    
    const allItineraries: Itinerary[] = []
    trip.days.forEach(day => {
      if (day.itineraries) {
        const supplementedItineraries = day.itineraries.map(itinerary => {
          if (itinerary.place_id && !itinerary.place_data && missingPlaceDataCache.has(itinerary.place_id)) {
            return {
              ...itinerary,
              place_data: missingPlaceDataCache.get(itinerary.place_id)
            }
          }
          return itinerary
        })
        allItineraries.push(...supplementedItineraries)
      }
    })
    return allItineraries
  }

  // 選択された日程のItineraryを取得する関数（missingPlaceDataCacheから補完）
  const getFilteredItineraries = (): Itinerary[] => {
    if (!trip?.days) return []
    
    let itineraries: Itinerary[]
    
    if (selectedDayId) {
      // 選択された日程のItineraryのみを返す
      const selectedDay = trip.days.find(day => day.id === selectedDayId)
      itineraries = selectedDay?.itineraries || []
    } else {
      // フィルタが選択されていない場合は全てのItineraryを返す
      itineraries = trip.days.flatMap(day => day.itineraries || [])
    }
    
    // missingPlaceDataCacheからplace_dataを補完
    return itineraries.map(itinerary => {
      if (itinerary.place_id && !itinerary.place_data && missingPlaceDataCache.has(itinerary.place_id)) {
        return {
          ...itinerary,
          place_data: missingPlaceDataCache.get(itinerary.place_id)
        }
      }
      return itinerary
    })
  }

  const handleScheduleAdded = async (newItinerary: any) => {
    if (!trip) return

    // サーバー側では挿入位置に応じて後続の sort_number を +1 済みだが、
    // ローカル状態は古いままなので、同様の再番号付けを適用してから追加する
    setTrip(prevTrip => {
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
    setMapFocusMode('single')

    // POIDialogを表示（place_dataがある場合）
    if (newItinerary.place_data?.place_id) {
      setPoiData({
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
      setPoiData({
        placeId: newItinerary.place_id,
        name: newItinerary.title,
        location: { lat: 0, lng: 0 },
        placeData: undefined
      })
    }
  }

  // POIDialogからItineraryを追加する際のハンドラー
  const handleAddFromPOI = async (placeId: string, dayId: string) => {
    try {
      // ローディング状態を設定
      setLoadingDayIds(prev => new Set(prev).add(dayId))
      
      const currentPoiData = poiData
      if (!currentPoiData) return

      // API を呼び出して Day に Itinerary を追加
      const response = await makeAuthenticatedRequest('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_id: dayId,
          place_id: placeId,
          place_data: currentPoiData.placeData || undefined,
          title: currentPoiData.name,
          description: '',
          location: currentPoiData.location ? `${currentPoiData.location.lat},${currentPoiData.location.lng}` : ''
        })
      })

      if (response.ok) {
        const newItinerary = await response.json()
        logger.debug('POI を Day に追加しました:', newItinerary)
        
        // ローカル状態を更新（handleScheduleAdded と同じロジック）
        handleScheduleAdded(newItinerary)
      } else {
        const error = await response.json()
        logger.error('POI の追加に失敗しました:', error)
        alert(t('tripSlugPage.addPOIFailed'))
      }
    } catch (error) {
      logger.error('POI の追加でエラーが発生しました:', error)
      alert(t('tripSlugPage.addPOIFailed'))
    } finally {
      // ローディング状態を解除
      setLoadingDayIds(prev => {
        const next = new Set(prev)
        next.delete(dayId)
        return next
      })
    }
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
        logger.error('Failed to delete itinerary')
        alert(t('common.deleteFailed'))
      }
    } catch (error) {
      logger.error('Error deleting itinerary:', error)
      alert(t('common.deleteFailed'))
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
        setTrip(prevTrip => {
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
      } else {
        logger.error('Failed to reorder itineraries')
        alert(t('tripSlugPage.orderUpdateFailed'))
      }
    } catch (error) {
      logger.error('Error reordering itineraries:', error)
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
      logger.error('Error moving down:', error)
    }
  }

  if (loading || tripLoading) {
    return <Loading fullScreen size="lg" message={t('loading.message')} />
  }

  if (!user || !trip) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
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
      onLogout={handleLogout}
      rightPaneWidth={currentView === 'checklist' ? 'zero' : 'default'}
      menuItems={[
        {
          id: 'edit-base-info',
          label: 'Edit Base Info',
          icon: 'mdi:pencil',
          onClick: () => setShowEditBaseInfoModal(true),
        },
        {
          id: 'calendar-publish',
          label: t('trip.calendarPublish'),
          icon: 'mdi:calendar-sync',
          onClick: () => setShowICalPublishModal(true),
          disabled: userPlan === 'season_traveler',
        },
        {
          id: 'travel-book-preview',
          label: 'Travel Book Preview',
          icon: 'mdi:eye',
          onClick: handlePdfPreview,
        },
        {
          id: 'download-travel-book',
          label: 'Download Travel Book',
          icon: 'mdi:file-pdf-box',
          onClick: handlePdfExport,
          disabled: pdfExporting || !canExportToPdf(userData?.planId || 'season_traveler'),
        },
        {
          id: 'export-json',
          label: 'Export JSON',
          icon: 'mdi:download',
          onClick: () => setShowExportModal(true),
        },
      ]}
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
          onAddFromPOI={handleAddFromPOI}
          getFilteredItineraries={getFilteredItineraries}
          // 地図側の操作によりスクロール連動を即停止
          onMapInteractionStart={() => setScrollSyncEnabled(false)}
          // 右上オーバーレイの「連動を再開」ボタン
          onRequestEnableScrollSync={() => setScrollSyncEnabled(true)}
          scrollSyncEnabled={scrollSyncEnabled}
        />
      }
    >
      {/* Hero Header with Background Image - show only in summary view */}
      {currentView === 'summary' && (
        <TripHeroSection
          trip={trip}
          onUpdateTrip={setTrip}
          onDeleteTrip={() => {
            // コンテキストから旅行を削除してから遷移
            removeTrip(trip.id)
            router.push('/home')
          }}
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
          loadingDayIds={loadingDayIds}
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
          onReorderItineraries={handleReorderItineraries}
          expandAllDays={expandAllDays}
          collapseAllDays={collapseAllDays}
          scrollSyncEnabled={scrollSyncEnabled}
          onScrollSyncEnabledChange={setScrollSyncEnabled}
          isProgrammaticScrollRef={isProgrammaticScrollRef}
          scrollToItineraryRef={scrollToItineraryRef}
        />
      )}

      {/* Checklist（モバイルではメインに表示）*/}
      {currentView === 'checklist' && (
        <TripChecklistView tripId={trip.id} />
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

      {/* Export Data Modal */}
      {showExportModal && (
        <ExportDataModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          trip={trip}
        />
      )}

      {/* iCal Publish Modal */}
      {showICalPublishModal && (
        <ICalPublishModal
          isOpen={showICalPublishModal}
          onClose={() => setShowICalPublishModal(false)}
          trip={trip}
          onUpdate={setTrip}
        />
      )}

      {/* Edit Base Info Modal */}
      {showEditBaseInfoModal && trip && (
        <TripEditor
          trip={trip}
          onUpdate={(updatedTrip) => {
            setTrip(updatedTrip)
            setShowEditBaseInfoModal(false)
          }}
          onDelete={() => {
            // コンテキストから旅行を削除してから遷移
            removeTrip(trip.id)
            router.push('/home')
          }}
          onClose={() => setShowEditBaseInfoModal(false)}
          hideDestinationEdit={true}
          initialEditing={true}
          hideEditButton={true}
        />
      )}
    </TripPageLayout>
  )
}
