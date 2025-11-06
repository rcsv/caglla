# Issue: ActivityカテゴリーのSecondary Categoryが日本語ハードコード（全カテゴリー対象）

**作成日**: 2025-11-05  
**状態**: 🔴 未対応  
**優先度**: 中  
**種類**: Bug（i18n）  
**関連Issue**: 
- [アクティビティカテゴリーのラベルが日本語ハードコード](activity-categories-i18n.md) - 解決済み（ただし、Secondary Categoryの大部分が未対応）

**関連ファイル**: 
- `lib/data/activity-categories.ts`（アクティビティカテゴリーマスターデータ）
- `components/trip/ActivityTagSelector.tsx`（アクティビティタグ選択UI）
- `lib/i18n/index.ts`（i18n辞書）

---

## 📋 概要

Activityカテゴリーの**すべてのPrimaryCategory**のSecondary Category（詳細カテゴリー）が日本語ハードコードのままになっています。`ActivityTagSelector`コンポーネントで任意のPrimaryCategoryを選択し、「Select Detail」ドロップダウンを開くと、選択肢が日本語で表示されます。

**特に問題が顕著な例（Serviceカテゴリー）**:
- 洗濯
- 両替
- 病院
- ビザ申請
- SIM購入
- 郵便局
- ATM
- 荷物預け

これにより、英語環境のユーザーが日本語のテキストを見ることになり、一貫性のないUI体験が発生しています。

**影響範囲**: 全10カテゴリー × 約70以上のSecondary Categoryアイテム

---

## 🐛 問題の詳細

### 現在の実装

#### 1. マスターデータ（`lib/data/activity-categories.ts`）

**すべてのPrimaryCategory**のSecondary Categoryが日本語でハードコードされています：

**例: Serviceカテゴリー**
```typescript
{
  primaryCategory: 'service',
  label: 'サービス提供',
  shortLabel: 'サービス',
  icon: '🔧',
  secondaryCategories: [
    { id: 'laundry', label: '洗濯', icon: '👕', description: 'コインランドリー・クリーニング' },
    { id: 'currency_exchange', label: '両替', icon: '💱', description: '両替所・銀行' },
    { id: 'hospital', label: '病院', icon: '🏥', description: '病院・クリニック' },
    { id: 'visa_application', label: 'ビザ申請', icon: '📋', description: '大使館・ビザセンター' },
    { id: 'sim_purchase', label: 'SIM購入', icon: '📱', description: 'SIMカード・通信サービス' },
    { id: 'post_office', label: '郵便局', icon: '📮', description: '郵便・荷物発送' },
    { id: 'atm', label: 'ATM', icon: '🏧', description: '現金引き出し' },
    { id: 'baggage_storage', label: '荷物預け', icon: '🧳', description: 'コインロッカー・荷物預かり' },
  ]
}
```

**同様に、他の9カテゴリーも全て日本語ハードコード**:
- `transportation`: 飛行機、電車、バス、タクシー、レンタカー、フェリー、自転車、バイク・スクーター
- `shopping`: お土産購入、食料品購入、ファッション、電化製品、ローカル市場、免税店、書店
- `dining`: 朝食、昼食、夕食、カフェ、バー、フードツアー、屋台・ストリートフード、ファインダイニング
- `accommodation`: チェックイン作業、チェックアウト作業、車中泊、キャンプ、ホステル泊、民泊、高級ホテル
- `exploration`: 街歩き、自然散策、写真撮影、展望・眺望、建築鑑賞、公園訪問
- `adventure`: ハイキング、トレッキング、ダイビング、シュノーケリング、ロッククライミング、洞窟探検、サファリ、ジャングルトレック
- `entertainment`: テーマパーク、ビーチ、ウォータースポーツ、カジノ、ナイトライフ、ゲームセンター、カラオケ、映画鑑賞
- `culture`: 博物館、美術館、水族館、寺社仏閣、歴史的建造物、地域祭り、劇場・コンサート、伝統文化体験、ワークショップ
- `wellness`: スパ、マッサージ、ヨガ、ジム、瞑想、温泉、デトックス

#### 2. i18nキーの不足（`lib/i18n/index.ts`）

`getSecondaryCategoryLabel`関数は以下のi18nキーを探します：

```typescript
`activity.secondary.${primaryCategory}.${secondaryCategoryId}`
```

しかし、`lib/i18n/index.ts`には以下のキーしか定義されていません：

- ✅ `activity.secondary.transportation.flight` - 存在
- ✅ `activity.secondary.transportation.train` - 存在

**約70以上のSecondary Categoryアイテムのうち、i18nキーが定義されているのは2つのみ**です。

**不足しているi18nキー（全カテゴリー）**:

**Transportation (6個不足)**:
- ❌ `activity.secondary.transportation.bus`
- ❌ `activity.secondary.transportation.taxi`
- ❌ `activity.secondary.transportation.car_rental`
- ❌ `activity.secondary.transportation.ferry`
- ❌ `activity.secondary.transportation.bike`
- ❌ `activity.secondary.transportation.scooter`

**Shopping (7個不足)**:
- ❌ `activity.secondary.shopping.souvenir`
- ❌ `activity.secondary.shopping.grocery`
- ❌ `activity.secondary.shopping.fashion`
- ❌ `activity.secondary.shopping.electronics`
- ❌ `activity.secondary.shopping.local_market`
- ❌ `activity.secondary.shopping.duty_free`
- ❌ `activity.secondary.shopping.bookstore`

**Dining (8個不足)**:
- ❌ `activity.secondary.dining.breakfast`
- ❌ `activity.secondary.dining.lunch`
- ❌ `activity.secondary.dining.dinner`
- ❌ `activity.secondary.dining.cafe`
- ❌ `activity.secondary.dining.bar`
- ❌ `activity.secondary.dining.food_tour`
- ❌ `activity.secondary.dining.street_food`
- ❌ `activity.secondary.dining.fine_dining`

**Accommodation (7個不足)**:
- ❌ `activity.secondary.accommodation.check_in`
- ❌ `activity.secondary.accommodation.check_out`
- ❌ `activity.secondary.accommodation.car_camping`
- ❌ `activity.secondary.accommodation.camping`
- ❌ `activity.secondary.accommodation.hostel_stay`
- ❌ `activity.secondary.accommodation.airbnb`
- ❌ `activity.secondary.accommodation.luxury_hotel`

**Exploration (6個不足)**:
- ❌ `activity.secondary.exploration.city_walk`
- ❌ `activity.secondary.exploration.nature_walk`
- ❌ `activity.secondary.exploration.photography`
- ❌ `activity.secondary.exploration.observation`
- ❌ `activity.secondary.exploration.architecture`
- ❌ `activity.secondary.exploration.park`

**Adventure (8個不足)**:
- ❌ `activity.secondary.adventure.hiking`
- ❌ `activity.secondary.adventure.trekking`
- ❌ `activity.secondary.adventure.diving`
- ❌ `activity.secondary.adventure.snorkeling`
- ❌ `activity.secondary.adventure.rock_climbing`
- ❌ `activity.secondary.adventure.caving`
- ❌ `activity.secondary.adventure.safari`
- ❌ `activity.secondary.adventure.jungle_trek`

**Entertainment (8個不足)**:
- ❌ `activity.secondary.entertainment.theme_park`
- ❌ `activity.secondary.entertainment.beach`
- ❌ `activity.secondary.entertainment.water_sports`
- ❌ `activity.secondary.entertainment.casino`
- ❌ `activity.secondary.entertainment.nightlife`
- ❌ `activity.secondary.entertainment.game_center`
- ❌ `activity.secondary.entertainment.karaoke`
- ❌ `activity.secondary.entertainment.movie`

**Culture (9個不足)**:
- ❌ `activity.secondary.culture.museum`
- ❌ `activity.secondary.culture.art_gallery`
- ❌ `activity.secondary.culture.aquarium`
- ❌ `activity.secondary.culture.temple_shrine`
- ❌ `activity.secondary.culture.historical_site`
- ❌ `activity.secondary.culture.local_festival`
- ❌ `activity.secondary.culture.theater`
- ❌ `activity.secondary.culture.traditional_experience`
- ❌ `activity.secondary.culture.workshop`

**Wellness (7個不足)**:
- ❌ `activity.secondary.wellness.spa`
- ❌ `activity.secondary.wellness.massage`
- ❌ `activity.secondary.wellness.yoga`
- ❌ `activity.secondary.wellness.gym`
- ❌ `activity.secondary.wellness.meditation`
- ❌ `activity.secondary.wellness.hot_spring`
- ❌ `activity.secondary.wellness.detox`

**Service (8個不足)**:
- ❌ `activity.secondary.service.laundry`
- ❌ `activity.secondary.service.currency_exchange`
- ❌ `activity.secondary.service.hospital`
- ❌ `activity.secondary.service.visa_application`
- ❌ `activity.secondary.service.sim_purchase`
- ❌ `activity.secondary.service.post_office`
- ❌ `activity.secondary.service.atm`
- ❌ `activity.secondary.service.baggage_storage`

**合計: 約70個以上のi18nキーが不足**（ラベル + 説明文で約140個以上）

#### 3. フォールバック動作

`getSecondaryCategoryLabel`関数の実装：

```typescript
export function getSecondaryCategoryLabel(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string {
  const info = getSecondaryCategoryInfo(primaryCategory, secondaryCategoryId)
  if (!info) return secondaryCategoryId
  const lang = getUserLanguage()
  const translated = t((`activity.secondary.${primaryCategory}.${secondaryCategoryId}` as unknown) as any, lang)
  return `${info.icon || ''} ${(translated || info.label)}`.trim()
}
```

i18nキーが見つからない場合、`info.label`（日本語ハードコード）がフォールバックとして使用されます。

### 影響範囲

- **ユーザー体験**: 英語環境のユーザーが日本語のテキストを見ることになり、一貫性のないUI体験
- **表示箇所**: 
  - `ActivityTagSelector`コンポーネントの「Select Detail」ドロップダウン（全カテゴリー）
  - 選択中のタグ表示（`getSecondaryCategoryLabel`の戻り値）
  - `ActivityStatsDisplay`コンポーネントの統計表示
- **カテゴリー数**: 全10カテゴリー × 約70以上のSecondary Categoryアイテム
- **i18nキー不足**: 約70個のラベル + 約70個の説明文 = 約140個以上のi18nキーが不足

---

## 💡 解決方針

### Phase 1: 段階的実装アプローチ

全約140個のi18nキーを一度に追加するのは大規模な作業のため、段階的に実装します。

#### Phase 1.1: Serviceカテゴリー（優先度高）

最も問題が顕著な`service`カテゴリーから実装します。

#### Phase 1.2-N: 他のカテゴリー

残りのカテゴリーを優先度順に実装します。

### Phase 2: i18nキーの追加方法

#### 2.1: TranslationKey型に追加

各カテゴリーごとに、以下の形式でキーを追加：

```typescript
// Activity Secondary Categories - {CategoryName}
| 'activity.secondary.{primaryCategory}.{secondaryCategoryId}'
| 'activity.secondary.{primaryCategory}.{secondaryCategoryId}.description'
```

#### 2.2: 英語翻訳を追加

```typescript
'activity.secondary.{primaryCategory}.{secondaryCategoryId}': 'English Label',
'activity.secondary.{primaryCategory}.{secondaryCategoryId}.description': 'English Description',
```

#### 2.3: 日本語翻訳を追加

```typescript
'activity.secondary.{primaryCategory}.{secondaryCategoryId}': '日本語ラベル',
'activity.secondary.{primaryCategory}.{secondaryCategoryId}.description': '日本語説明',
```

### Phase 3: 実装順序（推奨）

1. **Service** (8個) - 最も問題が顕著
2. **Transportation** (6個) - 一部既に存在、残りを追加
3. **Dining** (8個) - よく使用されるカテゴリー
4. **Accommodation** (7個) - よく使用されるカテゴリー
5. **Shopping** (7個)
6. **Culture** (9個)
7. **Adventure** (8個)
8. **Entertainment** (8個)
9. **Exploration** (6個)
10. **Wellness** (7個)

### Phase 4: 一括追加スクリプト（オプション）

大量のキーを追加する際は、スクリプトで自動生成することを検討：

```typescript
// マスターデータから自動生成
ACTIVITY_CATEGORIES.forEach(category => {
  category.secondaryCategories.forEach(secondary => {
    // i18nキーを自動生成
  })
})
```

---

## 🔗 関連ファイル

- `lib/data/activity-categories.ts` - アクティビティカテゴリーマスターデータ（約272行）
- `components/trip/ActivityTagSelector.tsx` - アクティビティタグ選択UI（約150行）
- `lib/i18n/index.ts` - i18n辞書（約3196行）
- `lib/data/activity-categories.ts`の`getSecondaryCategoryLabel`関数（約247-256行目）

---

## ✅ 完了条件

### Phase 1: Serviceカテゴリー（優先度高）

- [ ] `lib/i18n/index.ts`に`activity.secondary.service.*`のi18nキーを追加（英語・日本語、ラベル＋説明、8個×2=16個）
- [ ] 英語環境で英語テキストが表示されることを確認
- [ ] 日本語環境で日本語テキストが表示されることを確認
- [ ] `ActivityTagSelector`の「Select Detail」ドロップダウンで正しく表示されることを確認
- [ ] 選択中のタグ表示で正しく表示されることを確認

### Phase 2-N: 他のカテゴリー（段階的実装）

- [ ] Transportationカテゴリーの残り6個のi18nキーを追加
- [ ] Diningカテゴリーの8個のi18nキーを追加
- [ ] Accommodationカテゴリーの7個のi18nキーを追加
- [ ] Shoppingカテゴリーの7個のi18nキーを追加
- [ ] Cultureカテゴリーの9個のi18nキーを追加
- [ ] Adventureカテゴリーの8個のi18nキーを追加
- [ ] Entertainmentカテゴリーの8個のi18nキーを追加
- [ ] Explorationカテゴリーの6個のi18nキーを追加
- [ ] Wellnessカテゴリーの7個のi18nキーを追加

### 最終確認

- [ ] 全10カテゴリーのSecondary Categoryが正しく多言語表示されることを確認
- [ ] 英語環境で全てのカテゴリーが英語で表示されることを確認
- [ ] 日本語環境で全てのカテゴリーが日本語で表示されることを確認

---

## 🔍 実装時の注意事項

1. **既存のi18nキーの確認**
   - `activity.secondary.transportation.flight`と`activity.secondary.transportation.train`は既に存在
   - 命名規則は`activity.secondary.{primaryCategory}.{secondaryCategoryId}`
   - 説明文は`activity.secondary.{primaryCategory}.{secondaryCategoryId}.description`

2. **フォールバック動作**
   - `getSecondaryCategoryLabel`関数は既にi18nキーを探す実装になっている
   - キーが見つからない場合のみ`info.label`（日本語ハードコード）がフォールバックとして使用される
   - キーを追加すれば、自動的に多言語対応が有効になる

3. **他のカテゴリーへの影響**
   - 他のPrimaryCategoryのSecondary Categoryも同様の問題がある可能性が高い
   - `service`カテゴリーを修正後、他のカテゴリーも確認することを推奨

---

## 📚 参考

### 既存のi18n実装パターン

`getSecondaryCategoryLabel`関数は既にi18n対応の実装になっています：

```typescript
export function getSecondaryCategoryLabel(
  primaryCategory: PrimaryCategoryType,
  secondaryCategoryId: string
): string {
  const info = getSecondaryCategoryInfo(primaryCategory, secondaryCategoryId)
  if (!info) return secondaryCategoryId
  const lang = getUserLanguage()
  const translated = t((`activity.secondary.${primaryCategory}.${secondaryCategoryId}` as unknown) as any, lang)
  return `${info.icon || ''} ${(translated || info.label)}`.trim()
}
```

i18nキーを追加するだけで、自動的に多言語対応が有効になります。

---

## 📊 統計情報

### 不足しているi18nキー数

| カテゴリー | Secondary Category数 | 不足キー数（ラベル） | 不足キー数（説明文） | 合計 |
|-----------|---------------------|-------------------|-------------------|------|
| Transportation | 8 | 6 | 6 | 12 |
| Shopping | 7 | 7 | 7 | 14 |
| Dining | 8 | 8 | 8 | 16 |
| Accommodation | 7 | 7 | 7 | 14 |
| Exploration | 6 | 6 | 6 | 12 |
| Adventure | 8 | 8 | 8 | 16 |
| Entertainment | 8 | 8 | 8 | 16 |
| Culture | 9 | 9 | 9 | 18 |
| Wellness | 7 | 7 | 7 | 14 |
| Service | 8 | 8 | 8 | 16 |
| **合計** | **76** | **74** | **74** | **148** |

**注**: `transportation.flight`と`transportation.train`は既に存在するため、Transportationカテゴリーは6個不足。

---

## 🔗 関連Issue

- [アクティビティカテゴリーのラベルが日本語ハードコード](activity-categories-i18n.md) - 解決済み（ただし、Secondary Categoryの大部分が未対応）
- [AddScheduleModalの日本語ハードコード問題](add-schedule-modal-japanese-hardcoded.md) - 未対応（類似の問題）

