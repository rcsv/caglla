# Google Places API 利用規約 - 重要ポイント

**最終更新**: 2025年10月18日  
**調査日時**: 2025年10月18日

⚠️ **注意**: この文書は参考情報です。実装前に必ず公式の利用規約を直接確認してください。

## 📋 公式ドキュメント

- **Google Maps Platform サービス固有の利用規約**: https://cloud.google.com/maps-platform/terms/maps-service-terms?hl=ja
- **Places API のポリシーと帰属**: https://developers.google.com/maps/documentation/places/web-service/policies?hl=ja
- **Google 利用規約**: https://policies.google.com/terms?hl=ja

## 🚨 重要な制約事項

### 1. キャッシュとデータの保存

#### ✅ 許可されていること
- **緯度・経度の一時キャッシュ**: 最大30日間

#### ❌ 禁止されていること
- **30日を超えるデータ保存**: 緯度経度を30日以上保存すること
- **データセットの作成**: Googleのコンテンツを使用して独自の地図関連データセット（ビジネスリスティングデータベース、マッピングデータベースなど）を作成すること
- **属性情報の変更**: キャッシュデータの属性情報を変更すること

### 2. 使用制限

#### ❌ 禁止されていること
- **非Googleマップとの併用**: Places APIから取得したコンテンツを非Google製の地図と組み合わせて使用すること
- **事前取得 (Pre-fetching)**: 実際のユーザーリクエストなしにデータを事前に大量取得すること
- **一括ダウンロード**: データを一括でダウンロードすること

### 3. 帰属表示の要件

#### レビューの概要表示時
以下のリンクを含める必要があります：
- 「この概要について」: https://support.google.com/local-listings/answer/9851099
- 「概要を報告」: APIレスポンスの`flagContentUri`
- 「クチコミを見る」: APIレスポンスの`reviewSummary.reviewsUri`

## ⚠️ 不明確な点（要確認）

以下の点については、公式ドキュメントに明確な記述が見つかりませんでした。**実装前に必ず確認してください**：

### 🔍 確認が必要な項目

1. **場所名（name）の保存期間**
   - 緯度経度は30日制限が明記されているが、場所名は？
   - 推測: 同様の制限がある可能性が高い

2. **住所（formatted_address）の保存期間**
   - 緯度経度と同様の制限がある可能性

3. **レビュー（reviews）の保存**
   - `author_name`（個人情報）の保存可否
   - レビューテキストの保存可否
   - GDPR/個人情報保護法との関連

4. **写真参照（photo_reference）の保存**
   - 写真参照の保存期間制限
   - 写真URL自体の保存可否

5. **営業時間（opening_hours）の保存**
   - リアルタイム情報（`open_now`）の扱い
   - 定期的な更新要件

6. **評価・価格情報の保存**
   - `rating`, `user_ratings_total`, `price_level`の保存期間

## 🎯 推奨される対応方針

### Option A: 保守的アプローチ（推奨）

すべてのPlaces APIデータに30日制限を適用：

```typescript
// すべてのキャッシュに30日TTLを設定
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000  // 30日

// 定期的にクリーンアップ
async function cleanupExpiredCache() {
  const cutoffDate = new Date(Date.now() - CACHE_TTL_MS)
  // 30日以上古いキャッシュを削除
}
```

**メリット**:
- 利用規約違反のリスクが最小
- Google側の方針変更にも対応しやすい

**デメリット**:
- キャッシュヒット率が下がる可能性
- APIコストが増加する可能性

### Option B: レビュー除外アプローチ

個人情報（レビュー）を除外して保存：

```typescript
interface PlacesCache {
  // 基本情報（保存OK）
  place_id: string
  name: string
  formatted_address: string
  geometry: { location: { lat: number; lng: number } }
  
  // 連絡先情報（保存OK）
  formatted_phone_number?: string
  website?: string
  
  // レビューは保存しない（API都度取得）
  reviews?: never  // 保存しない
  
  // 30日TTL
  cached_at: Date
}
```

**メリット**:
- GDPR/個人情報保護法への対応が容易
- レビューは最新情報を取得できる

**デメリット**:
- レビュー取得時はAPI呼び出しが必要

### Option C: Googleに直接問い合わせ

**最も確実な方法**:

1. Google Maps Platform サポートに問い合わせ
2. 具体的な使用ケースを説明
3. 書面での回答を取得

問い合わせ先: https://cloud.google.com/maps-platform/support

## 📊 現在の実装との比較

### 現在の実装（v1.7.1）

```typescript
// 実装されているキャッシュ
interface PlacesCache {
  place_id: string
  language: SupportedLanguage
  name: string              // ← 保存期間の確認が必要
  formatted_address: string // ← 保存期間の確認が必要
  geometry: { ... }         // ✅ 30日OK
  photos?: [...]            // ← 保存期間の確認が必要
  reviews?: [...]           // ⚠️ 個人情報の扱いに注意
  // ... その他
}

// Soft TTL: 30日
const SOFT_TTL_MS = 30 * 24 * 60 * 60 * 1000
```

### 必要な対応

1. **即座に対応**（リスク高）:
   - レビュー（`reviews`）の保存を停止
   - または `author_name` を匿名化

2. **短期対応**（1週間以内）:
   - Google サポートに問い合わせ
   - 明確な回答を取得

3. **中期対応**（1ヶ月以内）:
   - 回答に基づいてキャッシュ戦略を調整
   - 必要に応じて実装を修正

## 🔒 GDPR / 個人情報保護法への対応

### 個人情報に該当する可能性のあるフィールド

1. **レビュー投稿者名**（`reviews[].author_name`）
   - 個人を特定できる情報
   - **推奨**: 保存しない、または匿名化

2. **レビュー内容**（`reviews[].text`）
   - 個人の意見や体験
   - **推奨**: 保存しない、またはユーザー同意を取得

3. **写真の投稿者情報**
   - 写真自体には個人情報が含まれる可能性
   - **推奨**: 参照のみ保存、実データは保存しない

### 推奨される実装

```typescript
// レビューを除外したキャッシュ
interface PlacesCacheSafe {
  // 個人情報を含まないフィールドのみ
  place_id: string
  language: SupportedLanguage
  name: string
  formatted_address: string
  geometry: { location: { lat: number; lng: number } }
  types?: string[]
  rating?: number
  user_ratings_total?: number
  price_level?: number
  // reviews は保存しない
  cached_at: Date
}
```

## 📝 実装チェックリスト

実装前に必ず確認：

- [ ] **Google Maps Platform サポートに問い合わせ**
  - [ ] 場所名・住所の保存期間制限を確認
  - [ ] レビュー保存の可否を確認
  - [ ] 写真参照の保存期間制限を確認
  - [ ] 書面での回答を取得

- [ ] **法務部門への確認**（企業の場合）
  - [ ] GDPR対応の確認
  - [ ] 個人情報保護法への対応確認
  - [ ] データ保持ポリシーの策定

- [ ] **実装の調整**
  - [ ] キャッシュTTLを30日に設定
  - [ ] レビューの保存を停止（または同意取得）
  - [ ] 定期的なクリーンアップを実装

- [ ] **監視・運用**
  - [ ] キャッシュヒット率の監視
  - [ ] APIコストの監視
  - [ ] 規約変更の定期的な確認

## 🔗 参考リンク

### 公式ドキュメント
- [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)
- [Maps Service Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms?hl=ja)
- [Places API Policies](https://developers.google.com/maps/documentation/places/web-service/policies?hl=ja)

### サポート
- [Google Maps Platform Support](https://cloud.google.com/maps-platform/support)
- [Stack Overflow - google-maps tag](https://stackoverflow.com/questions/tagged/google-maps)

## 📞 次のアクション

1. **今すぐ**: 公式の利用規約を熟読する
2. **1週間以内**: Google サポートに問い合わせる
3. **回答取得後**: 実装を調整する

⚠️ **重要**: この文書は参考情報です。最終的な判断は公式の利用規約と Google サポートの回答に基づいて行ってください。

