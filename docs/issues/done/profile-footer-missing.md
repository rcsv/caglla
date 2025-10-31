# Issue: プロフィールページにFooterがない

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 低  
**関連ファイル**: `app/[userSlug]/page.tsx`

---

## 📋 概要

プロフィールページ（`/[userSlug]/page.tsx`）にFooterが表示されていない。他のページ（About、Contact、Homeなど）と統一性を保つため、Footerを追加する必要がある。

---

## 🐛 問題の詳細

### 現状
- プロフィールページは独自のレイアウトを使用
- Footerコンポーネントが含まれていない
- ページの最後にFooterが表示されない

### 期待される動作
- 他のページと同様にFooterが表示される
- プロフィールページのレイアウトに統一感がある

---

## 💡 解決方針

1. `HomeFooter`または`LandingFooter`コンポーネントを追加
2. 認証済みユーザー向けなので、`HomeFooter`の方が適切かもしれない
3. Aboutページとデザインを統一しているため、`LandingFooter`も検討

---

## 🔗 関連ファイル

- `app/[userSlug]/page.tsx` - プロフィールページ
- `components/common/HomeFooter.tsx` - ホーム用フッター
- `components/common/LandingFooter.tsx` - ランディングページ用フッター
- `app/home/page.tsx` - 参考実装

