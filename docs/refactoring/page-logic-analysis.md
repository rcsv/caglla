# page.tsx ロジック混在と isSameUser 判定の分析

## 1. page.tsx にロジック部分が混在して見通しが悪くなっている箇所

### app/(planner)/[userSlug]/[tripSlug]/page.tsx (1620行)

このファイルは非常に長く、多くのロジックが混在しています：

#### 1.1 状態管理ロジック（32-71行目）
- 多数のuseState（trip, tripLoading, fetchError, showAddScheduleModal, showExportModal, showEditBaseInfoModal, pdfExporting, selectedDayId, insertAfterIndex, collapsedDays, leftNavExpanded, mobileMenuOpen, mobileMapOpen, summaryCollapsed, selectedItineraryId, mapFocusMode, poiData, missingPlaceDataCache, refreshKey, scrollSyncEnabled, loadingDayIds, replicaLoading, publishLoading, showReplicaModal, recentTripTimerRef）
- これらはカスタムフックやコンテキストに抽出可能

#### 1.2 クエリパラメータ同期ロジック（73-124行目）
- `currentView`, `queryDayParam`, `querySectionParam`の読み取りと状態同期
- `updateQuery`関数（127-134行目）
- クエリパラメータと状態の双方向同期ロジック（83-124行目、565-600行目）
- これらはカスタムフック（例：`useTripQueryParams`）に抽出可能

#### 1.3 日付計算ロジック（64-67行目）
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
```
- ユーティリティ関数に抽出可能

#### 1.4 旅行データ取得ロジック（467-562行目）
- `fetchTrip`関数内で複数の処理が混在：
  - API呼び出し
  - エラーハンドリング
  - place_dataの補完ロジック（505-552行目）
- カスタムフック（例：`useTripData`）に抽出可能

#### 1.5 Itinerary操作ロジック
- `handleScheduleAdded`（759-823行目）：複雑な状態更新ロジック
- `handleScheduleUpdated`（874-904行目）
- `handleScheduleDelete`（906-944行目）
- `handleDuplicateToDay`（947-995行目）
- `handleMoveToDay`（998-1042行目）
- `handleDragEnd`（1056-1141行目）
- `handleReorderItineraries`（1144-1194行目）
- `handleMoveUp`（1197-1257行目）
- `handleMoveDown`（1259-1319行目）
- これらはカスタムフック（例：`useItineraryOperations`）に抽出可能

#### 1.6 地図関連ロジック
- `handleItineraryClick`（384-432行目）
- `handleMapMarkerClick`（435-464行目）
- `getAllItineraries`（712-731行目）
- `filteredItineraries`（734-755行目）
- `getFilteredItineraries`（757行目）
- カスタムフック（例：`useTripMap`）に抽出可能

#### 1.7 PDFエクスポートロジック（220-247行目）
- `handlePdfExport`関数
- カスタムフック（例：`usePdfExport`）に抽出可能

#### 1.8 公開/複製ロジック
- `handlePublish`（307-358行目）
- `handleReplicaConfirm`（263-305行目）
- カスタムフック（例：`useTripPublish`）に抽出可能

#### 1.9 権限判定ロジック（1373-1381行目）
```typescript
const canEdit = canEditTrip(user, trip)
const isTemplateTrip = Boolean(trip.is_template)
const templateDayCount = isTemplateTrip
  ? (typeof trip.day_count === 'number' && trip.day_count > 0
      ? trip.day_count
      : trip.days?.length ?? 0)
  : 0
const canPublishTrip = canEdit && trip.access_level !== 'public'
```
- カスタムフック（例：`useTripPermissions`）に抽出可能

#### 1.10 メニュー項目構築ロジック（1384-1421行目）
- `menuItems`配列の構築
- カスタムフック（例：`useTripMenuItems`）に抽出可能

### app/home/page.tsx

比較的シンプルですが、以下のロジックが混在：

#### 1.1 日付計算ロジック（64-67行目）
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
```
- ユーティリティ関数に抽出可能

#### 1.2 ハンドラー関数（50-62行目）
- `handleLogout`, `handleChangePlan`, `handleTripCreated`
- これらは比較的シンプルで問題なし

## 2. isSameUser 系の判定をライブラリを使用せずに独自にやっている箇所

### 2.1 components/social/CommentItem.tsx (58行目)
```typescript
const isOwner = user?.uid === comment.user_id
```
- **問題点**: 直接的な比較で、`user_id`が`auth_uid`か`google_id`か`users`ドキュメントIDかを考慮していない
- **推奨**: `lib/core/permissions.ts`に`isSameUser`関数を追加して使用

### 2.2 components/home/HomeMainTabs.tsx (299行目)
```typescript
{userSlug && creator?.id !== userData?.id && (
```
- **問題点**: `creator?.id`（Trip.creator.id）と`userData?.id`（User.id）を直接比較
- **問題点**: `creator.id`が`users`ドキュメントIDで、`userData.id`も`users`ドキュメントIDなので、この比較は正しい可能性が高いが、一貫性のためライブラリ関数を使用すべき
- **推奨**: `lib/core/permissions.ts`に`isSameUser`関数を追加して使用

### 2.3 components/home/HomeMainTabs.tsx (PlanCatalog内、529行目)
```typescript
{trip.creator?.slug && trip.creator.id !== userData?.id && (
```
- **問題点**: `trip.creator.id`と`userData?.id`を直接比較
- **推奨**: `lib/core/permissions.ts`に`isSameUser`関数を追加して使用

## 3. 推奨される改善策

### 3.1 ユーザーID比較ライブラリ関数の追加

`lib/core/permissions.ts`または新しい`lib/core/user-identity.ts`に以下を追加：

```typescript
/**
 * 2つのユーザーIDが同じユーザーを指しているかどうかを判定します
 * 
 * @param userId1 - 1つ目のユーザーID（auth_uid, google_id, usersドキュメントIDのいずれか）
 * @param userId2 - 2つ目のユーザーID（auth_uid, google_id, usersドキュメントIDのいずれか）
 * @param user1Data - 1つ目のユーザーのUserオブジェクト（オプショナル、より正確な判定のため）
 * @param user2Data - 2つ目のユーザーのUserオブジェクト（オプショナル、より正確な判定のため）
 * @returns 同じユーザーの場合 true
 */
export function isSameUser(
  userId1: string | null | undefined,
  userId2: string | null | undefined,
  user1Data?: User | null,
  user2Data?: User | null
): boolean {
  if (!userId1 || !userId2) return false
  
  // 直接一致
  if (userId1 === userId2) return true
  
  // Userオブジェクトが提供されている場合、より詳細な比較
  if (user1Data && user2Data) {
    // usersドキュメントIDで比較
    if (user1Data.id === user2Data.id) return true
    // auth_uidで比較
    if (user1Data.auth_uid === user2Data.auth_uid) return true
    // google_idで比較（両方存在する場合）
    if (user1Data.google_id && user2Data.google_id && user1Data.google_id === user2Data.google_id) return true
  }
  
  return false
}
```

### 3.2 カスタムフックへの抽出

以下のカスタムフックを作成して、page.tsxからロジックを分離：

1. `hooks/useTripQueryParams.ts` - クエリパラメータ管理
2. `hooks/useTripData.ts` - 旅行データ取得
3. `hooks/useItineraryOperations.ts` - Itinerary操作
4. `hooks/useTripMap.ts` - 地図関連ロジック
5. `hooks/useTripPermissions.ts` - 権限判定
6. `hooks/useTripMenuItems.ts` - メニュー項目構築

### 3.3 ユーティリティ関数の追加

`lib/utils/date.ts`に以下を追加：

```typescript
export function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function getTomorrow(): Date {
  const tomorrow = new Date(getToday())
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}
```

