# Issue: Headerのユーザー名横に言語選択状態を示す国旗アイコンを表示

**作成日**: 2025-10-31  
**解決日**: 2025-10-31  
**状態**: ✅ 解決済み  
**優先度**: 低  
**関連ファイル**: 
- `components/common/HomeHeader.tsx`（推定）
- `components/common/LandingHeader.tsx`（推定）
- `lib/i18n/storage.ts`（言語設定取得）
- `lib/utils/country-flags.ts`（国旗取得関数 - 参考）

---

## 📋 概要

現在どの言語が選択されているかが分からないため、Headerのユーザー名の横に小さく言語名を象徴する国旗アイコンを表示する。これにより、現在の言語設定を視覚的に確認できるようにする。

---

## 🐛 問題の詳細

### 現状
- Headerにユーザー名は表示されているが、現在の言語設定が分からない
- 言語切り替えを行っても、どの言語が選択されているか視覚的に確認できない
- プロフィール編集画面で言語を変更した際の反映状況が分かりづらい

### 期待される動作
- Headerのユーザー名の横（または近く）に小さな国旗アイコンを表示
- 選択中の言語に対応した国旗を表示
  - 日本語: 🇯🇵
  - 英語: 🇺🇸 または 🇬🇧
  - 中国語: 🇨🇳（将来対応時）
- ホバー時にツールチップで言語名を表示（例: "日本語" / "English"）
- クリック可能な場合は言語選択モーダルを開く（オプション）

---

## 💡 解決方針

### Phase 1: 基本的な表示

1. **言語設定の取得**
   - `lib/i18n/storage.ts`または`lib/utils/language.ts`から現在の言語設定を取得
   - プロフィール設定を最優先、フォールバックでブラウザ設定を使用

2. **国旗アイコンのマッピング**
   ```typescript
   const languageFlags: Record<SupportedLanguage, string> = {
     ja: '🇯🇵',
     en: '🇺🇸',
     zh: '🇨🇳'
   }
   ```

3. **UI実装**
   - Headerコンポーネントのユーザー名表示エリアに追加
   - 小さなサイズ（例: `text-sm`または`w-4 h-4`）で表示
   - ホバー時にツールチップ表示（i18n対応）

### Phase 2: インタラクション（オプション）

1. **クリック可能にする**
   - 国旗アイコンをクリックで言語選択モーダルを開く
   - またはドロップダウンメニューで言語切り替え

2. **アニメーション**
   - 言語切り替え時にアイコンが更新されることを視覚的に示す（フェードイン/アウトなど）

---

## 🎨 UIデザイン案

### 配置
- ユーザー名の右側に小さな国旗アイコン
- またはユーザーアイコンの近くに表示

### サイズ・スタイル
- 小さいサイズ（16px程度）で目立ちすぎない
- グレー系の背景色で統一（オプション）
- ホバー時に少し拡大または色が変わる

---

## 🔍 調査が必要な項目

1. **Headerコンポーネントの実装確認**
   - `HomeHeader.tsx`と`LandingHeader.tsx`のどちらを使用しているか
   - ユーザー名が表示されている位置の確認
   - 既存の国旗表示実装の有無（`getCountryFlag`関数など）

2. **言語設定取得方法の確認**
   - 現在の言語設定を取得する最適な方法
   - プロフィール設定とブラウザ設定の優先順位
   - リアルタイムで言語変更を検知する方法

3. **既存の国旗表示実装**
   - `lib/utils/country-flags.ts`の実装を参考にする
   - 絵文字国旗かSVG国旗か、既存の実装に合わせる

---

## 💡 技術的検討事項

### 言語→国旗のマッピング
- **日本語 (ja)**: 🇯🇵 (Japanese flag)
- **英語 (en)**: 🇺🇸 (US flag) または 🇬🇧 (UK flag)
- **中国語 (zh)**: 🇨🇳 (Chinese flag)

### 実装方法
- 絵文字国旗を使用（シンプル、パフォーマンス良好）
- またはSVGアイコンを使用（デザイン統一性、拡張性）

### アクセシビリティ
- `aria-label`で言語名を明示（スクリーンリーダー対応）
- キーボード操作でフォーカス可能にする（クリック可能な場合）

---

## 🔗 関連ファイル

- `components/common/HomeHeader.tsx` - ホーム用ヘッダー
- `components/common/LandingHeader.tsx` - ランディングページ用ヘッダー
- `lib/i18n/storage.ts` - 言語設定の保存・取得
- `lib/utils/language.ts` - 言語設定のユーティリティ
- `lib/utils/country-flags.ts` - 国旗取得関数（参考）
- `lib/i18n/index.ts` - i18n設定（言語名の取得）

---

## 📝 実装時の注意事項

- 言語切り替えのフォールバック問題（`language-switching-fallback-issue.md`）と関連
- 言語設定の優先順位を明確にする必要がある
- 小さなアイコンなので、パフォーマンスへの影響は最小限に抑える
- モバイル表示でも見やすいサイズにする

---

## ✅ 解決内容

### 実装した変更

1. **言語→国旗マッピングの作成**
   - `HomeHeader.tsx`に`languageFlags`オブジェクトを追加
   - 9つのサポート言語に対応する国旗絵文字を定義

2. **現在の言語取得**
   - `getUserLanguage()`を使用して現在の言語を取得
   - `useState`と`useEffect`でクライアントサイドでの更新を実装

3. **UI実装**
   - ユーザー名の横に国旗アイコンを表示
   - `title`属性でホバー時に言語名（ネイティブ名）を表示
   - `aria-label`でアクセシビリティ対応

4. **スタイリング**
   - `text-base leading-none`で小さなサイズに調整
   - ユーザー名と並べて表示（`flex items-center gap-1.5 justify-end`）

### 実装詳細

```typescript
// 言語→国旗のマッピング
const languageFlags: Record<SupportedLanguage, string> = {
  ja: '🇯🇵',
  en: '🇺🇸',
  zh: '🇨🇳',
  ko: '🇰🇷',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹'
}

// 現在の言語を取得
const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => getUserLanguage())

// UI表示
<span 
  className="text-base leading-none" 
  title={LANGUAGE_NAMES[currentLanguage]?.native || currentLanguage}
  aria-label={`Current language: ${LANGUAGE_NAMES[currentLanguage]?.native || currentLanguage}`}
>
  {languageFlags[currentLanguage] || '🌐'}
</span>
```

### 対応済みの確認事項

- [x] Headerに現在の言語を示す国旗アイコンが表示される
- [x] 言語切り替え時に国旗アイコンが更新される（`useEffect`で実装）
- [x] ホバー時にツールチップで言語名が表示される（`title`属性で実装）
- [x] アクセシビリティ対応（`aria-label`を実装）
- [x] モバイル表示でも適切に表示される（レスポンシブ対応済み）
- [x] 既存のUIデザインと調和している（ユーザー名の横に小さく配置）

---

## ✅ 解決後の確認事項

- [x] Headerに現在の言語を示す国旗アイコンが表示される
- [x] 言語切り替え時に国旗アイコンが更新される
- [x] ホバー時にツールチップで言語名が表示される（i18n対応）
- [x] アクセシビリティ対応（`aria-label`など）が実装されている
- [x] モバイル表示でも適切に表示される
- [x] 既存のUIデザインと調和している

