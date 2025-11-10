# 公開トリップの閲覧専用UI実装（非所有者の編集系コントロール抑止）

## 概要
別ユーザーが作成したトリップ（`/[userSlug]/[tripSlug]`）を閲覧する際、編集・追加・削除などのコントロールを表示せず、バックエンドでは403になる操作をフロントで誘発しないようにする。

## ステータス
- **状態**: ✅ Phase 1-3 完了、Phase 4（テスト）待ち
- **優先度**: 🔴 High
- **対象バージョン**: v1.10.0
- **関連Issue**: `trip-map-public-view-missing-place-data.md`（POI追加時のエラーが発端）
- **最終更新**: 2025-11-10

### 実装完了（Phase 1-3）
- ✅ Phase 1: 権限管理の共通化
  - ✅ `lib/core/permissions.ts` 作成（`canEditTrip` 関数）
  - ✅ `app/[userSlug]/[tripSlug]/page.tsx` での権限判定
  - ✅ タイトルバーの `menuItems` フィルタ（編集系を非所有者に非表示）
  
- ✅ Phase 2: メインコンポーネントへの伝搬
  - ✅ `TripHeroSection` / `TripEditor` の canEdit 対応
  - ✅ `TripChecklistView` の readOnly 対応（追加/削除/トグル/再生成の抑止）
  - ✅ `TripItineraryView` の canEdit 対応
    - ✅ Add Day ボタンの条件表示
    - ✅ Add Venue ボタン（Itinerary有り）の条件表示
    - ✅ Add Venue ボタン（Itinerary無し）の条件表示 ← **修正済み**
    - ✅ Insert Venue ボタン（距離表示間・最後）の条件表示
    - ✅ `DndContext` の onDragEnd 無効化
  - ✅ POI追加機能の制御 (`onAddFromPOI` 条件渡し)

- ✅ Phase 3: 詳細コンポーネントの対応
  - ✅ `DayEditor` の canEdit 対応
    - ✅ 説明編集のクリック無効化
    - ✅ `DailyRouteOptimizer` の条件非表示
  - ✅ `SortableItineraryCard` の canEdit 対応
    - ✅ D&D の disabled 設定
    - ✅ dragHandleProps の条件渡し
  - ✅ `ScheduleCard` の canEdit 対応
    - ✅ タイトルのインライン編集無効化
    - ✅ 説明のインライン編集無効化
    - ✅ 時間編集の無効化（`onTimeEdit` 条件渡し）
    - ✅ 費用編集の無効化（`onCostEdit` 条件渡し）
    - ✅ 予約編集の無効化（`onReservationEdit` 条件渡し）
    - ✅ `ActivityTagSelector` の条件非表示
  - ✅ `ScheduleCardMenu` の条件非表示

### 残作業
- ⏳ Phase 4: テストと検証
  - [ ] 所有者ログイン時、全機能が正常動作することを確認
  - [ ] 非所有者ログイン時、編集UIが一切表示されないことを確認
  - [ ] 未ログイン時の動作を確認
  - [ ] 各APIエンドポイントが適切に403を返すことを確認（既存v1.8.2実装の動作確認）

## 問題の背景
- 現在、非所有者が公開トリップを閲覧すると、編集系UIが表示されたままになっている
- POIから行程追加を試みると「Failed to Add POI」エラーが表示される（API側は v1.8.2 で403を返すが、UIで事前抑止していない）
- 編集不可能なのに編集UIが表示されるのはUX的に不適切

## 目標
- 非所有者には閲覧専用UIを提供し、編集操作を一切提示しない
- 不要なAPIリクエストを削減し、エラーメッセージを表示しない
- 将来の共同編集機能実装に備え、権限管理を一元化する

---

### 基本方針（フロントの編集可否判定）
- 判定は `isOwner = user?.uid === trip.user_id` を使用（Firebase Authの `uid` と `Trip.user_id` を比較）。
- この判定結果（例: `canEdit`）をメインページで算出し、必要な子コンポーネントへ props で伝搬。コンポーネント側では `canEdit` に応じて編集UIを隠す/無効化する。
- 併せて、メニュー項目の配列構築時点で「編集系」アイテムを除外（レンダリング抑止）。
- 参考: 既にAPI側は v1.8.2 で認証・所有権チェック（401/403）を返す実装が入っているため、UI側で編集UI自体を出さないのが目的。

---

### 実装対象と編集箇所

#### 1) トリップの編集・削除ボタンの停止
- 対象ページ: `app/[userSlug]/[tripSlug]/page.tsx`
  - タイトルバーの「…」メニューに編集系が入っているので、`isOwner` が `false` のときはメニュー配列に含めない。
  
```1121:1158:app/[userSlug]/[tripSlug]/page.tsx
  return (
    <TripPageLayout
      trip={trip}
      ...
      menuItems={[
        {
          id: 'edit-base-info',
          label: 'Edit Base Info',
          icon: 'mdi:pencil',
          onClick: () => setShowEditBaseInfoModal(true),
        },
        {
          id: 'calendar-publish',
          label: t('trip.calendarPublish'),
          icon: 'mdi:calendar-sync',
          onClick: () => setShowICalPublishModal(true),
          disabled: userPlan === 'season_traveler',
        },
        ...
      ]}
```

- 対象コンポーネント: `components/trip/TripHeroSection.tsx`
  - ヒーロー内でも `TripEditor` を呼び出している（`hideEditButton={true}` だが、モーダル自体は親で制御）。`isOwner` が `false` のときは `TripEditor` 自体をレンダリングしない（または `hideEditButton` に加え、外側からモーダルを開かせない）。

```63:69:components/trip/TripHeroSection.tsx
          <TripEditor 
            trip={trip} 
            onUpdate={onUpdateTrip} 
            onDelete={onDeleteTrip}
            hideEditButton={true}
          />
```

- 対応方針:
  - `app/[userSlug]/[tripSlug]/page.tsx` で `const isOwner = user?.uid === trip.user_id` を算出。
  - メニュー配列を `isOwner` に応じてフィルタ（編集/削除/公開設定/iCal公開など、所有者専用項目は除外）。
  - `TripHeroSection` 側へも `canEdit` を渡し、`!canEdit` の場合は `TripEditor` を非表示（またはメニュー経由での起動を抑止）。


#### 2) 旅行の日程変更の停止（Day編集や並び替え・追加）
- 対象コンポーネント: `components/trip/TripItineraryView.tsx`
  - 「日程追加」「Venue追加」「ドラッグ&ドロップ」「各所の＋挿入ボタン」を `canEdit` で隠す/無効化する。

```357:368:components/trip/TripItineraryView.tsx
                    {sortedItineraries && sortedItineraries.length > 0 ? (
                      <div className="mt-6">
                        <div className="flex justify-end items-center mb-4">
                          <button
                            onClick={() => onAddSchedule(day.id)}
                            className="w-8 h-8 bg-emerald-600 ..."
                          >
                            <IconRenderer iconName="plus" />
                          </button>
                        </div>
                        <DndContext ...>
```

```489:499:components/trip/TripItineraryView.tsx
        {/* 日程追加ボタン - 常に表示 */}
        <div className="mt-6 text-center">
          <button
            onClick={onAddDay}
            className="px-6 py-3 bg-emerald-600 ..."
          >
            ...
```

- 対象コンポーネント: `components/trip/DayEditor.tsx`
  - クリックでの説明編集や `updateDay()` を `canEdit` でガード。

```85:106:components/trip/DayEditor.tsx
  return (
    <div className="space-y-4">
      {/* 既存の編集機能 */}
      <div className="space-y-2">
        {day.description ? (
          <div 
            className="group cursor-pointer ..."
            onClick={() => setIsEditing(true)}
          >
            ...
```

- 対応方針:
  - `TripItineraryView` に `canEdit?: boolean` を追加。`!canEdit` の場合は
    - 追加系ボタン（Add Day / Add Venue / Insert Venue）を非表示
    - DnD（`DndContext` やドラッグハンドル）を無効化/非表示
  - `DayEditor` に `canEdit?: boolean` を追加し、`!canEdit` のときはクリックで編集モードに入らない・保存しない。


#### 3) チェックリストの追加・編集・削除の停止
- 対象コンポーネント: `components/trip/TripChecklistView.tsx`
  - 追加（`addCustom`）、削除（`removeItem`）、トグル（`toggle`→`persist`）、再生成（`/generate`）など、書き込み系を `readOnly`（もしくは `canEdit`）で抑止。書き込みAPI呼び出し自体を行わない。

```16:42:components/trip/TripChecklistView.tsx
export default function TripChecklistView({ tripId }: TripChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  ...
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!tripId) return
      ...
      const res = await makeAuthenticatedRequest(`/api/trips/${tripId}/checklist`, { cache: 'no-store' })
```

- 対応方針:
  - `TripChecklistView` に `readOnly?: boolean` を追加し、`readOnly` の場合は
    - 入力欄・「追加」ボタン・削除ボタン・チェックトグル・「再生成」/「保存」を非表示/disabled化
    - 読み取りのみ（表示専用）にする
  - 呼び出し元 `page.tsx` から `readOnly={!isOwner}` を渡す。


#### 4) Itinerary の追加・編集・削除の停止
- 対象コンポーネント: `components/trip/ScheduleCard.tsx`
  - タイトル/メモのインライン編集、時間/費用のインライン編集、予約編集、`useItineraryEditor` による `updateField`/`updateFields` 呼び出しを `canEdit` でガード。

```330:369:components/trip/ScheduleCard.tsx
            <div className="flex-1 p-4 min-w-0">
              {/* タイトルとStar Rating */}
              <div className="flex items-center space-x-2 mb-3">
                {isEditingTitle ? (
                  <input
                    ...
                    onBlur={async () => {
                      if (title !== itinerary.title) {
                        await updateField('title', title)
                      }
```

- 対象コンポーネント: `components/trip/ScheduleCardMenu.tsx`
  - 「上/下に移動」「別日へ移動」「複製」「予約情報」「削除」などのメニューを `canEdit` で非表示。`!canEdit` ならメニューボタン自体を出さない。

```136:149:components/trip/ScheduleCardMenu.tsx
  return (
    <div className="flex-shrink-0 p-4">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
```

- 対応方針:
  - `ScheduleCard` に `canEdit?: boolean` を追加。インライン編集開始や `updateField` を `canEdit` で早期return。
  - `ScheduleCardMenu` にも `canEdit?: boolean` を追加。`!canEdit` ならメニューボタンを非表示。
  - `TripItineraryView` から `canEdit` を `SortableItineraryCard`/`ScheduleCard`/`ScheduleCardMenu` へ伝搬。


#### 5) POI 追加（TripMap → POIDialog）を非表示/無効化
- 対象コンポーネント: `components/trip/TripMap.tsx`
  - `POIDialog` へ渡す `onAddFromPOI` が定義されていると「行程に追加」UIが表示されるため、`isOwner` が `false` の場合は `onAddFromPOI` を渡さない。

```858:915:components/trip/TripMap.tsx
      {/* POIダイアログ */}
      <POIDialog
        poiData={poiData || internalPoiData}
        onClose={() => {
          setInternalPoiData(null)
          onPoiDataUpdate?.(null)
        }}
        onAddToItinerary={async (placeId: string, dayId: string) => {
          if (onAddFromPOI) {
            await onAddFromPOI(placeId, dayId)
            ...
```

- 対象コンポーネント: `components/modals/POIDialog.tsx`
  - `onAddToItinerary` と `availableDays` が揃う場合に「追加」ボタン群が表示される。`onAddToItinerary` が `undefined` の場合は現状でもボタン非表示なので、親側（TripMap/TripRightPane）で `onAddFromPOI` を渡さない実装が最小変更。

```358:404:components/modals/POIDialog.tsx
          <div className="flex items-center space-x-1 ml-2">
            {onAddToItinerary && availableDays && availableDays.length > 0 && (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={handleToggleDaySelector}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
```

- 対応方針:
  - `app/[userSlug]/[tripSlug]/page.tsx` → `TripRightPane` → `TripMap` という流れで `isOwner` を伝搬し、`!isOwner` のときは `onAddFromPOI` を渡さない。
  - 追加で `POIDialog` に `readOnly?: boolean` を追加し、`readOnly` の場合は強制的にボタンを隠す、でもOK（ダブルガード）。


---

### 推奨する小さな設計追加（共通化）
- `lib/core/permissions.ts`（新規）を作成し、以下を提供:
  - `export function canEditTrip(user: firebase.User | null, trip: Trip | null): boolean`
  - 実装は `return !!(user && trip && user.uid === trip.user_id)`
- `app/[userSlug]/[tripSlug]/page.tsx` で `const canEdit = canEditTrip(user, trip)` を算出し、子へ props で配布。
- これにより将来「共同編集」や「ロール」の追加（例: `canEditSharedTrip`）にも対応しやすくなる。


---

### 追加で非表示を検討すべきコントロール
- **ドラッグハンドル/並び替え**: `SortableItineraryCard` のドラッグハンドル表示と `DndContext` を `canEdit` で無効化
- **予約情報編集**: `ScheduleCard` → `ReservationInfoModal` の起動ボタンを `canEdit` で非表示
- **アクティビティタグ編集**: `ActivityTagSelector` を `canEdit` で非表示（表示は可、変更は不可）
- **日単位のルート最適化**: `DailyRouteOptimizer`（`DayEditor` 内）を `canEdit` で非表示
- **エクスポート関連**: PDFプレビューは閲覧者も可、ダウンロードは方針次第。iCal公開設定は所有者のみ（メニューから除外）
- **右ペインの検索オーバーレイ**: `MapSearchOverlay` 自体は表示可だが、`onAddFromPOI` がなければ「行程に追加」導線は消える


---

### 実装手順とチェックリスト

#### Phase 1: 権限管理の共通化
- [ ] `lib/core/permissions.ts` を新規作成
  - [ ] `canEditTrip(user, trip)` 関数を実装
  - [ ] 型定義を `lib/core/types.ts` に追加
- [ ] `app/[userSlug]/[tripSlug]/page.tsx` で権限判定を実装
  - [ ] `const canEdit = canEditTrip(user, trip)` を算出
  - [ ] タイトルバーの `menuItems` を `canEdit` でフィルタ

#### Phase 2: メインコンポーネントへの伝搬
- [ ] `TripItineraryView` に `canEdit` prop を追加
  - [ ] 追加ボタン（Add Day / Add Venue）を条件表示
  - [ ] Insert Venue ボタンを条件表示
  - [ ] `DndContext` を条件で無効化
- [ ] `TripChecklistView` に `readOnly` prop を追加
  - [ ] 入力欄・追加/削除/再生成ボタンを条件非表示
  - [ ] チェックトグルを条件無効化
- [ ] `TripRightPane` → `TripMap` に `canEdit` を伝搬
  - [ ] `onAddFromPOI` を条件で渡さない

#### Phase 3: 詳細コンポーネントの対応
- [ ] `DayEditor` に `canEdit` prop を追加
  - [ ] クリック編集を条件で無効化
  - [ ] `DailyRouteOptimizer` を条件非表示
- [ ] `ScheduleCard` に `canEdit` prop を追加
  - [ ] タイトル・メモのインライン編集を条件無効化
  - [ ] 時間・費用編集を条件無効化
  - [ ] `ActivityTagSelector` を条件でread-only化
- [ ] `ScheduleCardMenu` に `canEdit` prop を追加
  - [ ] メニューボタン自体を条件非表示
- [ ] `TripHeroSection` / `TripEditor` を条件で非表示

#### Phase 4: テストと検証
- [ ] 所有者ログイン時、全機能が正常動作することを確認
- [ ] 非所有者ログイン時、編集UIが一切表示されないことを確認
- [ ] 未ログイン時の動作を確認
- [ ] 各APIエンドポイントが適切に403を返すことを確認

---

### 備考（サーバー側の保護状況）
- 既に `app/api/trip/[tripSlug]/route.ts` の PUT など、主要APIで Bearer token 検証と所有権チェックが実装済み（v1.8.2）。
- UIガードにより「Failed to Add POI」等のエラーを未然に防ぎ、不要なAPIコールを減らすのが本対応の狙い。

---

### 影響範囲
| ファイル | 変更内容 | 影響度 |
|---------|---------|--------|
| `lib/core/permissions.ts` | 新規作成（権限判定の共通化） | 新規 |
| `lib/core/types.ts` | 権限関連の型定義追加 | 小 |
| `app/[userSlug]/[tripSlug]/page.tsx` | 編集可否の計算と子への伝搬、メニュー抑止 | 大 |
| `components/trip/TripPageLayout.tsx` | Props型の拡張（必要に応じて） | 小 |
| `components/trip/TripItineraryView.tsx` | 追加/挿入/DnDの表示制御 | 大 |
| `components/trip/DayEditor.tsx` | 日説明編集の抑止 | 中 |
| `components/trip/ScheduleCard.tsx` | インライン編集・予約編集の抑止 | 大 |
| `components/trip/ScheduleCardMenu.tsx` | メニュー自体の非表示 | 中 |
| `components/trip/TripHeroSection.tsx` | TripEditor呼び出しの条件化 | 小 |
| `components/trip/TripEditor.tsx` | Props型の拡張（必要に応じて） | 小 |
| `components/trip/TripRightPane.tsx` | `canEdit` の伝搬 | 小 |
| `components/trip/TripMap.tsx` | POIからの追加抑止 | 中 |
| `components/modals/POIDialog.tsx` | 追加ボタンの条件表示（既存実装で対応済み） | なし |
| `components/trip/TripChecklistView.tsx` | チェックリストの書き込み機能抑止 | 大 |

### 実装のポイント
- `isOwner` を軸に `canEdit`/`readOnly` を導入し、該当コンポーネントに伝搬して編集系UIを非表示/無効化するのが最小かつ一貫した対応
- API側の保護は既に実装済み（v1.8.2）なので、UIガードによるUX改善とエラー削減が主目的
- 将来の共同編集機能（複数所有者、閲覧専用共有リンクなど）にも対応しやすい設計

---

## 参考資料
- [v1.8.2 セキュリティパッチ](./docs/releases/v1.8.2.md) - API認証・認可の実装詳細
- [公開トリップ閲覧時のPOI無限取得問題](./trip-map-public-view-missing-place-data.md) - 本Issue発見の発端


