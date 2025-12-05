# チェックリストUX改善提案

**作成日**: 2025-12-05  
**目的**: チェックリスト機能の使いやすさと情報量の向上

---

## 📋 改善要望

### 1. カテゴライズ不足で目が滑る

**現状の問題**:
- チェックリスト項目が雑多な一覧として表示される
- 生成根拠（`generatedFrom`）が表示されていない
- 同じアクティビティタグから生成された項目が散らばっている

**改善案**:
- 生成根拠（アクティビティタグ）でグループ化して表示
- 各グループにアクティビティタグ名を表示
- グループ内で優先度順にソート

**実装例**:
```typescript
import { getSecondaryCategoryLabel, getPrimaryCategoryFromSecondary } from '@/lib/data/activity-categories';

// 生成根拠でグループ化（例外処理込み）
const groupedItems = useMemo(() => {
  return items.reduce((acc, item) => {
    let groupKey = 'custom';
    
    // カスタムアイテムは常にcustomグループ
    if (item.isCustom) {
      groupKey = 'custom';
    } else if (item.generatedFrom) {
      // generatedFromが有効かチェック
      const primaryCategory = getPrimaryCategoryFromSecondary(item.generatedFrom);
      if (primaryCategory) {
        groupKey = item.generatedFrom; // secondaryCategory ID
      }
      // primaryCategoryがnullの場合はcustomグループへfallback
    }
    
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);
}, [items]);

// 表示
{Object.entries(groupedItems).map(([secondaryCategory, items]) => {
  // アクティビティタグ名を取得（既存の関数を使用）
  const categoryName = secondaryCategory === 'custom'
    ? t('checklist.customItems')
    : (() => {
        const primaryCategory = getPrimaryCategoryFromSecondary(secondaryCategory);
        if (!primaryCategory) return t('checklist.unknownCategory');
        return getSecondaryCategoryLabel(primaryCategory, secondaryCategory);
      })();
  
  return (
    <div key={secondaryCategory} className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <IconRenderer iconName="tag" className="w-4 h-4" />
        {categoryName} 関連
      </h3>
      <ul className="space-y-2">
        {items.map(item => <ChecklistItemRow key={item.id} item={item} />)}
      </ul>
    </div>
  );
})}
```

**必要な関数の実装**:
```typescript
// lib/data/activity-categories.ts に追加
export function getPrimaryCategoryFromSecondary(
  secondaryCategoryId: string
): PrimaryCategoryType | null {
  for (const master of ACTIVITY_CATEGORIES) {
    const found = master.secondaryCategories.find(
      sc => sc.id === secondaryCategoryId
    );
    if (found) return master.primaryCategory;
  }
  return null; // 見つからない場合はnull（fallback処理でcustomグループへ）
}
```

---

### 2. 優先度（Priority）の表示

**現状の問題**:
- `priority`（high/medium/low）は定義されているが、UI上で表示されていない
- ユーザーが優先度を把握できない

**改善案**:
- `priority`を視覚的に表示（バッジやアイコン）
- 優先度順にソート（既に実装済み）
- 優先度の説明をツールチップで表示

**UI表示例**:
```typescript
{item.priority === 'high' && (
  <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
    高
  </span>
)}
{item.priority === 'medium' && (
  <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
    中
  </span>
)}
{item.priority === 'low' && (
  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
    低
  </span>
)}
```

**⚠️ Tailwind v4 互換性の注意**:
- Tailwind v4では色システムが変更される可能性がある
- 既存の`text-red-700`、`bg-red-100`などのクラスが変わる可能性
- 実装時はTailwindのバージョンを確認し、必要に応じて互換レイヤーを検討
- または、カスタムCSS変数を使用して色を管理する方法も検討可能

**注意**: `required/optional`フラグは不要。`priority`の情報を表示することで十分。

---

### 3. 備考欄（説明とリンク）

**現状の問題**:
- `description`はあるが、Amazonリンクなどのアフィリエイト欄がない
- 具体的な商品情報や購入リンクが提供できない

**改善案**:
- `ChecklistItem`型に`links`配列を追加
- リンクタイプ（Amazon、公式サイト、レビューなど）を定義
- アフィリエイトリンクに対応

**型定義**:
```typescript
export interface ChecklistItemLink {
  type: "amazon" | "official" | "review" | "other";
  label: string; // 表示ラベル（例: "Amazonで見る"）
  url: string;
  affiliateId?: string; // アフィリエイトID（オプション）
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: ChecklistCategory;
  done: boolean;
  generatedFrom?: string;
  isCustom?: boolean;
  priority?: ChecklistPriority; // 既存: 表示を追加
  links?: ChecklistItemLink[]; // 新規追加: 関連リンク
}
```

**Phase 1での表示（最小限）**:
```typescript
{/* リンク存在インジケーター */}
{item.links && item.links.length > 0 && (
  <span className="ml-2 text-xs text-blue-600" title={`${item.links.length}個のリンク`}>
    🔗
  </span>
)}

{/* 説明はツールチップまたは省略表示 */}
{item.description && (
  <span 
    className="ml-2 text-xs text-gray-400 cursor-help"
    title={item.description}
  >
    ℹ️
  </span>
)}
```

**Phase 3での表示（詳細パネル内）**:
```typescript
{/* 詳細パネル内で完全表示 */}
{item.description && (
  <p className="text-sm text-gray-700 mt-2">{item.description}</p>
)}
{item.links && item.links.length > 0 && (
  <div className="mt-3 space-y-2">
    {item.links.map((link, idx) => (
      <a
        key={idx}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
      >
        {link.label}
      </a>
    ))}
  </div>
)}
```

**ルール定義例**:
```typescript
{
  title: "日焼け止め",
  description: "SPF50+推奨。海やプールでは水に強いタイプを",
  category: "packing",
  priority: "high", // 既存: UIで表示
  links: [ // 新規追加
    {
      type: "amazon",
      label: "Amazonで見る",
      url: "https://amazon.co.jp/dp/XXXXX",
      affiliateId: "caglla-22" // アフィリエイトID
    }
  ]
}
```

---

### 4. 画面の使い方（全幅表示の改善）

**現状の問題**:
- **バグ**: Parallel Routesの`@map/default.tsx`で`currentView`のチェックがなく、`checklist`ビューでも地図が表示されている
- メインコンテンツは2カラム（Preparing / Packing）表示のみ
- 画面スペースを有効活用できていない

**バグの詳細**:
- `@map/default.tsx`（146-194行目）で`currentView`を取得していない
- `TripClientLayout.tsx`（410-413行目）で`map`スロットを常に表示している
- `TripRightPane.tsx`は非表示制御しているが、Parallel Routesの`@map`スロットとは別物

**修正方法**:
1. `@map/default.tsx`で`useTripUrlState()`から`currentView`を取得
2. `currentView === "checklist"`の場合は`null`を返す
3. `TripClientLayout.tsx`でも`currentView`を取得し、`checklist`の時は`map`スロットを非表示にする

**改善案: アコーディオン + 詳細パネル（推奨）**
- 生成根拠でグループ化したアコーディオン
- アイテムクリックで右側に詳細パネル表示（POIDialogと同じパターン）
- 3カラムレイアウト（左: Preparing、中央: Packing、右: 詳細パネル）

**実装イメージ**:
```
┌─────────────────────────────────────────────────────────────┐
│ [Apply Preset] [My Presets] [Save as Preset] [Regenerate]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────┬──────────────────────────────────┐ │
│ │ Preparing           │ Packing                          │ │
│ ├─────────────────────┼──────────────────────────────────┤ │
│ │ ▼ Flight 関連       │ ▼ Beach 関連                     │ │
│ │   □ パスポート確認   │   □ 水着                         │ │
│ │   □ 航空券確認      │   □ 日焼け止め                   │ │
│ │                     │                                  │ │
│ │ ▼ Hotel 関連        │ ▼ Nature Walk 関連               │ │
│ │   □ 予約確認        │   □ トレッキングシューズ         │ │
│ │                     │   □ レインウェア                  │ │
│ │                     │                                  │ │
│ │                     │ ┌──────────────────────────────┐ │ │
│ │                     │ │ 日焼け止め                   │ │ │
│ │                     │ │ SPF50+推奨。海やプールでは...│ │ │
│ │                     │ │ [必須] [高優先度]            │ │ │
│ │                     │ │                              │ │ │
│ │                     │ │ [Amazonで見る] [公式サイト]  │ │ │
│ │                     │ └──────────────────────────────┘ │ │
│ └─────────────────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 実装優先順位

### Phase 1: 優先度表示と備考欄（高優先度）

**理由**: ユーザー体験に直接影響する機能

**実装内容**:
1. `ChecklistItem`型に`links`を追加
2. `ChecklistRuleItem`型に`links`を追加
3. UIに優先度バッジ（high/medium/low）を追加
4. ルール定義ファイルにリンクを追加

**⚠️ 重要な依存関係**:
- `links`と`description`は**詳細パネル（Phase 3）前提の設計要素**
- Phase 1では最小限の可視化のみ（リンクが存在することを示すインジケーター）
- 詳細パネルがないと情報密度が高すぎてUIが破裂する

**Phase 1での表示方針**:
- 優先度バッジ: 完全実装（high/medium/low）
- リンク: 存在インジケーターのみ（例: リンクアイコン表示）
- 説明: ツールチップまたは省略表示（全文はPhase 3で）

**所要時間**: 3-4時間

---

### Phase 2: 生成根拠でのグループ化（中優先度）

**理由**: 可読性向上

**実装内容**:
1. `getPrimaryCategoryFromSecondary()`関数を実装（逆引き）
2. アクティビティタグ名の取得関数を実装
3. 生成根拠でグループ化するロジックを追加
4. UIをグループ化表示に変更
5. アコーディオンで折りたたみ可能に

**⚠️ 例外処理・Fallback ポリシー**:
- `generatedFrom`が`undefined`または`null`の場合 → `"custom"`グループへ分類
- `secondaryCategory`が`ACTIVITY_CATEGORIES`に存在しない場合 → `"custom"`グループへ分類
- ルール更新でIDが変わった場合 → 既存データは`"custom"`グループへ退避
- カスタムアイテム（`isCustom: true`）は常に`"custom"`グループ

**グループ化ロジック**:
```typescript
const groupedItems = items.reduce((acc, item) => {
  let groupKey = 'custom';
  
  if (item.generatedFrom) {
    const primaryCategory = getPrimaryCategoryFromSecondary(item.generatedFrom);
    if (primaryCategory) {
      groupKey = item.generatedFrom; // secondaryCategory ID
    }
  }
  
  if (!acc[groupKey]) acc[groupKey] = [];
  acc[groupKey].push(item);
  return acc;
}, {} as Record<string, ChecklistItem[]>);
```

**所要時間**: 3-4時間

---

### Phase 3: 詳細パネル（中優先度）

**理由**: 画面レイアウトの改善と情報量の増加に対応

**実装内容**:
1. `@map`スロットの非表示確認と修正（バグ修正）
2. 詳細パネルコンポーネントの作成
3. アイテム選択状態の管理
4. レイアウトを3カラムに変更（左: Preparing、中央: Packing、右: 詳細パネル）
5. レスポンシブ対応（モバイルではモーダル表示）

**⚠️ Parallel Routes の二重化制御**:
- **Layout レベル**: `TripClientLayout.tsx`で`currentView === "checklist"`の時は`map`スロットを非表示
- **Slot レベル**: `@map/default.tsx`でも`currentView === "checklist"`の時は`null`を返す
- 二重化することで、Suspenseやメモ化の影響を受けても安全

**実装例**:
```typescript
// TripClientLayout.tsx
{currentView !== "checklist" && (
  <div className="hidden lg:block lg:flex-1 lg:min-w-[400px] border-l border-gray-200 h-full overflow-hidden">
    {map}
  </div>
)}

// @map/default.tsx
function MapContent() {
  const { currentView } = useTripUrlState();
  
  if (currentView === "checklist") {
    return null; // 安全弁
  }
  
  // ... 地図の描画
}
```

**モバイル UX 仕様**:
- **画面遷移**: List → Detail は右から左へスライドイン（iOS標準パターン）
- **戻る操作**: 
  - 上部Backボタン（← アイコン + タイトル）
  - スワイプ右（iOS標準の戻るジェスチャー）
- **情報密度**:
  - タイトル: 常に表示
  - 優先度バッジ: タイトル横に表示
  - タグ名（生成根拠）: タイトル下に小さく表示
  - 説明: 折りたたみ可能（デフォルトは展開）
  - リンク: ボタン形式で縦に並べる

**所要時間**: 6-8時間

---

## 📝 実装詳細

### 1. 型定義の拡張

**ファイル**: `lib/core/types/activity.ts`

```typescript
export interface ChecklistItemLink {
  type: "amazon" | "official" | "review" | "other";
  label: string;
  url: string;
  affiliateId?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: ChecklistCategory;
  done: boolean;
  generatedFrom?: string;
  isCustom?: boolean;
  priority?: ChecklistPriority; // 既存: UIで表示を追加
  links?: ChecklistItemLink[]; // 新規追加
}
```

**ファイル**: `lib/data/checklist-rules/types.ts`

```typescript
export interface ChecklistRuleItem {
  title: string;
  description?: string;
  category: "preparation" | "packing";
  priority?: "high" | "medium" | "low"; // 既存: UIで表示を追加
  links?: ChecklistItemLink[]; // 新規追加
  condition?: ChecklistCondition;
}
```

---

### 2. UIコンポーネントの拡張

**ファイル**: `components/trip/TripChecklistView.tsx`

**変更点**:
1. 生成根拠でグループ化
2. 必須バッジの表示
3. リンクの表示
4. 詳細パネルの追加（Phase 3）

---

### 3. アクティビティタグ名の取得

**ファイル**: `lib/data/activity-categories.ts` または新規作成

```typescript
export function getActivityCategoryDisplayName(
  secondaryCategory: string,
  locale: string = "ja"
): string {
  // アクティビティカテゴリの表示名を取得
  // i18n対応
}
```

---

### 4. ルール定義の更新

各ルール定義ファイル（`accommodation.ts`, `dining.ts`など）に`links`を追加。

**例**: `lib/data/checklist-rules/accommodation.ts`

```typescript
{
  title: "ホテル予約確認書をプリントアウト",
  description: "チェックイン時に必要です",
  category: "preparation",
  priority: "high", // 既存: UIで表示
  links: [], // 新規追加（必要に応じて）
  condition: { type: "always" }
}
```

---

## 🔄 マイグレーション

### 既存データへの対応

既存の`ChecklistItem`には`links`がないため、デフォルト値を設定：

```typescript
const item: ChecklistItem = {
  ...existingItem,
  links: existingItem.links ?? [],
};
```

---

## 📊 期待される効果

1. **可読性向上**: 生成根拠でグループ化することで、関連項目がまとまって見やすくなる
2. **優先度の明確化**: 優先度バッジにより、重要な項目が一目で分かるようになる
3. **情報量の増加**: 説明とリンクにより、ユーザーが具体的な行動を起こしやすくなる
4. **画面の有効活用**: 詳細パネルにより、より多くの情報を表示できる
5. **バグ修正**: `@map`スロットの非表示制御を修正し、チェックリスト表示時に地図が表示されないようにする

---

## 🚧 実装時の注意点

1. **後方互換性**: 既存の`ChecklistItem`に`links`がない場合の処理（デフォルト値: `[]`）
2. **i18n対応**: アクティビティタグ名の多言語対応（既存の`getSecondaryCategoryLabel`を使用）
3. **レスポンシブ**: 詳細パネルはモバイルでは別画面（モーダル）で表示（上記モバイルUX仕様参照）
4. **パフォーマンス**: グループ化処理は`useMemo`で最適化
5. **例外処理**: `generatedFrom`が無効な場合のfallback処理（`"custom"`グループへ）
6. **Parallel Routes**: LayoutレベルとSlotレベルの二重化制御で安全性を確保
7. **Tailwind v4**: 色クラスの互換性を確認（必要に応じてカスタムCSS変数を使用）

---

**最終更新**: 2025-12-05  
**作成者**: AI Assistant

