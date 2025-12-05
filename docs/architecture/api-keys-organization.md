# Google API Keys 整理案

## 📋 現状の課題

先日にAPIキーを2種類に分けたが、以下の整理が必要：

1. **フロントエンドに漏れるAPIキー** (`NEXT_PUBLIC_`プレフィックス) → サイト制限をかけたキー
2. **バックエンドに隠れるAPIキー** (`NEXT_PUBLIC_`なし) → サイト制限をかけていないキー

しかし、現在の構成では：
- バックエンドAPIでも `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` を使用している
- これは、サイト制限をかけたキーをバックエンドで使っていることになり、セキュリティ上問題がある

## 🎯 整理方針

### APIキーの役割分担

#### 1. フロントエンド用APIキー（`NEXT_PUBLIC_`プレフィックス）
- **目的**: クライアント側（ブラウザ）で直接使用
- **セキュリティ**: サイト制限をかけたキー（HTTP referrer制限）
- **用途**: Maps JavaScript API、Places API（クライアント側）など

#### 2. バックエンド用APIキー（`NEXT_PUBLIC_`なし）
- **目的**: サーバーサイドでのみ使用
- **セキュリティ**: サイト制限をかけていないキー（サーバーからのアクセスのみ）
- **用途**: Distance Matrix API、Directions API、Places API（サーバー側）、Geocoding APIなど

## 📝 推奨される構成

### 環境変数の整理

```bash
# ============================================
# フロントエンド用（サイト制限あり）
# ============================================
# クライアント側で直接使用されるAPIキー
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx  # Maps JavaScript API用
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=xxx  # Places API (クライアント側)用

# ============================================
# バックエンド用（サイト制限なし）
# ============================================
# サーバーサイドでのみ使用されるAPIキー
GOOGLE_MAPS_API_KEY=xxx  # Distance Matrix API、Directions API用
GOOGLE_PLACES_API_KEY=xxx  # Places API (サーバー側)、Geocoding API用
```

### APIキーと有効にするAPIのセット

#### フロントエンド用キー（`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`）
**有効にするAPI:**
- ✅ Maps JavaScript API
- ✅ Directions API（JavaScript API経由のDirections Service用）
- ✅ Places API (New) - クライアント側のみ（オプション）

**サイト制限:**
- HTTP referrer: `https://caglla.travel/*`, `https://www.caglla.travel/*`

**使用場所:**
- `components/trip/TripMap.tsx` - Directions Service（ルート表示用）

---

#### フロントエンド用キー（`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`）
**有効にするAPI:**
- ✅ Places API (New) - クライアント側のみ
- ✅ Geocoding API - クライアント側のみ（将来使用する場合）

**サイト制限:**
- HTTP referrer: `https://caglla.travel/*`, `https://www.caglla.travel/*`

---

#### バックエンド用キー（`GOOGLE_MAPS_API_KEY`）
**有効にするAPI:**
- ✅ Distance Matrix API
- ✅ Directions API（Route Optimization で使用）
- ✅ Time Zone API

**サイト制限:**
- ❌ なし（サーバーからのアクセスのみ）

---

#### バックエンド用キー（`GOOGLE_PLACES_API_KEY`）
**有効にするAPI:**
- ✅ Places API (New) - サーバー側
- ✅ Geocoding API - サーバー側
- ✅ Maps Static API - PDF生成など

**サイト制限:**
- ❌ なし（サーバーからのアクセスのみ）

## 🔄 実装方針

### 1. バックエンド用APIキーの環境変数を追加
- `GOOGLE_MAPS_API_KEY` - バックエンド専用（サイト制限なし）
- `GOOGLE_PLACES_API_KEY` - バックエンド専用（サイト制限なし）

### 2. ミドルウェアを更新（フォールバック対応）
- バックエンド用キーを優先的に使用
- フォールバック: フロントエンド用キー（後方互換性のため）
- `withGooglePlacesKey()` → `GOOGLE_PLACES_API_KEY` を優先、なければ `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- `withGoogleMapsKey()` → `GOOGLE_MAPS_API_KEY` を優先、なければ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `withGoogleGeocodingKey()` → `GOOGLE_PLACES_API_KEY` を優先、なければ `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

### 3. APIエンドポイントの状態
- Distance Matrix API → `GOOGLE_MAPS_API_KEY` を使用 ✅ (既に修正済み)
- Directions API (Route Optimization) → `GOOGLE_MAPS_API_KEY` を使用 ✅ (既に修正済み)
- Time Zone API → `GOOGLE_MAPS_API_KEY` を使用（要修正: 現在 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を使用）
- Places API（サーバー側）→ `GOOGLE_PLACES_API_KEY` を使用 ✅ (フォールバック対応済み)
- Geocoding API（サーバー側）→ `GOOGLE_PLACES_API_KEY` を使用 ✅ (フォールバック対応済み)
- Maps Static API（PDF生成）→ `GOOGLE_PLACES_API_KEY` を使用 ✅ (フォールバック対応済み)

### 4. 環境変数の整理とドキュメント化
- `env.example` を更新
- ドキュメントを更新

## 📌 重要なポイント

- **フロントエンド用キー** (`NEXT_PUBLIC_*`) = サイト制限あり
- **バックエンド用キー** (`*` プレフィックスなし) = サイト制限なし
- 同じAPIでも、フロントエンドとバックエンドで異なるキーを使用
