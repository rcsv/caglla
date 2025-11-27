# v3.0.0 API Testing Plan

**作成日**: 2025-11-14  
**目的**: `endpoints.md`でテストが「✗」になっているAPIエンドポイントのテスト実装計画

---

## 📊 現状分析

### テスト実装済み
- ✅ **SNS機能（v3.0.0）**: 12エンドポイント、31テスト通過

### テスト未実装
- ⚠️ **トリップ管理**: 19エンドポイント
- ⚠️ **ユーザー管理**: 6エンドポイント
- ⚠️ **日程・スケジュール管理**: 8エンドポイント
- ⚠️ **場所・地図機能**: 13エンドポイント
- ⚠️ **テンプレート・チェックリスト**: 13エンドポイント
- ⚠️ **エクスポート・共有**: 5エンドポイント
- ⚠️ **システム・ユーティリティ**: 15エンドポイント

**合計**: 79エンドポイントがテスト未実装

---

## 🎯 実現可能性評価

### ✅ **高優先度・容易に実装可能**（優先度: 高）

これらのエンドポイントは、既存のテストパターンと同じ方法で実装可能です。

#### 1. システムエンドポイント（認証不要）
- `GET /api/health` - ヘルスチェック
- `GET /api/status` - ステータス取得
- `GET /api/version` - バージョン情報取得
- `GET /api/self-check` - セルフチェック

**実装難易度**: ⭐ 簡単（30分-1時間）
**実装方法**: `system-endpoints.test.ts`と同じパターン

#### 2. トリップ管理（Firestoreエミュレータでテスト可能）
- `GET /api/trip/[tripSlug]` - トリップ取得（public/private対応）
- `PUT /api/trip/[tripSlug]` - トリップ更新
- `DELETE /api/trip/[tripSlug]` - トリップ削除
- `POST /api/trip/[tripSlug]/publish` - トリップ公開
- `DELETE /api/trip/[tripSlug]/publish` - トリップ公開停止
- `POST /api/trip/[tripSlug]/replica` - テンプレートから複製
- `POST /api/trip/[tripSlug]/day` - 日程追加

**実装難易度**: ⭐⭐ 中程度（2-4時間）
**実装方法**: `trip-likes.firestore.test.ts`と同じパターン（Firestoreエミュレータ + 認証モック）

#### 3. ユーザー管理（Firestoreエミュレータでテスト可能）
- `GET /api/users` - ユーザー情報取得
- `POST /api/users` - ユーザー作成・更新
- `GET /api/users/[userSlug]` - 他のユーザーの公開情報取得（認証不要）
- `PUT /api/users/[userSlug]` - ユーザー情報更新
- `POST /api/users/check-slug` - スラッグ重複チェック（認証不要）
- `GET /api/user/plan` - プラン情報取得
- `PUT /api/user/plan` - プラン情報更新

**実装難易度**: ⭐⭐ 中程度（2-3時間）
**実装方法**: `user-follows.firestore.test.ts`と同じパターン

#### 4. Trips リスト（Firestoreエミュレータでテスト可能）
- `GET /api/trips` - ユーザーのトリップ一覧取得
- `POST /api/trips` - トリップ作成
- `GET /api/trips/recommended` - おすすめトリップ取得
- `GET /api/trips/recommendations` - おすすめトリップ取得（別実装）
- `GET /api/trips/accessible` - アクセス可能なトリップ取得

**実装難易度**: ⭐⭐ 中程度（3-5時間）
**実装方法**: Firestoreエミュレータ + 認証モック

---

### ⚠️ **中優先度・実装可能だが追加準備が必要**（優先度: 中）

#### 5. 日程・スケジュール管理（Firestoreエミュレータでテスト可能）
- `GET /api/itineraries?day_id=xxx` - スケジュール一覧取得
- `POST /api/itineraries` - スケジュール作成
- `PUT /api/itineraries/[id]` - スケジュール更新
- `DELETE /api/itineraries/[id]` - スケジュール削除
- `POST /api/itineraries/insert` - スケジュール挿入
- `POST /api/itineraries/move-to-day` - 別日程へ移動
- `POST /api/itineraries/duplicate-to-day` - 別日程へ複製
- `POST /api/itineraries/reorder` - 並び替え

**実装難易度**: ⭐⭐⭐ やや困難（5-8時間）
**実装方法**: Firestoreエミュレータ + 複雑なデータセットアップ（trips → days → itineraries）

#### 6. テンプレート・チェックリスト（Firestoreエミュレータでテスト可能）
- `GET /api/templates` - テンプレート一覧取得
- `POST /api/templates` - テンプレート作成
- `GET /api/trips/[tripSlug]/checklist` - チェックリスト取得
- `PUT /api/trips/[tripSlug]/checklist` - チェックリスト更新
- `POST /api/trips/[tripSlug]/checklist/generate` - チェックリスト生成
- `POST /api/trips/[tripSlug]/checklist/apply-preset` - プリセット適用
- `GET /api/checklists/presets` - プリセット一覧取得
- `POST /api/checklists/presets` - プリセット作成
- `GET /api/checklists/presets/[presetSlug]` - プリセット取得
- `PUT /api/checklists/presets/[presetSlug]` - プリセット更新
- `DELETE /api/checklists/presets/[presetSlug]` - プリセット削除

**実装難易度**: ⭐⭐⭐ やや困難（6-10時間）
**実装方法**: Firestoreエミュレータ + 複雑なデータセットアップ

---

### ❌ **低優先度・実装困難または外部依存**（優先度: 低）

これらのエンドポイントは外部API（Google Places API、PDF生成、画像処理など）に依存するため、モックが必要です。

#### 7. 場所・地図機能（Google Places API依存）
- `POST /api/places/search` - 場所検索
- `POST /api/places/details` - 場所詳細取得
- `POST /api/places/nearby` - 周辺場所検索
- `GET /api/places/photo` - 場所写真取得
- `POST /api/geocoding/geocode` - 住所→座標変換
- `POST /api/geocoding/reverse` - 座標→住所変換
- `POST /api/distance` - 距離・時間計算
- `POST /api/distance/batch` - 一括距離計算
- `POST /api/route-optimization` - ルート最適化
- `GET /api/route-optimization` - 最適化状態取得

**実装難易度**: ⭐⭐⭐⭐ 困難（10-20時間）
**実装方法**: Google Places APIのモックが必要、または実際のAPIキーを使用（コストがかかる）

#### 8. エクスポート・共有（PDF生成、外部処理依存）
- `GET /api/trips/[tripSlug]/pdf` - PDFエクスポート
- `GET /api/trips/[tripSlug]/preview` - HTMLプレビュー
- `GET /api/trips/[tripSlug]/ical` - iCalエクスポート
- `POST /api/trips/[tripSlug]/ical-token` - iCal公開トークン生成
- `DELETE /api/trips/[tripSlug]/ical-token` - iCal公開トークン削除

**実装難易度**: ⭐⭐⭐⭐ 困難（8-15時間）
**実装方法**: PDF生成ライブラリのモック、または実際のPDF生成をテスト（時間がかかる）

#### 9. システム・ユーティリティ（外部サービス依存）
- `GET /api/storage/usage` - ストレージ使用量取得
- `POST /api/storage/usage` - ストレージ使用量更新
- `GET /api/storage/quota` - ストレージクォータ取得
- `POST /api/storage/quota` - ストレージクォータ更新
- `GET /api/cache/image` - 画像キャッシュ取得
- `POST /api/cache/image` - 画像キャッシュ保存
- `DELETE /api/cache/image` - 画像キャッシュ削除
- `GET /api/unsplash` - Unsplash画像検索
- `POST /api/unsplash` - Unsplash画像取得
- `POST /api/migrate/places-to-cache` - Places→Cache移行

**実装難易度**: ⭐⭐⭐⭐ 困難（10-20時間）
**実装方法**: Firebase Storage、Unsplash APIのモックが必要

---

## 🚀 推奨実装順序

### Phase 1: 簡単なものから（優先度: 最高）

1. **システムエンドポイント**（30分-1時間）
   - `GET /api/health`
   - `GET /api/status`
   - `GET /api/version`
   - `GET /api/self-check`

**理由**: 認証不要、外部依存なし、既存のテストパターンと同じ

### Phase 2: コア機能（優先度: 高）

2. **ユーザー管理**（2-3時間）
   - `GET /api/users`
   - `POST /api/users`
   - `GET /api/users/[userSlug]`
   - `PUT /api/users/[userSlug]`
   - `POST /api/users/check-slug`

**理由**: 既存の`user-follows.firestore.test.ts`と同じパターンで実装可能

3. **トリップ管理（基本）**（3-5時間）
   - `GET /api/trip/[tripSlug]`
   - `PUT /api/trip/[tripSlug]`
   - `DELETE /api/trip/[tripSlug]`
   - `POST /api/trip/[tripSlug]/publish`
   - `DELETE /api/trip/[tripSlug]/publish`

**理由**: 既存の`trip-likes.firestore.test.ts`と同じパターンで実装可能

### Phase 3: 複雑な機能（優先度: 中）

4. **Trips リスト**（3-5時間）
   - `GET /api/trips`
   - `POST /api/trips`
   - `GET /api/trips/recommended`
   - `GET /api/trips/recommendations`
   - `GET /api/trips/accessible`

5. **日程・スケジュール管理**（5-8時間）
   - `GET /api/itineraries`
   - `POST /api/itineraries`
   - `PUT /api/itineraries/[id]`
   - `DELETE /api/itineraries/[id]`
   - その他の操作

### Phase 4: 高度な機能（優先度: 低）

6. **テンプレート・チェックリスト**（6-10時間）
7. **エクスポート・共有**（8-15時間）- モックが必要
8. **場所・地図機能**（10-20時間）- 外部APIモックが必要
9. **システム・ユーティリティ**（10-20時間）- 外部サービスモックが必要

---

## 📋 実装方針

### テストファイル命名規則
- Firestoreエミュレータを使用: `*.firestore.test.ts`
- 単純なHTTPテスト: `*.test.ts`

### テストパターン

#### パターン1: 認証不要エンドポイント
```typescript
describe('GET /api/health', () => {
  it('should return 200 with health status', async () => {
    const request = new NextRequest('http://localhost/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
  })
})
```

#### パターン2: 認証必要エンドポイント（Firestoreエミュレータ）
```typescript
describe('GET /api/trip/[tripSlug]', () => {
  let db: Firestore
  let trip: Trip
  
  beforeAll(() => {
    db = getTestFirestore()
  })
  
  beforeEach(async () => {
    // テストデータのセットアップ
    trip = createMockTrip({ ... })
    await db.collection(COLLECTIONS.TRIPS).doc(trip.id).set(trip)
  })
  
  it('should return trip for authenticated owner', async () => {
    const request = new NextRequest(`http://localhost/api/trip/${trip.slug}`, {
      headers: createAuthHeader(trip.user_id)
    })
    
    const response = await GET(request, { params: Promise.resolve({ tripSlug: trip.slug }) })
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.trip.id).toBe(trip.id)
  })
})
```

---

## ✅ 実装チェックリスト

### Phase 1: システムエンドポイント
- [ ] `GET /api/health`
- [ ] `GET /api/status`
- [ ] `GET /api/version`
- [ ] `GET /api/self-check`

### Phase 2: ユーザー管理
- [ ] `GET /api/users`
- [ ] `POST /api/users`
- [ ] `GET /api/users/[userSlug]`
- [ ] `PUT /api/users/[userSlug]`
- [ ] `POST /api/users/check-slug`
- [ ] `GET /api/user/plan`
- [ ] `PUT /api/user/plan`

### Phase 3: トリップ管理
- [ ] `GET /api/trip/[tripSlug]`
- [ ] `PUT /api/trip/[tripSlug]`
- [ ] `DELETE /api/trip/[tripSlug]`
- [ ] `POST /api/trip/[tripSlug]/publish`
- [ ] `DELETE /api/trip/[tripSlug]/publish`
- [ ] `POST /api/trip/[tripSlug]/replica`
- [ ] `POST /api/trip/[tripSlug]/day`

### Phase 4: Trips リスト
- [ ] `GET /api/trips`
- [ ] `POST /api/trips`
- [ ] `GET /api/trips/recommended`
- [ ] `GET /api/trips/recommendations`
- [ ] `GET /api/trips/accessible`

---

## 🎯 結論

### 実現可能性: **高い**

**実装可能なエンドポイント数**: 約30-40エンドポイント（合計79エンドポイント中）

**実装困難なエンドポイント**: 約40-50エンドポイント（外部API依存、複雑な処理）

### 推奨アプローチ

1. **Phase 1から開始**: システムエンドポイント（30分-1時間）
2. **Phase 2を優先**: コア機能のテスト（5-8時間）
3. **Phase 3以降は段階的に**: 必要に応じて実装

**総工数見積もり**: 
- Phase 1-2: 約10-15時間
- Phase 3: 約20-30時間
- Phase 4以降: 約50-100時間（モック実装含む）

---

**作成日**: 2025-11-14  
**最終更新**: 2025-11-14

