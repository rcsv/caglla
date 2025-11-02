# Issue: Activity Analysis表示が日本語ハードコード

**作成日**: 2025-11-01  
**解決日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**種類**: i18n不備  
**関連ファイル**: 
- `components/stats/ActivityStatsDisplay.tsx`（アクティビティ統計表示コンポーネント）
- `lib/data/activity-categories.ts`（アクティビティカテゴリー定義、関連Issue: `activity-categories-i18n.md`）

---

## 📋 概要

Activity Analysis表示コンポーネント（`ActivityStatsDisplay`）で、ラベルやメッセージが日本語ハードコードされており、英語設定時でも日本語が表示される。また、アクティビティカテゴリー名も日本語で表示される（これは別Issue `activity-categories-i18n.md` で対応予定）。

---

## 🐛 問題の詳細

### 日本語ハードコード箇所

**ファイル**: `components/stats/ActivityStatsDisplay.tsx`

#### 1. 空状態メッセージ
- 95行目: `アクティビティタグが設定されていません。`
- 96行目: `旅程にアクティビティタグを追加すると、ここに統計が表示されます。`

#### 2. ラベル
- 121行目: `アクティビティ総数`
- 126行目: `カテゴリー別分布`
- 134行目: `({data.count}回)`（回数表示）
- 149行目: `詳細アクティビティ Top 5`
- 157行目: `{count}回`（回数表示）

#### 3. アクティビティカテゴリー名（別Issueで対応）

- 131行目: `getPrimaryCategoryShortLabel(category)` - 日本語を返す
- 155行目: `getSecondaryCategoryLabel(primary, secondary)` - 日本語を返す

これらは`lib/data/activity-categories.ts`で定義されており、別Issue（`activity-categories-i18n.md`）で対応予定。

---

## 💡 解決方針

### Phase 1: i18nキーの追加

`lib/i18n/index.ts`に以下のキーを追加:

```typescript
// Activity Analysis Display
| 'activity.analysis.empty'
| 'activity.analysis.empty.description'
| 'activity.analysis.total'
| 'activity.analysis.categoryDistribution'
| 'activity.analysis.detailsTop5'
| 'activity.analysis.times'
```

### Phase 2: ActivityStatsDisplayのi18n化

**ファイル**: `components/stats/ActivityStatsDisplay.tsx`

```typescript
import { t } from '@/lib/i18n'

// 空状態メッセージ
<p className="text-gray-500 text-center py-8">
  {t('activity.analysis.empty')}<br />
  {t('activity.analysis.empty.description')}
</p>

// ラベル
<p className="text-sm text-gray-500">
  {t('activity.analysis.total')}
</p>

<h4 className="text-sm font-medium text-gray-600">
  {t('activity.analysis.categoryDistribution')}
</h4>

<span className="text-gray-600 font-medium">
  {data.percentage}% ({data.count}{t('activity.analysis.times')})
</span>

<h4 className="text-sm font-medium text-gray-600 mb-3">
  {t('activity.analysis.detailsTop5')}
</h4>

<span className="text-gray-800 font-medium">
  {count}{t('activity.analysis.times')}
</span>
```

### Phase 3: i18n辞書の実装

```typescript
// en辞書
'activity.analysis.empty': 'No activity tags have been set.',
'activity.analysis.empty.description': 'Add activity tags to your itinerary to see statistics here.',
'activity.analysis.total': 'Total Activities',
'activity.analysis.categoryDistribution': 'Distribution by Category',
'activity.analysis.detailsTop5': 'Detailed Activities Top 5',
'activity.analysis.times': ' times',

// ja辞書
'activity.analysis.empty': 'アクティビティタグが設定されていません。',
'activity.analysis.empty.description': '旅程にアクティビティタグを追加すると、ここに統計が表示されます。',
'activity.analysis.total': 'アクティビティ総数',
'activity.analysis.categoryDistribution': 'カテゴリー別分布',
'activity.analysis.detailsTop5': '詳細アクティビティ Top 5',
'activity.analysis.times': '回',
```

### Phase 4: アクティビティカテゴリー名のi18n化（別Issueで対応）

`activity-categories-i18n.md`で対応予定のため、ここでは触れない。

ただし、実装時は以下の順序で対応することを推奨:

1. まず`ActivityStatsDisplay`のi18n化（本Issue）
2. その後、`activity-categories-i18n.md`の対応（アクティビティカテゴリー名のi18n化）

---

## 🔗 関連ファイル

- `components/stats/ActivityStatsDisplay.tsx` - アクティビティ統計表示コンポーネント（約166行）
- `lib/data/activity-categories.ts` - アクティビティカテゴリー定義（別Issueで対応）
- `lib/i18n/index.ts` - i18n辞書（約1200行）

---

## ✅ 完了条件

- [ ] `ActivityStatsDisplay`の全日本語文字列がi18n化される（カテゴリー名を除く）
- [ ] 英語設定時に全て英語で表示される（カテゴリー名は別Issueで対応）
- [ ] 日本語設定時に全て日本語で表示される
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）
- [ ] アクティビティカテゴリー名のi18n化は別Issueで対応することを明記

---

## 📝 実装時の注意事項

1. **アクティビティカテゴリー名との関係**
   - `getPrimaryCategoryShortLabel()`と`getSecondaryCategoryLabel()`が返す値は別Issueで対応
   - 本Issueでは、これらの関数の戻り値はそのまま使用し、ラベル・メッセージのみi18n化

2. **回数の表示**
   - `({data.count}回)` → `({data.count}{t('activity.analysis.times')})`
   - 英語では"times"、日本語では"回"

3. **Top 5の表記**
   - "詳細アクティビティ Top 5" は部分的に英語だが、全体として日本語文脈
   - i18nキーで完全に制御する

4. **既存のi18nキーとの整合性**
   - `trip.schedule.activity`など、既存のキーと重複しないよう注意

---

## 🔗 関連Issue

- `activity-categories-i18n.md` - アクティビティカテゴリー名のi18n化（別Issue、優先的に対応）

