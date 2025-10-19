# 大型データ/型定義ファイルの分割戦略

**対象ファイル**:
- `lib/data/checklist-rules.ts` (2,923行)
- `lib/core/types.ts` (1,010行)

---

## 📊 現状分析

### checklist-rules.ts (2,923行)
**内容**: チェックリスト自動生成ルールのマスターデータ
- 約100個以上のルール定義
- 各ルールに複数の項目（title, description, category, condition）
- アクティビティタグ別に分類

**問題点**:
- ✅ データ量が多い（本質的に大きい）
- ⚠️ すべてのルールが1ファイルに集約
- ⚠️ 編集時のスクロールが大変

---

### types.ts (1,010行)
**内容**: プロジェクト全体の型定義
- User, Trip, Day, Itinerary等のエンティティ型
- API レスポンス型
- UI コンポーネントのProps型
- ユーティリティ型

**問題点**:
- ✅ 型の数が多い（プロジェクトの成長に伴う）
- ⚠️ ドメインをまたいだ型が混在
- ⚠️ インポート時にすべてがロードされる（ツリーシェイキングで解決されるが）

---

## 🎯 分割戦略

### 戦略1: ドメイン別分割（最も推奨）⭐⭐⭐⭐⭐

#### checklist-rules.ts の場合

**分割前**: 1ファイル (2,923行)
```
lib/data/checklist-rules.ts
```

**分割後**: カテゴリ別に分割
```
lib/data/checklist-rules/
├── index.ts                 (50行) - 統合エクスポート
├── transportation.ts        (400行) - 交通関連
├── accommodation.ts         (350行) - 宿泊関連
├── dining.ts               (300行) - 食事関連
├── sightseeing.ts          (400行) - 観光関連
├── shopping.ts             (250行) - ショッピング関連
├── outdoor.ts              (350行) - アウトドア関連
├── entertainment.ts        (300行) - エンターテイメント関連
├── wellness.ts             (250行) - ウェルネス関連
├── business.ts             (200行) - ビジネス関連
└── other.ts                (150行) - その他
```

**メリット**:
- ✅ 各ファイルが200-400行程度に
- ✅ 編集したい箇所を見つけやすい
- ✅ Git diffが見やすい（変更箇所が特定しやすい）
- ✅ 複数人で同時編集しやすい（コンフリクト減少）

**実装例**:
```typescript
// lib/data/checklist-rules/transportation.ts
import { ChecklistGenerationRule } from '../types'

export const TRANSPORTATION_RULES: ChecklistGenerationRule[] = [
  {
    id: 'flight_international_rule',
    secondaryCategory: 'flight',
    items: [/* ... */]
  },
  {
    id: 'train_domestic_rule',
    secondaryCategory: 'train',
    items: [/* ... */]
  },
  // ...
]

// lib/data/checklist-rules/index.ts
export { TRANSPORTATION_RULES } from './transportation'
export { ACCOMMODATION_RULES } from './accommodation'
export { DINING_RULES } from './dining'
// ...

// すべてを統合
export const CHECKLIST_RULES = [
  ...TRANSPORTATION_RULES,
  ...ACCOMMODATION_RULES,
  ...DINING_RULES,
  // ...
]
```

**使用側は変更不要**:
```typescript
import { CHECKLIST_RULES } from '@/lib/data/checklist-rules'
// そのまま使える
```

---

#### types.ts の場合

**分割前**: 1ファイル (1,010行)
```
lib/core/types.ts
```

**分割後**: ドメイン別に分割
```
lib/core/types/
├── index.ts                 (50行) - 再エクスポート
├── user.ts                  (100行) - User関連
├── trip.ts                  (150行) - Trip, Day関連
├── itinerary.ts            (120行) - Itinerary, PlaceData関連
├── checklist.ts            (100行) - Checklist関連
├── reservation.ts          (80行) - Reservation関連
├── subscription.ts         (70行) - Subscription, Plan関連
├── api.ts                  (150行) - API レスポンス型
├── ui.ts                   (100行) - UI Props型
└── common.ts               (90行) - 共通型（Result, Errorなど）
```

**実装例**:
```typescript
// lib/core/types/trip.ts
export interface Trip {
  id: string
  title: string
  // ...
}

export interface Day {
  id: string
  trip_id: string
  // ...
}

// lib/core/types/index.ts
export * from './user'
export * from './trip'
export * from './itinerary'
// ...
```

**使用側は変更不要**:
```typescript
import { Trip, Day, User } from '@/lib/core/types'
// そのまま使える
```

---

### 戦略2: レイジーロード/動的インポート（必要に応じて）⭐⭐⭐

#### checklist-rules.ts の場合

**問題**: すべてのルールが一度にロードされる

**改善**: 必要なカテゴリのみを動的にロード

```typescript
// lib/data/checklist-rules/loader.ts
export async function loadRulesForCategory(category: string) {
  switch (category) {
    case 'transportation':
      return (await import('./transportation')).TRANSPORTATION_RULES
    case 'accommodation':
      return (await import('./accommodation')).ACCOMMODATION_RULES
    // ...
    default:
      return []
  }
}

// 使用例
const rules = await loadRulesForCategory('transportation')
```

**メリット**:
- ✅ 初期バンドルサイズ削減
- ✅ 必要な時だけロード（パフォーマンス向上）

**デメリット**:
- ⚠️ 非同期処理が必要
- ⚠️ コードが複雑化

**推奨**: SSRの場合は効果が限定的なので不要

---

### 戦略3: JSON/YAMLへの外部化（データ量が膨大な場合）⭐⭐⭐

#### checklist-rules.ts の場合

**現状**: TypeScriptコード (2,923行)

**改善**: JSONファイルに外部化

```
lib/data/checklist-rules/
├── transportation.json      (JSONデータ)
├── accommodation.json
├── dining.json
...
```

```typescript
// lib/data/checklist-rules/loader.ts
import transportationRules from './transportation.json'
import accommodationRules from './accommodation.json'

export const CHECKLIST_RULES = [
  ...transportationRules,
  ...accommodationRules,
  // ...
]
```

**メリット**:
- ✅ TypeScriptファイルから分離
- ✅ 非エンジニアでも編集可能
- ✅ CMS化しやすい（将来的にFirestoreに移行等）

**デメリット**:
- ⚠️ 型安全性が低下（zod等でバリデーションが必要）
- ⚠️ コメントが書きにくい

**推奨度**: ⭐⭐ 低（現状はTypeScriptのままで良い）

---

### 戦略4: 型定義の階層化（types.ts）⭐⭐⭐⭐

#### 現状の問題
すべての型が同じレベルで定義されている

#### 改善案: ネストされた名前空間

```typescript
// lib/core/types/index.ts

// === User ドメイン ===
export namespace UserTypes {
  export interface User {
    id: string
    email: string
    // ...
  }
  
  export interface UserPreferences {
    language: string
    timezone: string
    // ...
  }
  
  export interface UserProfile {
    displayName: string
    avatarUrl: string
    // ...
  }
}

// === Trip ドメイン ===
export namespace TripTypes {
  export interface Trip {
    id: string
    title: string
    // ...
  }
  
  export interface Day {
    id: string
    trip_id: string
    // ...
  }
}

// 使用例
import { UserTypes, TripTypes } from '@/lib/core/types'

const user: UserTypes.User = { ... }
const trip: TripTypes.Trip = { ... }
```

**メリット**:
- ✅ 型の所属が明確
- ✅ 名前の衝突を防ぐ
- ✅ 1ファイルでも見通しが良い

**デメリット**:
- ⚠️ 既存コードの大量修正が必要
- ⚠️ インポート文が長くなる

**推奨度**: ⭐⭐⭐ 中（既存プロジェクトでは移行コスト高）

---

## 🎯 推奨される実装順序

### checklist-rules.ts（2,923行）

#### フェーズ1: ディレクトリ構造作成（1時間）
```bash
mkdir -p lib/data/checklist-rules
```

#### フェーズ2: カテゴリ別に分割（4-6時間）
1. transportation.ts - 交通関連
2. accommodation.ts - 宿泊関連
3. dining.ts - 食事関連
4. sightseeing.ts - 観光関連
5. その他のカテゴリ

#### フェーズ3: index.ts で統合（30分）
```typescript
export const CHECKLIST_RULES = [
  ...TRANSPORTATION_RULES,
  ...ACCOMMODATION_RULES,
  // ...
]
```

#### フェーズ4: テスト（1時間）
- ルール数が同じか確認
- チェックリスト生成が正常に動作するか確認

**合計所要時間**: 約7-9時間

**削減効果**:
- 各ファイル: 200-400行程度
- 平均ファイルサイズ: 約300行
- **保守性**: 大幅向上
- **コード行数**: 変わらない（分割するだけ）

---

### types.ts（1,010行）

#### フェーズ1: ディレクトリ構造作成（30分）
```bash
mkdir -p lib/core/types
```

#### フェーズ2: ドメイン別に分割（3-4時間）
1. user.ts - User, UserPreferences等
2. trip.ts - Trip, Day等
3. itinerary.ts - Itinerary, PlaceData等
4. api.ts - API レスポンス型
5. ui.ts - UI Props型
6. common.ts - 共通型

#### フェーズ3: index.ts で再エクスポート（30分）
```typescript
export * from './user'
export * from './trip'
// ...
```

#### フェーズ4: インポート文の調整（2-3時間）
既存コードの `import { ... } from '@/lib/core/types'` は変更不要だが、
念のため全ファイルで動作確認

**合計所要時間**: 約6-8時間

**削減効果**:
- 各ファイル: 80-150行程度
- **保守性**: 大幅向上
- **型の発見**: 容易に
- **コード行数**: 変わらない（再エクスポートで互換性維持）

---

## 💡 具体的な実装例

### checklist-rules.ts の分割例

```typescript
// lib/data/checklist-rules/transportation.ts
import { ChecklistGenerationRule } from '@/lib/core/types'

export const TRANSPORTATION_RULES: ChecklistGenerationRule[] = [
  // Flight rules
  {
    id: 'flight_international_rule',
    secondaryCategory: 'flight',
    items: [
      { title: 'パスポートの有効期限確認', /* ... */ },
      { title: '航空券の印刷', /* ... */ },
      // ...
    ]
  },
  // Train rules
  {
    id: 'train_domestic_rule',
    secondaryCategory: 'train',
    items: [/* ... */]
  },
  // Car rental rules
  {
    id: 'rental_car_rule',
    secondaryCategory: 'rental_car',
    items: [/* ... */]
  },
  // ...
]

// lib/data/checklist-rules/accommodation.ts
export const ACCOMMODATION_RULES: ChecklistGenerationRule[] = [
  {
    id: 'hotel_rule',
    secondaryCategory: 'hotel',
    items: [/* ... */]
  },
  {
    id: 'hostel_rule',
    secondaryCategory: 'hostel',
    items: [/* ... */]
  },
  // ...
]

// lib/data/checklist-rules/index.ts
export { TRANSPORTATION_RULES } from './transportation'
export { ACCOMMODATION_RULES } from './accommodation'
export { DINING_RULES } from './dining'
export { SIGHTSEEING_RULES } from './sightseeing'
export { SHOPPING_RULES } from './shopping'
export { OUTDOOR_RULES } from './outdoor'
export { ENTERTAINMENT_RULES } from './entertainment'
export { WELLNESS_RULES } from './wellness'
export { BUSINESS_RULES } from './business'
export { OTHER_RULES } from './other'

// すべてを統合したエクスポート（後方互換性のため）
export const CHECKLIST_RULES = [
  ...TRANSPORTATION_RULES,
  ...ACCOMMODATION_RULES,
  ...DINING_RULES,
  ...SIGHTSEEING_RULES,
  ...SHOPPING_RULES,
  ...OUTDOOR_RULES,
  ...ENTERTAINMENT_RULES,
  ...WELLNESS_RULES,
  ...BUSINESS_RULES,
  ...OTHER_RULES,
]

// カテゴリ別に取得する関数も提供
export function getRulesByCategory(category: string): ChecklistGenerationRule[] {
  switch (category) {
    case 'transportation': return TRANSPORTATION_RULES
    case 'accommodation': return ACCOMMODATION_RULES
    case 'dining': return DINING_RULES
    // ...
    default: return []
  }
}
```

**使用側**:
```typescript
// 既存コード（変更不要）
import { CHECKLIST_RULES } from '@/lib/data/checklist-rules'

// または、カテゴリ別に取得（オプション）
import { TRANSPORTATION_RULES } from '@/lib/data/checklist-rules'
import { getRulesByCategory } from '@/lib/data/checklist-rules'
```

---

### types.ts の分割例

```typescript
// lib/core/types/user.ts
export interface User {
  id: string
  email: string
  displayName: string
  slug: string
  avatarUrl: string | null
  planId: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  language: string
  timezone: string
  currency: string
  dateFormat: string
}

export interface UserProfile extends User {
  bio?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
  }
}

// lib/core/types/trip.ts
export interface Trip {
  id: string
  userId: string
  slug: string
  title: string
  description: string
  destination: string
  startDate: Date
  endDate: Date
  imageUrl?: string
  accessLevel: 'public' | 'private'
  createdAt: Date
  updatedAt: Date
}

export interface Day {
  id: string
  tripId: string
  date: Date
  dayNumber: number
  title?: string
  createdAt: Date
  updatedAt: Date
}

// lib/core/types/index.ts
export * from './user'
export * from './trip'
export * from './itinerary'
export * from './checklist'
export * from './reservation'
export * from './subscription'
export * from './api'
export * from './ui'
export * from './common'

// 使用側（変更不要）
import { User, Trip, Day } from '@/lib/core/types'
```

---

## 🚀 戦略5: 自動生成（超大型の場合）⭐⭐

### スキーマ駆動開発

データ量が非常に大きい場合は、スキーマから自動生成：

```yaml
# schemas/checklist-rules.yaml
transportation:
  flight:
    - title: パスポートの有効期限確認
      description: 多くの国で入国時に6ヶ月以上の残存期間が必要
      category: preparation
      priority: high
      condition:
        type: always
    - title: 航空券の印刷
      # ...
```

```typescript
// scripts/generate-checklist-rules.ts
import yaml from 'yaml'
import fs from 'fs'

const schema = yaml.parse(fs.readFileSync('schemas/checklist-rules.yaml', 'utf8'))

// TypeScriptコードを生成
const generatedCode = generateTypeScriptFromSchema(schema)
fs.writeFileSync('lib/data/checklist-rules/generated.ts', generatedCode)
```

**メリット**:
- ✅ YAMLは人間が読みやすい
- ✅ 非エンジニアでも編集可能
- ✅ バリデーションを自動化

**デメリット**:
- ⚠️ ビルドプロセスが複雑化
- ⚠️ デバッグが困難

**推奨度**: ⭐⭐ 低（現時点では不要、将来的にCMS化する時に検討）

---

## 📋 実装チェックリスト

### checklist-rules.ts 分割

- [ ] ディレクトリ作成: `lib/data/checklist-rules/`
- [ ] カテゴリを特定（約10カテゴリ）
- [ ] 各カテゴリファイルに分割
  - [ ] transportation.ts
  - [ ] accommodation.ts
  - [ ] dining.ts
  - [ ] sightseeing.ts
  - [ ] shopping.ts
  - [ ] outdoor.ts
  - [ ] entertainment.ts
  - [ ] wellness.ts
  - [ ] business.ts
  - [ ] other.ts
- [ ] index.ts で統合
- [ ] テスト: ルール数が同じか確認
- [ ] テスト: チェックリスト生成が動作するか確認
- [ ] 元のファイル削除
- [ ] コミット

---

### types.ts 分割

- [ ] ディレクトリ作成: `lib/core/types/`
- [ ] ドメインを特定（約8-10ドメイン）
- [ ] 各ドメインファイルに分割
  - [ ] user.ts
  - [ ] trip.ts
  - [ ] itinerary.ts
  - [ ] checklist.ts
  - [ ] reservation.ts
  - [ ] subscription.ts
  - [ ] api.ts
  - [ ] ui.ts
  - [ ] common.ts
- [ ] index.ts で再エクスポート
- [ ] ビルドエラーがないか確認
- [ ] 型チェックが通るか確認
- [ ] 元のファイル削除
- [ ] コミット

---

## ⚠️ 注意点

### 1. 後方互換性の維持
- ✅ index.tsで再エクスポートすれば既存コードは変更不要
- ✅ `import { X } from '@/lib/core/types'` がそのまま動く

### 2. 循環依存の回避
- ⚠️ 分割時に型同士の依存関係に注意
- ⚠️ common.ts に共通型を置いて他のファイルから参照

### 3. Gitの履歴保持
```bash
# ファイル移動時は git mv を使う
git mv lib/core/types.ts lib/core/types/legacy.ts
# 分割後
git rm lib/core/types/legacy.ts
```

### 4. チーム全体への周知
- 分割前にPRで提案
- 分割後の構造をドキュメント化
- チームレビュー必須

---

## 📊 推定効果

### checklist-rules.ts（2,923行）

| 指標 | 分割前 | 分割後 |
|------|-------|-------|
| 最大ファイルサイズ | 2,923行 | 400行 |
| 平均ファイルサイズ | 2,923行 | 300行 |
| ファイル数 | 1個 | 11個 |
| 編集のしやすさ | ⭐️ | ⭐️⭐️⭐️⭐️⭐️ |
| Git diff | 見づらい | 見やすい |

**総行数**: 変わらない（約2,973行 = 2,923行 + index.ts 50行）

---

### types.ts（1,010行）

| 指標 | 分割前 | 分割後 |
|------|-------|-------|
| 最大ファイルサイズ | 1,010行 | 150行 |
| 平均ファイルサイズ | 1,010行 | 110行 |
| ファイル数 | 1個 | 10個 |
| 型の発見性 | ⭐️⭐️ | ⭐️⭐️⭐️⭐️⭐️ |
| 名前空間の明確さ | ⭐️⭐️ | ⭐️⭐️⭐️⭐️⭐️ |

**総行数**: 変わらない（約1,060行 = 1,010行 + index.ts 50行）

---

## ✅ 結論

### 推奨戦略
**ドメイン別分割（戦略1）** が最も効果的

### 理由
1. ✅ 各ファイルが適切なサイズに（200-400行）
2. ✅ 後方互換性を維持（既存コード変更不要）
3. ✅ 保守性が大幅向上
4. ✅ 複数人での同時編集がしやすい
5. ✅ Git diffが見やすい

### 所要時間
- **checklist-rules.ts**: 7-9時間
- **types.ts**: 6-8時間
- **合計**: 13-17時間（2-3日）

### 効果
- **コード行数削減**: なし（分割するだけ）
- **保守性向上**: ⭐️⭐️⭐️⭐️⭐️
- **開発効率**: ⭐️⭐️⭐️⭐️⭐️
- **チーム貢献**: ⭐️⭐️⭐️⭐️⭐️

---

## 🎓 他のプロジェクトでの事例

### Material-UI
```
packages/mui-material/src/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── TextField/
│   ├── TextField.tsx
│   └── index.ts
...
```

各コンポーネントが独立したディレクトリ

### Prisma Schema
```
schema/
├── user.prisma
├── trip.prisma
├── itinerary.prisma
...
```

大きなスキーマをドメイン別に分割

### Redux Toolkit
```
store/
├── slices/
│   ├── userSlice.ts
│   ├── tripSlice.ts
│   └── itinerarySlice.ts
└── index.ts
```

状態管理をドメイン別に分割

---

**作成者**: AI Assistant  
**ステータス**: 戦略提案完了  
**推奨**: ドメイン別分割（戦略1）

