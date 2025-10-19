# チェックリスト生成ルール

このディレクトリは、旅行のアクティビティタグに基づいて自動的にチェックリスト項目を生成するためのルール定義を含んでいます。

## 📁 ファイル構成

```
lib/data/checklist-rules/
├── README.md                    # このファイル
├── types.ts                     # 型定義
├── index.ts                     # 統合エクスポート
├── transportation.ts            # 交通関連 (103行)
├── shopping.ts                  # 買い物関連 (20行)
├── accommodation.ts             # 宿泊関連 (151行)
├── adventure.ts                 # 探検・アドベンチャー関連 (123行)
├── entertainment.ts             # エンターテイメント関連 (41行)
├── culture.ts                   # 文化体験関連 (47行)
├── wellness.ts                  # ウェルネス関連 (20行)
├── service.ts                   # サービス関連 (204行)
├── dining.ts                    # 食事関連 (322行)
└── exploration.ts               # 探索関連 (1815行、最大)
```

## 🎯 使用方法

### 全ルールを取得

```typescript
import { CHECKLIST_RULES } from '@/lib/data/checklist-rules'

// すべてのルールを取得
const allRules = CHECKLIST_RULES
```

### カテゴリ別にルールを取得

```typescript
import { TRANSPORTATION_RULES, DINING_RULES } from '@/lib/data/checklist-rules'

// 特定カテゴリのみ
const transportRules = TRANSPORTATION_RULES
const diningRules = DINING_RULES
```

### ヘルパー関数を使用

```typescript
import { getRulesByCategory, getChecklistRules } from '@/lib/data/checklist-rules'

// カテゴリ名で取得
const rules = getRulesByCategory('transportation')

// Secondary Category IDで絞り込み
const flightRules = getChecklistRules('flight')
```

## ✏️ ルールの追加・編集

### 1. 適切なカテゴリファイルを選択

アクティビティの性質に基づいて、最も適切なカテゴリファイルを選びます：

- **transportation.ts**: 飛行機、電車、レンタカーなど
- **accommodation.ts**: ホテル、ホステル、民泊など
- **dining.ts**: レストラン、カフェ、食事関連
- **exploration.ts**: 観光、街歩き、写真撮影など
- その他

### 2. ルールの構造

```typescript
{
  id: 'unique_rule_id',                 // ユニークなID
  secondaryCategory: 'flight',          // 2段階目のカテゴリーID
  items: [
    {
      title: 'パスポートの有効期限確認',
      description: '多くの国で入国時に6ヶ月以上の残存期間が必要',
      category: 'preparation',          // 'preparation' または 'packing'
      priority: 'high',                 // 'high', 'medium', 'low'
      condition: {
        type: 'always'                  // 'always', 'count', 'duration', 'destination'
      }
    },
    // ... more items
  ]
}
```

### 3. 条件タイプ

- **always**: 常に表示
- **count**: 同じsecondaryCategoryの回数に基づく
  ```typescript
  condition: { type: 'count', minCount: 3 }
  ```
- **duration**: 旅行期間（日数）に基づく
  ```typescript
  condition: { type: 'duration', minDays: 7 }
  ```
- **destination**: 目的地（国・大陸）に基づく
  ```typescript
  condition: { type: 'destination', countries: ['US', 'CA'] }
  condition: { type: 'destination', continents: ['EU', 'AS'] }
  ```

### 4. ID命名規約

- 形式: `{secondary_category}_{特徴}_rule`
- 例:
  - `flight_international_rule`
  - `hotel_luxury_rule`
  - `restaurant_fine_dining_rule`

### 5. 編集後の確認

```bash
# ビルドが通ることを確認
npm run build

# 型チェック
npm run type-check

# チェックリスト生成テスト（手動）
# Tripを作成してチェックリストが正しく生成されるか確認
```

## 📊 統計情報

- **総ルール数**: 100+
- **総行数**: 約2,900行
- **カテゴリ数**: 10カテゴリ
- **最大ファイル**: exploration.ts (1,815行)
- **平均ファイルサイズ**: 約290行

## 🔄 後方互換性

既存のインポート文は変更不要です：

```typescript
// これらはすべて動作します
import { CHECKLIST_RULES } from '@/lib/data/checklist-rules'
import { getChecklistRules } from '@/lib/data/checklist-rules'
import { ChecklistGenerationRule } from '@/lib/data/checklist-rules'
```

## 📝 注意事項

1. **ルールの重複を避ける**: 同じチェック項目が複数のカテゴリに含まれないようにする
2. **説明文は簡潔に**: descriptionは1-2文で要点を伝える
3. **優先度を適切に設定**: highは必須項目、mediumは推奨、lowはあると便利
4. **条件を正確に**: 不適切な条件設定はユーザー体験を損なう

## 🚀 将来の拡張

- JSON/YAML形式への外部化（CMS化を見据えて）
- 多言語対応（ルール定義の国際化）
- 動的ルール（ユーザーの過去の行動に基づく学習）
- カスタムルール（ユーザーが独自のルールを追加）

