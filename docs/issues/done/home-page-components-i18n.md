# Issue: /home/page.tsxで使用しているコンポーネントがi18n化されていない

**作成日**: 2025-10-31  
**解決日**: 2025-10-31  
**状態**: ✅ 解決済み  
**優先度**: 中  
**関連ファイル**: 
- `app/home/page.tsx`
- `components/common/MemoriesSection.tsx`
- `components/common/UpcomingTripsSection.tsx`
- `components/stats/CountryStatsSimple.tsx`
- `components/ui/PlanInfoDisplay.tsx`
- `components/tripcard/NextTripCard.tsx`

---

## 📋 概要

`/home/page.tsx`自体はi18n化済みだが、使用している以下のコンポーネントがまだi18n化されていない：

- 思い出（`MemoriesSection`）
- 計画中の旅行（`UpcomingTripsSection`）
- 国別統計（`CountryStatsSimple`）
- プラン情報（`PlanInfoDisplay`）
- 次の旅行プラン（`NextTripCard`）
- 新しい旅行を作成（`NextTripCard`内の作成ボタン）

---

## 🐛 問題の詳細

### 影響を受けるコンポーネント

1. **`components/common/MemoriesSection.tsx`**
   - "思い出"（タイトル）
   - "{count}件"（件数表示）
   - "すべての思い出"（ボタン）

2. **`components/common/UpcomingTripsSection.tsx`**
   - "計画中の旅行"（タイトル）
   - "{count}件"（件数表示）
   - "すべての旅行プラン"（ボタン）

3. **`components/stats/CountryStatsSimple.tsx`**
   - "国別統計"（タイトル）
   - "{totalTrips}回の旅行 • {totalCountries}カ国"（サマリー）
   - "回"（訪問回数表示）
   - "まだ旅行がありません"（空状態）
   - "エラーが発生しました"（エラー表示）
   - "再試行"（リトライボタン）
   - "詳細を見る →"（詳細ボタン）

4. **`components/ui/PlanInfoDisplay.tsx`**
   - プラン情報表示のテキスト（要確認）

5. **`components/tripcard/NextTripCard.tsx`**
   - 次の旅行プラン関連のテキスト（例: 見出しや説明）
   - 「新しい旅行を作成」ボタンの文言・ARIAラベル・トースト/エラーメッセージ
   - 日付/期間の書式（例: "11/1 - 2日間" など）
   - アクセスレベルのラベル（例: 「Private」バッジ）

---

## 💡 解決方針

1. 各コンポーネントに`t()`関数をインポート
2. ハードコードされた日本語テキストをi18nキーに置き換え
3. `lib/i18n/index.ts`に必要な翻訳キーを追加
4. 英語・日本語の翻訳を追加

### 優先順位

- **高**: MemoriesSection、UpcomingTripsSection（頻繁に表示される）
- **中**: CountryStatsSimple（統計情報表示）
- **低**: PlanInfoDisplay
- **中**: NextTripCard（新規作成ボタン含む）

---

## 🔗 関連ファイル

- `app/home/page.tsx` - ホームページ（既にi18n化済み）
- `components/common/MemoriesSection.tsx`
- `components/common/UpcomingTripsSection.tsx`
- `components/stats/CountryStatsSimple.tsx`
- `components/ui/PlanInfoDisplay.tsx`
- `components/tripcard/NextTripCard.tsx`
- `lib/i18n/index.ts` - i18nキー定義

