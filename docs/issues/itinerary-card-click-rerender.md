# Issue: ItineraryCard編集時の不要な再描画

**作成日**: 2025-11-24  
**状態**: 🔍 調査中  
**優先度**: 中  
**関連ファイル**:
- `components/trip/ScheduleCard.tsx`（ItineraryCardコンポーネント）
- `app/(planner)/[userSlug]/[tripSlug]/@timeline/default.tsx`（編集ハンドラー）
- `app/(planner)/[userSlug]/[tripSlug]/@map/default.tsx`（POIDialog表示）
- `components/modals/POIDialog.tsx`（POI詳細ダイアログ）
- `app/(planner)/[userSlug]/[tripSlug]/TripProvider.tsx`（Trip状態管理）

---

## 📋 概要

ItineraryCard（ScheduleCard）内部の**編集操作**（アクティビティ選択、時間設定、コスト設定、予約設定）を行うだけで、POIDialogの再描画が発生し、不要なAPIリクエスト（`/api/places/details`、`/api/venue/aggregate`）が実行される問題。

同じ`placeId`のItineraryCardで以下の操作を行っても、POIDialogが再描画され、データ再取得が発生する：
- **アクティビティタグの変更**（ActivityTagSelector）
- **時間の設定**（InlineTimeEditor）
- **コストの設定**（InlineCostEditor）
- **予約情報の設定**（ReservationInfoModal）

---

## 🎯 動作サマリー（3行要約）

1. **ItineraryCardの「編集」** → TripProviderの`trip`全体が更新される
2. **`trip.days`の参照が毎回変わる** → `availableDays`が再計算される
3. **POIDialogに新しいpropsが渡る** → `placeId`が変わらなくても再-fetchが発生

---

## 🔍 根本原因（Root Cause）

### ひとことで表すと：

> **TripProviderが"Model全体の状態 + 個別のItinerary編集"を両方持っているため、局所的な更新でも`trip`全体が新しい参照になってしまう構造がボトルネック**

### 詳細説明

TripProviderは以下の責務を同時に持っている：

1. **Trip全体の構造的状態**（`days`の構造・位置・順番、`trip`の基本情報）
2. **個別Itineraryの編集状態**（`activity_tag`、`start_time`、`cost_amount`、`reservation`など）

これにより、**局所的なItinerary編集**（`activity_tag`の変更など）でも、`trip`オブジェクト全体が新しい参照で作成され、TripProviderに依存するすべてのコンポーネント（POIDialog含む）が再レンダリングされる。

**特に問題なのは**：
- これらの編集操作は`trip.days`の構造には影響しない
- しかし`trip.days`の参照が変わるため、`availableDays`の`useMemo`が再計算される
- POIDialogに新しいpropsが渡され、`placeId`が同じでも再-fetchが発生する

---

## 🔄 詳細フロー

```
編集操作（アクティビティ/時間/コスト/予約）
  ↓
updateField/updateFields('field', value)
  ↓
useItineraryEditor: updateField/updateFields()
  ├─ PUT /api/itineraries/${itinerary.id}
  └─ onUpdate?.(updated)                  // 更新されたItineraryを返す
      ↓
ScheduleCard: onUpdate(updatedItinerary)
  ↓
TripItineraryView: onScheduleUpdated(updatedItinerary)
  ↓
@timeline/default.tsx: handleScheduleUpdated(updatedItinerary)
  └─ updateTrip(prevTrip => { ... })      // ⚠️ TripProviderのtrip全体を更新
      ↓
TripProvider: setTrip(updatedTrip)        // ⚠️ trip全体が新しい参照になる
  ↓
@map/default.tsx: tripが更新される
  ├─ availableDaysのuseMemoが再計算される  // ⚠️ trip.daysの参照が変わったため
  └─ POIDialogに新しいpropsが渡される
      ↓
POIDialog: useEffect ([currentPlaceId, fetchPlaceDetails])
  └─ fetchPlaceDetails()                 // ⚠️ APIリクエスト実行（不要）
```

**影響を受ける操作**:
- `activity_tag`の更新（`updateField('activity_tag', tag)`）
- `start_time`/`end_time`/`timezone`の更新（`updateFields({ start_time, end_time, timezone })`）
- `cost_amount`/`cost_currency`の更新（`updateFields({ cost_amount, cost_currency })`）
- `reservation`の更新（`updateField('reservation', reservation)`）

---

## 🐛 再現手順

1. 旅行プランページで、ItineraryCard（ScheduleCard）をクリックしてPOIDialogを表示
2. POIDialogが表示された状態で、同じItineraryCard内で以下のいずれかの操作を行う：
   - ActivityTagSelectorでアクティビティタグを変更
   - InlineTimeEditorで時間を設定
   - InlineCostEditorでコストを設定
   - ReservationInfoModalで予約情報を設定
3. POIDialogが再描画され、APIリクエストが再実行される（ログで確認可能）

---

## 💡 解決策

### ⚠️ 重要: 根本原因への対処を優先

本Issueの目的は **「TripProviderの責務過剰の排除」** です。以下の3つの対策を優先順位順に実装することを推奨します。

---

### 1. Structural Fix（最重要）: POIDialogをTripProvider依存から切り離す

**目的**: POIDialogがTripの変更に影響されないようにする

**実装方針**:
```typescript
// POIDialogはTripProviderに依存せず、placeIdのみに依存
interface POIDialogProps {
  poiData: POIData | null
  onClose: () => void
  // availableDaysは削除
  // 必要に応じて、POIDialog内でTripProviderから直接取得（ただし、tripの変更に依存しない）
}

// POIDialog内で
// trip.daysから直接計算するが、tripの変更に依存しない構造にする
// または、availableDaysを別のProviderから取得
```

**メリット**: 
- **最重要**: Tripの変更がPOIDialogに伝播しない
- POIDialogの独立性が上がる
- 実装コストは中程度

**実装場所**:
- `components/modals/POIDialog.tsx`
- `app/(planner)/[userSlug]/[tripSlug]/@map/default.tsx`

---

### 2. Architectural Fix（長期）: Itinerary編集の状態をTripProviderから分離

**目的**: Itinerary編集の状態をTripProviderから切り離し、Trip全体の更新を防ぐ

**実装方針**:
```typescript
// ItineraryEditor用の別Providerを作成
// TripProviderとは独立した状態管理
const ItineraryEditorProvider = ({ children }) => {
  const [itineraryStates, setItineraryStates] = useState<Map<string, Partial<Itinerary>>>(new Map())
  
  const updateItineraryField = useCallback((itineraryId: string, field: keyof Itinerary, value: any) => {
    setItineraryStates(prev => {
      const next = new Map(prev)
      const current = next.get(itineraryId) || {}
      next.set(itineraryId, { ...current, [field]: value })
      return next
    })
    // ⚠️ TripProviderを更新しない
  }, [])
  
  return (
    <ItineraryEditorContext.Provider value={{ itineraryStates, updateItineraryField }}>
      {children}
    </ItineraryEditorContext.Provider>
  )
}
```

**理想的な構造**:
```
TripProvider → "構造的状態のみ"
  ├─ daysの構造・位置・順番
  └─ tripの基本情報（title, destination等）

ItineraryEditorProvider → "編集に必要なミニマム状態"
  ├─ 編集中のitineraryの状態
  └─ 楽観的更新（TripProviderとは独立）

POIProvider → "placeIdに依存する状態"
  ├─ POIデータ
  └─ キャッシュ

URL → "現在のplaceIdなどUIのstate"
  ├─ selectedItineraryId
  └─ mapFocusMode
```

**メリット**: 
- **根本的解決**: TripProviderの責務過剰を解消
- 局所的な更新がTrip全体に影響しない
- 変更が伝播する範囲を狭められる

**デメリット**: 
- 大規模なリファクタリングが必要
- 実装コストが高い

**実装場所**:
- `app/(planner)/[userSlug]/[tripSlug]/ItineraryEditorProvider.tsx`（新規作成）
- `app/(planner)/[userSlug]/[tripSlug]/TripProvider.tsx`（責務の縮小）
- `components/trip/ScheduleCard.tsx`（ItineraryEditorProviderを使用）

---

### 3. Immediate Fix（応急処置）: POIキャッシュの実装

**目的**: 症状を緩和する（根本的な解決ではない）

**実装方針**:
```typescript
// placeId + versionでキャッシュ
const poiCache = useRef(new Map<string, { data: any, timestamp: number }>())
const CACHE_TTL = 5 * 60 * 1000 // 5分

const fetchPlaceDetails = useCallback(async () => {
  if (!poiData || !currentPlaceId) return
  
  // キャッシュチェック
  const cached = poiCache.current.get(currentPlaceId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('✅ Using cached POI data')
    setPlaceDetails(cached.data.placeDetails)
    setAggregatedData(cached.data.aggregatedData)
    setUnifiedReviews(cached.data.unifiedReviews)
    return
  }
  
  // キャッシュがない場合のみAPIリクエスト
  // ... 既存の処理 ...
  
  // キャッシュに保存
  poiCache.current.set(currentPlaceId, {
    data: { placeDetails, aggregatedData, unifiedReviews },
    timestamp: Date.now()
  })
}, [currentPlaceId, poiData])
```

**メリット**: 
- **即効性が高い**: Trip更新でPOIデータは変わらないため、キャッシュで再取得を防げる
- 実装が簡単
- React Queryを使っている場合は一発で実装可能

**デメリット**: 
- **あくまで応急処置**: 根本的な解決ではない
- 再描画は発生する（再-fetchだけが防げる）
- キャッシュの無効化ロジックが必要（ただし、POIデータは滅多に変わらないため問題ない）

**実装場所**:
- `components/modals/POIDialog.tsx`

---

## 🎯 実装優先順位

### 推奨される実装順序

1. **Structural Fix（最重要）**: POIDialogをTripProvider依存から切り離す
   - 実務インパクトが最も大きい
   - 実装コストは中程度
   - 他の対策の前提条件にもなる

2. **Architectural Fix（長期）**: Itinerary編集の状態をTripProviderから分離
   - 根本的な解決策
   - Structural Fixとセットで実装すると効果が高い
   - 実装コストは高いが、長期的な保守性が向上

3. **Immediate Fix（応急処置）**: POIキャッシュの実装
   - 即効性はあるが、根本的な解決ではない
   - Structural FixとArchitectural Fixを実装するまでの間の緩和策として使用

---

## 📝 実装時の注意点

### ✅ 推奨されるアプローチ

1. **データ構造とUIの関係を分離する**: 
   - TripProvider: 構造的な情報のみ
   - ItineraryEditor: 編集に必要なミニマム状態
   - POIDialog: placeIdに依存する状態

2. **Providerの粒度を細かくする**: 
   - 巨大なTripProviderを分割
   - 変更が伝播する範囲を狭める

3. **変更が伝播する範囲を狭める**: 
   - 1箇所変わっても全画面が動く状態を防ぐ
   - 必要な部分のみを更新

4. **キャッシュできるものはキャッシュする**: 
   - POIデータは滅多に変わらないため、キャッシュで再取得を防ぐ
   - React Queryを使っている場合は一発で実装可能

5. **更新タイプの識別**: 
   - **非構造的更新**（`activity_tag`、`start_time`/`end_time`、`cost_amount`/`cost_currency`、`reservation`）: `days`の構造に影響しない
   - **構造的更新**（`itineraries`の追加/削除、`days`の追加/削除）: `days`の構造が変わる

6. **デバッグ**: 
   - ログを追加して、再描画の原因を特定しやすくする
   - React DevToolsのProfilerを使用して、再レンダリングの原因を特定

---

## 🔗 関連Issue

- [POIDialogの不要な再取得問題](./poi-dialog-unnecessary-refetch.md)（既に修正済み）
- [Parallel Routes実装計画](../refactoring/planner-parallel-routes-plan.md)

---

## 📚 参考資料

### 生成AIからの提案

本Issueの調査中、生成AIから以下の重要な指摘を受けました：

> "If your global state contains a small village — every sneeze becomes an earthquake."
> 
> TripProviderが巨大すぎて、1箇所変わると全画面が動く状態になっている。

### React的ベストプラクティス

- データ構造とUIの関係を分離する
- Providerの粒度を細かくする
- 変更が伝播する範囲を狭める
- キャッシュできるものはキャッシュする

この4つを守ると、自然とPOIDialogの再描画問題は消えていく。

### 参考リンク

- [React useCallback and useMemo](https://react.dev/reference/react/useCallback)
- [Next.js Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Custom Events API](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
