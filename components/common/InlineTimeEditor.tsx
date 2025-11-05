import { TIMEZONE_OPTIONS } from '@/lib/data/timezone-options'
import { isValidTimeFormat } from '@/lib/utils/time-validation'
import { t } from '@/lib/i18n'

interface InlineTimeEditorProps {
  startTime: string
  endTime: string
  timezone: string
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onTimezoneChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function InlineTimeEditor({
  startTime,
  endTime,
  timezone,
  onStartTimeChange,
  onEndTimeChange,
  onTimezoneChange,
  onSave,
  onCancel,
  isSaving
}: InlineTimeEditorProps) {
  const isValid = isValidTimeFormat(startTime) && isValidTimeFormat(endTime)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">開始時間:</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              onSave()
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        <label className="text-sm font-medium text-gray-700">終了時間:</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              onSave()
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">タイムゾーン:</label>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onSave}
          disabled={isSaving || !isValid}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          キャンセル
        </button>
      </div>
      {!isValid && (
        <p className="text-xs text-red-500">{t('inlineTimeEditor.invalidFormat')}</p>
      )}
      <p className="text-xs text-gray-400">{t('inlineTimeEditor.saveHint')}</p>
    </div>
  )
}

