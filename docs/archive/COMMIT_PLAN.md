# コミット計画（Issue別）

## Issue #29: Next.js App Router params型修正とFirestoreDate型変換
**ファイル**:
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
- `app/memories/page.tsx`
- `components/ui/StorageUsageDisplay.tsx`
- `components/ui/TimezoneLogManager.tsx`
- `lib/api/google/geocoding.ts`
- `lib/api/google/places.ts`
- `lib/utils/date.ts`

---

## Issue #34: 通貨推測機能の改善
**ファイル**:
- `lib/core/locations.ts`
- `lib/utils/currency.ts`
- `components/trip/ScheduleCard.tsx`
- `components/trip/SortableItineraryCard.tsx`
- `components/trip/TripItineraryView.tsx`

---

## Issue #33: コスト集計機能の詳細表示
**ファイル**:
- `lib/travel/cost-aggregation.ts`
- `components/stats/TripCostDisplay.tsx`
- `components/trip/TripSummaryView.tsx`

---

## Issue #48: アクティビティカテゴリのi18n化
**ファイル**:
- `lib/data/activity-categories.ts`
- `lib/i18n/index.ts` (アクティビティカテゴリ関連のi18nキーのみ)

---

## Issue #47: AddScheduleModalのi18n化
**ファイル**:
- `components/modals/AddScheduleModal.tsx`
- `lib/i18n/index.ts` (AddScheduleModal関連のi18nキーのみ)

---

## Issue #49, #45, #46: 画像削除機能とその他改善
**ファイル**:
- `app/[userSlug]/[tripSlug]/page.tsx`
- `components/trip/TripEditor.tsx`
- `lib/firebase/admin.ts`
- `storage.rules`

---

## Issue無し: Privacy Policyのi18n化
**ファイル**:
- `app/privacy/page.tsx`
- `lib/i18n/index.ts` (Privacy Policy関連のi18nキーのみ)

---

## Issue無し: Loadingコンポーネントのハイドレーションエラー修正
**ファイル**:
- `components/common/Loading.tsx`

---

## Issueドキュメントの更新
**ファイル**:
- `docs/issues/DIFFICULTY_RANKING.md`
- `docs/issues/activity-categories-i18n.md`
- `docs/issues/create-trip-dialog-date-order-phase2.md`
- `docs/issues/feature-trip-cost-itemized-breakdown.md`
- `docs/issues/itinerary-currency-inference-weak.md`
- `docs/issues/profile-private-trips-not-displaying.md`
- `docs/issues/trip-image-upload-authentication-error.md`

