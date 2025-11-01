# Issue: 左メニューのSummaryセクションでtitleとsubtitleが重複表示される

**作成日**: 2025-11-01  
**解決日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**種類**: UX改善 / i18n不備  
**関連ファイル**: 
- `components/planner/NavigationMenu.tsx`（左メニュー）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

左メニューのSummaryセクションで、各メニューアイテムの`title`（主タイトル）と`subtitle`（副タイトル）が英語設定時に同じ言葉が2つ並ぶ状態になっている。以前は日英併記（title: 英語、subtitle: 日本語）だったが、i18n化に伴いsubtitleも英語に変更した結果、重複表示が発生している。

また、Weather Forecastのsubtitleがまだ日本語ハードコード（`'天気予報'`）のまま残っている。

---

## 🐛 問題の詳細

### 現状の問題

#### 1. 重複表示が発生しているアイテム

**Reservation:**
- `title: 'Reservation'`（英語固定）
- `subtitle: t('nav.reservation')` → 英語設定時は `'Reservation'`
- **結果**: "Reservation" と "Reservation" が2つ並ぶ

**Activity Statistics:**
- `title: 'Activity Statistics'`（英語固定）
- `subtitle: t('nav.activityStats')` → 英語設定時は `'Activity Statistics'`
- **結果**: "Activity Statistics" と "Activity Statistics" が2つ並ぶ

#### 2. まだ日本語ハードコードのアイテム

**Weather Forecast:**
- `title: 'Weather Forecast'`（英語固定）
- `subtitle: '天気予報'`（日本語ハードコード）
- **結果**: 英語設定時でも日本語が表示される

#### 3. 正常に動作しているアイテム

**Budget:**
- `title: 'Budget'`（英語固定）
- `subtitle: t('nav.travelCost')` → 英語設定時は `'Travel Cost'`
- **結果**: "Budget" と "Travel Cost" で適切に表示される ✅

**Distances:**
- `title: 'Distances'`（英語固定）
- `subtitle: t('nav.totalDistance')` → 英語設定時は `'Total Distance'`
- **結果**: "Distances" と "Total Distance" で適切に表示される ✅

### コードの現状

```typescript
// components/planner/NavigationMenu.tsx (72-106行目)
children: [
  {
    id: 'weather-forecast',
    title: 'Weather Forecast',
    subtitle: '天気予報',  // ❌ 日本語ハードコード
    icon: <CloudIcon className="w-4 h-4" />,
    onClick: () => onNavigateToSection('weather-forecast')
  },
  {
    id: 'reservation',
    title: 'Reservation',
    subtitle: t('nav.reservation'),  // ⚠️ 英語設定時は 'Reservation'（重複）
    icon: <BookmarkIcon className="w-4 h-4" />,
    onClick: () => onNavigateToSection('reservation')
  },
  {
    id: 'budget',
    title: 'Budget',
    subtitle: t('nav.travelCost'),  // ✅ 'Travel Cost' で適切
    icon: <MoneyIcon className="w-4 h-4" />,
    onClick: () => onNavigateToSection('budget')
  },
  {
    id: 'activity-statistics',
    title: 'Activity Statistics',
    subtitle: t('nav.activityStats'),  // ⚠️ 英語設定時は 'Activity Statistics'（重複）
    icon: <PieChartIcon className="w-4 h-4" />,
    onClick: () => onNavigateToSection('activity-statistics')
  },
  {
    id: 'distance-summary',
    title: 'Distances',
    subtitle: t('nav.totalDistance'),  // ✅ 'Total Distance' で適切
    icon: <LocationIcon className="w-4 h-4" />,
    onClick: () => onNavigateToSection('distance-summary')
  }
]
```

### 期待される動作

**英語設定時:**
- Weather Forecast → "Weather Forecast" のみ（subtitle非表示または空）
- Reservation → "Reservation" のみ（subtitle非表示または空）
- Budget → "Budget" / "Travel Cost"（異なる意味なので両方表示OK）
- Activity Statistics → "Activity Statistics" のみ（subtitle非表示または空）
- Distances → "Distances" / "Total Distance"（異なる意味なので両方表示OK）

**日本語設定時:**
- Weather Forecast → "Weather Forecast" / "天気予報"
- Reservation → "Reservation" / "予約情報"
- Budget → "Budget" / "旅行費用"
- Activity Statistics → "Activity Statistics" / "アクティビティ統計"
- Distances → "Distances" / "総移動距離"

---

## 💡 解決方針

### Phase 1: Weather Forecastのi18n化

#### 1.1: i18nキーの追加

`lib/i18n/index.ts`にWeather Forecast用のキーを追加:

```typescript
| 'nav.weatherForecast'

// en辞書
'nav.weatherForecast': 'Weather Forecast'

// ja辞書
'nav.weatherForecast': '天気予報'
```

#### 1.2: NavigationMenu.tsxの更新

```typescript
{
  id: 'weather-forecast',
  title: 'Weather Forecast',
  subtitle: t('nav.weatherForecast'),  // i18n化
  icon: <CloudIcon className="w-4 h-4" />,
  onClick: () => onNavigateToSection('weather-forecast')
}
```

### Phase 2: titleとsubtitleの重複問題の解決

#### オプションA: titleもi18n化（推奨）

titleもi18n化し、titleとsubtitleが同じ場合はsubtitleを非表示にする。

```typescript
{
  id: 'reservation',
  title: t('nav.reservation'),  // i18n化
  subtitle: t('nav.reservation'),  // 同じキーを使用
  icon: <BookmarkIcon className="w-4 h-4" />,
  onClick: () => onNavigateToSection('reservation')
}
```

そして、表示ロジックでtitleとsubtitleが同じ場合はsubtitleを非表示:

```typescript
// 表示ロジック（例）
{item.title === item.subtitle ? (
  <div className="text-sm font-medium">{item.title}</div>
) : (
  <>
    <div className="text-sm font-medium">{item.title}</div>
    <div className="text-xs text-gray-500">{item.subtitle}</div>
  </>
)}
```

#### オプションB: subtitleを条件付きで非表示

titleとsubtitleが実質的に同じ意味の場合は、subtitleを空にするか条件付きで非表示:

```typescript
// i18nキーの設計を変更
| 'nav.reservation.short'  // 短い説明用（空文字列または非表示）
| 'nav.reservation.full'   // 完全な説明

// または
| 'nav.reservation'        // タイトル用
| 'nav.reservation.description'  // 説明用（空文字列の場合もあり）
```

```typescript
{
  id: 'reservation',
  title: 'Reservation',
  subtitle: t('nav.reservation.description') || undefined,  // 空文字列の場合はundefined
  icon: <BookmarkIcon className="w-4 h-4" />,
  onClick: () => onNavigateToSection('reservation')
}
```

**推奨**: オプションA（titleもi18n化） - より柔軟で、将来的にtitleも多言語対応できる

#### オプションC: subtitleの役割を見直す

subtitleを「説明文」ではなく「カテゴリー・分類」として再定義し、常に異なる情報を表示する。

ただし、現在のBudget（"Budget" / "Travel Cost"）やDistances（"Distances" / "Total Distance"）のように、既に異なる意味で使用されているケースもあるため、この方法は既存の実装と矛盾する可能性がある。

### Phase 3: 表示ロジックの改善

#### 3.1: subtitleの条件付き表示

NavigationMenu.tsxの表示ロジックで、titleとsubtitleが同じ場合や、subtitleが空の場合にsubtitleを非表示にする:

```typescript
// NavigationMenu.tsx の表示ロジック部分
{item.subtitle && item.subtitle !== item.title && (
  <div className="text-xs text-gray-500 truncate">
    {item.subtitle}
  </div>
)}
```

---

## 🔗 関連ファイル

- `components/planner/NavigationMenu.tsx` - 左メニューコンポーネント（約431行）
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [ ] Weather Forecastのsubtitleがi18n化される（`t('nav.weatherForecast')`）
- [ ] Reservationのtitleとsubtitleの重複が解消される
- [ ] Activity Statisticsのtitleとsubtitleの重複が解消される
- [ ] titleとsubtitleが同じ場合にsubtitleが非表示になる（または空文字列になる）
- [ ] 英語設定時に重複表示が発生しない
- [ ] 日本語設定時に適切に日本語が表示される
- [ ] BudgetとDistancesは既存の動作を維持（異なる意味なので両方表示）
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）

---

## 📝 実装時の注意事項

1. **既存の正常動作の維持**
   - Budget（"Budget" / "Travel Cost"）とDistances（"Distances" / "Total Distance"）は、titleとsubtitleが異なる意味を持っているため、両方表示する必要がある
   - これらの動作は変更しない

2. **i18nキーの設計**
   - title用とsubtitle用のキーを分けるか、同じキーを使用するか検討
   - subtitleが空文字列の場合は非表示にする

3. **表示ロジックの一貫性**
   - titleとsubtitleの比較ロジックを統一する
   - パフォーマンスを考慮し、不要な再レンダリングを避ける

4. **後方互換性**
   - 既存のsubtitleの動作を大きく変更しない
   - 段階的な移行を検討

---

## 🔍 参考

- 現在のi18n実装:
  - `t('nav.reservation')` → 英語: `'Reservation'`, 日本語: `'予約情報'`
  - `t('nav.activityStats')` → 英語: `'Activity Statistics'`, 日本語: `'アクティビティ統計'`
  - `t('nav.travelCost')` → 英語: `'Travel Cost'`, 日本語: `'旅行費用'`
  - `t('nav.totalDistance')` → 英語: `'Total Distance'`, 日本語: `'総移動距離'`

- 正常に動作している例:
  - Budget: title="Budget", subtitle="Travel Cost"（異なる意味）
  - Distances: title="Distances", subtitle="Total Distance"（異なる意味）

---

## 💡 拡張アイデア（将来）

1. **動的なsubtitle表示**
   - メニューアイテムにhoverした時にのみsubtitleを表示
   - コンパクトな表示を維持しつつ、詳細情報を提供

2. **ツールチップでの説明**
   - subtitleを削除し、代わりにツールチップ（title属性）で説明を表示
   - よりクリーンなUI

3. **設定による表示切り替え**
   - ユーザー設定で「subtitleを常に表示」「同じ場合は非表示」「常に非表示」を選択可能

