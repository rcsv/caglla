'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Trip } from '@/lib/core/types'
import { useAuth } from '@/lib/contexts/auth'
import logger from '@/lib/core/logger'

interface UseTemplatesResult {
  trips: Trip[] | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  nextCursor?: string
}

export function useTemplates(limit: number = 20, excludeMyTrips: boolean = false): UseTemplatesResult {
  const { user, loading: authLoading } = useAuth()
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)

  const fetchTemplates = useCallback(async () => {
    // 認証が完了していない場合は待機（認証は任意なので、ユーザーがいなくても取得可能）
    if (authLoading) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 認証トークンは任意（公開テンプレートなので）
      let token: string | null = null
      if (user) {
        token = await user.getIdToken()
      }

      const excludeParam = excludeMyTrips ? '&excludeMyTrips=true' : ''
      logger.debug('Fetching templates', { limit, excludeMyTrips })

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`/api/trips/templates?limit=${limit}${excludeParam}`, {
        method: 'GET',
        headers,
      })

      if (!res.ok) {
        const errorText = await res.text()
        logger.error('Failed to fetch templates', { status: res.status, error: errorText })
        throw new Error(`Failed to fetch templates: ${res.status}`)
      }

      const json = await res.json()

      logger.debug('Templates fetched successfully', { count: json.trips?.length ?? 0 })
      setTrips(json.trips ?? [])
      setNextCursor(json.nextCursor)
    } catch (e: any) {
      logger.error('Error fetching templates', e)
      setError(e instanceof Error ? e : new Error(String(e)))
      setTrips([])
    } finally {
      setLoading(false)
    }
  }, [user, authLoading, limit, excludeMyTrips])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return { trips, loading, error, refresh: fetchTemplates, nextCursor }
}

