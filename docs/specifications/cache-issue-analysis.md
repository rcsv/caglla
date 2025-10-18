# Places Cache 言語問題の分析と解決策

**作成日**: 2025年10月18日  
**問題**: 既存の`places_cache`が旧形式で保存され、言語指定なしで日本語がハードコードされている

---

## 🚨 現在の問題

### 1. **キャッシュ形式の混在**

#### 新形式（正しい）:
```typescript
// ドキュメントID: ChIJ123_ja
{
  format_version: "2.0.0",
  place_id: "ChIJ123",
  language: "ja",
  name: "東京駅",
  // ...
}
```

#### 旧形式（問題あり）:
```typescript
// ドキュメントID: ChIJ123
{
  format_version: "1.0.0",  // 旧バージョン
  place_id: "ChIJ123",
  // language フィールドなし
  name: "Tokyo Station",  // 日本語でハードコード
  // ...
}
```

### 2. **旧形式キャッシュを生成している箇所**

| ファイル | 行 | 問題 |
|---------|----|----|
| `app/api/itineraries/insert/route.ts` | 157 | `format_version: '1.0.0'`, 言語指定なし |
| `app/api/itineraries/route.ts` | 82 | `format_version: '1.0.0'`, 言語指定なし |
| `app/api/trips/route.ts` | 195 | `format_version: '1.0.0'`, 言語指定なし |
| `app/api/migrate/places-to-cache/route.ts` | 48 | `format_version: '1.0.0'`, 言語指定なし |
| `lib/travel/places-cache.ts` | 136 | 旧形式のまま（新形式に未対応） |

### 3. **言語指定なしのAPI呼び出し**

旧来のコードでは言語パラメータを渡していない：
```typescript
// ❌ 問題: 言語指定なし
const placeData = await placesApiHelpers.getPlaceDetails(placeId)

// ✅ 正しい: 言語指定あり
const placeData = await placesApiHelpers.getPlaceDetails(placeId, language)
```

---

## 🔍 問題の影響

### 1. **ユーザー体験への影響**
- ユーザーが英語を選択しても、キャッシュされた日本語データが返される
- レビューや営業時間が日本語で表示される
- 住所情報も日本語で表示される

### 2. **キャッシュ効率の低下**
- 言語ごとにキャッシュが分かれない
- 不要なAPI呼び出しが発生
- ストレージ効率が悪い

### 3. **データの不整合**
- 同じ`place_id`で複数の言語データが混在
- マイグレーションが必要

---

## 🛠️ 解決策

### Phase 1: 緊急対応（即座に実施）

#### 1. **旧形式キャッシュ保存の停止**

以下のファイルを修正して、新形式での保存に統一：

```typescript
// 修正前（旧形式）
const cachePayload: any = {
  format_version: '1.0.0',  // ❌ 旧バージョン
  place_id: place_data.place_id,
  // language フィールドなし ❌
  // ...
}
await adminDb.collection(COLLECTIONS.PLACES_CACHE).doc(resolvedPlaceId).set(cachePayload)

// 修正後（新形式）
import { savePlaceToCache } from '@/lib/api/places-cache'
import { getUserLanguage } from '@/lib/utils/language'

const language = getUserLanguage(user) // ユーザーの言語設定を取得
await savePlaceToCache(place_data, language) // 新形式で保存
```

#### 2. **修正が必要なファイル**

| ファイル | 修正内容 |
|---------|---------|
| `app/api/itineraries/insert/route.ts` | `savePlaceToCache()` を使用 |
| `app/api/itineraries/route.ts` | `savePlaceToCache()` を使用 |
| `app/api/trips/route.ts` | `savePlaceToCache()` を使用 |
| `lib/travel/places-cache.ts` | 新形式に対応 |

### Phase 2: マイグレーション（1週間以内）

#### 1. **既存キャッシュの移行**

```bash
# マイグレーションスクリプト実行
npx tsx scripts/migrate-places-cache-i18n.ts --dry-run --limit 100
npx tsx scripts/migrate-places-cache-i18n.ts --limit 1000
```

#### 2. **移行戦略**

```typescript
// 旧形式 → 新形式への変換
const oldCache = {
  format_version: '1.0.0',
  place_id: 'ChIJ123',
  name: '東京駅',  // 日本語データ
  // ...
}

// 新形式に変換
const newCache = {
  format_version: '2.0.0',
  place_id: 'ChIJ123',
  language: 'ja',  // 日本語として保存
  name: '東京駅',
  cached_at: new Date(),
  // ...
}

// ドキュメントIDを変更: ChIJ123 → ChIJ123_ja
await db.collection('places_cache').doc('ChIJ123_ja').set(newCache)
await db.collection('places_cache').doc('ChIJ123').delete()
```

### Phase 3: 検証（移行後）

#### 1. **キャッシュヒット率の確認**

```typescript
// 各言語でのキャッシュヒット率を監視
const metrics = {
  'ja': { hits: 100, misses: 20 },
  'en': { hits: 50, misses: 30 },
  'zh': { hits: 10, misses: 5 }
}
```

#### 2. **言語別データの確認**

```bash
# Firestore コンソールで確認
places_cache/
  ├── ChIJ123_ja    # 日本語データ
  ├── ChIJ123_en    # 英語データ
  └── ChIJ123_zh    # 中国語データ
```

---

## 📋 実装チェックリスト

### 緊急対応（今日中）

- [ ] **旧形式キャッシュ保存の停止**
  - [ ] `app/api/itineraries/insert/route.ts` を修正
  - [ ] `app/api/itineraries/route.ts` を修正
  - [ ] `app/api/trips/route.ts` を修正
  - [ ] `lib/travel/places-cache.ts` を修正

- [ ] **言語指定の追加**
  - [ ] 各API呼び出しで `getUserLanguage(user)` を使用
  - [ ] `savePlaceToCache(placeData, language)` を使用

### マイグレーション（1週間以内）

- [ ] **マイグレーションスクリプトの実行**
  - [ ] ドライランでテスト
  - [ ] 小ロットで実行
  - [ ] 全データの移行

- [ ] **検証**
  - [ ] 各言語でのキャッシュヒット確認
  - [ ] データの整合性確認
  - [ ] パフォーマンス確認

---

## 🎯 期待される効果

### 1. **ユーザー体験の向上**
- ユーザーが選択した言語で場所情報が表示される
- レビューや営業時間が適切な言語で表示される

### 2. **パフォーマンスの向上**
- 言語ごとのキャッシュで効率化
- 不要なAPI呼び出しの削減

### 3. **データの整合性**
- 統一されたキャッシュ形式
- 予測可能な動作

---

## ⚠️ リスクと対策

### 1. **移行中のサービス停止**
- **対策**: 段階的移行、ロールバック計画

### 2. **データの損失**
- **対策**: 移行前のバックアップ、ドライラン実行

### 3. **パフォーマンスの一時的な低下**
- **対策**: 移行期間中の監視、必要に応じたスケーリング

---

## 📞 次のアクション

1. **今すぐ**: 旧形式キャッシュ保存の停止
2. **今日中**: 言語指定の追加
3. **1週間以内**: マイグレーション実行
4. **移行後**: 検証と監視

この問題は早急に解決する必要があります。ユーザーが言語設定を変更しても効果が現れない状況が続いているためです。
