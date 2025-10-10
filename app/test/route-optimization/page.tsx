'use client'
import logger from '@/lib/core/logger'

import React, { useState } from 'react'
import RouteCostEstimator from '@/components/trip/RouteCostEstimator'
import RouteOptimizationDisplay from '@/components/trip/RouteOptimizationDisplay'

export default function RouteOptimizationDemo() {
  const [waypointCount, setWaypointCount] = useState(5)
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'>('DRIVING')
  const [avoidHighways, setAvoidHighways] = useState(false)
  const [avoidTolls, setAvoidTolls] = useState(false)
  const [avoidFerries, setAvoidFerries] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  // サンプルデータ
  const sampleWaypoints = [
    { lat: 35.6762, lng: 139.6503 }, // 東京駅
    { lat: 35.6586, lng: 139.7454 }, // 浅草寺
    { lat: 35.6586, lng: 139.7454 }, // 上野公園
    { lat: 35.6586, lng: 139.7454 }, // 東京スカイツリー
    { lat: 35.6586, lng: 139.7454 }, // 皇居
  ].slice(0, waypointCount)

  const origin = { lat: 35.6762, lng: 139.6503 } // 東京駅
  const destination = { lat: 35.6586, lng: 139.7454 } // 浅草寺

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          ルート最適化デモ
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 設定パネル */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">設定</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地点数: {waypointCount}
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={waypointCount}
                onChange={(e) => setWaypointCount(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                移動手段
              </label>
              <select
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRIVING">車</option>
                <option value="WALKING">徒歩</option>
                <option value="BICYCLING">自転車</option>
                <option value="TRANSIT">公共交通機関</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={avoidHighways}
                  onChange={(e) => setAvoidHighways(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">高速道路を避ける</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={avoidTolls}
                  onChange={(e) => setAvoidTolls(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">有料道路を避ける</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={avoidFerries}
                  onChange={(e) => setAvoidFerries(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">フェリーを避ける</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">ルート比較を表示</span>
              </label>
            </div>
          </div>

          {/* 結果パネル */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">結果</h2>
            
            {/* コスト見積もり */}
            <RouteCostEstimator 
              waypointCount={waypointCount}
              showSuggestions={true}
            />

            {/* ルート最適化結果 */}
            <RouteOptimizationDisplay
              waypoints={sampleWaypoints}
              origin={origin}
              destination={destination}
              travelMode={travelMode}
              avoidHighways={avoidHighways}
              avoidTolls={avoidTolls}
              avoidFerries={avoidFerries}
              showComparison={showComparison}
            />
          </div>
        </div>

        {/* 機能説明 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-semibold text-gray-700 mb-3">実装された機能</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>サーバーサイド最適化:</strong> Google Directions APIの最適化機能をサーバーサイドで実行</li>
            <li>• <strong>デバウンス機能:</strong> 連続するAPI呼び出しを防ぎ、コストを削減</li>
            <li>• <strong>キャッシュ機能:</strong> 同じルートの再計算を避けてパフォーマンスを向上</li>
            <li>• <strong>コスト見積もり:</strong> API使用料金の事前見積もりとコスト削減提案</li>
            <li>• <strong>ルート比較:</strong> 複数の移動手段・回避オプションを比較</li>
            <li>• <strong>最適化オプション:</strong> 高速道路・有料道路・フェリーの回避設定</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
