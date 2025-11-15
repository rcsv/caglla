# バリデーション移行状況 - 残タスク確認

## 📊 Phase 4 (Option A) 移行完了状況

### ✅ 完了したエンドポイント（20個）

1. ✅ `app/api/trips/route.ts` POST - `CreateTripSchema`
2. ✅ `app/api/places/search/route.ts` POST - `PlaceSearchSchema`
3. ✅ `app/api/places/details/route.ts` POST - `PlaceDetailsSchema`
4. ✅ `app/api/places/nearby/route.ts` POST - `PlaceNearbySchema`
5. ✅ `app/api/reservation-templates/[templateId]/route.ts` PUT - `ReservationTemplateInputSchema`
6. ✅ `app/api/itineraries/route.ts` POST - `CreateItinerarySchema`
7. ✅ `app/api/itineraries/insert/route.ts` POST - `InsertItinerarySchema`
8. ✅ `app/api/plans/route.ts` POST - `PlanSaveDataSchema`
9. ✅ `app/api/plans/route.ts` PUT - `UpdatePlanRequestSchema`
10. ✅ `app/api/users/route.ts` POST - `CreateUserSchema`
11. ✅ `app/api/users/[userSlug]/route.ts` PUT - `UpdateUserSchema`
12. ✅ `app/api/itineraries/[id]/route.ts` PUT - `UpdateItinerarySchema`
13. ✅ `app/api/route-optimization/route.ts` POST - `RouteOptimizationRequestSchema`
14. ✅ `app/api/checklists/presets/route.ts` POST - `CreateChecklistPresetSchema`
15. ✅ `app/api/checklists/presets/[presetSlug]/route.ts` PUT - `UpdateChecklistPresetSchema`
16. ✅ `app/api/templates/route.ts` POST - `CreateFromTemplateSchema`
17. ✅ `app/api/users/check-slug/route.ts` POST - `CheckUserSlugSchema`
18. ✅ `app/api/plans/[planSlug]/duplicate/route.ts` POST - `DuplicatePlanSchema`
19. ✅ `app/api/plans/[planSlug]/template/route.ts` POST - `SavePlanAsTemplateSchema`
20. ✅ `app/api/trip/[tripSlug]/replica/route.ts` POST - `CreateReplicaFromTemplateSchema`

---

## 📋 残タスク（未移行エンドポイント）

### 🔴 優先度高：簡単な移行

以下のエンドポイントは比較的シンプルな構造で、すぐに移行可能です。

#### 1. `app/api/trips/[tripSlug]/checklist/apply-preset/route.ts` POST
- **現状**: `parseRequestBody` + `if (!preset_id) return badRequest`
- **必要なスキーマ**: `ApplyChecklistPresetSchema`
  ```typescript
  {
    preset_id: z.string().min(1, 'Preset ID is required')
  }
  ```
- **推定作業時間**: 15分

#### 2. `app/api/itineraries/duplicate-to-day/route.ts` POST
- **現状**: `parseRequestBody` + `if (!itinerary_id || !target_day_id) return badRequest`
- **必要なスキーマ**: `DuplicateItineraryToDaySchema`
  ```typescript
  {
    itinerary_id: z.string().min(1, 'Itinerary ID is required'),
    target_day_id: z.string().min(1, 'Target day ID is required')
  }
  ```
- **推定作業時間**: 15分

#### 3. `app/api/itineraries/reorder/route.ts` POST
- **現状**: `parseRequestBody` + `if (!dayId || !itineraryIds || !Array.isArray(itineraryIds)) return badRequest`
- **必要なスキーマ**: `ReorderItinerariesSchema`
  ```typescript
  {
    dayId: z.string().min(1, 'Day ID is required'),
    itineraryIds: z.array(z.string()).min(1, 'At least one itinerary ID is required')
  }
  ```
- **推定作業時間**: 15分

#### 4. `app/api/itineraries/move-to-day/route.ts` PUT
- **現状**: `parseRequestBody` + `if (!itinerary_id || !target_day_id) return badRequest`
- **必要なスキーマ**: `MoveItineraryToDaySchema`（`DuplicateItineraryToDaySchema` と同一で再利用可能）
  ```typescript
  {
    itinerary_id: z.string().min(1, 'Itinerary ID is required'),
    target_day_id: z.string().min(1, 'Target day ID is required')
  }
  ```
- **推定作業時間**: 10分

### 🟡 優先度中：複雑な認証を持つエンドポイント

以下のエンドポイントは独自の認証システム（`resolveAuthUserId`）を使用しているため、移行には少し注意が必要です。

#### 5. `app/api/trip/[tripSlug]/comments/route.ts`
- **POST**: `content` 必須、`userName`, `userAvatar`, `parentCommentId` オプショナル
- **PUT**: `content` 必須
- **現状**: `parseRequestBody` + `if (!content) return badRequest`
- **必要なスキーマ**: 
  - `CreateTripCommentSchema`: `{ content: string, userName?: string, userAvatar?: string, parentCommentId?: string }`
  - `UpdateTripCommentSchema`: `{ content: string }`
- **注意**: 認証が `authApi` ではなく独自の `resolveAuthUserId` を使用しているため、`withAuth()` をそのまま使えない可能性がある
- **推定作業時間**: 30分

#### 6. `app/api/trip/[tripSlug]/likes/route.ts` POST
- **現状**: `parseRequestBody` + `action?: 'like' | 'unlike'`（デフォルトは 'toggle'）
- **必要なスキーマ**: `ToggleTripLikeSchema`
  ```typescript
  {
    action: z.enum(['like', 'unlike', 'toggle']).optional().default('toggle')
  }
  ```
- **注意**: 認証が `authApi` ではなく独自の `resolveAuthUserId` を使用している
- **推定作業時間**: 20分

### 🟢 優先度低：外部API・特殊エンドポイント

以下のエンドポイントは、外部API呼び出しや特殊な処理を含むため、移行の優先度は低めです。

#### 7. その他のエンドポイント
- `app/api/venue/aggregate/route.ts`
- `app/api/unsplash/route.ts`
- `app/api/distance/route.ts`
- `app/api/distance/batch/route.ts`
- `app/api/geocoding/geocode/route.ts`
- `app/api/geocoding/reverse/route.ts`
- `app/api/user/plan/route.ts`
- `app/api/trips/[tripSlug]/checklist/route.ts`
- `app/api/debug/trip-image-deletion/route.ts`

これらは、必要に応じて後で移行することを推奨します。

---

## 📈 統計

- **完了**: 20エンドポイント
- **残り（優先度高）**: 4エンドポイント
- **残り（優先度中）**: 2エンドポイント（3ハンドラー）
- **残り（優先度低）**: 10エンドポイント以上

**推定残作業時間**: 
- 優先度高: 約55分
- 優先度中: 約50分
- **合計（優先度高+中）**: 約105分（1時間45分）

---

## 🎯 推奨される次のステップ

1. **優先度高の4エンドポイントを移行**（約55分）
   - これらは構造がシンプルで、すぐに移行可能
   - 移行による効果が高い

2. **優先度中の2エンドポイントを移行**（約50分）
   - 認証システムの統合が必要
   - `resolveAuthUserId` を `withAuth()` に統合するか、別途対応を検討

3. **Phase 4 完了後、Phase 5 に進む**
   - `validateReservationInfo` → `ReservationSchema` に移行
   - `validateAirportCode` → zod regex に吸収
   - `validateNumberParam` → 数値スキーマに統合

---

## 📝 注意事項

- `parseRequestBody` が残っているファイルが38個ありますが、その多くは既に移行済みです（コメント内やGETエンドポイントで使用されている可能性）
- 実際に移行が必要なのは、POST/PUT/PATCH エンドポイントのボディバリデーションのみです
- GETエンドポイントや、ボディを持たないエンドポイントは移行不要です

