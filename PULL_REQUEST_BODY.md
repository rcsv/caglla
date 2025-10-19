# 📋 機能提案まとめドキュメントの追加

## 変更内容

機能提案を整理・統合したまとめドキュメント `docs/features/FEATURE_PROPOSALS.md` を追加しました。

## 🎯 目的

Caglla Travel Managerの将来的な機能提案を一元管理し、開発の優先順位と実装状況を明確化することを目的としています。

## 📝 追加されたドキュメント

### `docs/features/FEATURE_PROPOSALS.md`

以下の2つの機能提案をまとめています:

#### 1. 左ペインとGoogle Mapsの連動強化機能

**ステータス**: 提案中  
**詳細**: [features-and-implementation-idea.md](./docs/features/features-and-implementation-idea.md)

**主要機能**:
- Daysエリアクリック時の地図フィルタリング
- Itineraryクリック時の地図フォーカス
- 地図マーカークリック時の左ペイン連動
- ルート表示の強化

**実装フェーズ**:
- Phase 1: Itineraryクリック時の地図フォーカス（実装難易度: ⭐⭐）
- Phase 2: Daysエリアクリック時の地図フィルタリング（実装難易度: ⭐⭐⭐）
- Phase 3: 地図マーカークリック時の左ペイン連動（実装難易度: ⭐⭐⭐）
- Phase 4: ルート表示の強化（実装難易度: ⭐⭐⭐⭐）

#### 2. サブスクリプションプラン設計

**ステータス**: 一部実装済み（Season Traveler, Backpacker, Globetrotterは実装済み）  
**詳細**: [subscription-idea.md](./docs/features/subscription-idea.md)

**プラン構成**:

| プラン | 価格 | ステータス | 対象 |
|--------|------|-----------|------|
| Season Traveler | 無料 | ✅ 実装済み | 個人の軽旅行者 |
| Backpacker | ¥480/月 | ✅ 実装済み | 個人の旅行愛好家 |
| Globetrotter | ¥980/月 | ✅ 実装済み | 個人の旅行上級者 |
| Planner Pro | ¥2,480/月〜 | 📝 提案中 | 旅行代理店・小規模企業 |
| Enterprise | ¥5,000/月〜 | 📝 提案中 | 大企業・旅行業界企業 |

**実装状況**:
- Phase 1（MVP）: ✅ 完了
- Phase 2（機能拡張）: ✅ 完了
- Phase 3（B2B対応）: 📝 提案中
- Phase 4（エンタープライズ）: 📝 提案中

## 🚀 次のステップ

### 優先度: 高
1. **左ペインとGoogle Mapsの連動強化 - Phase 1**
   - Itineraryクリック時の地図フォーカス
   - 実装難易度が低く、即座に効果を実感できる

### 優先度: 中
2. **左ペインとGoogle Mapsの連動強化 - Phase 2**
   - Daysエリアクリック時の地図フィルタリング
3. **サブスクリプションプラン - Phase 3（B2B対応）**
   - Planner Pro（2,480円プラン）の実装

### 優先度: 低
4. **左ペインとGoogle Mapsの連動強化 - Phase 3, 4**
5. **サブスクリプションプラン - Phase 4（エンタープライズ）**

## 📝 レビュープロセス

各機能提案は以下のプロセスでレビューされます:

1. **提案**: 機能の概要と期待される効果を文書化
2. **技術調査**: 実装難易度とリソース要件の評価
3. **承認**: プロジェクトオーナーによる承認
4. **実装**: 段階的な機能実装
5. **テスト**: ユーザーフィードバックの収集
6. **リリース**: 本番環境へのデプロイ

## ✅ チェックリスト

- [x] ドキュメントの内容を確認した
- [x] 既存の機能提案ドキュメントとの整合性を確認した
- [x] 実装状況と優先順位を明確化した
- [x] レビュープロセスを定義した

## 💭 補足事項

このドキュメントは、既存の `features-and-implementation-idea.md` と `subscription-idea.md` を統合し、プロジェクトの機能提案を一元管理するためのものです。各提案の詳細は、個別のドキュメントを参照してください。

---

**レビュー URL**: https://github.com/rcsv/caglla/pull/new/feature/feature-proposals

