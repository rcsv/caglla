import { IconRenderer } from '../common/icons/IconRenderer'
import { formatTimeForDisplay } from '@/lib/utils/time-validation'
import { currencyUtils } from '@/lib/utils/currency'

interface ScheduleInfoDisplayProps {
  startTime: string
  endTime: string
  costAmount?: number
  costCurrency?: string
  onTimeEdit: () => void
  onCostEdit: () => void
  onReservationEdit: () => void
}

export function ScheduleInfoDisplay({
  startTime,
  endTime,
  costAmount,
  costCurrency,
  onTimeEdit,
  onCostEdit,
  onReservationEdit
}: ScheduleInfoDisplayProps) {
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
            時間
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
            費用
          </span>
        )}
      </div>

      {/* 予約要素 */}
      <div className="flex items-center space-x-1">
        <IconRenderer iconName="reservation" className="w-4 h-4" color="#8B5CF6" />
        <span 
          className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onReservationEdit()
          }}
        >
          予約
        </span>
      </div>
    </div>
  )
}

