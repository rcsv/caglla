# Feature (Backlog): POIDialogへの外部POI API統合（TripAdvisor / Foursquare）

**作成日**: 2025-10-31  
**状態**: 🟡 未実装（後回し）  
**優先度**: 低  
**関連ファイル**:
- `components/trip/POIDialog.tsx`
- `lib/api/`（外部APIヘルパー追加予定）
- `lib/env-validation.ts`（環境変数の検証）

---

## 📋 概要

POIDialogで表示するスポット詳細に、TripAdvisorおよびFoursquare（Places API）から取得した豊富なメタデータ（レビュー、評価、カテゴリ、写真等）を統合する。現状は未着手のため、後回し（Backlog）としてIssueに残す。

---

## 🎯 目的
- 既存のGoogle Placesデータに加えて、外部ソースからの信頼できるレビュー/写真/カテゴリを補完
- 旅行計画の質向上（ユーザーがスポットを判断しやすく）

---

## 🧩 機能要件（案）
- TripAdvisor
  - レーティング、レビュー抜粋、写真、価格帯、URL
- Foursquare
  - カテゴリ、スコア、チェックイン数、写真、URL
- 複数ソースのデータマージ（重複/矛盾の解決方針）
- 元データの出典表記（各プロバイダの規約準拠）

---

## 🔐 セキュリティ/キー管理
- `lib/env-validation.ts`に以下を追加（例）
  - `NEXT_PUBLIC_FOURSQUARE_API_KEY`
  - `TRIPADVISOR_API_KEY`
- サーバサイド経由で外部APIを呼び出し（APIキーをクライアントに晒さない）

---

## 🛠 実装方針（高レベル）
1. APIヘルパー追加
   - `lib/api/foursquare.ts`
   - `lib/api/tripadvisor.ts`
2. 同期ロジック
   - `place_id`や座標、名称から同定（ファジーマッチ）
   - キャッシュ層（Firestore/Redis相当）で応答の再利用
3. POIDialog拡張
   - タブ式UI（Overview / Reviews / Photos / From Foursquare / From TripAdvisor）
   - 出典ロゴ・外部リンク
4. エラーハンドリング/フォールバック
   - 外部API失敗時は既存のGoogleデータのみ表示

---

## ⏳ 優先順位/段階導入
- Phase 0: 仕様整理・APIキー準備（Backlog）
- Phase 1: Foursquare最小統合（カテゴリ・スコア）
- Phase 2: TripAdvisor統合（レーティング・レビュー）
- Phase 3: 画像/写真の最適化表示、キャッシュ層

---

## ✅ 完了条件（将来）
- [ ] 環境変数と検証が追加されている
- [ ] サーバ経由のAPIヘルパーで外部呼び出しができる
- [ ] POIDialogに外部データが表示され、出典表記がある
- [ ] 外部API失敗時のフォールバックが機能
- [ ] 規約遵守（ブランド/クレジット）
