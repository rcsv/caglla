# Google API Keys 整理のまとめ

## 🎯 整理の目的

先日のAPIキー分割後の影響を整理し、以下のルールを明確にする：

1. **フロントエンドに漏れるAPIキー** (`NEXT_PUBLIC_`プレフィックス) → **サイト制限をかけたキー**
2. **バックエンドに隠れるAPIキー** (`NEXT_PUBLIC_`なし) → **サイト制限をかけていないキー**

## 📝 APIキーと有効にするAPIのセット

### フロントエンド用（サイト制限あり）

#### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **有効にするAPI:**
  - ✅ Maps JavaScript API
- **サイト制限:** HTTP referrer `https://caglla.travel/*`, `https://www.caglla.travel/*`

#### `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- **有効にするAPI:**
  - ✅ Places API (New) - クライアント側のみ
- **サイト制限:** HTTP referrer `https://caglla.travel/*`, `https://www.caglla.travel/*`

### バックエンド用（サイト制限なし）

#### `GOOGLE_MAPS_API_KEY`
- **有効にするAPI:**
  - ✅ Distance Matrix API
  - ✅ Directions API（Route Optimization で使用）
  - ✅ Time Zone API
- **サイト制限:** ❌ なし（サーバーからのアクセスのみ）

#### `GOOGLE_PLACES_API_KEY`
- **有効にするAPI:**
  - ✅ Places API (New) - サーバー側
  - ✅ Geocoding API - サーバー側
  - ✅ Maps Static API - PDF生成など
- **サイト制限:** ❌ なし（サーバーからのアクセスのみ）

## 🔄 実装済みの変更

### ミドルウェアの更新（フォールバック対応）
- バックエンド用キーを優先的に使用
- フォールバック: フロントエンド用キー（後方互換性のため）
- ✅ `withGooglePlacesKey()` → `GOOGLE_PLACES_API_KEY` を優先
- ✅ `withGoogleMapsKey()` → `GOOGLE_MAPS_API_KEY` を優先
- ✅ `withGoogleGeocodingKey()` → `GOOGLE_PLACES_API_KEY` を優先

### APIエンドポイントの更新
- ✅ Distance Matrix API → `GOOGLE_MAPS_API_KEY` を使用
- ✅ Directions API (Route Optimization) → `GOOGLE_MAPS_API_KEY` を使用
- ✅ Time Zone API → `GOOGLE_MAPS_API_KEY` を使用（フォールバック対応）
- ✅ Maps Static API（PDF生成）→ `GOOGLE_PLACES_API_KEY` を使用（フォールバック対応）

## 📌 次のステップ

1. **環境変数の設定**
   - `GOOGLE_MAPS_API_KEY` を設定（バックエンド専用、サイト制限なし）
   - `GOOGLE_PLACES_API_KEY` を設定（バックエンド専用、サイト制限なし）

2. **Google Cloud Console での設定**
   - 各APIキーに対して適切なAPIを有効化
   - フロントエンド用キーにはサイト制限を設定
   - バックエンド用キーにはサイト制限を設定しない

3. **動作確認**
   - Distance Matrix API の動作確認
   - Directions API の動作確認
   - Time Zone API の動作確認
   - Places API（サーバー側）の動作確認

## ⚠️ 重要なポイント

- **フロントエンド用キー** (`NEXT_PUBLIC_*`) = サイト制限あり
- **バックエンド用キー** (`*` プレフィックスなし) = サイト制限なし
- 同じAPIでも、フロントエンドとバックエンドで異なるキーを使用する設計

## 📋 使用されているAPIの確認

- ✅ **Time Zone API** - `lib/api/google/timezone.ts` で使用（バックエンド用キーを使用するように更新済み）
- ✅ **Directions API** - `app/api/route-optimization/route.ts` で使用（バックエンド用キーを使用済み）
