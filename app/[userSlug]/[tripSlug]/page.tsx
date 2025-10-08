'use client'

import { useAuth } from '@/lib/auth-context'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { notFound } from 'next/navigation'
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
import Checklist from '@/components/Checklist'
import NavigationMenu from '@/components/planner/NavigationMenu'
import Loading from '@/components/common/Loading'
import PublicAccessBadge from '@/components/common/icons/PublicAccessBadge'
import FloatingTitleBar from '@/components/planner/FloatingTitleBar'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { CalendarIcon } from '@/components/common/icons/CalendarIcon'
import { dateUtils } from '@/lib/date-utils'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { Trip, Day, Itinerary, User } from '@/lib/firestore'
import { getTripBySlugs } from '@/lib/slug-data-helpers'
import { getZIndexClass, getZIndex } from '@/lib/z-index-layers'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  const [poiData, setPoiData] = useState<any>(null)

  // URLクエリパラメータから現在のビューを取得
  const currentView = searchParams.get('view') || 'summary'
  const dayParam = searchParams.get('day')

  // URLクエリパラメータを更新するヘルパー関数
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl, { scroll: false })
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
        
        // 日付パラメータが指定されている場合は該当する日を選択
        if (dayParam) {
          const day = tripData.days?.find(d => d.id === dayParam)
          if (day) {
            setSelectedDayId(day.id)
            setMapFocusMode('day')
          }
        }
      } catch (error) {
        console.error('旅行データの取得に失敗しました:', error)
        notFound()
      } finally {
        setTripLoading(false)
      }
    }

    fetchTrip()
  }, [userSlug, tripSlug, dayParam, router])

  // 認証チェック
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // 認証済みユーザーが旅行の所有者かチェック
  const isOwner = user && trip && user.uid === trip.user_id

  // 旅行データが読み込み中の場合
  if (loading || tripLoading) {
    return <Loading />
  }

  // 旅行データが存在しない場合
  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">旅行が見つかりません</h1>
          <p className="text-gray-600 mb-8">指定された旅行は存在しないか、アクセス権限がありません。</p>
          <Link 
            href="/home" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  // プライベート旅行の場合は所有者のみアクセス可能
  if (trip.access_level === 'private' && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-8">この旅行はプライベート設定になっています。</p>
          <Link 
            href="/home" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  // 既存のTripPageコンポーネントのロジックをここに移植
  // （既存のコードをそのまま使用するため、ここでは簡略化）

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 既存のTripPageコンポーネントの内容をここに移植 */}
      <div className="flex h-screen">
        {/* 左メニュー */}
        <NavigationMenu
          isExpanded={leftNavExpanded}
          onToggleCollapse={() => setLeftNavExpanded(!leftNavExpanded)}
          currentView={currentView}
          onViewChange={(view) => updateQuery({ view })}
          trip={trip}
          selectedDayId={selectedDayId}
          onDaySelect={(dayId) => {
            setSelectedDayId(dayId)
            updateQuery({ day: dayId })
            setMapFocusMode('day')
          }}
        />

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Floating Title Bar */}
          <FloatingTitleBar
            title={trip.title}
            accessLevel={trip.access_level}
            className="zidx-left-panel"
          />

          {/* メインコンテンツエリア */}
          <div className="flex-1 flex overflow-hidden">
            {/* 左ペイン（メインコンテンツ） */}
            <div className="flex-1 overflow-y-auto">
              {/* 既存のコンテンツ表示ロジックをここに移植 */}
              <div className="p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{trip.title}</h1>
                <p className="text-gray-600">スラッグベースのルートで表示中</p>
                <p className="text-sm text-gray-500 mt-2">
                  URL: /trip/{userSlug}/{tripSlug}
                </p>
              </div>
            </div>

            {/* 右ペイン（地図またはチェックリスト） */}
            <div className="w-full md:w-1/2 lg:w-2/5 border-l border-gray-200 bg-white">
              {currentView === 'checklist' ? (
                <div className="h-full p-4">
                  <Checklist />
                </div>
              ) : (
                <TripMap
                  itineraries={[]} // 既存のロジックを移植
                  selectedItineraryId={selectedItineraryId}
                  selectedDayId={selectedDayId}
                  onItineraryClick={() => {}}
                  onPoiDataUpdate={setPoiData}
                  className="h-full"
                  focusMode={mapFocusMode}
                  initialCenter={trip.destination_place?.geometry?.location}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
