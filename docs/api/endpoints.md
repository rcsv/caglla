# API エントリポイント一覧

**Last Updated:** 2025-11-14  
**Version:** v3.0.0 (Phase 1 完了)

---

## 📋 目次

1. [SNS機能（v3.0.0）](#sns機能v300)
2. [トリップ管理](#トリップ管理)
3. [ユーザー管理](#ユーザー管理)
4. [日程・スケジュール管理](#日程スケジュール管理)
5. [場所・地図機能](#場所地図機能)
6. [テンプレート・チェックリスト](#テンプレートチェックリスト)
7. [エクスポート・共有](#エクスポート共有)
8. [システム・ユーティリティ](#システムユーティリティ)

---

## 🌐 SNS機能（v3.0.0）

### Trip Likes（いいね機能）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/trip/[tripSlug]/likes` | いいね状態取得 | ✅ | ✅ |
| `POST` | `/api/trip/[tripSlug]/likes` | いいね追加/削除（toggle） | ✅ | ✅ |
| `DELETE` | `/api/trip/[tripSlug]/likes` | いいね削除 | ✅ | ✅ |

**実装状況:** ✅ Phase 1-3-1 完了

### Trip Comments（コメント機能）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/trip/[tripSlug]/comments` | コメント一覧取得 | ❌ | ✅ |
| `POST` | `/api/trip/[tripSlug]/comments` | コメント作成 | ✅ | ✅ |
| `PUT` | `/api/trip/[tripSlug]/comments` | コメント更新 | ✅ | ✅ |
| `DELETE` | `/api/trip/[tripSlug]/comments` | コメント削除（論理削除） | ✅ | ✅ |

**実装状況:** ✅ Phase 1-3-2 完了

### User Follow（フォロー機能）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/users/[userSlug]/follow` | フォロー状態取得 | ✅ | ✅ |
| `POST` | `/api/users/[userSlug]/follow` | フォロー | ✅ | ✅ |
| `DELETE` | `/api/users/[userSlug]/follow` | フォロー解除 | ✅ | ✅ |

**実装状況:** ✅ Phase 1-3-3 完了

### Feed（フィード機能）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/feed/public` | 公開フィード取得 | ❌ | ✅ |
| `GET` | `/api/feed/trending` | トレンドフィード取得 | ❌ | ✅ |
| `GET` | `/api/feed/following` | フォロー中フィード取得 | ✅ | ✅ |

**Query Parameters:**
- `limit`: 取得件数（1-100、デフォルト: 20）
- `cursor`: ページネーション用カーソル（オプション）

**実装状況:** ✅ Phase 1-3-4 完了

---

## 🗺️ トリップ管理

### Trip CRUD

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/trip/[tripSlug]` | トリップ取得（publicは認証不要、privateは所有者のみ） | 🔐 | ✅ |
| `PUT` | `/api/trip/[tripSlug]` | トリップ更新 | ✅ | ✅ |
| `DELETE` | `/api/trip/[tripSlug]` | トリップ削除 | ✅ | ✅ |
| `POST` | `/api/trip/[tripSlug]/publish` | トリップ公開 | ✅ | ✅ |
| `DELETE` | `/api/trip/[tripSlug]/publish` | トリップ公開停止（unpublish） | ✅ | ✅ |
| `POST` | `/api/trip/[tripSlug]/replica` | テンプレートから複製 | ✅ | ✅ |
| `POST` | `/api/trip/[tripSlug]/day` | 日程追加 | ✅ | ❌ |

### Trips リスト

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/trips` | ユーザーのトリップ一覧取得 | ✅ | ❌ |
| `POST` | `/api/trips` | トリップ作成 | ✅ | ❌ |
| `GET` | `/api/trips/recommended` | おすすめトリップ取得 | ✅ | ❌ |
| `GET` | `/api/trips/recommendations` | おすすめトリップ取得（別実装） | ✅ | ❌ |
| `GET` | `/api/trips/accessible` | アクセス可能なトリップ取得 | ✅ | ❌ |

### Trip 関連機能

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/trips/[tripSlug]/checklist` | チェックリスト取得 | ✅ | ❌ |
| `PUT` | `/api/trips/[tripSlug]/checklist` | チェックリスト更新 | ✅ | ❌ |
| `POST` | `/api/trips/[tripSlug]/checklist/generate` | チェックリスト生成 | ✅ | ❌ |
| `POST` | `/api/trips/[tripSlug]/checklist/apply-preset` | プリセット適用 | ✅ | ❌ |
| `GET` | `/api/trips/[tripSlug]/reservations` | 予約情報取得 | ✅ | ❌ |

---

## 👤 ユーザー管理

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/users` | ユーザー情報取得（認証済みユーザー自身） | ✅ | ✅ |
| `POST` | `/api/users` | ユーザー作成・更新（認証済みユーザー自身） | ✅ | ✅ |
| `GET` | `/api/users/[userSlug]` | 他のユーザーの公開情報取得（認証不要） | ✅ | ✅ |
| `PUT` | `/api/users/[userSlug]` | ユーザー情報更新（`userSlug` での明示的指定、自分自身のみ） | ✅ | ✅ |
| `POST` | `/api/users/check-slug` | スラッグ重複チェック | ❌ | ✅ |
| `POST` | `/api/users/migrate` | ユーザーデータ移行 | ✅ | ❌ |
| `GET` | `/api/user/plan` | プラン情報取得 | ✅ | ✅ |
| `PUT` | `/api/user/plan` | プラン情報更新 | ✅ | ✅ |

---

## 📅 日程・スケジュール管理

### Itineraries（スケジュール）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/itineraries?day_id=xxx` | スケジュール一覧取得（`day_id` クエリパラメータ必須、特定のdayに紐づくitinerariesを取得） | ✅ | ❌ |
| `POST` | `/api/itineraries` | スケジュール作成 | ✅ | ❌ |
| `PUT` | `/api/itineraries/[id]` | スケジュール更新 | ✅ | ❌ |
| `DELETE` | `/api/itineraries/[id]` | スケジュール削除 | ✅ | ❌ |
| `POST` | `/api/itineraries/insert` | スケジュール挿入 | ✅ | ❌ |
| `POST` | `/api/itineraries/move-to-day` | 別日程へ移動 | ✅ | ❌ |
| `POST` | `/api/itineraries/duplicate-to-day` | 別日程へ複製 | ✅ | ❌ |
| `POST` | `/api/itineraries/reorder` | 並び替え | ✅ | ❌ |

---

## 🗺️ 場所・地図機能

### Places（場所検索）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/places/search` | 場所検索 | ❌ | ❌ |
| `POST` | `/api/places/details` | 場所詳細取得 | ❌ | ❌ |
| `POST` | `/api/places/nearby` | 周辺場所検索 | ❌ | ❌ |
| `GET` | `/api/places/photo` | 場所写真取得 | ❌ | ❌ |

### Geocoding（ジオコーディング）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/geocoding/geocode` | 住所→座標変換 | ❌ | ❌ |
| `POST` | `/api/geocoding/reverse` | 座標→住所変換 | ❌ | ❌ |

### Distance（距離計算）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/distance` | 距離・時間計算 | ❌ | ❌ |
| `POST` | `/api/distance/batch` | 一括距離計算 | ❌ | ❌ |

### Route Optimization（ルート最適化）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/route-optimization` | ルート最適化 | ✅ | ❌ |
| `GET` | `/api/route-optimization` | 最適化状態取得 | ✅ | ❌ |

### Venue（会場情報）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/venue/aggregate` | 会場情報統合 | ❌ | ❌ |
| `GET` | `/api/venue/debug` | デバッグ情報 | ❌ | ❌ |

---

## 📋 テンプレート・チェックリスト

### Templates（テンプレート）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/templates` | テンプレート一覧取得 | ✅ | ❌ |
| `POST` | `/api/templates` | テンプレート作成 | ✅ | ❌ |

### Plans（プラン）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/plans` | プラン作成 | ✅ | ❌ |
| `PUT` | `/api/plans` | プラン更新 | ✅ | ❌ |
| `POST` | `/api/plans/[planSlug]/template` | テンプレート化 | ✅ | ❌ |
| `POST` | `/api/plans/[planSlug]/duplicate` | プラン複製 | ✅ | ❌ |

### Checklists（チェックリスト）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/checklists/presets` | プリセット一覧取得 | ✅ | ❌ |
| `POST` | `/api/checklists/presets` | プリセット作成 | ✅ | ❌ |
| `GET` | `/api/checklists/presets/[presetSlug]` | プリセット取得 | ❌ | ❌ |
| `PUT` | `/api/checklists/presets/[presetSlug]` | プリセット更新 | ✅ | ❌ |
| `DELETE` | `/api/checklists/presets/[presetSlug]` | プリセット削除 | ✅ | ❌ |

### Reservation Templates（予約テンプレート）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/reservation-templates` | 予約テンプレート一覧取得 | ✅ | ❌ |
| `POST` | `/api/reservation-templates` | 予約テンプレート作成 | ✅ | ❌ |
| `POST` | `/api/reservation-templates/[templateId]` | 予約テンプレート更新 | ✅ | ❌ |
| `PUT` | `/api/reservation-templates/[templateId]` | 予約テンプレート更新（PUT） | ✅ | ❌ |
| `DELETE` | `/api/reservation-templates/[templateId]` | 予約テンプレート削除 | ✅ | ❌ |

---

## 📤 エクスポート・共有

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/trips/[tripSlug]/pdf` | PDFエクスポート | ✅ | ❌ |
| `GET` | `/api/trips/[tripSlug]/preview` | HTMLプレビュー | ✅ | ❌ |
| `GET` | `/api/trips/[tripSlug]/ical` | iCalエクスポート | ❌ | ❌ |
| `POST` | `/api/trips/[tripSlug]/ical-token` | iCal公開トークン生成 | ✅ | ❌ |
| `DELETE` | `/api/trips/[tripSlug]/ical-token` | iCal公開トークン削除 | ✅ | ❌ |

---

## 🔧 システム・ユーティリティ

### Health & Status

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/health` | ヘルスチェック | ❌ | ✅ |
| `GET` | `/api/status` | ステータス取得 | ❌ | ✅ |
| `GET` | `/api/version` | バージョン情報取得 | ❌ | ✅ |
| `GET` | `/api/self-check` | セルフチェック | ❌ | ✅ |

### Storage（ストレージ）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/storage/usage` | ストレージ使用量取得 | ✅ | ❌ |
| `POST` | `/api/storage/usage` | ストレージ使用量更新 | ✅ | ❌ |
| `GET` | `/api/storage/quota` | ストレージクォータ取得 | ✅ | ❌ |
| `POST` | `/api/storage/quota` | ストレージクォータ更新 | ✅ | ❌ |

### Cache（キャッシュ）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/cache/image` | 画像キャッシュ取得 | ❌ | ❌ |
| `POST` | `/api/cache/image` | 画像キャッシュ保存 | ✅ | ❌ |
| `DELETE` | `/api/cache/image` | 画像キャッシュ削除 | ✅ | ❌ |

### Images（画像）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/unsplash` | Unsplash画像検索 | ❌ | ❌ |
| `POST` | `/api/unsplash` | Unsplash画像取得 | ❌ | ❌ |

### Migration（移行）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `POST` | `/api/migrate/places-to-cache` | Places→Cache移行 | ✅ | ❌ |

### Debug（デバッグ）

| Method | Endpoint | 説明 | 認証 | テスト |
|--------|----------|------|------|--------|
| `GET` | `/api/debug/auth` | 認証デバッグ | ❌ | ❌ |
| `GET` | `/api/debug/firebase` | Firebaseデバッグ | ❌ | ❌ |
| `GET` | `/api/debug/trip-ownership` | トリップ所有権デバッグ | ❌ | ❌ |
| `POST` | `/api/debug/trip-image-deletion` | トリップ画像削除デバッグ | ❌ | ❌ |

---

## 📊 統計

### 実装状況

- **SNS機能（v3.0.0）**: ✅ 100% 完了（12エンドポイント、31テスト通過）
- **トリップ管理**: ⚠️ 一部未テスト（19エンドポイント、ただしTrip CRUD 6エンドポイントは✅）
- **ユーザー管理**: ✅ 100% 完了（8エンドポイント、全テスト通過）
- **日程・スケジュール管理**: ⚠️ 一部未テスト（8エンドポイント）
- **場所・地図機能**: ⚠️ 一部未テスト（13エンドポイント）
- **テンプレート・チェックリスト**: ⚠️ 一部未テスト（13エンドポイント）
- **エクスポート・共有**: ⚠️ 一部未テスト（5エンドポイント）
- **システム・ユーティリティ**: ⚠️ 一部未テスト（15エンドポイント、ただし`/api/health`, `/api/status`, `/api/version`, `/api/self-check`は✅）

### 合計

- **総エンドポイント数**: 91
- **v3.0.0新規追加**: 12
- **テスト通過**: 約50-60（v3.0.0 SNS機能12エンドポイント + システムエンドポイント4エンドポイント + ユーザー管理8エンドポイント + Trip CRUD 6エンドポイント）

---

## 🔗 関連ドキュメント

- **v3.0.0アーキテクチャ構想**: `docs/planning/v3-architecture-vision.md`
- **実装順序**: `docs/planning/v3-implementation-order.md`
- **ブランチ戦略**: `docs/development/branch-strategy.md`

