'use client'

import { dateUtils } from '@/lib/utils/date'

export default function DateRangeUnifiedTestPage() {
  // Test cases for unified date range formatting
  const testCases = [
    {
      name: '単日旅行（同日）',
      startDate: new Date('2025-10-20'),
      endDate: new Date('2025-10-20'),
      expected: '10/20 (1日後、日帰り)'
    },
    {
      name: '同月内の期間',
      startDate: new Date('2025-10-20'),
      endDate: new Date('2025-10-21'),
      expected: '10/20 - 21 (1日後、2日間)'
    },
    {
      name: '同年内異月',
      startDate: new Date('2025-10-20'),
      endDate: new Date('2025-11-05'),
      expected: '10/20 - 11/5 (1日後、16日間)'
    },
    {
      name: '年跨ぎ',
      startDate: new Date('2025-12-30'),
      endDate: new Date('2026-01-10'),
      expected: '2025/12/30 - 2026/1/10 (1日後、11日間)'
    },
    {
      name: '3日間の旅行',
      startDate: new Date('2025-10-21'),
      endDate: new Date('2025-10-23'),
      expected: '10/21 - 23 (2日後、3日間)'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          統一日付範囲表示ルール テスト
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">実装されたルール</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>1. <strong>単日</strong>: 終了日を表示しない、期間は「日帰り」</li>
            <li>2. <strong>同月</strong>: 終了日の月を省略（ノート記述方式）</li>
            <li>3. <strong>同年</strong>: 終了日の年を省略</li>
            <li>4. <strong>年跨ぎ</strong>: 開始年と終了年の両方を表示</li>
            <li>5. <strong>曜日</strong>: 表示しない</li>
          </ul>
        </div>

        <div className="space-y-6">
          {testCases.map((testCase, index) => {
            const result = dateUtils.formatFutureTripDate(testCase.startDate, testCase.endDate)
            const isCorrect = result === testCase.expected
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {testCase.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isCorrect ? '✓ 正解' : '✗ 不正解'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">入力データ</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div>開始日: {testCase.startDate.toLocaleDateString('ja-JP')}</div>
                      <div>終了日: {testCase.endDate.toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">結果</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div className="font-mono">{result}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">期待値</h4>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="font-mono">{testCase.expected}</div>
                  </div>
                </div>
                
                {!isCorrect && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 text-sm">
                      <strong>不一致:</strong> 期待値と実際の結果が異なります
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">基本日付範囲表示（相対時間なし）</h2>
          <div className="space-y-4">
            {testCases.map((testCase, index) => {
              const result = dateUtils.formatDateRange(testCase.startDate, testCase.endDate)
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{testCase.name}</span>
                  <span className="font-mono text-sm">{result}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
