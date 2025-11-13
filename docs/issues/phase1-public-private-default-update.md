---
title: Phase 1 – Public/Private デフォルト値変更と Trip Guide 名称更新
status: Proposed
author: GPT-5 Codex (assistant)
createdAt: 2025-11-12
linkedPlan: public-private-mode-revamp.md#phase-1
---

# Phase 1 着手計画

## 🎯 目的
- 新規トリップ作成時のデフォルト公開範囲を `public` から `private` へ変更し、個人利用を優先する UX に合わせる。
- 旧 `Travel Guide` メニューをリブランディングした `Trip Guide` へ名称統一し、Public データの最新コンセプトに沿わせる。

## 🧩 対象コンポーネント/モジュール
- `components/common/CreateTripDialog.tsx`
- `app/trip/new/page.tsx`
- `app/api/trips/route.ts`（POST）
- `components/trip/TripEditor.tsx`（説明テキスト更新）
- `lib/i18n/index.ts`
- `components/common/navigation` 系（Trip Guide 文言を利用する UI 全般）

## ✅ 実装タスク
1. **Create Trip ダイアログのデフォルト値変更**
   - `useState` 初期値を `accessLevel: 'private'` に変更。
   - UI 上のヘルプテキスト・ツールチップも新定義（Public=紹介用 / Private=自分用）へ更新。
   - キャンセル時のリセット処理でも `accessLevel: 'private'` を維持するよう調整。

2. **新規作成ページ（`/trip/new`）の整合性**
   - `app/trip/new/page.tsx` の初期 state を `accessLevel: 'private'` へ。
   - プラン制限チェック時のメッセージも新定義に合わせる。

3. **バックエンド保険措置**
   - `app/api/trips/route.ts` POST で `access_level` が未指定の場合 `private` を設定。
   - Firestore 書き込み時の後方互換性を確認（既存フィールド `access_level` は `public|private` 混在許容）。

4. **Trip Editor 説明文**
   - `TripEditor` の公開範囲説明を新メッセージへ更新（`t('tripEditor.accessLevel.*')`）。

5. **i18n 翻訳キー更新**
   - `lib/i18n/index.ts` で公開範囲説明・Trip Guide 名称に関わるキーを更新。
   - 既存キーの参照箇所（`TripEditor`、サイドバー等）を確認し、新キーへ置換。

6. **UI 内の `Travel Guide` 表記置換**
   - サイドバー、メニュー、パンくずなど `Travel Guide` を参照する箇所を `Trip Guide` に統一。
   - `lib/i18n/index.ts` のキー（型定義含む）を `tripGuide` にリネームし、英日翻訳値を更新。参照側（例: `components/common/HomeHeader.tsx`）の置換も実施。
   - アイコン名称・テスト等も確認し、必要ならリファクタ。

7. **QA / 動作確認**
   - 新規トリップ作成 → Firestore に `access_level: private` が保存されること。
   - Trip Editor での表示文言が更新されていること。
   - ナビゲーション全体で `Trip Guide` に統一されていること。

## 🧪 推奨テスト
- **単体テスト**: 既存のフォーム関連テストがあれば更新。無い場合は省略可。
- **E2E**:
  - 新規トリップ作成フロー（Cypress/Playwright）で `private` デフォルトを確認。
  - サイドバー/トップメニューに `Trip Guide` が表示されることを確認。
- **スナップショット**: i18n 文言変更が影響する UI コンポーネントがあれば更新。

## 📎 追加メモ
- 後続フェーズ（Phase 2 以降）の機能が依存しないよう、今回の変更は純粋なデフォルト値と言語変更に限定する。
- 変更後、`Trip Guide` のコンセプト説明（ドキュメント/ツールチップ）は Phase 2 以降で拡充予定。

