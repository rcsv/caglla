import { currencyUtils } from '@/lib/utils/currency'
import { isValidAmount } from '@/lib/utils/amount-validation'
import { t } from '@/lib/i18n'

interface InlineCostEditorProps {
  amount: string
  currency: string
  onAmountChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function InlineCostEditor({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  onSave,
  onCancel,
  isSaving
}: InlineCostEditorProps) {
  const isValid = isValidAmount(amount)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">金額:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isValid) {
              onSave()
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-24"
          placeholder="0"
          min="0"
          step="0.01"
          autoFocus
        />
        <label className="text-sm font-medium text-gray-700">通貨:</label>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {currencyUtils.getAvailableCurrencies().map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} ({curr.name})
            </option>
          ))}
        </select>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onSave}
          disabled={isSaving || !isValid}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
        <p className="text-xs text-red-500">{t('inlineCostEditor.invalidAmount')}</p>
      )}
      <p className="text-xs text-gray-400">{t('inlineCostEditor.saveHint')}</p>
    </div>
  )
}

