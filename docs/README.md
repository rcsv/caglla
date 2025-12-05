# Caglla Travel Manager - ドキュメント

このディレクトリには、Caglla Travel Managerの技術仕様書、開発ガイド、アーキテクチャドキュメントが含まれています。

---

## 📋 Docs Governance（総則）

### 目的

`docs/` 以下の文書を、現行開発を妨げない状態で管理する。

### 基本ルール

1. **アクティブ文書以外は `archive/` に移動する**
   - 情報としての利用頻度が低い
   - 現行仕様/現行計画とは直接関係しない
   - 参照価値はある（履歴として）
   → 以上すべて満たす場合のみ `archive/` に移動

2. **削除しても Git 履歴で復元可能なものは削除可**
   - 一時的なコミット計画（`CHANGES_*` など）
   - 実装完了後の作業メモ

3. **計画書は実装完了後 7 日以内にアーカイブまたは削除する**
   - `planning/` 内の実装済み計画書は `planning/archive/` へ移動

4. **重複情報は CHANGELOG.md、仕様書、issues に一本化する**
   - `CHANGES_SUMMARY.md` / `CHANGES_DETAILED.md` は使用禁止
   - 変更履歴は `CHANGELOG.md` のみに記載

5. **解決済みIssueは `issues/done/` に移動する**
   - Issue解決後は即座に `issues/done/` へ移動

6. **リリースノートは最新5バージョンのみ保持**
   - 古いリリースノートは `releases/archive/` へ移動

### 情報分類

| 分類 | ディレクトリ | 説明 | ライフサイクル |
|------|------------|------|--------------|
| **仕様（現行）** | `specifications/` | 現在実装されている機能の仕様書 | 機能が存在する限り保持 |
| **決定（Decision Log）** | `architecture/` | アーキテクチャの決定事項 | 決定事項として保持 |
| **計画（planning）** | `planning/` | 実装予定の計画書 | 実装完了後7日以内に archive/ へ移動 |
| **変更履歴（CHANGELOG）** | `CHANGELOG.md` | 公式の変更履歴 | 永続的に保持 |
| **問題追跡（issues）** | `issues/` | バグ報告・機能要望 | 解決後は `issues/done/` へ移動 |
| **調査レポート（investigation）** | `investigation/` | 問題調査の記録 | 解決後は archive/ へ移動 |
| **リリースノート** | `releases/` | バージョン別のリリースノート | 最新5バージョンのみ保持 |
| **アーカイブ** | `archive/` | 過去のドキュメント | 参照頻度が低いが履歴として保持 |

### 定期メンテナンス

- **週次**: 新規追加されたドキュメントの分類確認
- **月次**: 解決済みIssueの `done/` への移動
- **四半期**: 実装済み計画書の archive/ への移動
- **年次**: アーカイブの見直し（本当に不要なものは削除検討）

**詳細**: `docs/investigation/docs-cleanup-report-2025-12-05.md` を参照

---

## 📖 ドキュメント一覧

### 仕様書（Specifications）

#### [チェックリスト機能仕様書](specifications/checklist-feature-specification.md)
旅行準備に必要なチェックリスト機能の詳細仕様です。以下の機能を含みます：
- **自動生成**: アクティビティタグに基づいた賢いチェックリスト生成
- **カテゴリー分類**: Preparing（行動系準備）とPacking（持ち物系）の2カテゴリー
- **カスタマイズ**: ユーザーが自由にアイテムを追加
- **プリセット機能**: ユーザー作成のテンプレートを共有・再利用
- **シームレスなUI**: 地図非表示で集中できる全幅表示

**主要トピック**:
- 画面構成とレイアウト
- データモデル（ChecklistItem, TripChecklist, ChecklistPreset）
- API設計（GET/PUT/POST/DELETE）
- ユーザープリセット機能（作成、シェア、適用）
- セキュリティとFirestore Security Rules
- パフォーマンス最適化

**対象読者**: プロダクトマネージャー、UI/UXデザイナー、開発者

---

#### [チェックリスト機能 改善提案仕様書](specifications/checklist-improvements.md)
既存仕様に対する改善提案（検索性・状態保持・UX/運用）。
- Algolia拡張による検索性向上 / 代替案（Meilisearch/Typesense）
- サブコレ化による状態保持の改善、個人差分の分離
- 再生成と手動編集の整合性（sourceRuleId/locked）
- 導入優先度、段階的移行、ルール/インデックス、計測

**対象読者**: プロダクトマネージャー、バックエンド/フロントエンド開発者

---

#### [スラッグ生成仕様](slug-generation-specification.md)
URL生成のためのスラッグシステムの詳細仕様です。
- スラッグの生成ルール（URL-safe文字列変換）
- ユニーク性の保証
- 日本語（漢字のみ）のハッシュ化フォールバック
- 使用例とベストプラクティス

**対象読者**: バックエンド開発者

---

### 開発ガイド（Development）

#### [チェックリスト実装ガイド](development/checklist-implementation-guide.md)
チェックリスト機能の実装手順と技術的な詳細です。
- **Phase 1**: 基本UI改善（MVP）
  - メインコンテンツでの全幅表示
  - カテゴリー選択UIの改善
  - アイテム削除機能
- **Phase 2**: プリセット基本機能
  - Firestore型定義の追加
  - プリセット作成・詳細・適用API
  - プリセット作成・管理モーダル
- **Phase 3**: プリセット共有機能
  - プリセット検索・適用モーダル
  - 公開プリセットライブラリ

**主要トピック**:
- 実装フェーズごとのタスクリスト
- コンポーネント実装例（TripChecklistView, ChecklistPresetModal など）
- API実装例（認証、権限チェック、Firestore操作）
- Firestore Security Rules
- Firestore Indexes
- テスト計画
- パフォーマンス最適化（楽観的更新）

**対象読者**: フロントエンド・バックエンド開発者

---

#### [アクティビティタグシステム開発ログ](development/activity-tag-system-development-log.md)
アクティビティタグシステムの開発経緯と設計判断の記録です。
- アクティビティカテゴリーの階層構造
- タグベースのチェックリスト生成ロジック
- データモデルの進化

**対象読者**: プロダクトマネージャー、開発者

---

### アーキテクチャ（Architecture）

#### [Google Maps Integration](architecture/google-maps-integration.md)
Google Maps JavaScript APIの統合方法とベストプラクティスです。
- マップの初期化
- マーカーの表示・更新
- ルート描画
- イベントハンドリング

**対象読者**: フロントエンド開発者

---

#### [Photo Caching Strategy](architecture/photo-caching-strategy.md)
写真キャッシング戦略の設計です。
- Firebase Storageからの画像取得
- ブラウザキャッシュの活用
- 画像最適化

**対象読者**: フロントエンド・バックエンド開発者

---

#### [Places API Cache Architecture](architecture/places-api-cache-architecture.md)
Google Places APIのキャッシュアーキテクチャです。
- APIレスポンスのFirestoreキャッシュ
- キャッシュの有効期限管理
- コスト削減戦略

**対象読者**: バックエンド開発者

---

### Firebase

#### [Firestore Collections](firebase/firestore-collections.md)
Firestoreコレクション構造の詳細です。
- コレクション一覧（users, trips, days, itineraries, trip_checklists, checklist_presets）
- フィールド定義
- リレーション

**対象読者**: バックエンド開発者、データベース設計者

---

#### [Firestore Setup Guide](firebase/firestore-setup-guide.md)
Firestoreのセットアップ手順です。
- プロジェクトの作成
- Firestoreデータベースの初期化
- Security Rulesの設定
- Indexesの作成

**対象読者**: 開発環境のセットアップ担当者

---

## 🔧 ドキュメントの使い方

### 新機能の実装時
1. **仕様書**を読んで、機能の全体像を理解する
2. **開発ガイド**に従って、段階的に実装を進める
3. **アーキテクチャ**ドキュメントで、関連する技術的な詳細を確認する

### 既存機能の理解時
1. **仕様書**で機能の目的と設計を把握する
2. **Firestore Collections**でデータモデルを確認する
3. コードベースを読む際に、開発ガイドを参照する

### トラブルシューティング時
1. **アーキテクチャ**ドキュメントで設計意図を確認する
2. **Firestore Setup Guide**で設定が正しいか確認する
3. 開発ガイドの「テスト計画」セクションで、テストケースを確認する

---

## 📝 ドキュメントの更新

ドキュメントは、以下のタイミングで更新してください：
- 新機能の仕様確定時：仕様書を作成
- 実装開始時：開発ガイドを作成
- 設計変更時：該当ドキュメントを更新
- バグ修正時：必要に応じて仕様書や開発ガイドを修正

---

## 🚀 今後のドキュメント追加予定

- PDF Export機能の仕様書と実装ガイド
- Google Calendar同期の仕様書と実装ガイド
- リアルタイム協力編集の仕様書と実装ガイド
- モバイルアプリの仕様書と実装ガイド

---

## 📚 関連リンク

- [プロジェクトREADME](../README.md)
- [AGENTS.md](../AGENTS.md) - AI開発アシスタント向けの指示

