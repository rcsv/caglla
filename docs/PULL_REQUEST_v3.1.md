# Support v3.1: セキュリティ修正、APIキー整理、PDFテンプレートリファクタリング

## 📋 概要

`support/v3.1` ブランチから `main` ブランチへの統合PRです。

**主な内容**:
1. ✅ CVE-2025-55182 セキュリティ修正（Critical）
2. ✅ APIキーの整理と分離（フロントエンド/バックエンド）
3. ✅ PDFテンプレートのリファクタリング（1946行→モジュール分割）
4. ✅ SNSフォロー・フォロワー機能の実装
5. ✅ 各種バグ修正と改善

---

## 🔒 セキュリティ修正（Critical）

### CVE-2025-55182 脆弱性修正

**影響**: React Server Components RCE vulnerability (CVE-2025-55182) affecting Next.js 16.x via React 19.2.0 dependency

**修正内容**:
- `next`: 16.0.6 → 16.0.7
- `react`: 19.2.0 → 19.2.1
- `react-dom`: 19.2.0 → 19.2.1
- `eslint-config-next`: 16.0.6 → 16.0.7

**関連コミット**: `8bc8704`

---

## 🔑 APIキー整理と分離

### 変更内容

Google APIキーをフロントエンド用とバックエンド用に分離しました。

#### フロントエンド用（サイト制限あり）
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps JavaScript API、Directions Service API
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - Places API (クライアント側)

#### バックエンド用（サイト制限なし）
- `GOOGLE_MAPS_API_KEY` - Distance Matrix API、Directions API (サーバー側)、Time Zone API
- `GOOGLE_PLACES_API_KEY` - Places API (サーバー側)、Geocoding API、Maps Static API

### 実装詳細

1. **ミドルウェアの更新** (`8e0533a`)
   - バックエンド用キーを優先、フォールバックとしてフロントエンド用キーを使用
   - `withGoogleMapsKey` ミドルウェアを追加

2. **API ルートの更新** (`db6a620`)
   - Distance Matrix API で `GOOGLE_MAPS_API_KEY` を使用
   - Directions API (サーバー側) で `GOOGLE_MAPS_API_KEY` を使用

3. **エラーログの改善** (`11c4e5f`)
   - より詳細なエラー情報を記録

4. **ドキュメント化** (`9c860f2`)
   - APIキーの整理方針と構成をドキュメント化
   - 各APIキーが有効にすべきAPIのリストを記載

### 環境変数の設定

`env.example` を更新し、フロントエンド用とバックエンド用のキーを明示的に分離しました。

**関連コミット**: `9c860f2`, `8e0533a`, `db6a620`, `11c4e5f`, `4e3387c`

---

## 📄 PDFテンプレートリファクタリング

### 変更内容

`magazine-pdf-template.ts`（1946行）を責務ごとに分割しました。

#### 新しい構造

```
lib/utils/pdf/
├── types.ts              # 型定義
├── styles.ts             # CSSスタイル（関数化、テーマ対応可能）
├── generator.ts          # オーケストレーター（ページ生成の統合）
├── index.ts              # 後方互換性のための再エクスポート
├── helpers/
│   ├── utils.ts          # 共通ユーティリティ
│   ├── map.ts            # 地図生成ヘルパー
│   ├── reservation.ts    # 予約情報ヘルパー
│   └── lodging.ts        # 宿泊情報ヘルパー
└── templates/
    ├── cover.ts          # 表紙
    ├── toc.ts            # 目次
    ├── reservations.ts   # 予約ページ
    ├── itinerary.ts      # 旅程ページ
    ├── emergency.ts      # 緊急連絡先
    ├── checklist.ts      # チェックリスト
    ├── memo.ts           # メモ
    └── back-cover.ts     # 裏表紙
```

#### 改善点

1. **責務の分離**: 各テンプレートが独立した関数として実装
2. **統一されたコンテキスト型**: `PdfContext` で一貫したデータ渡し
3. **マルチページ対応**: 各テンプレート関数は `string[]` を返す
4. **後方互換性**: 既存の `magazine-pdf-template.ts` はエイリアスとして維持

**関連コミット**: `bd0787f`

---

## 📝 PDFテンプレートの改善

### 変更内容

1. **予約情報の表示** (`981efbc`)
   - 予約情報を種類別にグループ化
   - フライト情報と標準予約情報を適切に表示

2. **説明文の表示改善**
   - 長い説明文でも表示が崩れないように高さ制限を追加

3. **URL変更**
   - PDF内のURLを `caglla.com` → `caglla.travel` に変更

**関連コミット**: `981efbc`

---

## 👥 SNSフォロー・フォロワー機能

### 実装内容

- ユーザーフォロー/アンフォロー機能
- フォロワー一覧表示
- フォロー中ユーザー一覧表示
- 旅行シェア機能の改善

**関連コミット**: `be0e8e8`

---

## 🛠️ その他の修正

### apphosting.yaml の環境変数設定修正 (`4e3387c`)

- `GOOGLE_PLACES_API_KEY`, `GOOGLE_MAPS_API_KEY`: `BUILD` → `RUNTIME` のみ
- `NEXT_PUBLIC_GOOGLE_MAP_ID`: `BUILD` → `BUILD, RUNTIME`
- `NEXT_PUBLIC_PRODUCT_ID`: `RUNTIME` → `BUILD, RUNTIME`

### Directions Service APIキーエラーの修正ガイド (`4326e54`)

- フロントエンドで Directions Service を使用する際の設定方法をドキュメント化

---

## ✅ テスト状況

- **テスト修正**: Distance API テストに `GOOGLE_MAPS_API_KEY` 環境変数を追加（mainに直接コミット済み）
- **テスト結果**: 386/392 テスト通過（プロダクションへの影響なし）

---

## 🔄 破壊的変更

### 環境変数の変更

既存の環境変数を使用している場合、以下の追加が必要です：

- `GOOGLE_MAPS_API_KEY` - バックエンド用（Distance Matrix API、Directions API等）
- `GOOGLE_PLACES_API_KEY` - バックエンド用（Places API、Geocoding API等）

詳細は `docs/architecture/api-keys-organization.md` を参照してください。

---

## 📚 関連ドキュメント

- `docs/security/cve-2025-55182-fix.md` - セキュリティ修正の詳細
- `docs/architecture/api-keys-organization.md` - APIキーの整理方針
- `docs/architecture/apphosting-yaml-fixes.md` - apphosting.yaml 修正の詳細
- `docs/refactoring/pdf-template-refactoring.md` - PDFテンプレートリファクタリングの設計
- `docs/architecture/directions-service-api-key-fix.md` - Directions Service 設定ガイド

---

## 🎯 チェックリスト

- [x] セキュリティ修正が適用されている
- [x] テストが通過している（386/392）
- [x] ドキュメントが更新されている
- [x] 環境変数の変更が `env.example` に反映されている
- [x] 後方互換性が維持されている（PDFテンプレート）

---

## 📊 コミット一覧

1. `be0e8e8` - feat: SNSフォロー・フォロワー機能の実装とOngoing旅行判定の修正
2. `981efbc` - feat: PDFテンプレートの改善と予約情報表示の修正
3. `bd0787f` - refactor: PDFテンプレートファイルを責務ごとに分割
4. `9c860f2` - docs: APIキーの整理方針と構成をドキュメント化
5. `8e0533a` - feat: バックエンド用APIキーを優先するようにミドルウェアを更新
6. `11c4e5f` - fix: Google Distance Matrix APIのエラーログを改善
7. `4e3387c` - fix: apphosting.yamlの環境変数availability設定を修正
8. `db6a620` - refactor: Distance Matrix APIとDirections APIでGOOGLE_MAPS_API_KEYを使用
9. `4326e54` - docs: Directions Service APIキーエラーの修正ガイドを追加
10. `8bc8704` - security: CVE-2025-55182の脆弱性を修正

---

## 🚀 デプロイ前の確認事項

1. **環境変数の設定確認**
   - 本番環境に `GOOGLE_MAPS_API_KEY` と `GOOGLE_PLACES_API_KEY` が設定されているか
   - フロントエンド用キーに Directions API が有効になっているか

2. **依存関係の更新**
   - `pnpm install` を実行して依存関係を更新

3. **ビルド確認**
   - `pnpm build` が正常に完了することを確認

---

## 🔗 関連Issue

- CVE-2025-55182 セキュリティ修正
- APIキー整理と分離
- PDFテンプレートリファクタリング
