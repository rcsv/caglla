'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export type TripView = 'summary' | 'itinerary' | 'checklist'

interface TripUrlState {
  currentView: TripView
  selectedDayId: string | null
  selectedItineraryId: string | null
  mapFocusMode: 'all' | 'day' | 'single'
  section: string | null
}

interface TripUrlStateActions {
  setView: (view: TripView) => void
  setSelectedDayId: (dayId: string | null) => void
  setSelectedItineraryId: (itineraryId: string | null) => void
  setMapFocusMode: (mode: 'all' | 'day' | 'single') => void
  setSection: (section: string | null) => void
  updateQuery: (updates: Partial<{
    view?: TripView
    sd?: string | null
    si?: string | null
    mf?: 'all' | 'day' | 'single'
    section?: string | null
  }>) => void
}

/**
 * useTripUrlState
 * 
 * URLクエリパラメータと状態を同期するフック
 * 
 * URLパラメータ:
 * - `view`: 現在のビュー（summary, itinerary, checklist）
 * - `sd`: 選択されたDay ID
 * - `si`: 選択されたItinerary ID
 * - `mf`: 地図のフォーカスモード（all, day, single）
 * - `section`: Summary内のセクションID
 */
export function useTripUrlState(): TripUrlState & TripUrlStateActions {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URLから状態を読み取る
  const currentView = useMemo(() => {
    const view = searchParams.get('view') as TripView | null
    return view && ['summary', 'itinerary', 'checklist'].includes(view)
      ? view
      : 'summary'
  }, [searchParams])

  const selectedDayId = useMemo(() => {
    return searchParams.get('sd') || null
  }, [searchParams])

  const selectedItineraryId = useMemo(() => {
    return searchParams.get('si') || null
  }, [searchParams])

  const mapFocusMode = useMemo(() => {
    const mode = searchParams.get('mf') as 'all' | 'day' | 'single' | null
    return mode && ['all', 'day', 'single'].includes(mode)
      ? mode
      : 'all'
  }, [searchParams])

  const section = useMemo(() => {
    return searchParams.get('section') || null
  }, [searchParams])

  // URLを更新する関数（debounceなし、即座に更新）
  const updateQuery = useCallback((
    updates: Partial<{
      view?: TripView
      sd?: string | null
      si?: string | null
      mf?: 'all' | 'day' | 'single'
      section?: string | null
    }>
  ) => {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.view !== undefined) {
      if (updates.view === 'summary') {
        params.delete('view') // デフォルトはsummaryなので削除
      } else {
        params.set('view', updates.view)
      }
    }

    if (updates.sd !== undefined) {
      if (updates.sd === null) {
        params.delete('sd')
      } else {
        params.set('sd', updates.sd)
      }
    }

    if (updates.si !== undefined) {
      if (updates.si === null) {
        params.delete('si')
      } else {
        params.set('si', updates.si)
      }
    }

    if (updates.mf !== undefined) {
      if (updates.mf === 'all') {
        params.delete('mf') // デフォルトはallなので削除
      } else {
        params.set('mf', updates.mf)
      }
    }

    if (updates.section !== undefined) {
      if (updates.section === null) {
        params.delete('section')
      } else {
        params.set('section', updates.section)
      }
    }

    // scroll: false でスクロール位置を保持
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  // 個別のsetter関数
  const setView = useCallback((view: TripView) => {
    updateQuery({ view })
  }, [updateQuery])

  const setSelectedDayId = useCallback((dayId: string | null) => {
    updateQuery({ sd: dayId })
  }, [updateQuery])

  const setSelectedItineraryId = useCallback((itineraryId: string | null) => {
    updateQuery({ si: itineraryId })
  }, [updateQuery])

  const setMapFocusMode = useCallback((mode: 'all' | 'day' | 'single') => {
    updateQuery({ mf: mode })
  }, [updateQuery])

  const setSection = useCallback((section: string | null) => {
    updateQuery({ section })
  }, [updateQuery])

  return {
    currentView,
    selectedDayId,
    selectedItineraryId,
    mapFocusMode,
    section,
    setView,
    setSelectedDayId,
    setSelectedItineraryId,
    setMapFocusMode,
    setSection,
    updateQuery,
  }
}

