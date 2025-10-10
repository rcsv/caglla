'use client'
import logger from '@/lib/logger'

import { useState, useEffect } from 'react'
import { timezoneUtils } from '@/lib/timezone-utils'
import type { PlaceData } from '@/lib/types'

export default function TimezoneExperimentPage() {
  const [testPlaces, setTestPlaces] = useState<PlaceData[]>([
    {
      place_id: 'test_1',
      name: 'Shibuya Sky',
      formatted_address: '2-1-1 Shibuya, Shibuya City, Tokyo 150-0002, Japan',
      geometry: {
        location: { lat: 35.6585, lng: 139.7013 }
      },
      address_components: [
        { long_name: 'Japan', short_name: 'JP', types: ['country'] },
        { long_name: 'Tokyo', short_name: 'Tokyo', types: ['administrative_area_level_1'] },
        { long_name: 'Shibuya City', short_name: 'Shibuya City', types: ['locality'] }
      ]
    },
    {
      place_id: 'test_2',
      name: 'Times Square',
      formatted_address: 'Times Square, New York, NY 10036, USA',
      geometry: {
        location: { lat: 40.7580, lng: -73.9855 }
      },
      address_components: [
        { long_name: 'United States', short_name: 'US', types: ['country'] },
        { long_name: 'New York', short_name: 'NY', types: ['administrative_area_level_1'] },
        { long_name: 'New York', short_name: 'New York', types: ['locality'] }
      ]
    },
    {
      place_id: 'test_3',
      name: 'Machu Picchu',
      formatted_address: 'Machu Picchu, 08680, Peru',
      geometry: {
        location: { lat: -13.1631, lng: -72.5450 }
      },
      address_components: [
        { long_name: 'Peru', short_name: 'PE', types: ['country'] },
        { long_name: 'Cusco', short_name: 'Cusco', types: ['administrative_area_level_1'] }
      ]
    },
    {
      place_id: 'test_4',
      name: 'Santorini',
      formatted_address: 'Santorini, Greece',
      geometry: {
        location: { lat: 36.3932, lng: 25.4615 }
      },
      address_components: [
        { long_name: 'Greece', short_name: 'GR', types: ['country'] },
        { long_name: 'South Aegean', short_name: 'South Aegean', types: ['administrative_area_level_1'] }
      ]
    },
    {
      place_id: 'test_5',
      name: 'Bali',
      formatted_address: 'Bali, Indonesia',
      geometry: {
        location: { lat: -8.3405, lng: 115.0920 }
      },
      address_components: [
        { long_name: 'Indonesia', short_name: 'ID', types: ['country'] },
        { long_name: 'Bali', short_name: 'Bali', types: ['administrative_area_level_1'] }
      ]
    }
  ])

  const [results, setResults] = useState<Array<{
    place: PlaceData
    timezone: string
    isNew: boolean
  }>>([])

  const [logs, setLogs] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const testTimezoneDetection = () => {
    const newResults = testPlaces.map(place => {
      const timezone = timezoneUtils.getTimezoneFromPlace(place, 'test_user')
      return {
        place,
        timezone,
        isNew: !['tokyo', 'new york', 'los angeles', 'chicago', 'san francisco', 'las vegas', 'miami', 'london', 'paris', 'rome', 'berlin', 'madrid', 'amsterdam', 'seoul', 'beijing', 'shanghai', 'hong kong', 'singapore', 'bangkok', 'taipei', 'sydney', 'melbourne', 'auckland', 'honolulu', 'guam', 'saipan', 'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'dubai', 'moscow', 'istanbul'].includes(place.name.toLowerCase())
      }
    })
    
    setResults(newResults)
    
    // ログを取得
    const failureLogs = timezoneUtils.getFailureLogs()
    setLogs(failureLogs)
  }

  const addCustomPlace = () => {
    const name = prompt('場所名を入力してください:')
    const address = prompt('住所を入力してください:')
    const country = prompt('国コードを入力してください (例: JP, US, FR):')
    
    if (name && address && country) {
      const newPlace: PlaceData = {
        place_id: `custom_${Date.now()}`,
        name,
        formatted_address: address,
        geometry: {
          location: { lat: 0, lng: 0 }
        },
        address_components: [
          { long_name: country, short_name: country, types: ['country'] }
        ]
      }
      
      setTestPlaces([...testPlaces, newPlace])
    }
  }

  const runBatchProcess = () => {
    const result = timezoneUtils.processBatchUpdate()
    alert(`処理完了: ${result.processedCount}件のログを処理し、${result.updates.length}件のマッピングを更新しました。`)
    
    // ログを再取得
    const failureLogs = timezoneUtils.getFailureLogs()
    setLogs(failureLogs)
  }

  const clearLogs = () => {
    if (confirm('すべてのログを削除しますか？')) {
      timezoneUtils.clearFailureLogs()
      setLogs([])
    }
  }

  // サーバーサイドレンダリング対応
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">タイムゾーン推定実験</h1>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">タイムゾーン推定実験</h1>
        
        {/* 操作ボタン */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={testTimezoneDetection}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            タイムゾーン推定テスト実行
          </button>
          <button
            onClick={addCustomPlace}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            カスタム場所追加
          </button>
          <button
            onClick={runBatchProcess}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            バッチ処理実行
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            ログクリア
          </button>
        </div>

        {/* テスト結果 */}
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">推定結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  result.timezone === 'UTC' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="font-semibold text-lg">{result.place.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{result.place.formatted_address}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      result.timezone === 'UTC' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {result.timezone}
                    </span>
                    {result.isNew && (
                      <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                        新規
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ログ表示 */}
        {logs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">失敗ログ ({logs.length}件)</h2>
            <div className="bg-white rounded-lg border p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {logs.slice(0, 10).map((log, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{log.place_data.name}</h4>
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
                    <div className="text-xs text-gray-500 mt-1">
                      <p>失敗理由: {log.failure_reason}</p>
                      {log.detected_city && <p>検出都市: {log.detected_city}</p>}
                      {log.detected_country && <p>検出国: {log.detected_country}</p>}
                    </div>
                  </div>
                ))}
                {logs.length > 10 && (
                  <p className="text-center text-gray-500">
                    他 {logs.length - 10} 件のログがあります
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 説明 */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">実験の流れ</h3>
          <ol className="text-blue-700 space-y-2">
            <li>1. 「タイムゾーン推定テスト実行」で既存の場所をテスト</li>
            <li>2. 赤い枠の場所は推定失敗（UTCにフォールバック）</li>
            <li>3. 失敗した場所は自動的にログに記録される</li>
            <li>4. 「カスタム場所追加」で新しい場所を追加してテスト</li>
            <li>5. ログが50件以上になったら「バッチ処理実行」</li>
            <li>6. バッチ処理で新しいマッピングが自動追加される</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
