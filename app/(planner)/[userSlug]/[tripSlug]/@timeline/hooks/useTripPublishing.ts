'use client'

import { useCallback, useState } from 'react'
import type { Trip } from '@/lib/core/types'
import type { User } from 'firebase/auth'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'
import { canExportToPdf, exportTripToPdf } from '@/lib/utils/export-helpers'

type RouterLike = {
  push: (path: string) => void
  replace: (path: string) => void
}

type UseTripPublishingParams = {
  trip: Trip | null
  user: User | null
  userData: any
  updateTrip: (tripOrUpdater: any) => void
  refreshTrip: () => Promise<void>
  router: RouterLike
  userPlan: string
}

export default function useTripPublishing({
  trip,
  user,
  userData,
  updateTrip,
  refreshTrip,
  router,
  userPlan,
}: UseTripPublishingParams) {
  const [replicaLoading, setReplicaLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const [pdfExporting, setPdfExporting] = useState(false)

  const replicate = useCallback(
    async (startDate: string) => {
      if (!trip || !user) return false

      try {
        setReplicaLoading(true)
        const response = await makeAuthenticatedRequest(`/api/trip/${trip.slug || trip.id}/replica`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          alert(errorData.error || t('trip.template.replicateFailed'))
          return
        }

        const data = await response.json()
        const newTrip = data.trip
        if (!newTrip) {
          alert(t('trip.template.replicateFailed'))
          return
        }

        const targetSlug = newTrip.slug || newTrip.id
        const targetUserSlug = userData?.slug || user.uid
        if (!targetSlug || !targetUserSlug) {
          alert(t('trip.template.replicateFailed'))
          return
        }

        router.push(`/${targetUserSlug}/${targetSlug}`)
        return true
      } catch (error) {
        logger.error('Replica creation failed:', error)
        alert(t('trip.template.replicateFailed'))
      } finally {
        setReplicaLoading(false)
      }
      return false
    },
    [trip, user, userData, router]
  )

  const publish = useCallback(async () => {
    if (!trip || !user) return false

    const previousSlug = trip.slug

    try {
      setPublishLoading(true)
      const slugOrId = trip.slug || trip.id

      const response = await makeAuthenticatedRequest(`/api/trip/${slugOrId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || t('trip.publish.failed'))
        return
      }

      const data = await response.json()
      const publishedTrip = data.trip
      if (!publishedTrip?.id) {
        alert(t('trip.publish.failed'))
        return
      }

      const refreshedResponse = await makeAuthenticatedRequest(`/api/trip/${publishedTrip.id}`)
      if (!refreshedResponse.ok) {
        alert(t('trip.publish.failed'))
        return
      }

      const refreshedTrip = await refreshedResponse.json()
      updateTrip(refreshedTrip)
      await refreshTrip()
      alert(t('trip.publish.success'))

      const newSlug = refreshedTrip.slug || publishedTrip.slug || previousSlug
      const creatorSlug = refreshedTrip.creator?.slug || userData?.slug || user.uid
      if (newSlug && creatorSlug && newSlug !== previousSlug) {
        router.replace(`/${creatorSlug}/${newSlug}`)
      }
      return true
    } catch (error) {
      logger.error('Trip publish failed:', error)
      alert(t('trip.publish.failed'))
    } finally {
      setPublishLoading(false)
    }
    return false
  }, [trip, user, userData, router, updateTrip, refreshTrip])

  const exportPdf = useCallback(async () => {
    if (!trip || !user) return false

    if (!canExportToPdf(userPlan)) {
      alert(t('tripSlugPage.pdfRequiresBackpacker'))
      return false
    }

    try {
      setPdfExporting(true)
      const token = await user.getIdToken()
      logger.debug('PDF Export: token obtained', { tokenLength: token.length })

      await exportTripToPdf(trip.slug || trip.id, token, (message) => {
        logger.debug('PDF Export:', message)
      })

      logger.info('PDF export completed successfully')
      return true
    } catch (error: any) {
      logger.error('PDF export failed:', error)
      alert(error.message || t('tripSlugPage.pdfExportFailed'))
    } finally {
      setPdfExporting(false)
    }
    return false
  }, [trip, user, userPlan])

  return {
    replicate,
    publish,
    exportPdf,
    replicaLoading,
    publishLoading,
    pdfExporting,
  }
}
