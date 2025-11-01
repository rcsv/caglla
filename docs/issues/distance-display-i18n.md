# Issue: 総移動距離表示が日本語ハードコード

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 中  
**種類**: i18n不備  
**関連ファイル**: 
- `components/stats/TripDistanceDisplay.tsx`（総移動距離表示コンポーネント）

---

## 📋 概要

総移動距離表示コンポーネント（`TripDistanceDisplay`）で、タイトル、ラベル、メッセージが日本語ハードコードされており、英語設定時でも日本語が表示される。

---

## 🐛 問題の詳細

### 日本語ハードコード箇所

**ファイル**: `components/stats/TripDistanceDisplay.tsx`

#### 1. タイトル
- 81行目: `総移動距離`（ローディング時）
- 85行目: `総移動距離を計算中...`
- 94行目: `総移動距離`（エラー時）
- 113行目: `総移動距離`（データなし時）
- 138行目: `総移動距離`（通常表示時）

#### 2. エラーメッセージ
- 66行目: `距離計算に失敗しました`
- 70行目: `総移動距離の計算に失敗しました`
- 100行目: `距離計算に失敗しました`

#### 3. データなしメッセージ
- 121-124行目:
  ```typescript
  {placesWithLocation.length === 0 
    ? '場所情報が設定されたスケジュールがありません' 
    : '移動距離を計算するには、場所情報が設定されたスケジュールが2つ以上必要です'
  }
  ```
- 127行目: `各スケジュールに場所を設定すると、総移動距離が表示されます`

#### 4. ラベル
- 149行目: `訪問地`
- 160行目: `総距離`
- 171行目: `総時間`
- 179行目: `平均距離`
- 185行目: `平均時間`
- 195行目: `💡 各Venue間の詳細な距離・時間はスケジュール内で確認できます`

---

## 💡 解決方針

### Phase 1: i18nキーの追加

`lib/i18n/index.ts`に以下のキーを追加:

```typescript
// Distance Display
| 'distance.title'
| 'distance.loading'
| 'distance.error.calculationFailed'
| 'distance.error.totalCalculationFailed'
| 'distance.empty.noPlaces'
| 'distance.empty.needTwoOrMore'
| 'distance.empty.description'
| 'distance.visitedPlaces'
| 'distance.total'
| 'distance.totalTime'
| 'distance.average'
| 'distance.averageTime'
| 'distance.perSegment'
| 'distance.hint.details'
```

### Phase 2: TripDistanceDisplayのi18n化

**ファイル**: `components/stats/TripDistanceDisplay.tsx`

```typescript
import { t } from '@/lib/i18n'

// タイトル
<Card title={<div className="flex items-center">
  <LocationIcon className="w-5 h-5 mr-2" color="#2563eb" />
  {t('distance.title')}
</div>}>

// ローディング
<span>{t('distance.loading')}</span>

// エラーメッセージ
setError(t('distance.error.calculationFailed'))
setError(t('distance.error.totalCalculationFailed'))
<div className="text-red-500 text-sm mb-2">
  {error}
</div>
<p className="text-gray-500 text-xs">
  {t('distance.error.calculationFailed')}
</p>

// データなしメッセージ
<p className="text-gray-600 text-sm">
  {placesWithLocation.length === 0 
    ? t('distance.empty.noPlaces')
    : t('distance.empty.needTwoOrMore')
  }
</p>
<p className="text-gray-500 text-xs mt-2">
  {t('distance.empty.description')}
</p>

// ラベル
<div className="text-xs text-gray-500">
  {t('distance.visitedPlaces')}
</div>
<div className="text-xs text-gray-500">
  {t('distance.total')}
</div>
<div className="text-xs text-gray-500">
  {t('distance.totalTime')}
</div>
<div className="text-gray-600 mb-1">
  {t('distance.average')}
</div>
<div className="text-gray-600 mb-1">
  {t('distance.averageTime')}
</div>
<div className="font-medium">
  {Math.round(...)}km{t('distance.perSegment')}
</div>
<div className="font-medium">
  {Math.round(...)}{t('distance.perTimeSegment')}
</div>

// ヒント
<p className="text-xs text-gray-500">
  💡 {t('distance.hint.details')}
</p>
```

### Phase 3: i18n辞書の実装

```typescript
// en辞書
'distance.title': 'Total Distance',
'distance.loading': 'Calculating total distance...',
'distance.error.calculationFailed': 'Distance calculation failed',
'distance.error.totalCalculationFailed': 'Total distance calculation failed',
'distance.empty.noPlaces': 'No schedules with location information',
'distance.empty.needTwoOrMore': 'At least 2 schedules with location information are required to calculate distance',
'distance.empty.description': 'Add locations to your schedules to display total distance',
'distance.visitedPlaces': 'Visited Places',
'distance.total': 'Total Distance',
'distance.totalTime': 'Total Time',
'distance.average': 'Average Distance',
'distance.averageTime': 'Average Time',
'distance.perSegment': '/segment',
'distance.perTimeSegment': ' min/segment',
'distance.hint.details': 'You can check detailed distance and time between venues in the schedule',

// ja辞書
'distance.title': '総移動距離',
'distance.loading': '総移動距離を計算中...',
'distance.error.calculationFailed': '距離計算に失敗しました',
'distance.error.totalCalculationFailed': '総移動距離の計算に失敗しました',
'distance.empty.noPlaces': '場所情報が設定されたスケジュールがありません',
'distance.empty.needTwoOrMore': '移動距離を計算するには、場所情報が設定されたスケジュールが2つ以上必要です',
'distance.empty.description': '各スケジュールに場所を設定すると、総移動距離が表示されます',
'distance.visitedPlaces': '訪問地',
'distance.total': '総距離',
'distance.totalTime': '総時間',
'distance.average': '平均距離',
'distance.averageTime': '平均時間',
'distance.perSegment': '/区間',
'distance.perTimeSegment': '分/区間',
'distance.hint.details': '各Venue間の詳細な距離・時間はスケジュール内で確認できます',
```

---

## 🔗 関連ファイル

- `components/stats/TripDistanceDisplay.tsx` - 総移動距離表示コンポーネント（約205行）
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [ ] `TripDistanceDisplay`の全日本語文字列がi18n化される
- [ ] 英語設定時に全て英語で表示される
- [ ] 日本語設定時に全て日本語で表示される
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）

---

## 📝 実装時の注意事項

1. **単位表記**
   - 距離の単位（km, m）と時間の単位（分）は国際標準なので変更不要
   - ただし、将来の単位設定機能（`temperature-distance-unit-settings.md`）で対応予定

2. **区切り文字**
   - `/区間` → `/segment`（英語）
   - `/区間` → `/segment`（日本語、そのままでも可）

3. **条件分岐メッセージ**
   - `placesWithLocation.length === 0` の条件に応じて異なるメッセージを表示
   - i18nキーを2つ用意して対応

4. **エラーメッセージの統一**
   - `距離計算に失敗しました`と`総移動距離の計算に失敗しました`の2種類がある
   - より具体的な`distance.error.totalCalculationFailed`を使用することを推奨

5. **既存のi18nキーとの整合性**
   - `nav.totalDistance`など、既存のキーと重複しないよう注意

---

## 🔗 関連Issue

- `temperature-distance-unit-settings.md` - 将来の単位設定機能（距離単位の切り替えに対応）

