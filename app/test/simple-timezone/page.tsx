'use client'

import { useState, useEffect } from 'react'

export default function SimpleTimezonePage() {
  const [mounted, setMounted] = useState(false)
  const [result, setResult] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const testBasicFunction = () => {
    // 基本的なタイムゾーン推定のテスト
    const testPlaceData = {
      place_id: 'test_tokyo',
      name: 'Tokyo Station',
      formatted_address: 'Tokyo Station, Tokyo, Japan',
      geometry: {
        location: { lat: 35.6762, lng: 139.7653 }
      },
      address_components: [
        { long_name: 'Japan', short_name: 'JP', types: ['country'] }
      ]
    }

    // 手動でタイムゾーン推定
    let timezone = 'UTC'
    
    // 1. 都市名チェック
    const cityName = testPlaceData.name?.toLowerCase()
    if (cityName && cityName.includes('tokyo')) {
      timezone = 'Asia/Tokyo'
    }
    
    // 2. 国コードチェック
    const countryCode = testPlaceData.address_components?.find(
      (component: any) => component.types.includes('country')
    )?.short_name
    
    if (countryCode === 'JP') {
      timezone = 'Asia/Tokyo'
    }

    setResult(`Place: ${testPlaceData.name}\nTimezone: ${timezone}\nCountry: ${countryCode}`)
  }

  if (!mounted) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">簡単なタイムゾーンテスト</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <button
            onClick={testBasicFunction}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            基本テスト実行
          </button>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">結果</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">このページは</h3>
          <p className="text-blue-700">外部ライブラリを使わずに基本的なタイムゾーン推定をテストします</p>
        </div>
      </div>
    </div>
  )
}
