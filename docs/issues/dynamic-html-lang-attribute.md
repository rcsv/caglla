# Issue: `<html lang="ja">` のハードコードによる影響と動的設定への変更提案

**作成日**: 2025-11-01  
**状態**: 🔴 未解決  
**優先度**: 低  
**種類**: i18n化、SEO、アクセシビリティ改善  
**関連ファイル**: 
- `app/layout.tsx`（RootLayout）
- `lib/utils/language.ts`（言語ユーティリティ）
- `lib/utils/trip-template.ts`（PDF生成用HTML）
- `lib/utils/magazine-pdf-template.ts`（マガジンPDF生成）

---

## 📋 概要

`app/layout.tsx`のRootLayoutで`<html lang="ja">`がハードコードされており、アプリケーションの多言語対応に影響を与える可能性があります。HTMLの`lang`属性は、検索エンジン、スクリーンリーダー、ブラウザの言語処理に使用されるため、適切な設定が重要です。

---

## 🔍 現状の調査結果

### 1. 現在の実装

**ファイル**: `app/layout.tsx` (26行目)

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">  {/* ← ハードコード */}
      <head>
        {/* ... */}
      </head>
      <body className={`${inter.className} ${rajdhani.variable}`}>
        {/* ... */}
      </body>
    </html>
  )
}
```

### 2. 他箇所の`lang`属性使用状況

ハードコードされた`lang="ja"`が使用されている箇所：

1. **`app/layout.tsx`** - メインアプリケーションのルートレイアウト
2. **`lib/utils/trip-template.ts`** (338行目) - 旅程PDF生成用HTML
3. **`lib/utils/magazine-pdf-template.ts`** (953行目) - マガジンPDF生成用HTML

### 3. 言語システムの現状

アプリケーションでは既に多言語対応のインフラが整備されています：

**言語ユーティリティ**: `lib/utils/language.ts`
- `getUserLanguage()`関数でユーザーの言語設定を取得可能
- 優先順位: ユーザープリファレンス → ブラウザ設定 → デフォルト（`'en'`）
- サポート言語: `'ja'`, `'en'`, `'zh'`, `'ko'`, `'es'`, `'fr'`, `'de'`, `'it'`, `'pt'`

```typescript
export function getUserLanguage(user?: User | null): SupportedLanguage {
  // 1. ユーザープリファレンス
  // 2. ブラウザ設定
  // 3. デフォルト言語（'en'）
}
```

---

## 🐛 問題の詳細

### 影響1: SEO（検索エンジン最適化）

**問題**:
- `lang="ja"`がハードコードされているため、英語版ページでも検索エンジンは「日本語」として認識
- 検索結果表示が不正確になる可能性
- 多言語サイトの構造が正しく認識されない

**参考**: [React/Next.jsのlang="en"問題について](https://iwb.jp/react-nextjs-website-lang-en-ja/)

### 影響2: アクセシビリティ

**問題**:
- スクリーンリーダーが誤った言語として読み上げる可能性
- 音声読み上げの発音が不自然になる
- WCAG 2.1の言語ガイドラインに準拠していない

**例**:
- 英語設定ユーザーが日本語として読み上げられる
- 文字の正しい読み上げができない

### 影響3: ブラウザの自動処理

**問題**:
- 翻訳機能が誤って動作する可能性
- 自動翻訳の提案が不適切になる
- 言語固有のフォント/タイポグラフィ処理が正しく機能しない

**例**:
```css
/* ブラウザが日本語として誤認識 */
html[lang="ja"] {
  font-family: "Noto Sans JP", sans-serif;
}
```

### 影響4: 他の言語への拡張性

**問題**:
- RTL（右から左へ）言語（アラビア語、ヘブライ語など）への対応が困難
- 言語固有の文字方向（`direction: rtl`）が正しく適用されない
- 将来的な多言語対応の基盤が不十分

### 影響5: PDF生成時の一貫性

**問題**:
- `lib/utils/trip-template.ts`と`lib/utils/magazine-pdf-template.ts`でも`lang="ja"`をハードコード
- 英語版PDFでも日本語として生成される
- メタデータの言語情報が不正確

---

## 💡 実装方針

### Next.js App Routerでの動的`lang`属性

Next.js 13+のApp Routerでは、`lang`属性を動的に設定する方法がいくつかあります：

#### 方法1: RootLayoutでCookiesから取得（推奨）

SSRでCookieから言語設定を取得し、`lang`属性を動的に設定：

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'
import { getUserLanguage } from '@/lib/utils/language'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cookieから言語設定を取得
  const cookieStore = cookies()
  const userLanguage = cookieStore.get('language')?.value || 'en'
  
  // サポート言語のみ許可
  const lang = isSupportedLanguage(userLanguage) ? userLanguage : 'en'
  
  return (
    <html lang={lang}>
      {/* ... */}
    </html>
  )
}
```

**利点**:
- SSRで正しい言語が設定される
- 検索エンジンが正しい言語を認識
- スクリーンリーダーの初期読み上げが正確

**問題点**:
- `app/layout.tsx`は現在同期コンポーネントで、`cookies()`は非同期関数
- Next.js 13+では`layout.tsx`で`cookies()`を使うには`async`にする必要がある

#### 方法2: クライアント側で動的変更

クライアント側で`lang`属性を変更：

```tsx
'use client'
import { useEffect } from 'react'
import { useLanguage } from '@/lib/contexts/language' // 新規作成が必要

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { language } = useLanguage()
  
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])
  
  return (
    <html lang="en"> {/* デフォルト値 */}
      {/* ... */}
    </html>
  )
}
```

**問題点**:
- 初期レンダリング時に`lang`属性が不正確
- SSRとクライアント側の不一致（Hydration warning）
- SEOに悪影響

#### 方法3: 中間層アプローチ（推奨）

**段階的実装**:

1. **Phase 1**: デフォルトを`'en'`に変更
   - 現状の`lang="ja"`は日本語がデフォルトという誤った印象を与える
   - 実際のデフォルト言語は`'en'`（`lib/utils/language.ts`）
   - `lang="en"`に変更するだけでも改善

2. **Phase 2**: 完全な動的実装
   - Next.jsの`generateStaticParams`やミドルウェアで処理
   - または、各ページレベルの`generateMetadata`で設定

---

## 🎯 推奨実装アプローチ

### 最も簡易な方法: `'en'`に変更

現状のi18nシステムでは、デフォルト言語が`'en'`（英語）です：

```typescript
// lib/utils/language.ts
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'
```

しかし、`app/layout.tsx`では`lang="ja"`となっており、不整合が発生しています。

**即座の修正**:
```tsx
// app/layout.tsx
<html lang="en">  {/* 'ja' から 'en' に変更 */}
```

**理由**:
- デフォルト言語が`'en'`なので、それに合わせる
- 多言語対応が実装されるまでの暫定対応
- SEOとアクセシビリティが一部改善される

### 完全な動的実装（将来）

完全な動的実装には、以下の実装が必要：

1. **Cookie/セッション管理**: 言語設定を保存
2. **ミドルウェア**: リクエストヘッダーから言語を検出
3. **各ページのメタデータ**: `generateMetadata`で`lang`を設定

**実装例**:
```tsx
// app/layout.tsx
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLanguageFromCookie()
  return {
    htmlLang: lang,
    // ...
  }
}
```

---

## 📊 影響範囲の評価

### 現在の影響度

| 影響範囲 | 深刻度 | 影響度 | 緊急度 |
|---------|--------|--------|--------|
| SEO | 中 | 中 | 低 |
| アクセシビリティ | 高 | 中 | 中 |
| ブラウザ機能 | 低 | 低 | 低 |
| 開発・拡張性 | 中 | 中 | 低 |

**総合評価**: **低優先度**（将来の改善項目）

### 現状維持が許容される理由

1. **アプリケーションの性質**:
   - 主に認証済みユーザー向けのプライベートサービス
   - 検索エンジンからのトラフィックが限定的

2. **既存のi18nシステム**:
   - アプリ内コンテンツは既に多言語対応
   - UIテキストは`t()`関数で言語切り替え可能
   - HTMLメタデータの不整合は機能に直接影響しない

3. **実装コスト**:
   - 完全な動的実装には時間とコストがかかる
   - 他の優先度の高いIssueが存在

---

## 🔧 実装計画

### Phase 1: 簡易修正（即座に実施可能）

**目的**: デフォルト言語の不整合を修正

**変更内容**:
1. `app/layout.tsx`: `lang="ja"` → `lang="en"`
2. `lib/utils/trip-template.ts`: `lang="ja"` → `lang="en"`
3. `lib/utils/magazine-pdf-template.ts`: `lang="ja"` → `lang="en"`

**効果**:
- ✅ デフォルト言語の一貫性向上
- ✅ SEOの一部改善
- ✅ アクセシビリティの一部改善

**リスク**: なし

### Phase 2: 完全な動的実装（将来）

**目的**: ユーザーの言語設定に基づいて`lang`属性を動的に設定

**実装内容**:
1. Cookie/セッションで言語設定を管理
2. ミドルウェアで言語を検出
3. RootLayoutで動的に`lang`属性を設定

**効果**:
- ✅ 完全な多言語対応
- ✅ SEO最適化
- ✅ アクセシビリティ準拠

**リスク**:
- SSR/クライアント側の不一致
- Hydration warningの発生可能性
- 実装・テストコスト

---

## 📝 技術的検討事項

### Next.js App Routerの制約

**問題**:
- `app/layout.tsx`は同期コンポーネントとして設計されている
- `cookies()`や`headers()`などのServer-only APIを使うには`async`が必要
- `async`にすると、すべてのレイアウトが非同期になる

**解決策**:
1. **ミドルウェアアプローチ**: `middleware.ts`で言語を検出し、ヘッダーに設定
2. **各ページで設定**: 各ページの`generateMetadata`で個別に設定
3. **中間層コンポーネント**: レイアウト内に言語検出コンポーネントを配置

---

## ✅ テスト計画

### Phase 1（簡易修正）

- [ ] `lang="en"`に変更
- [ ] 各ブラウザでの動作確認
- [ ] スクリーンリーダーでの読み上げ確認
- [ ] SEOツールでの`lang`属性確認

### Phase 2（完全実装）

- [ ] 各言語での`lang`属性確認
- [ ] SSR/クライアント側の一致確認
- [ ] Hydration warningの有無確認
- [ ] PDF生成時の言語確認

---

## 🔗 関連リンク

### 参考資料
- [HTML lang attribute - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang)
- [WCAG 2.1 - Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html)
- [Next.js internationalization](https://nextjs.org/docs/advanced-features/i18n-routing)

### 関連Issue
- [言語設定のi18n化](language-settings-i18n.md)
- [PDF生成の言語対応](pdf-language-support.md)

---

## 🙏 補足事項

### 現状維持を推奨する理由

1. **優先度の低さ**:
   - 他の未解決Issueが多数存在
   - アプリの主要機能に影響しない

2. **実装コスト**:
   - 完全な動的実装には時間がかかる
   - Phase 1の簡易修正のみならすぐに実施可能

3. **段階的改善**:
   - Phase 1で簡易修正
   - ユーザーフィードバックを収集
   - Phase 2は将来的に検討

### 推奨事項

**現時点での対応**:
- Phase 1の簡易修正を実施（`lang="en"`に変更）
- Phase 2の完全実装は将来のタスクとして記録

**優先度**:
- **Phase 1**: 中（簡易修正のため即座に実施可能）
- **Phase 2**: 低（将来的な改善項目）

---

**このIssueは、アプリケーションの多言語対応を完璧にするための将来の改善項目です。現状では緊急性は低いですが、SEOとアクセシビリティの観点から、Phase 1の簡易修正は推奨されます。**

