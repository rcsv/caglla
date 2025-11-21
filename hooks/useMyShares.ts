'use client'

import { useEffect, useState } from 'react'
import type { Trip } from '@/lib/core/types'

interface UseMySharesResult {
  trips: Trip[] | null
  loading: boolean
  error: Error | null
}

export function useMyShares(): UseMySharesResult {
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchMyShares = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/trips/my-shares?limit=20', {
          method: 'GET',
          credentials: 'include',
        })
        if (!res.ok) {
          throw new Error(`Failed to fetch my shares: ${res.status}`)
        }
        const json = await res.json()
        if (cancelled) return
        setTrips(json.trips ?? [])
      } catch (e: any) {
        if (cancelled) return
        setError(e instanceof Error ? e : new Error(String(e)))
        setTrips([])
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMyShares()

    return () => {
      cancelled = true
    }
  }, [])

  return { trips, loading, error }
}


