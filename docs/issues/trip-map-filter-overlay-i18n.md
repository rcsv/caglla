# TripMap フィルタ条件表示のi18n化

## 問題

地図上に表示されるフィルタ条件のオーバーレイ情報が、全て日本語でハードコードされています。

## 現状

### 該当箇所

`components/trip/TripMap.tsx` の690-708行目に、地図のオーバーレイ情報が表示されています：

```typescript
{/* マップのオーバーレイ情報 */}
<div className={`absolute top-4 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs ${getZIndexClass('MAIN_CONTENT')}`}>
  <div className="text-sm text-gray-600">
    <div className="font-medium text-gray-900 mb-1">
      旅程マップ
      {selectedDayId && (
        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          フィルタ中
        </span>
      )}
    </div>
    <div>
      {itineraries.filter(i => i.place_data?.geometry?.location).length} 箇所の地点を表示
      {selectedDayId && (
        <div className="text-xs text-red-600 mt-1">
          選択された日程のみ表示中
        </div>
      )}
    </div>
  </div>
</div>
```

### 問題点

以下の日本語文字列がハードコードされています：

1. **"旅程マップ"** (693行目) - 地図のタイトル
2. **"フィルタ中"** (696行目) - フィルタリング状態のバッジ
3. **"{count} 箇所の地点を表示"** (701行目) - 表示中の地点数
4. **"選択された日程のみ表示中"** (704行目) - フィルタ条件の説明

## 解決策

### i18nキーの追加

```typescript
// lib/i18n/index.ts
'tripMap.overlay.title': 'Itinerary Map'
'tripMap.overlay.filtering': 'Filtering'
'tripMap.overlay.displayingLocations': '{count} locations displayed'
'tripMap.overlay.filteredByDay': 'Only selected dates are displayed'

// 日本語
'tripMap.overlay.title': '旅程マップ'
'tripMap.overlay.filtering': 'フィルタ中'
'tripMap.overlay.displayingLocations': '{count} 箇所の地点を表示'
'tripMap.overlay.filteredByDay': '選択された日程のみ表示中'
```

### 実装

```typescript
import { t } from '@/lib/i18n'

// ...

{/* マップのオーバーレイ情報 */}
<div className={`absolute top-4 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-w-xs ${getZIndexClass('MAIN_CONTENT')}`}>
  <div className="text-sm text-gray-600">
    <div className="font-medium text-gray-900 mb-1">
      {t('tripMap.overlay.title')}
      {selectedDayId && (
        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
          {t('tripMap.overlay.filtering')}
        </span>
      )}
    </div>
    <div>
      {t('tripMap.overlay.displayingLocations').replace('{count}', 
        itineraries.filter(i => i.place_data?.geometry?.location).length.toString()
      )}
      {selectedDayId && (
        <div className="text-xs text-red-600 mt-1">
          {t('tripMap.overlay.filteredByDay')}
        </div>
      )}
    </div>
  </div>
</div>
```

## 実装手順

1. **i18nキーの追加**
   - `lib/i18n/index.ts` に `tripMap.overlay.*` キーを追加

2. **文字列の置き換え**
   - `components/trip/TripMap.tsx` の690-708行目を修正
   - `t()` 関数を使用して文字列を置き換え
   - プレースホルダー `{count}` の置き換え処理を追加

3. **importの追加**
   - `import { t } from '@/lib/i18n'` を追加（既に存在する場合は確認）

4. **テスト**
   - 日本語環境で正しく表示されることを確認
   - 英語環境で正しく表示されることを確認
   - フィルタリング状態での表示を確認

## 受け入れ基準

- [ ] "旅程マップ" がi18n化されている
- [ ] "フィルタ中" がi18n化されている
- [ ] "{count} 箇所の地点を表示" がi18n化されている（プレースホルダー置換も含む）
- [ ] "選択された日程のみ表示中" がi18n化されている
- [ ] 日本語環境と英語環境の両方で正しく表示される
- [ ] フィルタリング状態での表示が正常に動作する

## 関連ファイル

- `components/trip/TripMap.tsx` (690-708行目)
- `lib/i18n/index.ts` (i18nキーの追加)

## ステータス

🟡 **未着手**

## 備考

- このオーバーレイは地図上に常に表示される情報なので、デバッグ用ではなくユーザー向けの情報として扱うべき
- プレースホルダー `{count}` の置き換えは `.replace()` メソッドを使用
- 将来的には、このオーバーレイを折りたたみ可能にする機能も検討できる

