# Google Maps統合実装ガイド

このドキュメントは、Caglla Travel ManagerでGoogle Maps JavaScript APIを使用して国別統計を視覚化する機能の実装手順を記録しています。

## 📋 概要

旅行した国にピンを表示するGoogle Mapを国別統計の横に配置し、視覚的に旅行履歴を確認できる機能を実装しました。

## 🛠️ 実装手順

### 1. 必要なライブラリのインストール

```bash
npm install @googlemaps/js-api-loader
```

### 2. Google Maps Platformでの設定

#### 2.1 MapIDの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Google Maps Platform > マップ管理
3. 「地図を作成」をクリック
4. 地図名: `caglla-trip-summary`
5. 説明: `/homeで表示するサマリ用マップ`
6. MapIDを取得（例: `6d1d86ef84ec9c9071f1b459`）

#### 2.2 スタイルIDの作成（オプション）
1. Google Maps Platform > 地図のスタイル
2. 「スタイルを作成」をクリック
3. スタイル名: `caglla-trip-summary-style-default`
4. スタイルIDを取得（例: `c43d64fa4c2bbb5b809de261`）

### 3. 環境変数の設定

`.env.local`ファイルに以下を追加：

```env
# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Google Maps Platform Map ID (for Advanced Markers)
NEXT_PUBLIC_GOOGLE_MAP_ID=6d1d86ef84ec9c9071f1b459
```

### 4. 座標データベースの作成

`lib/country-coordinates.ts`を作成：

```typescript
export interface CountryCoordinate {
  countryCode: string
  countryName: string
  countryNameJa: string
  lat: number
  lng: number
}

export const COUNTRY_COORDINATES: CountryCoordinate[] = [
  { countryCode: 'JP', countryName: 'Japan', countryNameJa: '日本', lat: 35.6762, lng: 139.6503 },
  { countryCode: 'US', countryName: 'United States', countryNameJa: 'アメリカ', lat: 39.8283, lng: -98.5795 },
  // 他の国の座標データ...
]

// 国コードマッピング機能
export function getCountryCoordinate(countryCode: string): CountryCoordinate | null {
  // 標準的な国コードで検索
  let coordinate = COUNTRY_COORDINATES.find(country => 
    country.countryCode.toLowerCase() === countryCode.toLowerCase()
  )
  
  if (coordinate) return coordinate
  
  // country-utils.tsで生成される形式（例: "united-states", "japan"）で検索
  const countryNameMapping: { [key: string]: string } = {
    'united-states': 'US',
    'japan': 'JP',
    // 他のマッピング...
  }
  
  const mappedCode = countryNameMapping[countryCode.toLowerCase()]
  if (mappedCode) {
    coordinate = COUNTRY_COORDINATES.find(country => 
      country.countryCode === mappedCode
    )
  }
  
  return coordinate || null
}
```

### 5. Google Mapコンポーネントの作成

`components/CountryMap.tsx`を作成：

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { CountryGroup } from '@/lib/country-utils'
import { getCountryCoordinate } from '@/lib/country-coordinates'

interface CountryMapProps {
  countryGroups: CountryGroup[]
  className?: string
}

export default function CountryMap({ countryGroups, className = '' }: CountryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initMap = async () => {
      try {
        setLoading(true)
        setError(null)

        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'marker']
        })

        await loader.load()

        if (!mapRef.current) return

        // 地図を初期化
        const newMap = new google.maps.Map(mapRef.current, {
          zoom: 2,
          center: { lat: 20, lng: 0 },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || '6d1d86ef84ec9c9071f1b459',
          // すべてのコントロールを無効化
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false
          // MapID使用時はstylesプロパティを設定しない
          // スタイルはGoogle Cloud Consoleで管理
        })

        setMap(newMap)

        // 既存のマーカーをクリア
        markers.forEach(marker => marker.map = null)

        // 新しいマーカーを作成
        const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []

        countryGroups.forEach((group, index) => {
          const coordinate = getCountryCoordinate(group.countryCode)
          
          if (coordinate) {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
            const colorIndex = Math.min(index, colors.length - 1)
            
            // カスタムマーカー要素を作成
            const markerElement = document.createElement('div')
            markerElement.style.width = `${8 + (group.tripCount * 2)}px`
            markerElement.style.height = `${8 + (group.tripCount * 2)}px`
            markerElement.style.borderRadius = '50%'
            markerElement.style.backgroundColor = colors[colorIndex]
            markerElement.style.border = '2px solid #ffffff'
            markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
            markerElement.style.cursor = 'pointer'
            markerElement.title = `${group.countryNameJa} (${group.tripCount}回)`
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
              position: { lat: coordinate.lat, lng: coordinate.lng },
              map: newMap,
              content: markerElement
            })

            // 情報ウィンドウを作成
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-semibold text-gray-800">${group.countryNameJa}</h3>
                  <p class="text-sm text-gray-600">${group.countryName}</p>
                  <p class="text-lg font-bold text-blue-600">${group.tripCount}回の旅行</p>
                </div>
              `
            })

            // マーカークリック時に情報ウィンドウを表示
            marker.addListener('click', () => {
              infoWindow.open(newMap, marker)
            })

            newMarkers.push(marker)
          }
        })

        setMarkers(newMarkers)

        // すべてのマーカーが表示されるように地図の境界を調整
        if (newMarkers.length > 0) {
          const bounds = new google.maps.LatLngBounds()
          newMarkers.forEach(marker => {
            const position = marker.position
            if (position) {
              bounds.extend(position)
            }
          })
          newMap.fitBounds(bounds)
          
          // ズームレベルが大きすぎる場合は制限
          google.maps.event.addListenerOnce(newMap, 'bounds_changed', () => {
            if (newMap.getZoom() && newMap.getZoom()! > 10) {
              newMap.setZoom(10)
            }
          })
        }

      } catch (err) {
        console.error('Error initializing map:', err)
        setError('地図の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (countryGroups.length > 0) {
      initMap()
    }
  }, [countryGroups])

  // レンダリング部分...
}
```

### 6. 国別統計コンポーネントの更新

`components/CountryStats.tsx`を更新して横並びレイアウトに変更：

```typescript
import CountryMap from './CountryMap'

// レイアウトを横並びに変更
return (
  <div className={`${className}`}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 国別統計リスト */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* 既存の統計表示 */}
      </div>

      {/* Google Map */}
      <CountryMap countryGroups={countryGroups} />
    </div>
  </div>
)
```

## ⚠️ 重要な注意点

### MapID使用時の制約
- **`styles`プロパティは設定しない**: MapID使用時はJavaScript側でスタイルを設定してはいけません
- **Google Cloud Consoleで管理**: 地図のスタイルはGoogle Cloud Consoleで管理します
- **警告の回避**: 「Map's styles property cannot be set when a mapId is present」の警告を避けるため

### AdvancedMarkerElementの使用
- **MapID必須**: `AdvancedMarkerElement`を使用するには有効なMapIDが必要
- **非推奨警告の回避**: 古い`google.maps.Marker`の代わりに使用
- **カスタムHTML要素**: `div`要素でマーカーを作成し、より柔軟なスタイリングが可能

## 🎨 視覚的特徴

- **6色のカラーパレット**: 旅行回数順に色分け
- **サイズ調整**: 旅行回数に応じてマーカーサイズを変更
- **影付きデザイン**: 立体的で美しいマーカー
- **情報ウィンドウ**: ピンクリックで詳細情報を表示
- **凡例表示**: 色と国の対応を明示

## 🔧 トラブルシューティング

### よくある問題と解決方法

1. **「有効なマップIDを使用せずに...」の警告**
   - 解決: MapIDを正しく設定する

2. **「Map's styles property cannot be set when a mapId is present」の警告**
   - 解決: JavaScript側の`styles`プロパティを削除する

3. **ピンが表示されない**
   - 解決: 国コードマッピングが正しく動作しているか確認

4. **地図が読み込まれない**
   - 解決: APIキーとMapIDが正しく設定されているか確認

## 📚 参考資料

- [Google Maps JavaScript API ドキュメント](https://developers.google.com/maps/documentation/javascript)
- [Cloud-based Maps Styling](https://developers.google.com/maps/documentation/javascript/cloud-customization)
- [Advanced Markers](https://developers.google.com/maps/documentation/javascript/advanced-markers)

## 🚀 今後の拡張可能性

- **アニメーション**: マーカーの表示アニメーション
- **クラスタリング**: 近い位置のマーカーをグループ化
- **フィルタリング**: 年代や旅行タイプでの絞り込み
- **統計表示**: 地図上での統計情報の表示
- **ルート表示**: 旅行ルートの線表示

---

**作成日**: 2025年1月
**更新日**: 2025年1月
**作成者**: Cursor AI Assistant
