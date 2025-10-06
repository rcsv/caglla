'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import { PlanId, RestrictionType } from '@/lib/restriction-system'
import type { Trip } from '@/lib/types'

interface UserDataContextType {
  // プラン情報
  userPlanId: PlanId | null
  planLoading: boolean
  planError: string | null
  
  // 旅行データ
  trips: Trip[]
  tripsLoading: boolean
  tripsError: string | null
  
  // 統計情報
  tripCount: number
  privateTripCount: number
  
  // 更新関数
  refreshUserPlan: () => Promise<void>
  refreshTrips: () => Promise<void>
  addTrip: (trip: Trip) => void
  updateTrip: (tripId: string, updates: Partial<Trip>) => void
  removeTrip: (tripId: string) => void
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

interface UserDataProviderProps {
  children: ReactNode
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const { user } = useAuth()
  
  // プラン情報の状態
  const [userPlanId, setUserPlanId] = useState<PlanId | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  
  // 旅行データの状態
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [tripsError, setTripsError] = useState<string | null>(null)

  // ユーザープラン情報を取得
  const refreshUserPlan = async () => {
    if (!user) return
    
    try {
      setPlanLoading(true)
      setPlanError(null)
      
      const response = await makeAuthenticatedRequest('/api/user/plan', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPlanId(data.planId)
      } else {
        console.error('Failed to fetch user plan:', response.status)
        // フォールバック: ユーザーオブジェクトからplanIdを取得
        if (user.planId) {
          setUserPlanId(user.planId as PlanId)
        }
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
      setPlanError('プラン情報の取得に失敗しました')
      // フォールバック: ユーザーオブジェクトからplanIdを取得
      if (user.planId) {
        setUserPlanId(user.planId as PlanId)
      }
    } finally {
      setPlanLoading(false)
    }
  }

  // 旅行データを取得
  const refreshTrips = async () => {
    if (!user) return
    
    try {
      setTripsLoading(true)
      setTripsError(null)
      
      const response = await makeAuthenticatedRequest('/api/trips/accessible?includeShared=true')
      
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      } else {
        console.error('Failed to fetch trips:', response.status)
        setTripsError('旅行データの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      setTripsError('旅行データの取得に失敗しました')
    } finally {
      setTripsLoading(false)
    }
  }

  // 旅行を追加
  const addTrip = (trip: Trip) => {
    setTrips(prev => [trip, ...prev])
  }

  // 旅行を更新
  const updateTrip = (tripId: string, updates: Partial<Trip>) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId ? { ...trip, ...updates } : trip
    ))
  }

  // 旅行を削除
  const removeTrip = (tripId: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== tripId))
  }

  // 統計情報を計算
  const tripCount = trips.length
  const privateTripCount = trips.filter(trip => trip.access_level === 'private').length

  // 初期データ読み込み
  useEffect(() => {
    if (user) {
      refreshUserPlan()
      refreshTrips()
    }
  }, [user])

  const value: UserDataContextType = {
    // プラン情報
    userPlanId,
    planLoading,
    planError,
    
    // 旅行データ
    trips,
    tripsLoading,
    tripsError,
    
    // 統計情報
    tripCount,
    privateTripCount,
    
    // 更新関数
    refreshUserPlan,
    refreshTrips,
    addTrip,
    updateTrip,
    removeTrip
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const context = useContext(UserDataContext)
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}
