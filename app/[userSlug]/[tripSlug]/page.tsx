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
import { getCachedPlaces } from '@/lib/places-cache'

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
  const [mapFocusMode, setMapFocusMode] = useState<'all' | 'day' | 'single'>('all')
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
    if (sectionId === 'checklist') {
      updateQuery({ view: 'checklist', day: null })
      return
    }
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
    setMapFocusMode('single')
    if (trip?.days) {
      for (const day of trip.days) {
        const itinerary = day.itineraries?.find(it => it.id === itineraryId)
        if (itinerary) {
          setCollapsedDays(prev => {
            const newSet = new Set(prev)
            newSet.delete(day.id)
            return newSet
          })
          if (itinerary.place_data?.place_id) {
            setPoiData({
              placeId: itinerary.place_data.place_id,
              name: itinerary.title,
              location: {
                lat: itinerary.place_data.geometry!.location.lat,
                lng: itinerary.place_data.geometry!.location.lng
              },
              placeData: itinerary.place_data
            })
          }
          break
        }
      }
    }
  }
