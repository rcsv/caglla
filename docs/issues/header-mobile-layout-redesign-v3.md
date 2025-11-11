# Header Mobile Layout Redesign (v3.0)

- Priority: P0（640px未満でヘッダーが収まらない・操作密度過多）
- Scope: `/[userSlug]/[tripSlug]`（ログイン後画面中心）、共通ヘッダーの影響も考慮
- Goal: 640px未満でヘッダーを簡素化し、主要操作をフローティング化して可用性を高める

## 要件（提案反映）
1) ハンバーガーメニューを左端のフローティング化
- 位置: `left: 0`, `top: 100px` で開始（モバイル時のみ）
- 表示: 円形ボタン（44px+）・影つき・`zidx-left-panel`相当
- 動作: 押下で左メニュー開閉（現行 `mobileMenuOpen` を流用）

2) 既存ハンバーガー位置は「Cg ロゴ」へ変更
- 動作: タップで `/home` に遷移
- 文字は省略・ロゴのみ（横幅節約）

3) 地図起動ボタンは右下の円形フローティング（FAB）に集約
- 表示: 右下固定（モバイル時のみ）、56px円形、`zidx-map-button`
- 動作: 現行のモバイル地図モーダルを起動（実装済みの `mobileMapOpen` を流用可能）

4) 「…（ドットメニュー）」はヘッダーから撤去
- 左メニュー下段の「Logout」領域を「Extra Controls >」に改名
- 押下で現行のメニュー項目（Export、Edit Base Info、Calendar Publish など）をポップアップ表示

5) Public/Private バッジは Summary View のヒーロー画像上に重ねて表示
- 位置: ヒーロー画像の右上（余白内）
- Z-index: `.zidx-top-menu-content` など既存クラスを使用

## 実現可能性（Feasibility）
- 技術的に実装可能: Yes
- 互換性: 既存状態管理（`mobileMenuOpen`, `mobileMapOpen`）を再利用可能
- スタイル: 既存Z-index管理クラスとTailwindユーティリティで実現可能
- i18n: 文字列増分は最小（「Extra Controls」程度）

## 影響範囲（主要コンポーネント）
- `components/planner/FloatingTitleBar.tsx`: モバイルのボタン削除（ハンバーガー）・タブは継続可（必要なら縮約）
- `components/trip/TripPageLayout.tsx`: モバイル用フローティングボタンを受け渡し（props追加）
- `app/[userSlug]/[tripSlug]/page.tsx`: フローティングハンバーガー/FABの実装・状態制御・既存 `mobileToolbar` との両立
- `components/planner/NavigationMenu.tsx`: 下段メニューを「Extra Controls >」に変更し、メニュー（従来ドット）をここから開く
- `components/trip/TripHeroSection.tsx`: Summary時のPublic/Privateバッジのオーバーレイ配置

## 実装方針（ステップ）
1. ハンバーガーのフローティング化
   - 新UI: `button.fixed.left-0.top-[100px]`（モバイルのみ表示）
   - `zidx-left-panel` を付与、`onClick` で `setMobileMenuOpen(true)`
2. ヘッダー左のアイコンをロゴ（`CagllaLogo`）に差替え
   - `Link href="/home"` にする、ラベルは `aria-label="Go to home"`
3. Map FAB 追加（右下）
   - `button.fixed.right-4.bottom-5`、`zidx-map-button`、`onClick` で `setMobileMapOpen(true)`
4. ドットメニューの移設
   - `FloatingTitleBar` からドットメニューを外し、`NavigationMenu` 下段に「Extra Controls >」ボタンを追加
   - 既存の `menuItems` をここで表示（同一ロジックを流用）
5. Public/Private バッジの位置変更
   - `TripHeroSection` に配置（Summary時のみ）、右上オーバーレイ表示
6. ヘッダー圧縮（必要に応じて）
   - モバイル時のタイトルサイズ調整、余白削減（既に一部対応済み）

## 受け入れ基準（Acceptance Criteria）
- [ ] 640px未満でヘッダー内の要素（タイトル等）が溢れず、1行で収まるか省略される
- [ ] ハンバーガーは左端フローティングで常にアクセス可能
- [ ] 右下FABで地図を起動できる（モーダル/全画面表示で閉じる操作あり）
- [ ] ドットメニューはヘッダーから消え、「Extra Controls >」から同等の操作が可能
- [ ] Public/Private バッジはヒーロー画像上に表示（Summary時のみ）
- [ ] すべてのボタンのタップ領域は44x44px以上
- [ ] 既存 `.zidx-*` クラスのみで重なり順を管理（ハードコードz禁止）

## アクセシビリティ
- フローティングボタン類は `aria-label` を付与
- モーダル表示時はフォーカスをトラップ、Escapeで閉じる

## リスク/考慮点
- フローティング要素の重なり（FABと他オーバーレイ）: `.zidx-map-button` を優先度高めに
- 小型端末での誤タップ: FAB/ハンバーガーの上下余白を十分に確保
- SSR/CSRの差異: 初期描画時のフラッシュを避けるため、メディアクエリ依存のクラス条件を統一

## 作業見積り（概算）
- 実装: 4-6h
- 動作確認/微調整: 2h
- ドキュメント更新: 0.5h

## 追跡
- Epic: Trip mobile IA/ナビゲーション再設計
- 関連Issue: 
  - `trip-page-mobile-left-menu-toggle-quirk.md`
  - `trip-page-mobile-map-unavailable.md`
  - `home-header-title-missing-mobile.md`
  - `prelogin-header-title-missing-mobile.md`

## 決定事項
- 実装可。v3.0に含めて進める


