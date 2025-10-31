# Issue: LandingFooter の Products 欄からトップページへ戻れない

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**: 
- `components/common/LandingFooter.tsx`（推定）
- `app/page.tsx`（トップページ）

---

## 📋 概要

ランディングフッター（LandingFooter）において、トップページへ戻るための明確な導線がない。Products 欄に、トップページ内容（Summary 等）に最も近い文言でリンクを追加し、トップページへ戻れるようにする。

---

## 🐛 問題の詳細

### 現状
- Footer の Products セクションにトップページへのリンクがない
- ユーザーが別ページからトップに戻る導線が分かりづらい

### 期待される動作
- Products 欄にトップページへ遷移するリンクを追加
- 文言はトップページで表現している内容に最も近いもの（例: "Summary"）
- 可能であれば i18n 対応（`t('footer.products.summary')` など）

---

## 💡 解決方針

1. Footer の Products セクションにリンクを追加
   - ラベル案: "Summary"（日本語: 「概要」）
   - 遷移先: `/`（トップページ）またはトップ内のセクション ID（例: `/#summary`）
2. i18n キーを追加（英日対応）
   - `footer.products.summary`: "Summary" / "概要"
3. UI 一貫性
   - 既存のFooterリンクと同じスタイル・ホバー挙動を適用

---

## 🔗 関連ファイル
- `components/common/LandingFooter.tsx`
- `app/page.tsx`（トップセクションのID確認: `summary` 等）
- `lib/i18n/index.ts`（i18nキー追加）

---

## ✅ 完了条件
- [ ] Products 欄にトップページ（または Summary セクション）へのリンクを追加
- [ ] i18n キーを追加して文言を多言語化
- [ ] デザイン・ホバー挙動が他リンクと統一
- [ ] アクセシビリティ（ARIAラベル）を適切に設定
