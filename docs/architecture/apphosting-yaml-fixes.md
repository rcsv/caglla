# apphosting.yaml 修正内容

## ✅ 修正済み

### 1. バックエンド用APIキー（`GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY`）
- **修正前**: `availability: [RUNTIME, BUILD]`
- **修正後**: `availability: [RUNTIME]`
- **理由**: サーバーサイドでのみ使用されるため、ビルド時には不要

### 2. `NEXT_PUBLIC_GOOGLE_MAP_ID`
- **修正前**: `availability: [BUILD]`
- **修正後**: `availability: [BUILD, RUNTIME]`
- **理由**: 念のため、ランタイムでも利用可能に（通常はBUILDのみで十分だが）

### 3. `NEXT_PUBLIC_PRODUCT_ID`
- **修正前**: `availability: [RUNTIME]`
- **修正後**: `availability: [BUILD, RUNTIME]`
- **理由**: `NEXT_PUBLIC_`プレフィックスがあるため、ビルド時にクライアントコードに埋め込まれる必要がある

### 4. Unsplash APIキー（`UNSPLASH_ACCESS_KEY`, `UNSPLASH_SECRET_KEY`）
- **修正前**: `availability: [RUNTIME, BUILD]`
- **修正後**: `availability: [RUNTIME]`
- **理由**: サーバーサイドでのみ使用されるため、ビルド時には不要

---

## ⚠️ 確認が必要

### Stripe価格変数（`STRIPE_PRICE_*`）
- **現在の設定**: `availability: [BUILD, RUNTIME]`
- **確認事項**: 
  - コードベース内で直接使用されていない可能性がある
  - `NEXT_PUBLIC_`プレフィックスがないので、サーバーサイドのみで使用されるはず
  - ビルド時に使用されるかどうかを確認する必要がある

**推奨**: 使用場所を確認してから、必要に応じて `RUNTIME` のみに変更

---

## 📝 原則

### `NEXT_PUBLIC_`プレフィックスがある場合
- `BUILD` と `RUNTIME` の両方が必要（Next.jsビルド時にクライアントコードに埋め込まれるため）

### `NEXT_PUBLIC_`プレフィックスがない場合
- サーバーサイドでのみ使用される → `RUNTIME` のみで十分
- ビルド時にも使用される場合のみ → `BUILD` も必要
