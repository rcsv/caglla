# Google Places API Cache アーキテクチャ設計

## 🎯 概要

Google Places APIのコストを削減し、パフォーマンスを向上させるためのキャッシュシステム設計。

## 💰 コスト分析

### Google Places API料金
- **Place Details**: $17/1,000リクエスト
- **Place Photos**: $7/1,000リクエスト
- **Text Search**: $32/1,000リクエスト

### Firestore料金
- **読み取り**: $0.06/100,000ドキュメント
- **書き込み**: $0.18/100,000ドキュメント
- **ストレージ**: $0.18/GB/月

### コスト比較（1,000回のPOI詳細表示）

#### 毎回APIコール
- APIコール: $17
- **合計**: $17

#### Firestoreキャッシュ
- 初回APIコール: $17
- Firestore書き込み: $0.0018
- Firestore読み取り（999回）: $0.0006
- **合計**: $17.0024

**結論**: Firestoreキャッシュの方が圧倒的に安い！

## 🏗️ 推奨アーキテクチャ

### 1. Google Places API Cache（マスター）
```typescript
interface PlacesCache {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: { lat: number; lng: number }
  }
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  website?: string
  editorial_summary?: {
    overview: string
  }
  // メタデータ
  cached_at: Date
  last_accessed: Date
  access_count: number
}
```

### 2. Itineraries（参照）
```typescript
interface Itinerary {
  id: string
  day_id: string
  sort_number: number
  title: string
  description?: string
  location?: string
  place_id: string // PlacesCacheへの参照
  start_time?: string
  end_time?: string
  // ... その他のフィールド
}
```

## 🔄 データフロー

### POI詳細表示の流れ
1. **ユーザーがPOIをクリック**
2. **Itinerariesからplace_idを取得**
3. **PlacesCacheを検索**
   - キャッシュヒット → 即座に表示
   - キャッシュミス → Google Places APIを呼び出し → PlacesCacheに保存 → 表示
4. **アクセス統計を更新**

### Google Maps標準マーカークリックの流れ
1. **ユーザーがGoogle Maps標準マーカーをクリック**
2. **place_idを取得**
3. **PlacesCacheを検索**
   - キャッシュヒット → 即座に表示
   - キャッシュミス → Google Places APIを呼び出し → PlacesCacheに保存 → 表示

## 📊 実装戦略

### Phase 1: 基本的なキャッシュシステム
- PlacesCacheコレクションの作成
- 基本的なCRUD操作
- Itinerariesとの連携

### Phase 2: 高度な機能
- キャッシュの有効期限管理
- アクセス統計の収集
- 自動的な古いデータの削除

### Phase 3: 最適化
- バッチ処理による効率的なデータ更新
- 予測的なキャッシュ読み込み
- 分析ダッシュボード

## 🎯 メリット

### コスト削減
- **APIコールの大幅削減**: 同じPOIの重複アクセスでコスト削減
- **Firestoreの低コスト**: APIコールより圧倒的に安い

### パフォーマンス向上
- **即座のレスポンス**: キャッシュヒット時は瞬時に表示
- **ネットワーク負荷軽減**: APIコールの削減

### データの一貫性
- **統一されたデータソース**: すべてのPOI情報がPlacesCacheから
- **バージョン管理**: データの更新履歴を追跡可能

## ⚠️ 考慮事項

### データの鮮度
- **営業時間の更新**: リアルタイム性が必要な場合
- **評価の変動**: 定期的な更新が必要

### ストレージコスト
- **大量のPOIデータ**: ストレージコストの増加
- **画像データ**: 写真の保存方法（URL vs バイナリ）

### プライバシー・セキュリティ
- **ユーザーデータの分離**: マルチテナント対応
- **データの暗号化**: 機密情報の保護

## 🚀 実装優先度

### 高優先度
1. PlacesCacheコレクションの設計
2. 基本的なキャッシュロジック
3. Itinerariesとの連携

### 中優先度
1. キャッシュの有効期限管理
2. アクセス統計の収集
3. エラーハンドリングの強化

### 低優先度
1. 分析ダッシュボード
2. 予測的なキャッシュ読み込み
3. 高度な最適化機能

## 📈 期待される効果

### コスト削減
- **90%以上のAPIコール削減**: 人気のPOIの重複アクセス
- **月額コストの大幅削減**: 特にアクティブなユーザーが多い場合

### パフォーマンス向上
- **レスポンス時間の短縮**: キャッシュヒット時は100ms以下
- **ユーザー体験の向上**: スムーズなPOI情報表示

### スケーラビリティ
- **大量ユーザー対応**: コストの線形増加を回避
- **グローバル展開**: 各地域のPOIデータを効率的に管理
