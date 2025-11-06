# Feature: POIDialogへの外部POI API統合（TripAdvisor / Foursquare）

**作成日**: 2025-10-31  
**実装日**: 2025-11-06（推定）  
**状態**: ✅ 実装済み  
**優先度**: 低  
**関連ファイル**:
- `components/modals/POIDialog.tsx`
- `lib/api/tripadvisor.ts`
- `lib/api/foursquare.ts`
- `lib/api/venue-aggregator.ts`
- `app/api/venue/aggregate/route.ts`
- `lib/core/types/env.ts`

---

## 📋 概要

POIDialogで表示するスポット詳細に、TripAdvisorおよびFoursquare（Places API）から取得した豊富なメタデータ（レビュー、評価、カテゴリ、写真等）を統合する。**既に実装済み**で、Google Placesデータに加えて外部ソースからの情報を補完表示している。

---

## 🎯 目的

- 既存のGoogle Placesデータに加えて、外部ソースからの信頼できるレビュー/写真/カテゴリを補完
- 旅行計画の質向上（ユーザーがスポットを判断しやすく）

---

## 🧩 機能要件

- TripAdvisor
  - レーティング、レビュー抜粋、写真、価格帯、URL
- Foursquare
  - カテゴリ、スコア、チェックイン数、写真、URL
- 複数ソースのデータマージ（重複/矛盾の解決方針）
- 元データの出典表記（各プロバイダの規約準拠）

---

## 🔐 セキュリティ/キー管理

- `lib/core/types/env.ts`に以下を追加済み
  - `TRIPADVISOR_API_KEY`（サーバーサイド専用、オプション）
  - `FOURSQUARE_API_KEY`（サーバーサイド専用、オプション）
- サーバサイド経由で外部APIを呼び出し（APIキーをクライアントに晒さない）
- 環境変数が未設定でも動作する（フォールバック処理）

---

## ✅ 実装完了（2025-11-06）

### 実装内容

#### Phase 1: APIヘルパーの実装 ✅
- **`lib/api/tripadvisor.ts`**: TripAdvisor Content API統合
  - 場所検索、詳細情報取得、レビュー取得、写真取得
  - APIキー未設定時は警告を出してスキップ（フォールバック処理）
  - エラーハンドリング実装済み

- **`lib/api/foursquare.ts`**: Foursquare Places API v3統合
  - 場所検索、詳細情報取得、Tips取得、写真取得
  - APIキー未設定時は警告を出してスキップ（フォールバック処理）
  - エラーハンドリング実装済み

#### Phase 2: データ統合ロジック ✅
- **`lib/api/venue-aggregator.ts`**: 複数ソースのデータ統合
  - Google Places、TripAdvisor、Foursquareのデータを統合
  - 統合評価情報の計算（加重平均、レビュー数で重み付け）
  - 統合写真情報の集約
  - レビュー・Tipsの統一フォーマット変換
  - 価格情報の統合（優先順位: Google → TripAdvisor → Foursquare）
  - 営業時間情報の統合（優先順位: Google → TripAdvisor → Foursquare）

#### Phase 3: サーバーサイドプロキシ ✅
- **`app/api/venue/aggregate/route.ts`**: サーバーサイドプロキシエンドポイント
  - CORS問題を回避
  - APIキーをクライアント側に露出しない
  - エラーハンドリング実装済み
  - 環境変数の状態をログ出力（デバッグ用）

#### Phase 4: POIDialog統合 ✅
- **`components/modals/POIDialog.tsx`**: 統合データの表示
  - 統合評価情報の表示（複数ソースの評価を統合表示）
  - 統合レビューの表示（Google + TripAdvisor + Foursquare）
  - 出典表記（ソースアイコン: Google/TripAdvisor/Foursquare）
  - エラーハンドリング（外部API失敗時はGoogleデータのみ表示）
  - 非同期データ取得（Google Places取得後に外部APIを呼び出し）

#### Phase 5: 環境変数の設定 ✅
- **`lib/core/types/env.ts`**: 環境変数の型定義
  - `TRIPADVISOR_API_KEY`: オプション（サーバーサイド専用）
  - `FOURSQUARE_API_KEY`: オプション（サーバーサイド専用）
  - 環境変数の検証はオプションとして扱われ、未設定でも動作する

### 実装の特徴

1. **フォールバック処理**: APIキーが未設定の場合やAPI呼び出しが失敗した場合でも、Google Placesデータのみで動作する
2. **並行処理**: TripAdvisorとFoursquareのデータを並行取得してパフォーマンスを最適化
3. **エラーハンドリング**: 各API呼び出しでエラーが発生しても、他のソースのデータは取得・表示される
4. **出典表記**: 各レビュー・評価にソースアイコンを表示し、データの出典を明確化
5. **統合評価**: 複数ソースの評価をレビュー数で重み付けした加重平均で統合表示

### 動作確認項目

- ✅ 環境変数が設定されていない場合の動作（フォールバック処理）
- ✅ 環境変数が設定されている場合の動作（外部API呼び出し）
- ✅ エラーハンドリング（API呼び出し失敗時の動作）
- ✅ UI表示（統合評価、レビュー、出典表記）
- ✅ サーバーサイドプロキシ経由でのデータ取得
- ✅ CORS問題の回避

### 完了条件

- [x] 環境変数と検証が追加されている（オプションとして実装）
- [x] サーバ経由のAPIヘルパーで外部呼び出しができる
- [x] POIDialogに外部データが表示され、出典表記がある
- [x] 外部API失敗時のフォールバックが機能
- [x] 規約遵守（ブランド/クレジット）- 出典表記で対応

---

## 🔮 今後の拡張案

### Phase 6: キャッシュ層の実装（未実装）
- Firestore/Redis相当のキャッシュ層で応答の再利用
- API呼び出し回数の削減
- パフォーマンスの向上

### Phase 7: UI/UXの改善（未実装）
- タブ式UI（Overview / Reviews / Photos / From Foursquare / From TripAdvisor）
- 外部リンクの追加（TripAdvisor/Foursquareの詳細ページへのリンク）
- 写真ギャラリーの拡張（統合写真の表示）

### Phase 8: データ品質の向上（未実装）
- ファジーマッチングの改善（場所名の一致度向上）
- 重複データの検出と統合
- データの信頼性スコアの計算

---

## 🔧 改善点・既知の問題

### 1. Google Photos URL変換の未実装
**問題**: `lib/api/venue-aggregator.ts`の`aggregatePhotos`メソッドで、Google Photosの`photo_reference`をそのままURLとして保存しているが、実際には`placesApiHelpers.getPhotoUrl()`で変換する必要がある。

**影響**: 統合写真情報（`aggregatedPhotos`）が正しく表示されない可能性がある。

**対応**: `aggregatePhotos`メソッドで`placesApiHelpers.getPhotoUrl()`を使用してURLを変換する。

**ファイル**: `lib/api/venue-aggregator.ts` (197行目)

### 2. 統合写真情報の未使用
**問題**: `aggregatedPhotos`がPOIDialogで使用されていない可能性がある。

**影響**: 統合写真情報が表示されない。

**対応**: POIDialogで`aggregatedPhotos`を表示する機能を追加する。

**ファイル**: `components/modals/POIDialog.tsx`

### 3. TripAdvisor APIの言語設定がハードコード
**問題**: `lib/api/tripadvisor.ts`の`makeRequest`メソッドで、言語設定が`'ja'`にハードコードされている。

**影響**: ユーザーの言語設定に関係なく、常に日本語でデータを取得する。

**対応**: ユーザーの言語設定に応じて言語パラメータを動的に設定する。

**ファイル**: `lib/api/tripadvisor.ts` (146行目)

### 4. キャッシュ層の未実装
**問題**: 外部APIの応答をキャッシュする機能が実装されていない。

**影響**: 同じ場所のデータを取得するたびにAPI呼び出しが発生し、コストとパフォーマンスに影響する。

**対応**: Firestore/Redis相当のキャッシュ層を実装する。

**優先度**: 低（今後の拡張案として検討）
