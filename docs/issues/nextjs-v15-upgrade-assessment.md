# Next.js v15 Upgrade Assessment

- **Priority**: P2（技術的負債の管理）
- **URL**: リポジトリ全体
- **Component**: `package.json`, `next.config.js`, `app/*`, API Routes
- **Epic**: Platform modernization

## ステータス

- 🕵️ 調査中（2025-11-11）
- 現行バージョン: `next@14.2.33`

## 現状

- App Router ベースの構成（`app/` ディレクトリ）、Route Handler API を広範に使用。
- `next/font`, `next/headers`, `NextResponse` など v14 で導入された API を利用。
- カスタム Jest 設定 (`next/jest`) と Storybook/Playwright は未導入だが E2E テスト (Playwright) は別管理。
- App Hosting（Firebase）でデプロイしており、 Node v18 環境想定。

## 期待結果

- Next.js v15 へのアップグレードにより React 19 対応、Optimized Partial Prerendering (OPP) など最新機能が利用可能。
- セキュリティアップデート（依存ライブラリ）を受け取り、長期的なメンテナンス性を向上。

## 想定される影響 / ハイライト

- **React 19 (RC) 完全対応**: v15 では React 19 をターゲットにしており、`use` フックや Actions API が安定化。現状コンポーネントは v14 用に書かれているが、互換性は概ね維持される見込み。
- **Route Handler / fetch**: v15 では `undici` v6+ が前提。カスタムポリフィルを Jest 用に導入しているため、Node 実行時の fetch 周りに差異が出ないか確認が必要。
- **ESLint プラグイン**: `next lint` のルールが更新される可能性。既存の eslint 設定 (`.eslintrc.js`) が v15 対応か要確認。
- **ビルド出力**: Turbopack/OPP の改善によりキャッシュ構造が変化。App Hosting へのデプロイ手順に変更が必要になる可能性。
- **依存パッケージ**: `@iconify/react`, `firebase`, `firebase-admin` などは v15 による breaking change の影響を受けないが、TypeScript バージョン(現在 5.x) が要求を満たすか要確認。
- **Testing**: `next/jest` が v15 に合わせて major update されるため、Jest polyfill (`jest.setup.js`) の互換性チェックが必要。

## 原因仮説（リスク）

- Firebase App Hosting の Node runtime が v18 固定のため、Next.js v15 が要求する Node v20 以上だった場合は互換性問題となる。
- API Route で `NextResponse` に Buffer を渡す箇所（PDF 返却など）が v15 で stricter validation を受け、対応が必要。
- 依存ライブラリが React 19 をまだサポートしていないケース（`@dnd-kit`, `@iconify/react` など）によりビルドが警告/失敗する可能性。

## 受け入れ基準

- [ ] `next` を v15 (最新安定版) にアップデートして `pnpm install` が成功。
- [ ] `pnpm lint`, `pnpm test`, `pnpm build` がローカルで通る。
- [ ] Firebase App Hosting で本番ビルドをデプロイし、主要ルートが 200 を返す。
- [ ] `/api/*` ルートのレスポンス形式に regressions がない（特に PDF, CSV, JSON）。
- [ ] Lighthouse スコア・Core Web Vitals が v14 と同程度以上を維持。

## 解決方針（案）

1. **依存アップデートの下準備**  
   - `pnpm outdated` で Next.js v15 に伴う依存を洗い出す。TypeScript、@types/react なども更新。
   - `next.config.js` の deprecated オプションを確認（`output`, `experimental` 等）。
2. **検証ブランチ作成**  
   - `feature/next15-upgrade` などでパッケージ更新、`pnpm build` を実行。
   - E2E（Playwright）と API ハンドラの smoke test を実施。
3. **Firebase/App Hosting 対応**  
   - Node runtime バージョン要件を確認し、必要なら `engines` フィールドを `package.json` に追加。
4. **監視とロールバック計画**  
   - Cloud Logging にエラーログアラートを設定し、アップデート後 24h は監視。
   - 問題発生時は `support/v2.1` にロールバックできるようタグ付け（例: `deploy/v2.1.0`）。

## アクセシビリティ / UX

- 直接の変更はないが、App Router の streaming などを活かすことで今後の UX 改善余地が広がる。

## メモ

- React 19 が GA まで待つか（v15.1 以降）を検討。既存の React API で blocking となるものは現状見つかっていない。
- Vercel の Edge Runtime を活用する場合は、Firebase App Hosting との併用可否を別途検証。

