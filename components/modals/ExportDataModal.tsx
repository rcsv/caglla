'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { Trip } from '@/lib/core/types'
import { 
  downloadTripAsJson, 
  downloadTripAsCSV, 
  downloadReservationsAsJson, 
  downloadReservationsAsCSV 
} from '@/lib/utils/export-helpers'
import Button from '@/components/common/Button'
import { Icon } from '@iconify/react'

interface ExportDataModalProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip
}

type ExportType = 'trip' | 'reservations'
type ExportFormat = 'json' | 'csv'

export default function ExportDataModal({ isOpen, onClose, trip }: ExportDataModalProps) {
  const [exportType, setExportType] = useState<ExportType>('trip')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // エクスポート実行
      if (exportType === 'trip' && exportFormat === 'json') {
        downloadTripAsJson(trip)
      } else if (exportType === 'trip' && exportFormat === 'csv') {
        downloadTripAsCSV(trip)
      } else if (exportType === 'reservations' && exportFormat === 'json') {
        downloadReservationsAsJson(trip)
      } else if (exportType === 'reservations' && exportFormat === 'csv') {
        downloadReservationsAsCSV(trip)
      }

      // 成功後に少し待ってから閉じる
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export error:', error)
      alert('エクスポート中にエラーが発生しました')
      setIsExporting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getExportDescription = () => {
    if (exportType === 'trip') {
      if (exportFormat === 'json') {
        return '旅程全体のデータ（旅行情報、日程、Itinerary、予約情報）をJSON形式でエクスポートします。'
      }
      return '旅程全体のItinerary一覧をCSV形式でエクスポートします。Excel等で編集可能です。'
    } else {
      if (exportFormat === 'json') {
        return '予約情報のみをJSON形式でエクスポートします。'
      }
      return '予約情報のみをCSV形式でエクスポートします。Excel等で編集可能です。'
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Icon icon="mdi:download" className="w-6 h-6 text-blue-600" />
            データエクスポート
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4 space-y-6">
          {/* エクスポートタイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              エクスポートするデータ
            </label>
            <div className="space-y-2">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: exportType === 'trip' ? '#3B82F6' : '#E5E7EB' }}>
                <input
                  type="radio"
                  name="exportType"
                  value="trip"
                  checked={exportType === 'trip'}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="mt-0.5 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Icon icon="mdi:map-marker-path" className="w-5 h-5 text-blue-600" />
                    旅程全体
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    旅行情報、日程、全てのItinerary、予約情報を含む
                  </p>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: exportType === 'reservations' ? '#3B82F6' : '#E5E7EB' }}>
                <input
                  type="radio"
                  name="exportType"
                  value="reservations"
                  checked={exportType === 'reservations'}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="mt-0.5 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Icon icon="mdi:ticket-confirmation" className="w-5 h-5 text-green-600" />
                    予約情報のみ
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    飛行機、ホテル、レンタカー等の予約情報のみ
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* エクスポート形式選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ファイル形式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: exportFormat === 'json' ? '#3B82F6' : '#E5E7EB' }}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Icon icon="mdi:code-json" className="w-5 h-5 text-purple-600" />
                    JSON
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    完全なデータ構造
                  </p>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: exportFormat === 'csv' ? '#3B82F6' : '#E5E7EB' }}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Icon icon="mdi:table" className="w-5 h-5 text-green-600" />
                    CSV
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Excel対応
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                {getExportDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isExporting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleExport}
            variant="primary"
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                エクスポート中...
              </>
            ) : (
              <>
                <Icon icon="mdi:download" className="w-5 h-5" />
                エクスポート
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

