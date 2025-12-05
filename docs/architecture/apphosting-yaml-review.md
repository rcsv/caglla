# apphosting.yaml レビュー

## 🔍 発見された問題点

### 1. バックエンド用APIキーの `availability` 設定

**現在の設定:**
```yaml
- variable: GOOGLE_PLACES_API_KEY
  secret: caglla-backend-places
  availability:
    - RUNTIME
    - BUILD  # ❌ 不要

- variable: GOOGLE_MAPS_API_KEY
  secret: caglla-backend-maps
  availability:
    - RUNTIME
    - BUILD  # ❌ 不要
```

**問題:**
- バックエンド用APIキー（`NEXT_PUBLIC_`なし）はサーバーサイドでのみ使用されます
- ビルド時には不要なので、`BUILD` を削除すべきです

**推奨修正:**
```yaml
- variable: GOOGLE_PLACES_API_KEY
  secret: caglla-backend-places
  availability:
    - RUNTIME  # ✅ サーバーサイドでのみ使用

- variable: GOOGLE_MAPS_API_KEY
  secret: caglla-backend-maps
  availability:
    - RUNTIME  # ✅ サーバーサイドでのみ使用
```

---

### 2. `NEXT_PUBLIC_GOOGLE_MAP_ID` の `availability` 設定

**現在の設定:**
```yaml
- variable: NEXT_PUBLIC_GOOGLE_MAP_ID
  secret: caglla-google-map-id
  availability:
    - BUILD  # ❌ RUNTIMEも必要かもしれない
```

**問題:**
- `NEXT_PUBLIC_`プレフィックスがあるので、Next.jsのビルド時にクライアントコードに埋め込まれます
- 通常は `BUILD` のみで十分ですが、ランタイムでも必要かどうか確認が必要

**推奨修正:**
```yaml
- variable: NEXT_PUBLIC_GOOGLE_MAP_ID
  secret: caglla-google-map-id
  availability:
    - BUILD
    - RUNTIME  # ✅ 念のため追加
```

---

### 3. `NEXT_PUBLIC_PRODUCT_ID` の `availability` 設定

**現在の設定:**
```yaml
- variable: NEXT_PUBLIC_PRODUCT_ID
  secret: caglla-stripe-product-id
  availability:
    - RUNTIME  # ❌ BUILDも必要
```

**問題:**
- `NEXT_PUBLIC_`プレフィックスがあるので、ビルド時にクライアントコードに埋め込まれる必要があります
- `BUILD` も必要です

**推奨修正:**
```yaml
- variable: NEXT_PUBLIC_PRODUCT_ID
  secret: caglla-stripe-product-id
  availability:
    - BUILD  # ✅ Next.jsビルド時に必要
    - RUNTIME
```

---

### 4. Stripe価格変数の `availability` 設定

**現在の設定:**
```yaml
- variable: STRIPE_PRICE_SEASON_TRAVELER
  secret: caglla-stripe-price-season-traveler
  availability:
    - BUILD
    - RUNTIME

- variable: STRIPE_PRICE_BACKPACKER
  secret: caglla-stripe-price-backpacker
  availability:
    - BUILD
    - RUNTIME

- variable: STRIPE_PRICE_GLOBETROTTER
  secret: caglla-stripe-price-globetrotter
  availability:
    - BUILD
    - RUNTIME
```

**問題:**
- `NEXT_PUBLIC_`プレフィックスがないので、サーバーサイドでのみ使用されるはず
- ビルド時には不要かもしれません（使用場所を確認する必要があります）

**確認が必要:**
- これらの変数がビルド時に使用されているかどうか
- サーバーサイドのみで使用される場合は `RUNTIME` のみで十分

---

## ✅ 正しく設定されているもの

1. **フロントエンド用APIキー** (`NEXT_PUBLIC_GOOGLE_*`)
   - `BUILD` と `RUNTIME` の両方が設定されている ✅
   - Next.jsビルド時にクライアントコードに埋め込まれるため正しい

2. **Firebase設定**
   - `BUILD` と `RUNTIME` の両方が設定されている ✅

3. **サーバーサイド専用APIキー** (`TRIPADVISOR_API_KEY`, `FOURSQUARE_API_KEY`, `SELECTPDF_API_KEY`, `SENDGRID_API_KEY`)
   - `RUNTIME` のみが設定されている ✅

---

## 📝 修正推奨事項のまとめ

1. **バックエンド用APIキー** → `RUNTIME` のみに変更
2. **`NEXT_PUBLIC_GOOGLE_MAP_ID`** → `RUNTIME` を追加（念のため）
3. **`NEXT_PUBLIC_PRODUCT_ID`** → `BUILD` を追加
4. **Stripe価格変数** → 使用場所を確認してから `BUILD` を削除するか判断
