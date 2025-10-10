# console.log 使用箇所リスト - 修正サマリー

**作成日**: 2025年10月9日  
**分析対象**: Caglla Travel Manager 全コードベース  
**分析結果**: 99ファイル、670箇所

---

## 📊 優先度別サマリー

| 優先度 | ファイル数 | 総箇所数 | console.log | console.error | console.warn |
|-------|----------|---------|------------|--------------|--------------|
| **🔴 A-最優先** | 34 | 170 | 98 | 64 | 8 |
| **🟡 B-高** | 23 | 217 | 96 | 96 | 25 |
| **🟢 C-中** | 22 | 132 | 73 | 56 | 3 |
| **🔵 D-低** | 20 | 151 | 93 | 58 | 0 |
| **合計** | **99** | **670** | **360** | **274** | **36** |

---

## 🔴 優先度A（最優先）: APIルート - 34ファイル、170箇所

### Top 10 修正対象ファイル

| 順位 | ファイル | 箇所 | log | error | warn | 推定工数 |
|-----|---------|-----|-----|-------|------|---------|
| 1 | `app/api/trip/[id]/route.ts` | 28 | 19 | 8 | 1 | 2時間 |
| 2 | `app/api/trips/route.ts` | 19 | 16 | 3 | 0 | 1.5時間 |
| 3 | `app/api/users/migrate/route.ts` | 16 | 14 | 2 | 0 | 1.5時間 |
| 4 | `app/api/trips/recommended/route.ts` | 12 | 9 | 2 | 1 | 1時間 |
| 5 | `app/api/debug/auth/route.ts` | 11 | 8 | 2 | 1 | 1時間 ⚠️ |
| 6 | `app/api/itineraries/insert/route.ts` | 10 | 8 | 2 | 0 | 1時間 |
| 7 | `app/api/itineraries/route.ts` | 9 | 5 | 4 | 0 | 45分 |
| 8 | `app/api/trips/[id]/route.ts` | 8 | 4 | 4 | 0 | 45分 |
| 9 | `app/api/users/route.ts` | 6 | 4 | 2 | 0 | 30分 |
| 10 | `app/api/itineraries/reorder/route.ts` | 5 | 3 | 1 | 1 | 30分 |

⚠️ **注意**: `app/api/debug/auth/route.ts` は認証デバッグ用で、機密情報が含まれる可能性が高いため最優先で対応

### 完全リスト

<details>
<summary>📋 全34ファイルの詳細を表示</summary>

| # | ファイル | 箇所 | log | error | warn |
|---|---------|-----|-----|-------|------|
| 1 | app/api/trip/[id]/route.ts | 28 | 19 | 8 | 1 |
| 2 | app/api/trips/route.ts | 19 | 16 | 3 | 0 |
| 3 | app/api/users/migrate/route.ts | 16 | 14 | 2 | 0 |
| 4 | app/api/trips/recommended/route.ts | 12 | 9 | 2 | 1 |
| 5 | app/api/debug/auth/route.ts | 11 | 8 | 2 | 1 |
| 6 | app/api/itineraries/insert/route.ts | 10 | 8 | 2 | 0 |
| 7 | app/api/itineraries/route.ts | 9 | 5 | 4 | 0 |
| 8 | app/api/trips/[id]/route.ts | 8 | 4 | 4 | 0 |
| 9 | app/api/users/route.ts | 6 | 4 | 2 | 0 |
| 10 | app/api/itineraries/reorder/route.ts | 5 | 3 | 1 | 1 |
| 11 | app/api/itineraries/[id]/route.ts | 4 | 2 | 2 | 0 |
| 12 | app/api/places/search/route.ts | 4 | 3 | 1 | 0 |
| 13 | app/api/trips/accessible/route.ts | 4 | 0 | 3 | 1 |
| 14 | app/api/user/plan/route.ts | 4 | 0 | 2 | 2 |
| 15 | app/api/distance/batch/route.ts | 3 | 1 | 1 | 1 |
| 16 | app/api/route-optimization/route.ts | 3 | 1 | 2 | 0 |
| 17 | app/api/debug/firebase/route.ts | 2 | 1 | 1 | 0 |
| 18 | app/api/plans/route.ts | 2 | 0 | 2 | 0 |
| 19 | app/api/storage/quota/route.ts | 2 | 0 | 2 | 0 |
| 20 | app/api/storage/usage/route.ts | 2 | 0 | 2 | 0 |
| 21 | app/api/templates/route.ts | 2 | 0 | 2 | 0 |
| 22 | app/api/unsplash/route.ts | 2 | 0 | 2 | 0 |
| 23-34 | その他12ファイル（各1箇所） | 12 | 0 | 12 | 0 |

</details>

**Phase 1 合計**: 34ファイル、170箇所、**推定工数: 12-15時間**

---

## 🟡 優先度B（高）: lib/ - 23ファイル、217箇所

### Top 10 修正対象ファイル

| 順位 | ファイル | 箇所 | log | error | warn | 推定工数 |
|-----|---------|-----|-----|-------|------|---------|
| 1 | `lib/places-cache.ts` | 30 | 17 | 13 | 0 | 2時間 |
| 2 | `lib/image-upload.ts` | 29 | 15 | 6 | 8 | 2時間 |
| 3 | `lib/weather-api.ts` | 21 | 11 | 5 | 5 | 1.5時間 |
| 4 | `lib/country-utils.ts` | 20 | 19 | 0 | 1 | 1.5時間 |
| 5 | `lib/slug-data-helpers.ts` | 15 | 12 | 3 | 0 | 1時間 |
| 6 | `lib/route-optimization.ts` | 12 | 6 | 6 | 0 | 1時間 |
| 7 | `lib/timezone-utils.ts` | 10 | 1 | 7 | 2 | 45分 |
| 8 | `lib/itinerary-reorder.ts` | 8 | 5 | 3 | 0 | 45分 |
| 9 | `lib/firebase-admin.ts` | 7 | 1 | 6 | 0 | 30分 ⚠️ |
| 10 | `lib/storage-management.ts` | 7 | 1 | 5 | 1 | 30分 |

⚠️ **注意**: `lib/firebase-admin.ts` は一部対応済み（環境変数検証部分）、残りの箇所を移行

### 完全リスト

<details>
<summary>📋 全23ファイルの詳細を表示</summary>

| # | ファイル | 箇所 | log | error | warn |
|---|---------|-----|-----|-------|------|
| 1 | lib/places-cache.ts | 30 | 17 | 13 | 0 |
| 2 | lib/image-upload.ts | 29 | 15 | 6 | 8 |
| 3 | lib/weather-api.ts | 21 | 11 | 5 | 5 |
| 4 | lib/country-utils.ts | 20 | 19 | 0 | 1 |
| 5 | lib/slug-data-helpers.ts | 15 | 12 | 3 | 0 |
| 6 | lib/route-optimization.ts | 12 | 6 | 6 | 0 |
| 7 | lib/timezone-utils.ts | 10 | 1 | 7 | 2 |
| 8 | lib/itinerary-reorder.ts | 8 | 5 | 3 | 0 |
| 9 | lib/firebase-admin.ts | 7 | 1 | 6 | 0 |
| 10 | lib/storage-management.ts | 7 | 1 | 5 | 1 |
| 11 | lib/browser-info.ts | 6 | 0 | 0 | 6 |
| 12 | lib/currency-utils.ts | 6 | 1 | 4 | 1 |
| 13 | lib/plan-save-operations.ts | 6 | 0 | 6 | 0 |
| 14 | lib/user-data-context.tsx | 6 | 0 | 6 | 0 |
| 15 | lib/auth-context.tsx | 5 | 2 | 3 | 0 |
| 16 | lib/places-api.ts | 5 | 3 | 2 | 0 |
| 17 | lib/unsplash-api.ts | 5 | 1 | 4 | 0 |
| 18 | lib/distance-api.ts | 4 | 0 | 4 | 0 |
| 19 | lib/env-validation.ts | 4 | 0 | 4 | 0 |
| 20 | lib/geocoding-api.ts | 4 | 2 | 2 | 0 |
| 21 | lib/firebase.ts | 3 | 0 | 3 | 0 |
| 22 | lib/api-helpers.ts | 1 | 0 | 1 | 0 |
| 23 | lib/subscription-context.tsx | 3 | 0 | 3 | 0 |

</details>

**Phase 2 合計**: 23ファイル、217箇所、**推定工数: 14-18時間**

---

## 🟢 優先度C（中）: components/ - 22ファイル、132箇所

### Top 10 修正対象ファイル

| 順位 | ファイル | 箇所 | log | error | warn | 推定工数 |
|-----|---------|-----|-----|-------|------|---------|
| 1 | `components/trip/ScheduleCard.tsx` | 22 | 13 | 9 | 0 | 1.5時間 |
| 2 | `components/ui/ImageUpload.tsx` | 14 | 5 | 9 | 0 | 1時間 |
| 3 | `components/trip/VenueDistance.tsx` | 12 | 6 | 6 | 0 | 1時間 |
| 4 | `components/tripcard/NextTripMap.tsx` | 11 | 4 | 7 | 0 | 1時間 |
| 5 | `components/modals/POIDialog.tsx` | 9 | 5 | 4 | 0 | 45分 |
| 6 | `components/trip/TripEditor.tsx` | 9 | 4 | 5 | 0 | 45分 |
| 7 | `components/common/CreateTripDialog.tsx` | 9 | 5 | 4 | 0 | 45分 |
| 8 | `components/modals/AddScheduleModal.tsx` | 8 | 5 | 3 | 0 | 45分 |
| 9 | `components/modals/UserSettingsModal.tsx` | 7 | 2 | 5 | 0 | 30分 |
| 10 | `components/trip/TripMap.tsx` | 7 | 5 | 2 | 0 | 30分 |

### 完全リスト

<details>
<summary>📋 全22ファイルの詳細を表示</summary>

| # | ファイル | 箇所 | log | error | warn |
|---|---------|-----|-----|-------|------|
| 1 | components/trip/ScheduleCard.tsx | 22 | 13 | 9 | 0 |
| 2 | components/ui/ImageUpload.tsx | 14 | 5 | 9 | 0 |
| 3 | components/trip/VenueDistance.tsx | 12 | 6 | 6 | 0 |
| 4 | components/tripcard/NextTripMap.tsx | 11 | 4 | 7 | 0 |
| 5 | components/modals/POIDialog.tsx | 9 | 5 | 4 | 0 |
| 6 | components/trip/TripEditor.tsx | 9 | 4 | 5 | 0 |
| 7 | components/common/CreateTripDialog.tsx | 9 | 5 | 4 | 0 |
| 8 | components/modals/AddScheduleModal.tsx | 8 | 5 | 3 | 0 |
| 9 | components/modals/UserSettingsModal.tsx | 7 | 2 | 5 | 0 |
| 10 | components/trip/TripMap.tsx | 7 | 5 | 2 | 0 |
| 11 | components/stats/RecommendedTrips.tsx | 6 | 4 | 2 | 0 |
| 12 | components/ui/AvatarUpload.tsx | 5 | 1 | 4 | 0 |
| 13 | components/trip/CountryMap.tsx | 4 | 2 | 2 | 0 |
| 14 | components/trip/DailyRouteOptimizer.tsx | 4 | 3 | 1 | 0 |
| 15 | components/common/PlaceSearchInput.tsx | 2 | 0 | 2 | 0 |
| 16 | components/stats/CountryStats.tsx | 2 | 0 | 2 | 0 |
| 17 | components/stats/CountryStatsSimple.tsx | 2 | 0 | 2 | 0 |
| 18 | components/ui/StorageUsageDisplay.tsx | 2 | 0 | 2 | 0 |
| 19-22 | その他4ファイル（各1箇所） | 4 | 2 | 2 | 0 |

</details>

**Phase 3 合計**: 22ファイル、132箇所、**推定工数: 9-12時間**

---

## 🔵 優先度D（低）: その他 - 20ファイル、151箇所

主にテストページ、統計表示、サブスクリプション関連

<details>
<summary>📋 20ファイルの詳細を表示</summary>

| # | ファイル | 箇所 | log | error | warn |
|---|---------|-----|-----|-------|------|
| 1 | app/[userSlug]/[tripSlug]/page.tsx | 11 | 2 | 9 | 0 |
| 2 | app/trip/new/page.tsx | 14 | 11 | 3 | 0 |
| 3 | app/test/daily-route-optimization/page.tsx | 1 | 1 | 0 | 0 |
| 4 | app/test/plan-change/page.tsx | 4 | 4 | 0 | 0 |
| 5 | app/test/storage/page.tsx | 4 | 0 | 4 | 0 |
| ... | その他15ファイル | 117 | 75 | 42 | 0 |

</details>

**Phase 4 合計**: 20ファイル、151箇所、**推定工数: 8-10時間**

---

## 📊 総合サマリー

### 工数見積もり

| Phase | 優先度 | ファイル数 | 箇所数 | 推定工数 | 期限目安 |
|-------|-------|----------|-------|---------|---------|
| Phase 1 | 🔴 A-最優先 | 34 | 170 | 12-15時間 | 今週中 |
| Phase 2 | 🟡 B-高 | 23 | 217 | 14-18時間 | 来週中 |
| Phase 3 | 🟢 C-中 | 22 | 132 | 9-12時間 | 2週間以内 |
| Phase 4 | 🔵 D-低 | 20 | 151 | 8-10時間 | 3週間以内 |
| **合計** | - | **99** | **670** | **43-55時間** | **1ヶ月** |

### コンソール種別の内訳

```
console.log   : 360箇所 (53.7%) → logger.debug または logger.info
console.error : 274箇所 (40.9%) → logger.error
console.warn  : 36箇所  (5.4%)  → logger.warn
```

---

## 🎯 推奨される作業フロー

### 1日の作業量（4時間/日と仮定）

**Week 1**: Phase 1（A-最優先）
- Day 1-2: Top 5ファイル（86箇所）
- Day 3-4: 残り29ファイル（84箇所）

**Week 2**: Phase 2（B-高）
- Day 1-2: 外部API統合（60箇所）
- Day 3-4: データ処理・ユーティリティ（157箇所）

**Week 3**: Phase 3（C-中）
- Day 1-2: 重要UIコンポーネント（67箇所）
- Day 3-4: モーダル・地図関連（65箇所）

**Week 4**: Phase 4（D-低）
- Day 1-2: ページコンポーネント（25箇所）
- Day 3-4: その他（126箇所）

---

## 📁 詳細データファイル

すべての詳細データは以下のファイルに記録されています：

- **CSVファイル**: `console-migration-list.csv`
  - 全99ファイルの詳細リスト
  - 各ファイルのconsole種別ごとの箇所数
  - 進捗管理用のステータス列

- **移行計画**: `docs/security/console-log-migration-plan.md`
  - 段階的な移行計画
  - 移行パターンとサンプルコード
  - テスト方法

---

## ✅ 次のアクション

1. **今すぐ**: 
   - [ ] `app/api/debug/auth/route.ts` の修正（機密情報含む）
   - [ ] `app/api/trip/[id]/route.ts` の修正（最も使用頻度が高い）

2. **今週中**:
   - [ ] Phase 1 の Top 10 ファイルを完了
   
3. **来週以降**:
   - [ ] Phase 2-4 を順次実施

---

**作成者**: AI Assistant (Claude Sonnet 4.5)  
**最終更新**: 2025年10月9日  
**進捗確認**: `console-migration-list.csv` のStatusカラムを更新

