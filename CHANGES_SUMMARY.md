# 変更内容の整理

## 1. Privacy Policyページのi18n化
- **ファイル**: `app/privacy/page.tsx`, `lib/i18n/index.ts`
- **変更内容**: Privacy Policyページの全テキストをi18n化（23個のキーを追加）
- **関連Issue**: なし（新規対応）

## 2. Loadingコンポーネントのハイドレーションエラー修正
- **ファイル**: `components/common/Loading.tsx`
- **変更内容**: SSRとクライアント側で言語が異なることによるハイドレーションエラーを修正
- **関連Issue**: なし（バグ修正）

## 3. Next.js App Routerのparams型修正（CodeRabbit提案対応）
- **ファイル**: 
  - `app/api/checklists/presets/[presetSlug]/route.ts`
  - `app/api/plans/[planSlug]/duplicate/route.ts`
  - `app/api/plans/[planSlug]/template/route.ts`
  - `app/api/reservation-templates/[templateId]/route.ts`
  - `app/api/trip/[tripSlug]/route.ts`
  - `app/api/trips/[tripSlug]/checklist/apply-preset/route.ts`
  - `app/api/trips/[tripSlug]/ical-token/route.ts`
  - `app/api/trips/[tripSlug]/ical/route.ts`
  - `app/api/trips/[tripSlug]/pdf/route.ts`
  - `app/api/trips/[tripSlug]/preview/route.ts`
  - `app/api/trips/[tripSlug]/route.ts`
  - `app/blog/[slug]/page.tsx`
- **変更内容**: Next.js 15対応のため、`params`を`Promise<{...}>`として扱うように修正
- **関連Issue**: `docs/issues/build-errors-type-check-2025-11-06.md` (Issue #29)

## 4. FirestoreDate型変換の修正
- **ファイル**: 
  - `app/memories/page.tsx`
  - `components/ui/StorageUsageDisplay.tsx`
  - `components/ui/TimezoneLogManager.tsx`
- **変更内容**: `FirestoreDate`型を`Date`に変換するために`toDateOrNull`を使用
- **関連Issue**: `docs/issues/build-errors-type-check-2025-11-06.md` (Issue #29)

## 5. 通貨推測機能の改善（Issue #34）
- **ファイル**: 
  - `lib/core/locations.ts` (国マッピングの拡充: 46→141カ国)
  - `lib/utils/currency.ts` (通貨定義の拡充: 40→90通貨、階層的フォールバック実装)
  - `components/trip/ScheduleCard.tsx`
  - `components/trip/SortableItineraryCard.tsx`
  - `components/trip/TripItineraryView.tsx`
- **変更内容**: CodeRabbit提案に沿って通貨推測ロジックを改善
- **関連Issue**: `docs/issues/itinerary-currency-inference-weak.md` (Issue #34)

## 6. コスト集計機能の詳細表示（Issue #33）
- **ファイル**: 
  - `lib/travel/cost-aggregation.ts`
  - `components/stats/TripCostDisplay.tsx`
  - `components/trip/TripSummaryView.tsx`
- **変更内容**: コストの詳細内訳を表示する機能を追加
- **関連Issue**: `docs/issues/feature-trip-cost-itemized-breakdown.md` (Issue #33)

## 7. アクティビティカテゴリのi18n化（Issue #48）
- **ファイル**: 
  - `lib/data/activity-categories.ts`
  - `lib/i18n/index.ts`
- **変更内容**: 全SecondaryCategoryのi18n対応（約148キー）、Transportカテゴリにgas_stationとtoll_paymentを追加
- **関連Issue**: `docs/issues/activity-categories-i18n.md` (Issue #48)

## 8. プロセス環境変数の修正（Issue #29）
- **ファイル**: 
  - `lib/api/google/geocoding.ts`
  - `lib/api/google/places.ts`
- **変更内容**: クライアント側で`process is not defined`エラーを防ぐため、`getApiKey()`関数を追加
- **関連Issue**: `docs/issues/build-errors-type-check-2025-11-06.md` (Issue #29)

## 9. 画像削除機能とその他改善
- **ファイル**: 
  - `app/[userSlug]/[tripSlug]/page.tsx` (onDelete prop追加、iCal制限)
  - `components/trip/TripEditor.tsx` (画像削除ロジック改善)
  - `lib/firebase/admin.ts` (Storage Bucket設定)
  - `storage.rules` (Storage Rules改善)
- **変更内容**: 画像削除機能の改善、iCal共有制限、Storage Rulesの改善
- **関連Issue**: Issue #49, #45, #46

## 10. AddScheduleModalのi18n化（Issue #47）
- **ファイル**: `components/modals/AddScheduleModal.tsx`
- **変更内容**: ハードコードされた日本語文字列をi18n化
- **関連Issue**: `docs/issues/add-schedule-modal-japanese-hardcoded.md` (Issue #47)

## 11. 日付ユーティリティの修正
- **ファイル**: `lib/utils/date.ts`
- **変更内容**: `FirestoreDate`型の変換処理を追加
- **関連Issue**: `docs/issues/build-errors-type-check-2025-11-06.md` (Issue #29)

## 12. Issueドキュメントの更新
- **ファイル**: 複数の`docs/issues/*.md`ファイル
- **変更内容**: 各Issueの解決状況と実装内容を更新
- **関連Issue**: 各Issueドキュメント

