'use client'

import { useEffect, useState } from 'react'
import { getRecentTrips, type RecentTripEntry } from '@/lib/utils/recent-trips'

/**
 * Recently You Checked 用に localStorage から履歴を取得し、
 * 他タブでの更新（storage イベント）も拾うカスタムフック。
 *
 * - 初期値: null （ローディング状態を区別するため）
 * - []: 履歴なし
 */
export function useRecentTrips(): RecentTripEntry[] | null {
  const [recentTrips, setRecentTrips] = useState<RecentTripEntry[] | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setRecentTrips(getRecentTrips())

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key !== 'recent_trips_v1') return
      setRecentTrips(getRecentTrips())
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return recentTrips
}


