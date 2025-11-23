'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { PlaceData } from '@/lib/core/types'

export interface POIData {
  placeId: string
  name: string
  location: {
    lat: number
    lng: number
  }
  placeData?: PlaceData
  orderNumber?: number
}

interface POIContextValue {
  poiData: POIData | null
  setPoiData: (data: POIData | null) => void
}

const POIContext = createContext<POIContextValue | undefined>(undefined)

interface POIProviderProps {
  children: ReactNode
}

/**
 * POIProvider
 * 
 * POI（Point of Interest）データをContext経由で提供します。
 * @map Parallel Route内でのみ使用し、地図まわりの状態を管理します。
 */
export function POIProvider({ children }: POIProviderProps) {
  const [poiData, setPoiData] = useState<POIData | null>(null)

  return (
    <POIContext.Provider value={{ poiData, setPoiData }}>
      {children}
    </POIContext.Provider>
  )
}

/**
 * usePOI hook
 * 
 * POIProviderからPOIデータを取得します。
 */
export function usePOI(): POIContextValue {
  const context = useContext(POIContext)
  if (context === undefined) {
    throw new Error('usePOI must be used within a POIProvider')
  }
  return context
}

