# Issue: /memories ページでの警告・エラーの多発

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `app/memories/page.tsx`
- `lib/i18n/storage.ts`
- `lib/contexts/auth.tsx`（ログ関連・ブラウザ情報取得）
- `lib/utils/browser.ts`（geolocation）
- 画像表示コンポーネント（Next/Image使用箇所）

---

## 📋 概要

/memories ページ表示時に、以下のエラー/警告が多数発生する：
- `Uncaught ReferenceError: process is not defined`
- geolocation 取得に関するブラウザの違反警告
- 画像の`sizes`属性未指定および`priority`推奨警告
- 言語ログが過剰に出力（重複）

---

## 🐛 詳細ログ

```
memories:3 Uncaught ReferenceError: process is not defined
browser.ts:143 [Violation] Only request geolocation information in response to a user gesture.
Image ... has "fill" but is missing "sizes" prop. Please add it ...
Image ... was detected as the Largest Contentful Paint (LCP). Please add the "priority" property ...
logger.ts:159 DEBUG: Language from override (cookie/localStorage): en (複数回)
```

---

## 🔍 想定原因と対処方針

### 1) `process is not defined`
- **原因**: クライアントバンドル内で `process`（Nodeグローバル）参照。`process.env` 直接参照や `typeof process !== 'undefined'` なしでの使用。
- **対処**:
  - クライアントコードから `process.env` の直接参照を排除し、必ず `lib/env-validation.ts` 経由で取得（サーバ/クライアント分岐）。
  - どうしても必要なら `typeof process !== 'undefined'` ガードを付与（推奨は環境バリデータの利用）。

### 2) Geolocation 取得の違反警告
- **原因**: ユーザー操作（クリック等）に紐づかないタイミングで `navigator.geolocation.getCurrentPosition` を呼び出している。
- **対処**:
  - 明示的なユーザー操作イベント後に呼ぶ（「現在地を取得」ボタンなど）。
  - 取得前に許諾説明UIを出す、取得はオプトイン。

### 3) 画像の`sizes`未指定（`fill`使用時）
- **原因**: Next/Image の `fill` 指定時、`sizes` 属性未設定。
- **対処**:
  - 下記のように `sizes` を指定：
    ```tsx
    <Image fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" ... />
    ```

### 4) LCP画像の`priority`未指定
- **原因**: ファーストビューの大画像（LCP候補）に `priority` 未指定。
- **対処**:
  - ファーストビューに確実に表示されるHero/主要画像に `priority` を付与。

### 5) 言語ログの重複出力
- **原因**: 言語取得処理（cookie/localStorage override）が複数箇所/複数回走っている。
- **対処**:
  - 言語状態をコンテキストで一元化し、初期化時に一度だけ決定。
  - DEBUG ログは dev 環境かつ初期化時のみに限定。

---

## 💡 実装タスク（提案）

1. `process`参照箇所の検出と修正
   - grep: `process.` / `process.env` をクライアント側で使っていないか確認
   - `lib/env-validation.ts`の利用へ切替
2. geolocation 呼び出しのユーザー操作連動化
   - 「現在地を取得」UI導入、呼出し位置をイベントハンドラ内へ移動
3. 画像最適化
   - `fill` 使用箇所に `sizes` を追加
   - LCP対象画像に `priority` を追加
4. 言語ログ
   - 言語状態の初期化を一回に絞る
   - ログスパム防止（去勢 or debounce）

---

## ✅ 完了条件
- [ ] /memories で `process is not defined` が発生しない
- [ ] geolocation の違反警告が消える（操作連動）
- [ ] `fill` 画像に `sizes` 指定、LCP画像に `priority` 指定
- [ ] 言語関連ログの重複出力が解消
- [ ] Lighthouse パフォーマンス/Best Practices の改善確認
