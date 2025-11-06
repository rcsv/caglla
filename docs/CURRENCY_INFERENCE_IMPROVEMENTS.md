# 通貨推測機能の改善（Currency Inference Improvements）

**作成日**: 2025-10-31  
**実装完了日**: 2025-10-31  
**関連Issue**: #34

---

## 📋 概要

Itinerary Cardの通貨推測機能を大幅に強化し、CodeRabbitの提案に基づいて以下の改善を実装しました：

1. **120+の国マッピング**を`lib/core/locations.ts`に追加
2. **70+の通貨**を`lib/utils/currency.ts`に追加
3. **階層的なフォールバック戦略**を実装（`getCurrencyFromPlaceEnhanced()`関数）
4. **UIコンポーネントの更新**（`ScheduleCard.tsx`）

---

## 🎯 実装内容

### 1. 国マッピングの拡張（`lib/core/locations.ts`）

**変更前**: 約46カ国  
**変更後**: 141カ国（120+達成）

追加した主な地域：
- **アジア**: バングラデシュ、ブータン、ブルネイ、カンボジア、スリランカ、ミャンマー、ネパール、パキスタン、アフガニスタン、イラン、イラク、ヨルダン、クウェート、レバノン、オマーン、カタール、イエメン、カザフスタン、ウズベキスタン、ジョージア、アルメニア、アゼルバイジャン、モンゴル
- **ヨーロッパ**: アイルランド、ポルトガル、ギリシャ、ルーマニア、ブルガリア、クロアチア、スロベニア、スロバキア、エストニア、ラトビア、リトアニア、アイスランド、マルタ、キプロス、ルクセンブルク、セルビア、ボスニア・ヘルツェゴビナ、モンテネグロ、北マケドニア、アルバニア、ウクライナ、ベラルーシ、モルドバ
- **アフリカ**: エジプト、モロッコ、チュニジア、アルジェリア、ケニア、タンザニア、ウガンダ、エチオピア、ガーナ、ナイジェリア
- **中南米**: コスタリカ、パナマ、グアテマラ、ホンジュラス、エルサルバドル、ニカラグア、キューバ、ドミニカ共和国、ジャマイカ、トリニダード・トバゴ、ウルグアイ、パラグアイ、ボリビア、エクアドル、ベネズエラ、ガイアナ、スリナム
- **オセアニア**: フィジー、パプアニューギニア、ニューカレドニア、フランス領ポリネシア
- **海外領土・特殊地域**: グアドループ、レユニオン、サンピエール・ミクロン、フランス領ギアナ、マルティニーク、マヨット、サン・バルテルミー、サン・マルタン、米領ヴァージン諸島、プエルトリコ、米領サモア、ケイマン諸島、バミューダ、英領ヴァージン諸島、タークス・カイコス諸島、アルバ、キュラソー、シント・マールテン

### 2. 通貨シンボルの追加（`lib/utils/currency.ts`）

**変更前**: 約40通貨  
**変更後**: 約90通貨（70+達成）

追加した主な通貨：
- **アジア**: BDT (৳), BTN (Nu.), BND (B$), KHR (៛), LKR (Rs), MMK (K), NPR (Rs), PKR (₨), AFN (؋), IRR (﷼), IQD (ع.د), JOD (د.ا), KWD (د.ك), LBP (ل.ل), OMR (﷼), QAR (﷼), YER (﷼), KZT (₸), UZS (so'm), GEL (₾), AMD (֏), AZN (₼), MNT (₮)
- **ヨーロッパ**: ISK (kr), RON (lei), BGN (лв), RSD (дин), BAM (КМ), MKD (ден), ALL (L), UAH (₴), BYN (Br), MDL (L)
- **アフリカ**: EGP (ج.م), MAD (د.م.), TND (د.ت), DZD (د.ج), KES (KSh), TZS (TSh), UGX (USh), ETB (Br), GHS (₵), NGN (₦)
- **中南米**: CRC (₡), PAB (B/.), GTQ (Q), HNL (L), NIO (C$), CUP (₱), DOP (RD$), JMD (J$), TTD (TT$), UYU ($U), PYG (Gs), BOB (Bs.), VES (Bs.S), GYD ($), SRD ($)
- **オセアニア**: FJD (FJ$), PGK (K), XPF (₣)
- **海外領土**: KYD ($), BMD ($), AWG (ƒ), ANG (ƒ)

### 3. 階層的なフォールバック戦略（`getCurrencyFromPlaceEnhanced()`）

新しい関数`getCurrencyFromPlaceEnhanced()`を実装し、以下の順序で通貨を推測します：

1. **Venueのplace_dataから国コードを取得**（信頼度: high）
   - `address_components`から`country`タイプを検索
   - 国コードから通貨を取得

2. **City名から推測**（信頼度: high/medium）
   - `formatted_address`から都市名を抽出
   - `place_data.name`からも都市名を抽出
   - 都市マッピングから通貨を取得

3. **Tripのdestination_placeから国コードを取得**（信頼度: medium）
   - `trip.destination_place.address_components`から国コードを抽出
   - 国コードから通貨を取得

4. **Tripのdestination文字列から推測**（信頼度: low）
   - `trip.destination`文字列から都市名をマッチング
   - 都市マッピングから通貨を取得

5. **ユーザーのhome_country_code**（信頼度: low）
   - `user.preferences.home_country_code`から通貨を取得

6. **デフォルト（JPY）**（信頼度: low）
   - すべての推測が失敗した場合、JPYを返す

**戻り値の型**:
```typescript
{
  currency: string
  source: 'venue' | 'city' | 'trip_place' | 'trip_destination' | 'user' | 'default'
  confidence: 'high' | 'medium' | 'low'
}
```

### 4. UIコンポーネントの更新

#### `ScheduleCard.tsx`
- `trip`プロップを追加
- `useAuth()`フックを使用して`user`を取得
- `getCurrencyFromPlace()`から`getCurrencyFromPlaceEnhanced()`に変更
- 推測結果のログ出力を追加

#### `SortableItineraryCard.tsx`
- `trip`プロップを追加して`ScheduleCard`に渡す

#### `TripItineraryView.tsx`
- `SortableItineraryCard`に`trip={trip}`を渡すように更新

---

## 🔧 技術的詳細

### 関数シグネチャ

```typescript
getCurrencyFromPlaceEnhanced(
  placeData?: PlaceData | null,
  trip?: Trip | null,
  user?: User | null,
  userId?: string
): {
  currency: string
  source: 'venue' | 'city' | 'trip_place' | 'trip_destination' | 'user' | 'default'
  confidence: 'high' | 'medium' | 'low'
}
```

### 使用例

```typescript
// ScheduleCard.tsx内
const result = currencyUtils.getCurrencyFromPlaceEnhanced(
  itinerary.place_data,
  trip || null,
  user || null
)

if (result.currency !== 'JPY') {
  setTempCostCurrency(result.currency)
  logger.debug(`Currency auto-detected: ${result.currency} (source: ${result.source}, confidence: ${result.confidence})`)
}
```

---

## 📊 改善効果

### 推測精度の向上
- **変更前**: Venueの国コードのみ → 約40カ国対応
- **変更後**: 階層的なフォールバック → 141カ国対応、推測成功率大幅向上

### ユーザー体験の向上
- Venueの国コードが取得できない場合でも、Tripのdestinationやユーザーのhome_country_codeから推測可能
- 推測の信頼度が分かるため、ユーザーが手動で修正する必要がある場合を判断しやすい

---

## 🔄 後方互換性

- `getCurrencyFromPlace()`関数は既存のまま維持（後方互換性）
- `getCurrencyFromPlaceEnhanced()`は新規追加
- 既存のコードは影響を受けない

---

## 📝 今後の改善案

1. **UI表示の改善**
   - 通貨フィールドに「推測: JPY（Venue）」のようなサブラベルを表示
   - クリックで候補（Venue/Trip/User）を切替選択可能に
   - 信頼度低（フォールバック深い）場合は薄い文言表示

2. **非同期フォールバック**
   - Tripのdestination文字列からGeocoding APIを使用して国コードを取得
   - 現在は同期版の都市名マッチングのみ

3. **ユニットテスト**
   - 代表ケース（US/UK/EU/海外領土/多通貨）のテストを追加

4. **ログ/検知の強化**
   - 推測失敗ケースを`DEBUG`で計測し、マッピング追加の優先度判断に活用

---

## 🔗 関連ファイル

- `lib/core/locations.ts` - 国マッピングデータ
- `lib/utils/currency.ts` - 通貨ユーティリティ
- `components/trip/ScheduleCard.tsx` - Itinerary Cardコンポーネント
- `components/trip/SortableItineraryCard.tsx` - ソート可能なItinerary Card
- `components/trip/TripItineraryView.tsx` - Trip Itinerary View
- `docs/issues/itinerary-currency-inference-weak.md` - Issueドキュメント

---

## ✅ 完了条件

- [x] Venueが設定されている場合、通貨が高確率で正しく推測される
- [x] 推測失敗時にTrip/User由来のフォールバックが機能
- [ ] UIに推測由来のヒント表示（Venue/Trip/User）← 今後の改善案
- [ ] 代表的な例外ケースのユニットテストが追加 ← 今後の改善案

---

## 📚 参考資料

- [CodeRabbit提案](https://github.com/rcsv/caglla/issues/34)
- [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
- [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217)

