import type { MouseEvent } from 'react'
import { IconRenderer } from '../common/icons/IconRenderer'
import { formatTimeForDisplay } from '@/lib/utils/time-validation'
import { currencyUtils } from '@/lib/utils/currency'
import { t } from '@/lib/i18n'
import type { ReservationInfo } from '@/lib/core/types'

interface ScheduleInfoDisplayProps {
  startTime: string
  endTime: string
  costAmount?: number
  costCurrency?: string
  reservation?: ReservationInfo | null
  onTimeEdit?: () => void
  onCostEdit?: () => void
  onReservationEdit?: () => void
}

export function ScheduleInfoDisplay({
  startTime,
  endTime,
  costAmount,
  costCurrency,
  reservation,
  onTimeEdit,
  onCostEdit,
  onReservationEdit
}: ScheduleInfoDisplayProps) {
  const hasReservation = !!reservation
  const confirmationNumber = reservation?.confirmation_number
  const canEditTime = typeof onTimeEdit === 'function'
  const canEditCost = typeof onCostEdit === 'function'
  const canEditReservation = typeof onReservationEdit === 'function'

  const handleTimeClick = () => {
    if (canEditTime) {
      onTimeEdit?.()
    }
  }

  const handleCostClick = () => {
    if (canEditCost) {
      onCostEdit?.()
    }
  }

  const handleReservationClick = (event: MouseEvent) => {
    if (!canEditReservation) return
    event.stopPropagation()
    onReservationEdit?.()
  }

  const timeClass = canEditTime
    ? 'text-sm text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors'
    : 'text-sm text-gray-600 px-2 py-1 rounded'
  const timeEmptyClass = canEditTime
    ? 'text-sm text-gray-500 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors'
    : 'text-sm text-gray-500 px-2 py-1 rounded'
  const costClass = canEditCost
    ? 'text-sm text-gray-600 cursor-pointer hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors'
    : 'text-sm text-gray-600 px-2 py-1 rounded'
  const costEmptyClass = canEditCost
    ? 'text-sm text-gray-500 cursor-pointer hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors'
    : 'text-sm text-gray-500 px-2 py-1 rounded'
  const reservationClass = canEditReservation
    ? `text-sm cursor-pointer px-2 py-1 rounded transition-colors ${
        hasReservation
          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
      }`
    : `text-sm px-2 py-1 rounded ${
        hasReservation
          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
          : 'text-gray-500'
      }`

  return (
    <div className="flex items-center space-x-4">
      {/* 時間要素 */}
      <div className="flex items-center space-x-1">
        <IconRenderer iconName="clock" className="w-4 h-4" color="#3B82F6" />
        {startTime || endTime ? (
          <span 
            className={timeClass}
            onClick={handleTimeClick}
          >
            {formatTimeForDisplay(startTime)} - {formatTimeForDisplay(endTime)}
          </span>
        ) : (
          <span 
            className={timeEmptyClass}
            onClick={handleTimeClick}
          >
            {t('trip.schedule.time')}
          </span>
        )}
      </div>

      {/* 費用要素 */}
      <div className="flex items-center space-x-1">
        <IconRenderer iconName="money" className="w-4 h-4" color="#10B981" />
        {costAmount !== undefined && costAmount !== null ? (
          <span 
            className={costClass}
            onClick={handleCostClick}
          >
            {currencyUtils.formatAmount(costAmount, costCurrency || 'JPY')}
          </span>
        ) : (
          <span 
            className={costEmptyClass}
            onClick={handleCostClick}
          >
            {t('trip.schedule.cost')}
          </span>
        )}
      </div>

      {/* 予約要素 */}
      <div className="flex items-center space-x-1">
        {hasReservation ? (
          <IconRenderer iconName="reservation" className="w-4 h-4" color="#10B981" />
        ) : (
          <IconRenderer iconName="reservation" className="w-4 h-4" color="#8B5CF6" />
        )}
        <span 
          className={reservationClass}
          onClick={handleReservationClick}
          title={confirmationNumber ? `Confirmation: ${confirmationNumber}` : undefined}
        >
          {hasReservation && confirmationNumber ? (
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              {confirmationNumber.length > 8 ? `${confirmationNumber.substring(0, 8)}...` : confirmationNumber}
            </span>
          ) : hasReservation ? (
            t('trip.schedule.reservation')
          ) : (
            t('trip.schedule.reservation')
          )}
        </span>
      </div>
    </div>
  )
}

