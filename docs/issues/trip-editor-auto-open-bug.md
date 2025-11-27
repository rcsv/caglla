# TripEditor が自動的に開いて閉じられない問題

## 🔍 問題の概要

`/[userSlug]/[tripSlug]` ページにアクセスすると、旅行データ編集用ダイアログ（`TripEditor`）が自動的に開き、Cancel ボタンを押してもすぐにまた表示されてしまう。

## 🐛 根本原因

### 1. **`onUpdateTrip` の"契約"が曖昧だった**

`TripHeroSection` コンポーネントの `onUpdateTrip` プロップは、本来「Trip データが更新されたときに親に通知する」ためのコールバックとして設計されている。

しかし、`@timeline/default.tsx` では以下のように、**編集モーダルを開く処理**を渡している：

```tsx
<TripHeroSection
  trip={trip}
  onUpdateTrip={() => setShowEditBaseInfoModal(true)}  // ❌ 間違った使い方
  ...
/>
```

一方、`TripHeroSection` 内の `TripLikeButton` は、いいね状態が変更されるたびに `onUpdateTrip` を呼び出す：

```tsx
const handleLikeStateChange = useCallback(({ likesCount, likedByMe }) => {
  const updatedTrip: Trip = {
    ...trip,
    likes_count: likesCount,
    liked_by_me: likedByMe
  }
  onUpdateTrip(updatedTrip)  // これが呼ばれると編集モーダルが開く
}, [onUpdateTrip, trip])
```

**結果：**
- ページ表示直後に `TripLikeButton` が初期化される
- `handleLikeStateChange` が呼ばれる
- `onUpdateTrip` が実行される
- `setShowEditBaseInfoModal(true)` が実行される
- 編集ダイアログが開く
- Cancel で閉じても、再レンダリングや別の `onUpdateTrip` 呼び出しで再び開く

### 2. **UI 操作（like）と UX アクション（編集要求）を混在させている**

Like ボタンの状態変更は「データの変更通知」であるべきなのに、それが「UI 制御（モーダルを開く）」に接続されている。

## ✅ 対策

### 対策1: `onUpdateTrip` と `onEditBaseInfoRequest` を分離

`TripHeroSection` に新しいプロップ `onEditBaseInfoRequest` を追加し、編集モーダルを開く処理を分離する。

**変更前：**
```tsx
interface TripHeroSectionProps {
  onUpdateTrip: (updatedTrip: Trip) => void  // データ更新 + モーダル要求（混在）
  ...
}
```

**変更後：**
```tsx
interface TripHeroSectionProps {
  onUpdateTrip: (updatedTrip: Trip) => void  // データ更新のみ
  onEditBaseInfoRequest?: () => void  // 編集モーダル要求（新規）
  ...
}
```

### 対策2: `@timeline/default.tsx` での使い分け

```tsx
<TripHeroSection
  trip={trip}
  onUpdateTrip={updateTrip}  // データ更新は updateTrip に
  onEditBaseInfoRequest={() => setShowEditBaseInfoModal(true)}  // モーダル要求は専用コールバックに
  ...
/>
```

## 🛡️ 将来また同じ穴に落ちないための留意点

### 1. **コールバックは名前＝役割を絶対に一致させる**

コールバックの名前と実際の役割が一致していないと、受け手によって意味がブレる。

**原則：**
- 役割が複数なら、必ず分割する
- 名前と役割を絶対に一致させる

**推奨命名規則：**

| 役割 | 推奨命名 | やってはいけない命名 |
|------|---------|-------------------|
| データ変更通知 | `onTripChange`, `onLikesChange` | `onUpdateTrip`（用途が広すぎ） |
| UI 要求 | `onEditRequest`, `onOpenSettings` | `onUpdateTrip` の使い回し |

### 2. **UI 操作と UX アクションを混ぜない**

操作イベント（Like/change/update）は「データの変更通知」に限定し、モーダルを開く/閉じるなどの「UI 制御」は専用コールバックに分離する。

**原則：**
- 操作イベント → データの変更通知のみ
- UI 制御 → 専用コールバック

### 3. **親の State に副作用を起こす Props は慎重に扱う**

親コンポーネントに状態変化を強制する Props は、「再レンダー → コールバック再実行 → 副作用再発」が起こりやすい。

**対策：**
- `useCallback` / `memo` 化の設計をしっかり行う
- キャンバス的な UI（ヒーローセクション）は UI の独自 state を最低限に

### 4. **Props の"説明責務"をファイル内で明文化する**

コンポーネントの Props の上に JSDoc で明記することで、後任や未来の自分が助かる。

```tsx
/**
 * TripHeroSection Props
 * 
 * @param onUpdateTrip
 *   Trip のデータモデルが変わったときに親へ通知する。
 *   UI を開く/閉じる用途には絶対に使わない。
 *   例: Like ボタンの状態変更、統計情報の更新など
 * 
 * @param onEditBaseInfoRequest
 *   ユーザーが明示的に編集操作を行ったときに呼ばれる。
 *   編集モーダルを開くなどの UI 制御に使用する。
 */
interface TripHeroSectionProps {
  onUpdateTrip: (updatedTrip: Trip) => void
  onEditBaseInfoRequest?: () => void
  ...
}
```

### 5. **コンポーネントの責務を明確にする**

**`TripHeroSection` の責務：**
- Trip の閲覧表示コンポーネント
- 編集・いいね・各種アクションは別子コンポーネントに分離
- Hero はそれらの"入れ物"でしかない

**`TripLikeButton` の責務：**
- Like 状態の表示と変更
- データ変更のみを親に通知（UI 制御は行わない）

## 📋 実装チェックリスト

- [ ] `TripHeroSection` に `onEditBaseInfoRequest` プロップを追加
- [ ] `TripHeroSection` 内の編集ボタンで `onEditBaseInfoRequest` を呼び出す
- [ ] `@timeline/default.tsx` で `onUpdateTrip` と `onEditBaseInfoRequest` を分離
- [ ] `TripLikeButton` の `onUpdateTrip` 呼び出しがデータ更新のみであることを確認
- [ ] Props の JSDoc コメントを追加
- [ ] `TripLikeButton` を `memo` 化して不要な再レンダリングを防ぐ

## 🔗 関連ファイル

- `components/trip/TripHeroSection.tsx`
- `components/trip/TripEditor.tsx`
- `app/(planner)/[userSlug]/[tripSlug]/@timeline/default.tsx`
- `components/trip/TripLikeButton.tsx`

