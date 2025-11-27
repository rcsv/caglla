 'use client'

import TripItineraryView from '@/components/trip/TripItineraryView'
import TripSummaryView from '@/components/trip/TripSummaryView'
import TripChecklistView from '@/components/trip/TripChecklistView'
import TripHeroSection from '@/components/trip/TripHeroSection'
import AddScheduleModal from '@/components/modals/AddScheduleModal'
import ExportDataModal from '@/components/modals/ExportDataModal'
import TemplateReplicaModal from '@/components/modals/TemplateReplicaModal'
import TripEditor from '@/components/trip/TripEditor'
import { useRef, useState } from 'react'
import Loading from '@/components/common/Loading'
import { useAuth } from '@/lib/contexts/auth'
import { useUserData } from '@/lib/contexts/user-data'
import { useSubscription } from '@/lib/contexts/subscription'
import { canEditTrip } from '@/lib/core/permissions'
import { useTrip } from '../TripProvider'
import useTripViewState from './hooks/useTripViewState'
import useTripModals from './hooks/useTripModals'
import useTripPublishing from './hooks/useTripPublishing'
import useItineraryActions from './hooks/useItineraryActions'
import { dispatchPOIOpen } from '../poi-events'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import { t } from '@/lib/i18n'
import logger from '@/lib/core/logger'
import { useRouter } from 'next/navigation'
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
    selectDay,
    selectItinerary,
  } = useTripViewState()

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [loadingDayIds, setLoadingDayIds] = useState<Set<string>>(new Set())
  const [deletingDayIds, setDeletingDayIds] = useState<Set<string>>(new Set())
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  const isProgrammaticScrollRef = useRef(false)
  const scrollToItineraryRef = useRef<((itineraryId: string) => void) | null>(null)

  const {
    modals,
    open,
    close,
    addScheduleContext,
    openAddSchedule,
    closeAddSchedule,
  } = useTripModals()

  const {
    replicate,
    publish,
    replicaLoading,
    publishLoading,
  } = useTripPublishing({
    trip,
    user,
    userData,
    updateTrip,
    refreshTrip,
    router,
    userPlan,
  })

  const {
    getAllItineraries,
    handleScheduleAdded,
    handleScheduleUpdated,
    handleScheduleDelete,
    handleMoveUp,
    handleMoveDown,
    handleMoveToDay,
    handleDuplicateToDay,
    handleDragEnd,
    handleReorderItineraries,
  } = useItineraryActions({
    trip,
    updateTrip,
    refreshTrip,
    setSelectedDayId,
    setSelectedItineraryId,
    updateQuery,
  })

  const handleOpenReplicaModal = () => {
    if (!trip || !user) return
    open('replica')
  }

  const handleAddSchedule = (dayId: string) => {
    setSelectedDayId(dayId)
    openAddSchedule(dayId)
  }

  const handleInsertSchedule = (dayId: string, afterIndex: number) => {
    setSelectedDayId(dayId)
    openAddSchedule(dayId, afterIndex)
  }

  const handleAddScheduleModalClose = () => {
    closeAddSchedule()
    setSelectedDayId(null)
  }

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
      selectDay(null)
    } else {
      selectDay(dayId)
    }
  }
  
  const onItineraryClickSync = (id: string) => {
    selectItinerary(id)
    
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

  const handleDayDelete = async (dayId: string) => {
    // 削除アニメーション開始
    setDeletingDayIds(prev => new Set(prev).add(dayId))
    
    // アニメーション完了を待つ（300ms）
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Firestore削除処理の完了を待つ（追加で200ms）
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // サーバーから最新データを取得（day_numberの振り直し + 削除されたDayを除外）
    try {
      await refreshTrip()
    } catch (error) {
      logger.error('Failed to refresh trip after day deletion:', error)
    }
    
    // 削除アニメーション状態をクリア（refreshTrip完了後）
    setDeletingDayIds(prev => {
      const next = new Set(prev)
      next.delete(dayId)
      return next
    })
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

  const templateDayCount = trip?.days?.length ?? 0

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
              onPublish={canPublishTrip ? () => publish() : undefined}
              publishLoading={publishLoading}
              onUpdateTrip={updateTrip}
              onEditBaseInfoRequest={() => open('editBaseInfo')}
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
        deletingDayIds={deletingDayIds}
        onToggleDayCollapse={onToggleDayCollapse}
        onDayClick={onDayClick}
            onAddSchedule={handleAddSchedule}
            onInsertSchedule={handleInsertSchedule}
            onAddDay={handleAddDay}
            onDayDelete={handleDayDelete}
            onScheduleUpdated={handleScheduleUpdated}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onMoveToDay={handleMoveToDay}
            onDuplicateToDay={handleDuplicateToDay}
            onScheduleDelete={handleScheduleDelete}
                        onItineraryClick={onItineraryClickSync}
                        onDragEnd={handleDragEnd}
                        onUpdateTrip={updateTrip}
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
        isOpen={modals.replica}
        onClose={() => {
          if (replicaLoading) return
          close('replica')
        }}
        onConfirm={async (startDate) => {
          const success = await replicate(startDate)
          if (success) {
            close('replica')
          }
        }}
        dayCount={templateDayCount}
        loading={replicaLoading}
        templateTitle={trip.title}
      />

      {modals.addSchedule && addScheduleContext?.dayId && (
        <AddScheduleModal
          isOpen={modals.addSchedule}
          dayId={addScheduleContext.dayId}
          onClose={handleAddScheduleModalClose}
          onScheduleAdded={handleScheduleAdded}
          insertAfterIndex={addScheduleContext.insertAfterIndex}
        />
      )}

      {modals.export && (
        <ExportDataModal
          isOpen={modals.export}
          onClose={() => close('export')}
          trip={trip}
        />
      )}

      {modals.editBaseInfo && trip && (
        <TripEditor
          trip={trip}
          onUpdate={async (updatedTrip) => {
            updateTrip(updatedTrip)
            await refreshTrip()
            close('editBaseInfo')
          }}
          onDelete={() => {
            removeTrip(trip.id)
            router.push('/home')
          }}
          onClose={() => close('editBaseInfo')}
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
