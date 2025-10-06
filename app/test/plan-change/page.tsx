'use client'

import React, { useState, useEffect } from 'react'
import { 
  RestrictionProvider, 
  PlanId, 
  RestrictionType, 
  PLAN_CONFIGS,
  formatLimit,
  calculateUsagePercentage,
  getUsageColor
} from '@/lib/restriction-system'
import { useAuth } from '@/lib/auth-context'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'

export default function PlaygroundPage() {
  const { user } = useAuth()
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(PlanId.SEASON_TRAVELER)
  const [userPlanId, setUserPlanId] = useState<PlanId | null>(null)
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)
  const [testValues, setTestValues] = useState({
    trips: 0,
    privateTrips: 0,
    travelDays: 0,
    storageGB: 0,
    accountStorageGB: 0
  })

  // ユーザーのプランIDを取得
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return
      
      try {
        const response = await makeAuthenticatedRequest('/api/user/plan', {
          method: 'GET'
        })
        
        if (response.ok) {
          const data = await response.json()
          setUserPlanId(data.planId)
          setSelectedPlanId(data.planId)
        } else {
          console.error('Failed to fetch user plan:', response.status)
          // フォールバック: ユーザーオブジェクトからplanIdを取得
          if (user.planId) {
            setUserPlanId(user.planId as PlanId)
            setSelectedPlanId(user.planId as PlanId)
          }
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
        // フォールバック: ユーザーオブジェクトからplanIdを取得
        if (user.planId) {
          setUserPlanId(user.planId as PlanId)
          setSelectedPlanId(user.planId as PlanId)
        }
      }
    }

    fetchUserPlan()
  }, [user])

  const currentPlan = PLAN_CONFIGS[selectedPlanId]

  const handleTestValueChange = (type: string, value: number) => {
    setTestValues(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const checkRestriction = (type: RestrictionType, currentValue: number) => {
    return RestrictionProvider.can(selectedPlanId, type, currentValue)
  }

  const getRemaining = (type: RestrictionType, currentValue: number) => {
    return RestrictionProvider.getRemaining(selectedPlanId, type, currentValue)
  }

  const getLimitExceededMessage = (type: RestrictionType, currentValue: number) => {
    return RestrictionProvider.getLimitExceededMessage(selectedPlanId, type, currentValue)
  }

  const hasFeature = (type: RestrictionType) => {
    return RestrictionProvider.hasFeature(selectedPlanId, type)
  }

  // プラン選択時の処理
  const handlePlanChange = async (planId: PlanId) => {
    if (planId === userPlanId) {
      // 現在のプランと同じ場合は何もしない
      setSelectedPlanId(planId)
      return
    }

    setIsUpdatingPlan(true)
    try {
      const response = await makeAuthenticatedRequest('/api/user/plan', {
        method: 'PUT',
        body: JSON.stringify({ planId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPlanId(planId)
        setSelectedPlanId(planId)
        alert(`プランが「${PLAN_CONFIGS[planId].name}」に更新されました`)
      } else {
        console.error('Failed to update user plan:', response.status)
        alert('プランの更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating user plan:', error)
      alert('プランの更新中にエラーが発生しました')
    } finally {
      setIsUpdatingPlan(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            プラン制限テストプレイグラウンド
          </h1>
          
          {/* プラン選択 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">プラン選択</h2>
            {userPlanId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>現在のプラン:</strong> {PLAN_CONFIGS[userPlanId].name}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(PlanId).map(planId => {
                const plan = PLAN_CONFIGS[planId]
                const isSelected = selectedPlanId === planId
                const isCurrentPlan = planId === userPlanId
                return (
                  <button
                    key={planId}
                    onClick={() => handlePlanChange(planId)}
                    disabled={isUpdatingPlan}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isUpdatingPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        {isCurrentPlan && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            現在
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}/${plan.interval}`}
                      </p>
                      {isUpdatingPlan && isSelected && (
                        <p className="text-blue-600 text-sm mt-2">更新中...</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 現在のプラン情報 */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">現在のプラン: {currentPlan.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">制限値</h3>
                <ul className="space-y-1 text-sm">
                  <li>旅行数: {formatLimit(currentPlan.limits[RestrictionType.MAX_TRIPS], RestrictionType.MAX_TRIPS)}</li>
                  <li>プライベート旅行数: {formatLimit(currentPlan.limits[RestrictionType.MAX_PRIVATE_TRIPS], RestrictionType.MAX_PRIVATE_TRIPS)}</li>
                  <li>旅行日数: {formatLimit(currentPlan.limits[RestrictionType.MAX_TRAVEL_DAYS], RestrictionType.MAX_TRAVEL_DAYS)}</li>
                  <li>ストレージ: {formatLimit(currentPlan.limits[RestrictionType.MAX_STORAGE_GB], RestrictionType.MAX_STORAGE_GB)}</li>
                  <li>アカウントストレージ: {formatLimit(currentPlan.limits[RestrictionType.MAX_ACCOUNT_STORAGE_GB], RestrictionType.MAX_ACCOUNT_STORAGE_GB)}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">利用可能機能</h3>
                <ul className="space-y-1 text-sm">
                  <li className={hasFeature(RestrictionType.AI_SUPPORT) ? 'text-green-600' : 'text-gray-400'}>
                    AIサポート: {hasFeature(RestrictionType.AI_SUPPORT) ? '✓' : '✗'}
                  </li>
                  <li className={hasFeature(RestrictionType.OUTLOOK_INTEGRATION) ? 'text-green-600' : 'text-gray-400'}>
                    Outlook統合: {hasFeature(RestrictionType.OUTLOOK_INTEGRATION) ? '✓' : '✗'}
                  </li>
                  <li className={hasFeature(RestrictionType.ROUTE_OPTIMIZATION) ? 'text-green-600' : 'text-gray-400'}>
                    ルート最適化: {hasFeature(RestrictionType.ROUTE_OPTIMIZATION) ? '✓' : '✗'}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* テスト値入力 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">テスト値入力</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">旅行数</label>
                <input
                  type="number"
                  min="0"
                  value={testValues.trips}
                  onChange={(e) => handleTestValueChange('trips', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">プライベート旅行数</label>
                <input
                  type="number"
                  min="0"
                  value={testValues.privateTrips}
                  onChange={(e) => handleTestValueChange('privateTrips', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">旅行日数</label>
                <input
                  type="number"
                  min="0"
                  value={testValues.travelDays}
                  onChange={(e) => handleTestValueChange('travelDays', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ストレージ使用量 (GB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={testValues.storageGB}
                  onChange={(e) => handleTestValueChange('storageGB', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">アカウントストレージ使用量 (GB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={testValues.accountStorageGB}
                  onChange={(e) => handleTestValueChange('accountStorageGB', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* 制限チェック結果 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">制限チェック結果</h2>
            <div className="space-y-4">
              {/* 旅行数制限 */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">旅行数制限</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    checkRestriction(RestrictionType.MAX_TRIPS, testValues.trips) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {checkRestriction(RestrictionType.MAX_TRIPS, testValues.trips) ? 'OK' : 'NG'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>現在: {testValues.trips}件</p>
                  <p>制限: {formatLimit(currentPlan.limits[RestrictionType.MAX_TRIPS], RestrictionType.MAX_TRIPS)}</p>
                  <p>残り: {getRemaining(RestrictionType.MAX_TRIPS, testValues.trips) === -1 ? '無制限' : `${getRemaining(RestrictionType.MAX_TRIPS, testValues.trips)}件`}</p>
                  {!checkRestriction(RestrictionType.MAX_TRIPS, testValues.trips) && (
                    <p className="text-red-600 mt-1">{getLimitExceededMessage(RestrictionType.MAX_TRIPS, testValues.trips)}</p>
                  )}
                </div>
              </div>

              {/* プライベート旅行数制限 */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">プライベート旅行数制限</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    checkRestriction(RestrictionType.MAX_PRIVATE_TRIPS, testValues.privateTrips) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {checkRestriction(RestrictionType.MAX_PRIVATE_TRIPS, testValues.privateTrips) ? 'OK' : 'NG'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>現在: {testValues.privateTrips}件</p>
                  <p>制限: {formatLimit(currentPlan.limits[RestrictionType.MAX_PRIVATE_TRIPS], RestrictionType.MAX_PRIVATE_TRIPS)}</p>
                  <p>残り: {getRemaining(RestrictionType.MAX_PRIVATE_TRIPS, testValues.privateTrips) === -1 ? '無制限' : `${getRemaining(RestrictionType.MAX_PRIVATE_TRIPS, testValues.privateTrips)}件`}</p>
                  {!checkRestriction(RestrictionType.MAX_PRIVATE_TRIPS, testValues.privateTrips) && (
                    <p className="text-red-600 mt-1">{getLimitExceededMessage(RestrictionType.MAX_PRIVATE_TRIPS, testValues.privateTrips)}</p>
                  )}
                </div>
              </div>

              {/* 旅行日数制限 */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">旅行日数制限</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    checkRestriction(RestrictionType.MAX_TRAVEL_DAYS, testValues.travelDays) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {checkRestriction(RestrictionType.MAX_TRAVEL_DAYS, testValues.travelDays) ? 'OK' : 'NG'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>現在: {testValues.travelDays}日</p>
                  <p>制限: {formatLimit(currentPlan.limits[RestrictionType.MAX_TRAVEL_DAYS], RestrictionType.MAX_TRAVEL_DAYS)}</p>
                  <p>残り: {getRemaining(RestrictionType.MAX_TRAVEL_DAYS, testValues.travelDays) === -1 ? '無制限' : `${getRemaining(RestrictionType.MAX_TRAVEL_DAYS, testValues.travelDays)}日`}</p>
                  {!checkRestriction(RestrictionType.MAX_TRAVEL_DAYS, testValues.travelDays) && (
                    <p className="text-red-600 mt-1">{getLimitExceededMessage(RestrictionType.MAX_TRAVEL_DAYS, testValues.travelDays)}</p>
                  )}
                </div>
              </div>

              {/* ストレージ制限 */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">ストレージ制限</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    checkRestriction(RestrictionType.MAX_STORAGE_GB, testValues.storageGB) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {checkRestriction(RestrictionType.MAX_STORAGE_GB, testValues.storageGB) ? 'OK' : 'NG'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>現在: {testValues.storageGB}GB</p>
                  <p>制限: {formatLimit(currentPlan.limits[RestrictionType.MAX_STORAGE_GB], RestrictionType.MAX_STORAGE_GB)}</p>
                  <p>残り: {getRemaining(RestrictionType.MAX_STORAGE_GB, testValues.storageGB) === -1 ? '無制限' : `${getRemaining(RestrictionType.MAX_STORAGE_GB, testValues.storageGB).toFixed(2)}GB`}</p>
                  {!checkRestriction(RestrictionType.MAX_STORAGE_GB, testValues.storageGB) && (
                    <p className="text-red-600 mt-1">{getLimitExceededMessage(RestrictionType.MAX_STORAGE_GB, testValues.storageGB)}</p>
                  )}
                </div>
              </div>

              {/* アカウントストレージ制限 */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">アカウントストレージ制限</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    checkRestriction(RestrictionType.MAX_ACCOUNT_STORAGE_GB, testValues.accountStorageGB) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {checkRestriction(RestrictionType.MAX_ACCOUNT_STORAGE_GB, testValues.accountStorageGB) ? 'OK' : 'NG'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>現在: {testValues.accountStorageGB}GB</p>
                  <p>制限: {formatLimit(currentPlan.limits[RestrictionType.MAX_ACCOUNT_STORAGE_GB], RestrictionType.MAX_ACCOUNT_STORAGE_GB)}</p>
                  <p>残り: {getRemaining(RestrictionType.MAX_ACCOUNT_STORAGE_GB, testValues.accountStorageGB) === -1 ? '無制限' : `${getRemaining(RestrictionType.MAX_ACCOUNT_STORAGE_GB, testValues.accountStorageGB).toFixed(2)}GB`}</p>
                  {!checkRestriction(RestrictionType.MAX_ACCOUNT_STORAGE_GB, testValues.accountStorageGB) && (
                    <p className="text-red-600 mt-1">{getLimitExceededMessage(RestrictionType.MAX_ACCOUNT_STORAGE_GB, testValues.accountStorageGB)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 機能チェック結果 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">機能チェック結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">AIサポート</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    hasFeature(RestrictionType.AI_SUPPORT) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hasFeature(RestrictionType.AI_SUPPORT) ? '利用可能' : '利用不可'}
                  </span>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Outlook統合</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    hasFeature(RestrictionType.OUTLOOK_INTEGRATION) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hasFeature(RestrictionType.OUTLOOK_INTEGRATION) ? '利用可能' : '利用不可'}
                  </span>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">ルート最適化</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    hasFeature(RestrictionType.ROUTE_OPTIMIZATION) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hasFeature(RestrictionType.ROUTE_OPTIMIZATION) ? '利用可能' : '利用不可'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* プラン比較表 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">プラン比較表</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">プラン</th>
                    <th className="border border-gray-300 p-2 text-left">価格</th>
                    <th className="border border-gray-300 p-2 text-left">旅行数</th>
                    <th className="border border-gray-300 p-2 text-left">プライベート旅行数</th>
                    <th className="border border-gray-300 p-2 text-left">旅行日数</th>
                    <th className="border border-gray-300 p-2 text-left">ストレージ</th>
                    <th className="border border-gray-300 p-2 text-left">アカウントストレージ</th>
                    <th className="border border-gray-300 p-2 text-left">AIサポート</th>
                    <th className="border border-gray-300 p-2 text-left">Outlook統合</th>
                    <th className="border border-gray-300 p-2 text-left">ルート最適化</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(PlanId).map(planId => {
                    const plan = PLAN_CONFIGS[planId]
                    return (
                      <tr key={planId} className={selectedPlanId === planId ? 'bg-blue-50' : ''}>
                        <td className="border border-gray-300 p-2 font-medium">{plan.name}</td>
                        <td className="border border-gray-300 p-2">
                          {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}/${plan.interval}`}
                        </td>
                        <td className="border border-gray-300 p-2">{formatLimit(plan.limits[RestrictionType.MAX_TRIPS], RestrictionType.MAX_TRIPS)}</td>
                        <td className="border border-gray-300 p-2">{formatLimit(plan.limits[RestrictionType.MAX_PRIVATE_TRIPS], RestrictionType.MAX_PRIVATE_TRIPS)}</td>
                        <td className="border border-gray-300 p-2">{formatLimit(plan.limits[RestrictionType.MAX_TRAVEL_DAYS], RestrictionType.MAX_TRAVEL_DAYS)}</td>
                        <td className="border border-gray-300 p-2">{formatLimit(plan.limits[RestrictionType.MAX_STORAGE_GB], RestrictionType.MAX_STORAGE_GB)}</td>
                        <td className="border border-gray-300 p-2">{formatLimit(plan.limits[RestrictionType.MAX_ACCOUNT_STORAGE_GB], RestrictionType.MAX_ACCOUNT_STORAGE_GB)}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {plan.features_enabled[RestrictionType.AI_SUPPORT] ? '✓' : '✗'}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {plan.features_enabled[RestrictionType.OUTLOOK_INTEGRATION] ? '✓' : '✗'}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {plan.features_enabled[RestrictionType.ROUTE_OPTIMIZATION] ? '✓' : '✗'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
