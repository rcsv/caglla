# ScheduleCard.tsx リファクタリングドキュメント

ScheduleCard.tsx（1,252行）を550-600行まで削減するための包括的なリファクタリングガイドです。

---

## 📚 ドキュメント構成

### 1. **`implementation-guide.md`** ⭐ **最優先で読むこと**

**現場でコケないための実践的な実装ガイド**

- 🚨 状態の一貫性（同期／競合）の対策
- 🔧 型とAPIの互換性維持
- ⚡ レンダリング・パフォーマンス最適化
- 🌍 タイムゾーンと通貨の正しい扱い方
- ♿ メニューのUX/アクセシビリティ対応
- 🧪 テスト戦略（ユニット・E2E）
- 📋 実装チェックリスト
- 🚢 PR/リリース戦略

**対象**: 実装者全員必読

---

### 2. **`quick-wins.md`** ⚡ 即効性が高い施策

**4時間で101行（8%）削減できる施策**

#### フェーズ1（1.5時間）: 73行削減
- タイムゾーン選択肢のライブラリ化（17行）
- バリデーション関数のユーティリティ化（18行）
- ティアドロップスタイルのCSS化（38行）

#### フェーズ2（2.5時間）: 28行削減
- useClickOutsideカスタムフック（13行）
- DragHandleコンポーネント（10行）
- TeardropMarkerコンポーネント（5行）

**対象**: すぐに成果を出したい実装者

---

### 3. **`schedule-card-refactoring-proposal.md`** 📋 全体計画

**包括的なリファクタリング提案書**

- コンポーネント抽出（6個）
- 定数・ライブラリ化（3個）
- カスタムフック（3個）
- 実装優先順位（4フェーズ、8-12日）
- 期待される効果

**対象**: プロジェクトマネージャー、アーキテクト

---

### 4. **`schedule-card-analysis.md`** 🔍 詳細分析

**1行単位の詳細分析レポート**

- 30セクションに分けた分析
- 各セクションの削減可能行数
- 最も効果的な施策トップ5
- 削減箇所のサマリーテーブル

**対象**: 詳細な分析が必要な実装者

---

## 🎯 推奨される読み方

### ケース1: すぐに実装を始めたい
1. ✅ `implementation-guide.md` - 注意点を理解
2. ✅ `quick-wins.md` - フェーズ1から実装開始
3. ✅ PRを出してレビュー

### ケース2: 全体計画を理解したい
1. ✅ `schedule-card-refactoring-proposal.md` - 全体像を把握
2. ✅ `schedule-card-analysis.md` - 詳細分析を確認
3. ✅ `implementation-guide.md` - 実装方法を理解
4. ✅ チームで優先順位を決定

### ケース3: 現場の失敗事例を知りたい
1. ✅ `implementation-guide.md` の「重要な注意点」セクション
2. ✅ 「実装上の具体的な"痛い目"と防御策」セクション
3. ✅ 「テスト／QAでチェックすべき具体シナリオ」セクション

---

## 📊 リファクタリング効果の予測

| 指標 | 現状 | 目標 | 削減率 |
|------|------|------|--------|
| 総行数 | 1,252行 | 550-600行 | 56% |
| State数 | 17個 | 8-10個 | 41-47% |
| 再利用可能コンポーネント | 0個 | 9個 | - |
| カバレッジ | 0% | 80%+ | - |

---

## 🚀 実装ロードマップ

### フェーズ1: 基盤整備（1-2日）
**Quick Winsに含まれる**
- タイムゾーン・通貨選択のライブラリ化
- バリデーション関数のユーティリティ化
- CSS整理

**成果**: 73行削減（6%）

---

### フェーズ2: カスタムフック（2-3日）
- `useItineraryEditor` - 旅程編集ロジック
- `useInlineEditor` - インライン編集ロジック
- `useScheduleCardImage` - 画像キャッシュロジック
- `useClickOutside` - メニュー外クリック検知

**成果**: 約180行削減（14%）

---

### フェーズ3: コンポーネント分離（3-4日）
- `TeardropMarker` - マーカー表示
- `DragHandle` - ドラッグハンドル
- `ScheduleCardImage` - 画像表示
- `InlineTimeEditor` - 時間編集フォーム
- `InlineCostEditor` - 費用編集フォーム
- `ScheduleInfoDisplay` - 情報表示
- `ScheduleCardMenu` - メニュー

**成果**: 約400行削減（32%）

---

### フェーズ4: 統合・最適化（2-3日）
- ScheduleCard.tsxのリファクタリング
- パフォーマンス最適化
- アクセシビリティ対応
- テスト追加
- ドキュメント更新

**成果**: 約50行削減（4%）

---

**総所要時間**: 8-12日  
**最終削減**: 約700行（56%）  
**最終行数**: 550-600行

---

## ⚠️ 最重要な注意事項

### 必ず対応すること
1. ✅ **AbortController** でリクエストの競合を防ぐ
2. ✅ **楽観更新+ロールバック** でUX向上とエラーハンドリング
3. ✅ **React.memo/useCallback/useMemo** でパフォーマンス最適化
4. ✅ **キーボード操作+ARIA属性** でアクセシビリティ対応
5. ✅ **小さいPR** で段階的にリリース

### やってはいけないこと
❌ 一気に大きなリファクタリングをする  
❌ 既存のAPIを壊して全箇所を修正する  
❌ テストを書かずにリリースする  
❌ アクセシビリティを無視する  
❌ パフォーマンスを計測せずに最適化する

---

## 📞 質問・相談先

### 実装上の質問
- `implementation-guide.md` を確認
- チームのテックリードに相談
- PRレビューで質問

### 設計上の質問
- `schedule-card-refactoring-proposal.md` を確認
- アーキテクトチームに相談

### 緊急の問題
- Slackの #dev-help チャンネル
- オンコールエンジニアに連絡

---

## 🧪 テスト要件

### ユニットテスト
- [ ] 各カスタムフック（Jest）
- [ ] バリデーション関数（Jest）
- [ ] 各子コンポーネント（React Testing Library）

### E2Eテスト
- [ ] インライン編集フロー（Playwright）
- [ ] メニュー操作（Playwright）
- [ ] 並行編集の競合処理（Playwright）
- [ ] キーボード操作（Playwright）

### 視覚テスト
- [ ] モバイル表示（Chromatic or Percy）
- [ ] ダークモード対応（必要に応じて）

### アクセシビリティテスト
- [ ] スクリーンリーダーテスト（NVDA/JAWS）
- [ ] キーボードのみでの操作（Tab/Arrow/Enter/Escape）
- [ ] Lighthouse Accessibility Score 90+

---

## 📈 進捗管理

### Jira/GitHub Issues
各フェーズごとにチケットを作成：
- `REFACTOR-001`: タイムゾーン・バリデーションユーティリティ
- `REFACTOR-002`: useItineraryEditor, useClickOutside
- `REFACTOR-003`: DragHandle, TeardropMarker
- `REFACTOR-004`: ScheduleCardImage
- `REFACTOR-005`: InlineTimeEditor, InlineCostEditor
- `REFACTOR-006`: ScheduleInfoDisplay
- `REFACTOR-007`: ScheduleCardMenu
- `REFACTOR-008`: ScheduleCard統合リファクタリング

### Definition of Done
各チケットで以下を満たすこと：
- [ ] コード実装完了
- [ ] ユニットテスト追加（カバレッジ80%+）
- [ ] E2Eテスト追加（主要フロー）
- [ ] アクセシビリティチェック完了
- [ ] パフォーマンス計測（リグレッションなし）
- [ ] コードレビュー承認
- [ ] QA検証完了
- [ ] ドキュメント更新

---

## 🎓 参考資料

### React Best Practices
- [React 公式ドキュメント - フック](https://react.dev/reference/react)
- [React 公式ドキュメント - パフォーマンス最適化](https://react.dev/learn/render-and-commit)

### アクセシビリティ
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### タイムゾーン/日時処理
- [Luxon Documentation](https://moment.github.io/luxon/)
- [You Don't Need Moment.js](https://github.com/you-dont-need/You-Dont-Need-Momentjs)

### テスト
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## 📝 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2025-10-19 | 1.0.0 | 初版作成 |

---

**最終更新**: 2025年10月19日  
**作成者**: AI Assistant  
**承認者**: （未定）

