'use client'

import { useEffect, useMemo, useState } from 'react'
import { t } from '@/lib/i18n'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { CloseIcon } from '@/components/common/icons/CloseIcon'
import Loading from '@/components/common/Loading'

interface TemplateReplicaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (startDate: string) => Promise<void> | void
  dayCount?: number
  loading?: boolean
  templateTitle?: string
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TemplateReplicaModal({
  isOpen,
  onClose,
  onConfirm,
  dayCount = 0,
  loading = false,
  templateTitle,
}: TemplateReplicaModalProps) {
  const [startDate, setStartDate] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStartDate('')
      setTouched(false)
    }
  }, [isOpen])

  const endDate = useMemo(() => {
    if (!startDate) return ''
    const parsed = new Date(startDate)
    if (Number.isNaN(parsed.getTime())) return ''

    if (dayCount && dayCount > 0) {
      const result = new Date(parsed)
      result.setDate(parsed.getDate() + dayCount - 1)
      return formatDateForInput(result)
    }
    return formatDateForInput(parsed)
  }, [startDate, dayCount])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!startDate) {
      return
    }
    await onConfirm(startDate)
  }

  const startDateError = touched && !startDate ? t('trip.template.replicateStartDateError') : ''

  return (
    <div className="fixed inset-0 zidx-float-modal flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('trip.template.replicateDialogTitle')}
              </h2>
              {templateTitle && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {templateTitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <Input
              label={t('trip.template.replicateStartDateLabel')}
              type="date"
              id="replica-start-date"
              name="replica-start-date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              onBlur={() => setTouched(true)}
              required
              error={startDateError || undefined}
            />
            {dayCount > 0 && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-medium">
                  {t('trip.template.replicateDayCountSummary', { dayCount })}
                </p>
                <p className="mt-1">
                  {startDate
                    ? t('trip.template.replicateEndDatePreview', { endDate })
                    : t('trip.template.replicateEndDateHint')}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !startDate}>
              {loading ? (
                <Loading inline size="xs" color="white" message={t('trip.template.replicating')} />
              ) : (
                t('trip.template.replicate')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

