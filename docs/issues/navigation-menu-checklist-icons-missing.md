# Issue: 左メニューのChecklist（Preparing / Packing）にアイコンがなく、折りたたみ時に不自然な空白が発生する

**作成日**: 2025-11-03  
**状態**: ✅ 解決済み  
**解決日**: 2025-11-03  
**優先度**: 低（UI/使い勝手の改善）  
**関連ファイル**:
- `components/planner/NavigationMenu.tsx`
- `components/common/icons/*`（アイコン群）
- `app/globals.css`（z-indexやユーティリティ）

---

## 📋 概要

左メニューの`Checklist`セクション配下の`Preparing`/`Packing`にアイコンが未設定のため、
- ChecklistセクションをExpand（展開）
- かつ 左メニュー全体をFold（折りたたみ＝アイコンのみ幅）
の状態で、項目の左側に空白が生じ、視覚的に「謎の空間」が発生する。

---

## 🐛 現状

- `NavigationMenu.tsx` のChecklist子要素は `icon` プロパティが未設定。
- 他セクション（Summary子要素など）は `icon` が設定されており、折りたたみ時も視覚的に揃っている。
- 折りたたみ幅に合わせたアイコンが無いことで、テキストが押し込まれ、結果として不自然な余白が出る。

対象コード（抜粋）:

```12:39:components/planner/NavigationMenu.tsx
      children: [
        {
          id: 'checklist-preparing',
          title: 'Preparing',
          subtitle: t('checklist.nav.preparing.subtitle'),
          onClick: () => {
            updateQuery({ view: 'checklist', day: null, section: 'preparing' })
            onNavigateToSection('checklist-preparing')
          }
        },
        {
          id: 'checklist-packing',
          title: 'Packing',
          subtitle: t('checklist.nav.packing.subtitle'),
          onClick: () => {
            updateQuery({ view: 'checklist', day: null, section: 'packing' })
            onNavigateToSection('checklist-packing')
          }
        }
      ]
```

---

## ✅ 期待される動作

- 折りたたみ時（アイコン幅）でも各項目の先頭にアイコンが表示され、レイアウトが安定する。
- 展開時はアイコン＋テキストで視認性が上がる。
- 既存のアイコン指針（SVG・モノクロ基調・機能一貫性）に従う。

---

## 💡 解決方針

### 案A（推奨）: Checklist項目にアイコンを付与
- `Preparing` → 書類/チェック系のアイコン（例: `ChecklistIcon`）
- `Packing` → バッグ/箱アイコン（例: `BagIcon` または `PackageIcon`）
- `components/common/icons` 配下に既存が無ければ、ガイドライン（`components/common/icons/AGENTS.md`）に従いSVG追加
- `NavigationMenu.tsx` のChecklistの子要素に `icon` を設定し、他セクションと同じ描画ロジックで表示

### 案B: レイアウト側でプレースホルダー領域を確保
- アイコン未設定時でも同幅のプレースホルダーを描画し、テキスト位置のズレを防ぐ
- ただし、アクセシビリティと意味的に不自然なため、案Aを優先

---

## 🛠 実装タスク（提案）

1. アイコンの選定/追加
   - 既存アイコンの再利用可否を確認
   - 無い場合は `ChecklistIcon`/`BagIcon` をSVGで追加
2. `NavigationMenu.tsx` のChecklist子要素に `icon` を付与
   - `className="w-4 h-4"` 程度で統一
   - `aria-label` は親ボタンのテキストがあるため不要だが、必要に応じ検討
3. 折りたたみ状態の余白確認
   - Collapsed時の幅でアイコンが収まり、空白が解消されることを確認
4. デザイン一貫性の確認
   - Summary配下のアイコン（`CloudIcon`/`BookmarkIcon` 等）とサイズ・色を合わせる

---

## 🔎 影響範囲

- `components/planner/NavigationMenu.tsx` のみ（小）
- 新規アイコン追加時は `components/common/icons` に1-2ファイル増加（小）
- i18nやAPIには非影響

---

## ✅ 完了条件

- [ ] 折りたたみ時のChecklist配下でアイコンが表示され、空白が解消される
- [ ] 展開/折りたたみを切り替えてもレイアウトが崩れない
- [ ] アイコンがガイドラインに沿ったスタイルで表示される
- [ ] 既存機能への回帰がない

---

## 📎 備考

- Z-Index管理は既存クラス（`globals.css`）の利用を継続。新規`z-index`の直書きは不可。
- アイコンはモノクロ・軽量SVGを推奨。多色は避ける。
