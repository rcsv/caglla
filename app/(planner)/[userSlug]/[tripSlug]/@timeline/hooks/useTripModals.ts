// hooks/useTripModals.ts
'use client'

import { useCallback, useState } from 'react'

export type TripModalKey =
  | 'addSchedule'
  | 'export'            // PDF Exporting Feature
  | 'editBaseInfo'
  | 'replica'
  | 'deleteTrip'

export type AddScheduleContext = {
  dayId: string
  insertAfterIndex?: number
}

type TripModalsController = {
  modals: Record<TripModalKey, boolean>
  open: (key: TripModalKey) => void
  close: (key: TripModalKey) => void
  closeAll: () => void
  addScheduleContext: AddScheduleContext | null
  openAddSchedule: (dayId: string, insertAfterIndex?: number) => void
  closeAddSchedule: () => void
}

export default function useTripModals(): TripModalsController {
  const [modals, setModals] = useState<Record<TripModalKey, boolean>>({
    addSchedule: false,
    export: false,
    editBaseInfo: false,
    replica: false,
    deleteTrip: false,
  })
  const [addScheduleContext, setAddScheduleContext] = useState<AddScheduleContext | null>(null)

  const open = useCallback((key: TripModalKey) => {
    setModals(prev => ({ ...prev, [key]: true }))
  }, [])

  const close = useCallback((key: TripModalKey) => {
    setModals(prev => ({ ...prev, [key]: false }))
  }, [])

  // すべて閉じる：モーダル衝突防止に便利
  const closeAll = useCallback(() => {
    setModals({
      addSchedule: false,
      export: false,
      editBaseInfo: false,
      replica: false,
      deleteTrip: false,
    })
    setAddScheduleContext(null)
  }, [])

  const openAddSchedule = useCallback((dayId: string, insertAfterIndex?: number) => {
    setAddScheduleContext({ dayId, insertAfterIndex })
    open('addSchedule')
  }, [open])

  const closeAddSchedule = useCallback(() => {
    setAddScheduleContext(null)
    close('addSchedule')
  }, [close])

  return {
    modals,
    open,
    close,
    closeAll,
    addScheduleContext,
    openAddSchedule,
    closeAddSchedule,
  }
}
