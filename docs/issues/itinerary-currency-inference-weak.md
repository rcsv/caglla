# Issue: Itinerary Cardの通貨推測（Venueの国からの推察）が弱い

**作成日**: 2025-10-31  
**状態**: 🔴 未解決  
**優先度**: 中  
**関連ファイル**:
- `components/trip/TripItineraryView.tsx`（Itinerary Card）
- `lib/travel/country/utils.ts`（国推定ユーティリティ）
- `lib/utils/currency.ts`（通貨マッピング想定）
- `lib/places-api.ts` / `lib/api/google/places`（Place詳細の取得）

---

## 📋 概要

Itinerary Cardで費用入力時に、Venue（場所）の国から通貨を推測する機能が十分でなく、誤推測や未推測が発生する。ISO 3166-1（国）とISO 4217（通貨）の対応が不完全、または例外ケース（複数通貨運用・海外領土・USD/EUR圏）の考慮不足が原因と見られる。

---

## 🐛 現状の問題

1. **推測テーブルの欠落/不足**
   - 一部の国コード→通貨コードの対応が存在しない、または古い
   - 海外領土（例: `GP`, `RE`, `PM` など）の扱いが不明確
2. **複数通貨/事実上の利用通貨**
   - 一部地域で法定通貨と流通通貨が異なるケース（USD/EUR常用地域）
3. **Place詳細の国コード取得失敗**
   - `address_components`に`country`がない、または`short_name`が想定外
4. **フォールバック戦略が弱い**
   - Venueから推測失敗時、Tripの`destination`やユーザーの`home_country_code`に落ちない
5. **UIの不透明さ**
   - 推測結果の信頼度や由来（Venue/Trip/User）が分からない

---

## 🔍 再現手順（例）
1. Itinerary CardでVenueを設定（Google Places検索）
2. 費用フィールドで通貨が自動補完されない／誤った通貨が提案される
3. `address_components`に`country`は存在するが、マッピングされていない

---

## 💡 対処方針（提案）

### A) 通貨マッピングの強化
- ISO 3166-1 alpha-2 → ISO 4217の包括的マップを`lib/utils/currency.ts`に整備
- 例外・海外領土の扱いを明記（`GF`→`EUR` 等）
- 将来更新容易なデータ構造（JSON/TS定数）＋ユニットテスト

### B) フォールバック戦略の階層化
1. Venueの`countryCode`から推測
2. 失敗時はTripの`destination_place`→国推定
3. さらに失敗時はTripの`destination`文字列→国推定
4. それでも失敗ならユーザー`home_country_code`
5. 最後に`USD`等のグローバルデフォルト（要議論）

### C) UI/UX改善
- 通貨フィールドに「推測: JPY（Venue）」のようなサブラベルを表示
- クリックで候補（Venue/Trip/User）を切替選択可能に
- 信頼度低（フォールバック深い）場合は薄い文言表示

### D) 技術的実装
- `extractCountryFromAddress(address)` の堅牢化（国コード取り出し）
- `getCurrencyFromCountryCode(code)` を新規実装（例外含む）
- Itinerary Cardの初期値設定に上記ロジックを組み込み
- 単体テスト: 代表ケース（US/UK/EU/海外領土/多通貨）

### E) ログ/検知
- 推測失敗ケースを`DEBUG`で計測し、マッピング追加の優先度判断に活用

---

## ✅ 完了条件
- [ ] Venueが設定されている場合、通貨が高確率で正しく推測される
- [ ] 推測失敗時にTrip/User由来のフォールバックが機能
- [ ] UIに推測由来のヒント表示（Venue/Trip/User）
- [ ] 代表的な例外ケースのユニットテストが追加

---

## 🔗 関連
- `lib/travel/country/utils.ts`（国推定）
- `lib/utils/currency.ts`（新規）
- `components/trip/TripItineraryView.tsx`（Card内の通貨フィールド）
