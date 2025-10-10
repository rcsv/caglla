'use client'
import logger from '@/lib/core/logger'

import { useState, useEffect } from 'react'
import { timezoneUtils } from '@/lib/utils/timezone'
import type { TimezoneFailureLog, TimezoneMappingUpdate } from '@/lib/core/types'

export default function TimezoneLogManager() {
  const [logs, setLogs] = useState<TimezoneFailureLog[]>([])
  const [updates, setUpdates] = useState<TimezoneMappingUpdate[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    const failureLogs = timezoneUtils.getFailureLogs()
    setLogs(failureLogs)
  }

  const handleProcessBatch = async () => {
    setIsProcessing(true)
    try {
      const result = timezoneUtils.processBatchUpdate()
      setUpdates(result.updates)
      
      if (result.processedCount > 0) {
        alert(`${result.processedCount}件のログを処理し、${result.updates.length}件のマッピングを更新しました。`)
        loadLogs() // ログを再読み込み
      } else {
        alert('処理対象のログが不足しています（50件未満）。')
      }
    } catch (error) {
      logger.error('Batch processing failed:', error)
      alert('バッチ処理に失敗しました。')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearLogs = () => {
    if (confirm('すべてのログを削除しますか？')) {
      timezoneUtils.clearFailureLogs()
      setLogs([])
      setUpdates([])
    }
  }

  const pendingLogs = logs.filter(log => log.status === 'pending')
  const processedLogs = logs.filter(log => log.status === 'processed')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">タイムゾーン推定ログ管理</h1>
      
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">総ログ数</h3>
          <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800">未処理</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingLogs.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">処理済み</h3>
          <p className="text-2xl font-bold text-green-600">{processedLogs.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">バッチ更新</h3>
          <p className="text-2xl font-bold text-purple-600">{updates.length}</p>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleProcessBatch}
          disabled={isProcessing || pendingLogs.length < 50}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
        >
          {isProcessing ? '処理中...' : 'バッチ処理実行'}
        </button>
        <button
          onClick={loadLogs}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          ログ再読み込み
        </button>
        <button
          onClick={handleClearLogs}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          ログ全削除
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          {showDetails ? '詳細を隠す' : '詳細を表示'}
        </button>
      </div>

      {/* バッチ更新結果 */}
      {updates.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">最新のバッチ更新結果</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {updates.map((update, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="font-semibold">{update.city_name}</div>
                  <div className="text-sm text-gray-600">{update.timezone}</div>
                  <div className="text-xs">
                    <span className={`px-2 py-1 rounded ${
                      update.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      update.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {update.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ログ詳細 */}
      {showDetails && (
        <div>
          <h2 className="text-xl font-semibold mb-4">ログ詳細</h2>
          <div className="space-y-4">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{log.place_data.name}</h3>
                    <p className="text-sm text-gray-600">{log.formatted_address}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    log.status === 'processed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <p>失敗理由: {log.failure_reason}</p>
                  {log.detected_city && <p>検出都市: {log.detected_city}</p>}
                  {log.detected_country && <p>検出国: {log.detected_country}</p>}
                  <p>作成日時: {new Date(log.created_at).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            ))}
            {logs.length > 20 && (
              <p className="text-center text-gray-500">
                他 {logs.length - 20} 件のログがあります
              </p>
            )}
          </div>
        </div>
      )}

      {/* バッチ処理の説明 */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">バッチ処理について</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 未処理ログが50件以上の場合に実行可能</li>
          <li>• 同じ都市名が3回以上出現した場合、新しいマッピングを追加</li>
          <li>• 信頼度: 高(10回以上) / 中(5-9回) / 低(3-4回)</li>
          <li>• 高信頼度・中信頼度のマッピングのみ実際に適用</li>
        </ul>
      </div>
    </div>
  )
}
