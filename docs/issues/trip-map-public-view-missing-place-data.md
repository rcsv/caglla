# 公開トリップ閲覧時の TripMap が無限に POI を取得し続ける

## 概要
- `/[userSlug]/[tripSlug]` 形式にリニューアル後、公開トリップを閲覧すると右ペインの TripMap が表示されなくなる
- `ScheduleCard` が `place_data` 不足と見なして `/api/places/details` を連続で叩き続けるため、サーバーログに大量のリクエストが記録される
- 同じ現象は、トリップ作成者／第三者どちらのアカウントでも再現する

## 期待する挙動
- 公開トリップでも TripMap が一度で描画され、追加の Places API リクエストは発生しない

## 実際の挙動
1. TripMap が灰色のまま表示されない
2. ブラウザログには以下が繰り返し出力される
   ```
   [DEBUG] 📦 ScheduleCard: Fetching place details for missing place_data {placeId: 'ChIJv8qC_PzDS4gR24Bi6KHwagY'}
   [DEBUG] 🗺️ TripMap: Filtering itineraries ... Valid itineraries count: 1
   ```
3. サーバーログには `/api/places/details` と `/api/itineraries/:id` の呼び出しが短時間で大量に並び、`Empty request body received for itinerary update` が混在する

## 再現手順
1. ログイン後、公開設定のトリップを開く（例: `http://localhost:3000/samantha/country-road-take-you-home`）
2. 右ペインの地図が描画されないこと、コンソールに上記ログが流れ続けることを確認

## 調査メモ

### 根本原因: PlacesCache キー不一致
- `app/api/trip/[tripSlug]/route.ts` (L95) では itinerary の `place_id` で PlacesCache を `adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(it.place_id).get()` のように取得している
- しかし、現在の PlacesCache のドキュメントキーは `placeId_language` 形式（例: `ChIJv8qC_PzDS4gR24Bi6KHwagY_en`）になっている
- そのため `doc(it.place_id)` は常に存在しないドキュメントを参照し、`place_data` が解決されない

### 無限ループのメカニズム
1. `/api/trip/[tripSlug]` が `place_data` なしで itinerary を返す
2. `ScheduleCard.tsx` (L140-164) の useEffect が「`place_data` が未設定」と判断
3. `placesApiHelpers.getPlaceDetails()` を呼び出し → Places API から詳細取得
4. `updateField('place_data', result)` で `/api/itineraries/:id` PUT を実行
5. `/api/itineraries/[id]/route.ts` (L64-97) は `place_data` を更新対象に含めていないため、Firestore に保存されない
6. `handleScheduleUpdated` でローカル state が更新されるが、次回レンダリング時に再び「未設定」と判断され、1に戻る

### 副次的な問題
- `useEntityEditor` が `updateField` 時に AbortController でリクエストをキャンセルするため、「Empty request body received」警告が頻発
- TripMap は `place_data.geometry.location` を必須としており、データが不足すると初期化を繰り返す

## 対応案

### 1. サーバー側: PlacesCache 解決ロジックの修正 ✅ 最優先
**ファイル**: `app/api/trip/[tripSlug]/route.ts` (L90-144)

現在の実装:
```typescript
const cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(it.place_id).get()
```

修正案（`lib/travel/slug-helpers.ts` の `getTripBySlugs` を参考）:
```typescript
// ユーザーの優先言語で PlacesCache を検索
const userLanguage = getUserLanguage() || 'en'
const preferredKey = `${it.place_id}_${userLanguage}`
let cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(preferredKey).get()

// フォールバック: 英語キャッシュを試行
if (!cacheDoc.exists) {
  const fallbackKey = `${it.place_id}_en`
  cacheDoc = await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(fallbackKey).get()
}
```

**効果**: これにより初回ロード時に `place_data` が正しく解決され、クライアント側の追加リクエストが不要になる

### 2. API側: place_data 更新の許可（オプション）
**ファイル**: `app/api/itineraries/[id]/route.ts` (L64-97)

現在は `place_data` が更新対象に含まれていない。以下を追加:
```typescript
if (place_data !== undefined) updateData.place_data = place_data
```

**注意**: この対応は「対応案1」で根本解決すれば不要。ただし、将来的に場所データの手動更新が必要になる可能性も考慮

### 3. クライアント側: 閲覧専用モードの検討（将来対応）
**ファイル**: `components/trip/ScheduleCard.tsx`

公開トリップを閲覧中（書き込み権限なし）の場合は、`place_data` の自動補完を試行しないロジックを追加:
```typescript
// 権限チェック（例）
const canEdit = user?.google_id === trip.user_id
if (!canEdit && !itinerary.place_data) {
  // 閲覧専用の場合は補完しない
  return
}
```

**効果**: 権限のないユーザーが不要な更新リクエストを発行しなくなる

### 実装優先順位
1. **対応案1（必須）**: PlacesCache 解決ロジックの修正 → 根本解決
2. 対応案2（任意）: place_data 更新許可 → 将来のための保険
3. 対応案3（任意）: 閲覧専用モード → UX/パフォーマンス向上

## 参考ログ
- クライアントログ: `ScheduleCard: Fetching place details for missing place_data`, `TripMap: Filtering itineraries`
- サーバーログ（一部）:
  ```
  POST /api/places/details 200 in 36ms
  PUT /api/itineraries/eUyLBK08WgFoTVikI6Xp 200 in 98ms
  WARN: Empty request body received for itinerary update { id: 'eUyLBK08WgFoTVikI6Xp' }
  ```

## 影響範囲
- **ユーザー体験**: 公開トリップの地図機能が完全に動作しない（Critical）
- **パフォーマンス**: 1秒間に数十回の Places API リクエストが発生し、API クォータを消費
- **コスト**: Places API の呼び出しコストが不必要に増加
- **適用範囲**: すべての公開トリップ（`/[userSlug]/[tripSlug]`）が影響を受ける

## 優先度
**🔴 High Priority**: 公開トリップ閲覧時に地図が機能せず、API コストも増加するため早急な対応が必要

## 関連ファイル
- `app/api/trip/[tripSlug]/route.ts` - 主な修正対象
- `lib/travel/slug-helpers.ts` - 参考実装（正しい PlacesCache 解決ロジック）
- `components/trip/ScheduleCard.tsx` - クライアント側の place_data 補完ロジック
- `hooks/useEntityEditor.ts` - 更新リクエストのハンドリング
- `components/trip/TripMap.tsx` - 地図描画コンポーネント
- `app/api/itineraries/[id]/route.ts` - itinerary 更新 API
