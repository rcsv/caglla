'use client'

import { useState, useCallback } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import logger from '@/lib/core/logger'
import { t } from '@/lib/i18n'
import { exportTripToPdf, canExportToPdf } from '@/lib/utils/export-helpers'
import { useNotification } from '@/lib/contexts/notification'
import type { Trip } from '@/lib/core/types'
import type { User } from 'firebase/auth'

export function useTripActions({
  trip,
  user,
  userData,
  refreshTrip,
  updateTrip,
  router,
  userPlan,
}: {
  trip: Trip | null
  user: User | null
  userData: any
  refreshTrip: () => Promise<void>
  updateTrip: (t: any) => void
  router: any
  userPlan: string
}) {
  const { showSuccess, showError, showWarning } = useNotification()
  const [publishLoading, setPublishLoading] = useState(false)
  const [replicaLoading, setReplicaLoading] = useState(false)
  const [pdfExporting, setPdfExporting] = useState(false)

  // -----------------------------------------
  // 1) レプリカ作成
  // -----------------------------------------
  const replicate = useCallback(
    async (startDate: string) => {
      if (!trip || !user) return

      try {
        setReplicaLoading(true)

        const response = await makeAuthenticatedRequest(`/api/trip/${trip.slug || trip.id}/replica`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          showError(errorData.error || t('trip.template.replicateFailed'))
          return
        }

        const data = await response.json()
        const newTrip = data.trip
        if (!newTrip) {
          showError(t('trip.template.replicateFailed'))
          return
        }

        const targetSlug = newTrip.slug || newTrip.id
        const targetUserSlug = userData?.slug || user.uid
        if (!targetSlug || !targetUserSlug) {
          showError(t('trip.template.replicateFailed'))
          return
        }

        router.push(`/${targetUserSlug}/${targetSlug}`)
      } catch (err) {
        logger.error('Replica creation failed:', err)
        showError(t('trip.template.replicateFailed'))
      } finally {
        setReplicaLoading(false)
      }
    },
    [trip, user, userData, router, showError]
  )

  // -----------------------------------------
  // 2) 公開処理
  // -----------------------------------------
  const publish = useCallback(async () => {
    if (!trip || !user) return

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
        showError(errorData.error || t('trip.publish.failed'))
        return
      }

      const data = await response.json()
      const publishedTrip = data.trip
      if (!publishedTrip?.id) {
        showError(t('trip.publish.failed'))
        return
      }

      // 最新情報を再取得（slug変更に備える）
      const refreshedResponse = await makeAuthenticatedRequest(`/api/trip/${publishedTrip.id}`)
      if (!refreshedResponse.ok) {
        showError(t('trip.publish.failed'))
        return
      }

      const refreshedTrip = await refreshedResponse.json()
      updateTrip(refreshedTrip)
      await refreshTrip()

      showSuccess(t('trip.publish.success'))

      // slug変更があった場合のルーター同期
      const newSlug = refreshedTrip.slug || publishedTrip.slug || previousSlug
      const creatorSlug = refreshedTrip.creator?.slug || userData?.slug || user.uid
      if (newSlug && creatorSlug && newSlug !== previousSlug) {
        router.replace(`/${creatorSlug}/${newSlug}`)
      }
    } catch (err) {
      logger.error('Trip publish failed:', err)
      showError(t('trip.publish.failed'))
    } finally {
      setPublishLoading(false)
    }
  }, [trip, user, userData, router, updateTrip, refreshTrip, showSuccess, showError])

  // -----------------------------------------
  // 3) PDF 出力
  // -----------------------------------------
  const exportPdf = useCallback(async () => {
    if (!trip || !user) return

    if (!canExportToPdf(userPlan)) {
      showWarning(t('tripSlugPage.pdfRequiresBackpacker'))
      return
    }

    try {
      setPdfExporting(true)

      const token = await user.getIdToken()
      logger.debug('PDF Export: token obtained', { tokenLength: token.length })

      await exportTripToPdf(trip.slug || trip.id, token, (message) => {
        logger.debug('PDF Export:', message)
      })

      logger.info('PDF export completed successfully')
      showSuccess(t('tripSlugPage.pdfExportSuccess'))
    } catch (err: any) {
      logger.error('PDF export failed:', err)
      showError(err.message || t('tripSlugPage.pdfExportFailed'))
    } finally {
      setPdfExporting(false)
    }
  }, [trip, user, userPlan, showWarning, showError, showSuccess])

  return {
    replicate,
    publish,
    exportPdf,

    replicaLoading,
    publishLoading,
    pdfExporting,
  }
}
