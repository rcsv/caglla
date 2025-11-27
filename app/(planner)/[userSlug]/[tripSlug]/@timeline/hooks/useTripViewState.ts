// hooks/useTripViewState.ts
'use client'

import { useCallback } from 'react'
import { useTripUrlState } from '../../useTripUrlState'

export type TripViewMode = 'summary' | 'itinerary' | 'checklist'

export function useTripViewState() {
  // もともとの useTripUrlState をそのままラップして返す。
  // 将来的に view 関連の派生ロジック（analytics, scroll sync など）を入れやすくするための抽象化レイヤ。
  const {
    currentView,
    selectedDayId,
    selectedItineraryId,
    setSelectedDayId,
    setSelectedItineraryId,
    updateQuery,
  } = useTripUrlState()

  const setView = useCallback((view: TripViewMode) => {
    // view と mf (mode fragment) の両方を更新して、URL と view の一貫性を担保
    updateQuery({
      view,
      mf: view === 'summary' ? 'all' : view === 'itinerary' ? 'day' : 'all'
    })
  }, [updateQuery])

  const selectDay = useCallback((dayId: string | null) => {
    setSelectedDayId(dayId)
    if (dayId == null) {
      // Day選択解除 → 全体表示
      updateQuery({ sd: null, si: null, mf: 'all' })
    } else {
      // Day選択 → day 表示
      setSelectedItineraryId(null)
      updateQuery({ sd: dayId, si: null, mf: 'day' })
    }
  }, [setSelectedDayId, setSelectedItineraryId, updateQuery])

  const selectItinerary = useCallback((itineraryId: string | null) => {
    setSelectedItineraryId(itineraryId)
    if (itineraryId == null) {
      updateQuery({ si: null, mf: 'day' })
    } else {
      updateQuery({ si: itineraryId, mf: 'single' })
    }
  }, [setSelectedItineraryId, updateQuery])

  return {
    currentView,
    selectedDayId,
    selectedItineraryId,
    setView,
    selectDay,
    selectItinerary,
    // 既存の低レベルAPIも渡して後方互換を保つ
    updateQuery,
    setSelectedDayId,
    setSelectedItineraryId,
  } as const
}

export default useTripViewState
