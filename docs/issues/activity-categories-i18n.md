# Issue: アクティビティカテゴリーのラベルが日本語ハードコード

**作成日**: 2025-11-01  
**状態**: ✅ 解決済み  
**優先度**: 中  
**種類**: i18n化  
**関連ファイル**: 
- `lib/data/activity-categories.ts`（アクティビティカテゴリーマスターデータ）
- `components/trip/ActivityTagSelector.tsx`（アクティビティタグ選択UI）
- `components/stats/ActivityStatsDisplay.tsx`（アクティビティ統計表示）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

アクティビティカテゴリーの選択肢（PrimaryCategory、SecondaryCategory）のラベルが日本語でハードコードされており、i18n化されていない。ユーザーの表示言語に関係なく、常に日本語で表示されるため、多言語対応が不完全。

**更新**: 2025-01-XX - ActivityTagSelectorの直接参照をi18n対応関数に変更。既存のヘルパー関数（`getPrimaryCategoryShortLabel`, `getSecondaryCategoryLabel`）を使用するように修正。`getSecondaryCategoryDescription`関数を追加。

---

## 🐛 問題の詳細

### 現状の問題

1. **PrimaryCategoryのラベル**
   - `lib/data/activity-categories.ts`の`ACTIVITY_CATEGORIES`配列に含まれる全カテゴリーの`label`と`shortLabel`が日本語でハードコード
   - 例: `'乗り物に乗る'`, `'買い物をする'`, `'食事をする'`, `'宿泊する'` など

2. **SecondaryCategoryのラベル**
   - 各PrimaryCategory配下の`secondaryCategories`配列の全アイテムの`label`が日本語でハードコード
   - 例: `'飛行機'`, `'電車'`, `'バス'`, `'朝食'`, `'昼食'` など

3. **説明文（description）**
   - SecondaryCategoryの`description`フィールドも日本語でハードコード
   - 例: `'国際線・国内線の搭乗'`, `'鉄道・地下鉄での移動'` など

4. **表示箇所**
   - `ActivityTagSelector`コンポーネントの選択肢（`<select>`要素）
   - `ActivityTagSelector`の「選択中」表示
   - `ActivityStatsDisplay`コンポーネントの統計表示
   - `getPrimaryCategoryLabel()`, `getPrimaryCategoryShortLabel()`, `getSecondaryCategoryLabel()`関数の戻り値

### 影響範囲

- **PrimaryCategory**: 10カテゴリー（乗り物、買い物、食事、宿泊、探索、探検、遊ぶ、文化、健康、サービス）
- **SecondaryCategory**: 約70以上のアイテム
- **表示コンポーネント**: `ActivityTagSelector`, `ActivityStatsDisplay`
- **使用箇所**: Itinerary Cardのアクティビティタグ選択、プロフィールページのアクティビティ統計表示

### 期待される動作

- ユーザーの表示言語設定に応じて、アクティビティカテゴリーのラベルが適切な言語で表示される
- 英語設定時は英語、日本語設定時は日本語で表示
- 既存のi18nシステム（`lib/i18n/index.ts`）と統合

---

## 💡 解決方針

### Phase 1: i18nキーの設計

#### 1.1: i18nキーの命名規則

PrimaryCategory用:
```
activity.category.{primaryCategoryId}.label
activity.category.{primaryCategoryId}.shortLabel
```

SecondaryCategory用:
```
activity.category.{primaryCategoryId}.{secondaryCategoryId}.label
activity.category.{primaryCategoryId}.{secondaryCategoryId}.description
```

例:
- `activity.category.transportation.label` → "乗り物に乗る" / "Transportation"
- `activity.category.transportation.shortLabel` → "乗り物" / "Transport"
- `activity.category.transportation.flight.label` → "飛行機" / "Flight"
- `activity.category.transportation.flight.description` → "国際線・国内線の搭乗" / "International/Domestic flights"

#### 1.2: i18nキーの追加

`lib/i18n/index.ts`に約80個のi18nキーを追加:
- PrimaryCategory: 10カテゴリー × 2（label, shortLabel）= 20個
- SecondaryCategory: 約70アイテム × 2（label, description）= 約140個
- 合計: 約160個のキー

**注意**: キー数が多いため、段階的な実装やマスター管理方法の検討が必要

### Phase 2: データ構造の変更

#### 2.1: オプションA - i18nキー参照方式（推奨）

現在のマスターデータ構造を変更し、ラベルの代わりにi18nキーを参照するように変更:

```typescript
export interface ActivityCategoryMaster {
  primaryCategory: PrimaryCategoryType
  labelKey: string  // 'activity.category.transportation.label'
  shortLabelKey: string  // 'activity.category.transportation.shortLabel'
  icon: string
  iconName?: string
  secondaryCategories: SecondaryCategoryItem[]
}

export interface SecondaryCategoryItem {
  id: string
  labelKey: string  // 'activity.category.transportation.flight.label'
  descriptionKey?: string  // 'activity.category.transportation.flight.description'
  icon?: string
  iconName?: string
}
```

**メリット**:
- データ構造が明確
- 型安全性が高い
- i18nシステムとの統合が容易

**デメリット**:
- 既存のマスターデータ構造を大幅に変更する必要がある
- マイグレーションが必要

#### 2.2: オプションB - ヘルパー関数方式

既存のデータ構造を維持し、ヘルパー関数でi18nキーから値を取得:

```typescript
// 既存の構造は維持
export const ACTIVITY_CATEGORIES: ActivityCategoryMaster[] = [
  // 既存の日本語ラベルのまま
]

// 新しいi18n対応関数を追加
export function getPrimaryCategoryLabelI18n(
  primaryCategory: PrimaryCategoryType
): string {
  return t(`activity.category.${primaryCategory}.label`)
}

export function getPrimaryCategoryShortLabelI18n(
  primaryCategory: PrimaryCategoryType
): string {
  return t(`activity.category.${primaryCategory}.shortLabel`)
}

export function getSecondaryCategoryLabelI18n(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string {
  return t(`activity.category.${primaryCategory}.${secondaryCategoryId}.label`)
}

export function getSecondaryCategoryDescriptionI18n(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string {
  return t(`activity.category.${primaryCategory}.${secondaryCategoryId}.description`)
}
```

**メリット**:
- 既存のデータ構造を変更不要
- 後方互換性が高い
- 段階的な移行が可能

**デメリット**:
- マスターデータに日本語が残る（ただし参照されない）
- 重複した情報管理

**推奨**: オプションB（段階的な移行が可能で、影響範囲が小さい）

### Phase 3: コンポーネントの更新

#### 3.1: ActivityTagSelectorの更新

- `getPrimaryCategoryLabel` → `getPrimaryCategoryLabelI18n`
- `getPrimaryCategoryShortLabel` → `getPrimaryCategoryShortLabelI18n`
- `getSecondaryCategoryLabel` → `getSecondaryCategoryLabelI18n`
- `description`参照 → `getSecondaryCategoryDescriptionI18n`

#### 3.2: ActivityStatsDisplayの更新

- 同様にi18n対応関数を使用するように変更

#### 3.3: その他の使用箇所の確認

- `ActivityTagSelector`以外で`getPrimaryCategoryLabel`などが使用されている箇所を確認し、すべてi18n対応関数に置き換え

### Phase 4: i18n辞書の作成

#### 4.1: 英語翻訳の追加

全PrimaryCategory、SecondaryCategoryの英語翻訳を`lib/i18n/index.ts`の`en`辞書に追加

#### 4.2: 日本語翻訳の追加

既存の日本語ラベルを`ja`辞書に追加（現状と同じ値を維持）

---

## 🔗 関連ファイル

- `lib/data/activity-categories.ts` - アクティビティカテゴリーマスターデータ（約250行）
- `components/trip/ActivityTagSelector.tsx` - アクティビティタグ選択UI（約148行）
- `components/stats/ActivityStatsDisplay.tsx` - アクティビティ統計表示（使用箇所）
- `lib/i18n/index.ts` - i18n辞書（約1200行）
- `lib/core/types/activity.ts` - ActivityTag型定義

---

## ✅ 完了条件

- [ ] PrimaryCategory（10カテゴリー）の`label`と`shortLabel`がi18n化される
- [ ] SecondaryCategory（約70アイテム）の`label`と`description`がi18n化される
- [ ] `ActivityTagSelector`で選択肢が多言語表示される
- [ ] `ActivityTagSelector`の「選択中」表示が多言語表示される
- [ ] `ActivityStatsDisplay`で統計情報が多言語表示される
- [ ] 既存のヘルパー関数（`getPrimaryCategoryLabel`など）がi18n対応になる、または新しいi18n対応関数が追加される
- [ ] 英語と日本語の翻訳が追加される
- [ ] ビルドエラーがない
- [ ] ブラウザで動作確認済み（英語・日本語切り替えテスト）

---

## 📝 実装時の注意事項

1. **キー数の多さ**
   - 約160個のi18nキーを追加する必要がある
   - `lib/i18n/index.ts`のサイズが大きくなるため、将来的な分割管理を検討

2. **後方互換性**
   - 既存のコードで`getPrimaryCategoryLabel`などが使用されている可能性がある
   - 既存関数を非推奨（deprecated）にし、新しいi18n対応関数に移行

3. **型安全性**
   - i18nキーのタイプセーフティを確保（`TranslationKey`型に追加）
   - キー名のミスをコンパイル時に検出できるようにする

4. **パフォーマンス**
   - i18n関数の呼び出しが増えるため、パフォーマンスへの影響を確認
   - 必要に応じてキャッシュやメモ化を検討

5. **翻訳品質**
   - 英語翻訳が正確で自然であることを確認
   - 必要に応じて翻訳レビューを実施

6. **段階的実装**
   - 一度に全てを変更せず、PrimaryCategoryから順次実装
   - 動作確認しながら進める

---

## 🔍 参考

- `lib/data/activity-categories.ts`の構造:
  - PrimaryCategory: `transportation`, `shopping`, `dining`, `accommodation`, `exploration`, `adventure`, `entertainment`, `culture`, `wellness`, `service`
  - SecondaryCategory: 各PrimaryCategory配下に5-9個のアイテム
  - 全SecondaryCategory数: 約70個

- 既存のi18n実装例:
  - `components/trip/ScheduleInfoDisplay.tsx` - `t('trip.schedule.time')`など
  - `components/trip/ActivityTagSelector.tsx` - `t('trip.schedule.activity')`など

---

## 💡 拡張アイデア（将来）

1. **アクティビティカテゴリーの動的読み込み**
   - i18nキーが多すぎる場合は、別ファイル（`lib/i18n/activity-categories.ts`）に分離
   - 必要に応じて動的に読み込む

2. **翻訳の外部管理**
   - 翻訳を外部ファイル（JSON、YAMLなど）で管理
   - 翻訳者向けの管理画面を提供

3. **カテゴリーのカスタマイズ**
   - ユーザーが独自のアクティビティカテゴリーを追加できる機能
   - カスタムカテゴリーもi18n対応

