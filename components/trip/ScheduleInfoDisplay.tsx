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
  onTimeEdit: () => void
  onCostEdit: () => void
  onReservationEdit: () => void
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
  return (
    <div className="flex items-center space-x-4">
      {/* 時間要素 */}
      <div className="flex items-center space-x-1">
        <IconRenderer iconName="clock" className="w-4 h-4" color="#3B82F6" />
        {startTime || endTime ? (
          <span 
            className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            onClick={onTimeEdit}
          >
            {formatTimeForDisplay(startTime)} - {formatTimeForDisplay(endTime)}
          </span>
        ) : (
          <span 
            className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            onClick={onTimeEdit}
          >
            {t('trip.schedule.time')}
          </span>
        )}
      </div>

      {/* 費用要素 */}
      <div className="flex items-center space-x-1">
        <IconRenderer iconName="money" className="w-4 h-4" color="#10B981" />
        {costAmount ? (
          <span 
            className="text-sm text-gray-600 cursor-pointer hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
            onClick={onCostEdit}
          >
            {currencyUtils.formatAmount(costAmount, costCurrency || 'JPY')}
          </span>
        ) : (
          <span 
            className="text-sm text-gray-500 cursor-pointer hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
            onClick={onCostEdit}
          >
            {t('trip.schedule.cost')}
          </span>
        )}
      </div>

      {/* 予約要素 */}
      <div className="flex items-center space-x-1">
        {hasReservation ? (
          <IconRenderer iconName="check-circle" className="w-4 h-4" color="#10B981" />
        ) : (
          <IconRenderer iconName="reservation" className="w-4 h-4" color="#8B5CF6" />
        )}
        <span 
          className={`text-sm cursor-pointer px-2 py-1 rounded transition-colors ${
            hasReservation
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onReservationEdit()
          }}
          title={confirmationNumber ? `Confirmation: ${confirmationNumber}` : undefined}
        >
          {hasReservation && confirmationNumber ? (
            <span className="flex items-center gap-1">
              <span>{t('trip.schedule.reservation')}</span>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                {confirmationNumber.length > 8 ? `${confirmationNumber.substring(0, 8)}...` : confirmationNumber}
              </span>
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

