# 重複チェック結果 - コンポーネント/ユーティリティの棚卸し

**作成日**: 2025年10月19日

---

## ⚠️ 発見された重複

### 1. ティアドロップスタイル - **重複あり！**

#### 既存の実装箇所
1. ✅ `components/trip/ScheduleCard.tsx` - **統合済み**（globals.cssへ移動）
2. ❌ `components/trip/TripMap.tsx` - **重複あり！**（56-93行）

#### TripMap.tsx の問題

**現状**（56-93行、38行）:
```typescript
const teardropStyles = `
  .teardrop-marker {
    width: 30px;
    height: 30px;
    position: relative;
    background-color: #3B82F6;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .teardrop-marker:hover {
    transform: rotate(-45deg) scale(1.1);
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  }
  // ... さらに続く
`

// useEffectでDOMに注入（177-189行）
useEffect(() => {
  const styleElement = document.createElement('style')
  styleElement.textContent = teardropStyles
  document.head.appendChild(styleElement)
  // ...
}, [])
```

#### 問題点
1. **ScheduleCard.tsx と同じパターンが重複**
2. **クラス名が異なる**: 
   - ScheduleCard: `.teardrop-marker-left`
   - TripMap: `.teardrop-marker`
3. **スタイルが微妙に異なる**:
   - TripMap: `cursor: pointer`, `:hover`疑似クラスあり
   - ScheduleCard: `cursor`なし、`:hover`なし
4. **DOM注入が重複**（パフォーマンス悪化）

#### 改善案

**globals.css に統合**:
```css
/* マップ用ティアドロップマーカー */
.teardrop-marker {
  width: 30px;
  height: 30px;
  position: relative;
  background-color: #3B82F6;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.teardrop-marker:hover {
  transform: rotate(-45deg) scale(1.1);
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
}

.teardrop-marker.selected {
  background-color: #EF4444;
  transform: rotate(-45deg) scale(1.2);
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.teardrop-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  color: white;
  font-weight: bold;
  font-size: 12px;
  pointer-events: none;
}
```

**TripMap.tsx で削除**:
- インラインスタイル定義（38行）
- useEffectによるDOM注入（13行）

**削減見込み**: 51行

---

### 2. useClickOutside - **重複なし ✅**

#### 既存の実装
- ❌ プロジェクト内に既存のuseClickOutsideフックはなし
- ✅ 今回新規作成したものが初めて

#### 手動実装があった箇所（すべて置き換え済み）
- ✅ ScheduleCard.tsx → 削除済み
- ✅ PlaceSearchInput.tsx → 置き換え済み
- ✅ HomeHeader.tsx → 置き換え済み

**結論**: 重複なし、適切に統合されている

---

### 3. DragHandle - **重複なし ✅**

#### 既存の実装
- SortableItineraryCard.tsx: ScheduleCardにpropsとして渡すのみ（重複ではない）
- ImageUpload.tsx: react-dropzone使用（異なる用途）

**結論**: 重複なし

---

### 4. TeardropMarker - **用途が異なる**

#### 既存の実装
1. **ScheduleCard (左ペイン用)**: `.teardrop-marker-left`
   - 用途: スケジュールリストの番号表示
   - スタイル: hover効果なし、クリック不可
   
2. **TripMap (マップ用)**: `.teardrop-marker`
   - 用途: Google Maps上のマーカー
   - スタイル: hover効果あり、クリック可能

#### 判断
**TeardropMarkerコンポーネントは正しい設計**:
- `position` propsで 'left' | 'map' を切り替え
- 将来的にTripMapでも`<TeardropMarker position="map">`として使用可能

**ただし**: TripMapは現在、Google Maps APIで直接DOM要素を作成しているため、
Reactコンポーネントをそのまま使うのは困難。現状維持が妥当。

---

### 5. バリデーション関数 - **重複なし ✅**

#### 新規作成
- `time-validation.ts`: 時間のバリデーション/フォーマット
- `amount-validation.ts`: 金額のバリデーション/フォーマット

#### 既存のユーティリティ
- `date.ts`: **日付**のユーティリティ（異なる用途）
- `timezone.ts`: タイムゾーン**検出**のユーティリティ（異なる用途）
- `currency.ts`: 通貨**検出**と情報取得（異なる用途）
- `reservation-utils.ts`: 予約情報のバリデーション（異なる用途）

**結論**: 
- **重複なし**
- `time-validation` は **時刻（HH:mm）** のバリデーション
- `date.ts` は **日付（yyyy-mm-dd）** のフォーマット
- 用途が明確に分かれている ✅

---

### 6. TIMEZONE_OPTIONS - **重複なし ✅**

#### 新規作成
- `lib/data/timezone-options.ts`: タイムゾーン**選択肢**のデータ

#### 既存のユーティリティ
- `lib/utils/timezone.ts`: タイムゾーン**検出**と変換
- `lib/core/locations.ts`: 都市→タイムゾーンの**マッピング**

**結論**: 
- 用途が異なり重複なし
- `timezone-options.ts`: UI表示用の選択肢
- `timezone.ts`: 自動検出ロジック
- `locations.ts`: マッピングデータ

---

### 7. useItineraryEditor - **重複なし ✅**

#### 既存の実装
- ❌ プロジェクト内に既存の汎用更新フックはなし
- 各コンポーネントで個別に実装していた

**結論**: 重複なし、今回が初の統一的な更新管理フック

---

## 🚨 対応が必要な重複

### TripMap.tsx のティアドロップスタイル

**優先度**: 🔴 高  
**削減見込み**: 51行  
**所要時間**: 30分

#### 対応内容
1. `app/globals.css` に `.teardrop-marker` スタイルを追加
2. TripMap.tsx からインラインスタイル定義を削除（38行）
3. TripMap.tsx からuseEffectによるDOM注入を削除（13行）

---

## ✅ 重複がないもの

| アセット | 状態 | 備考 |
|---------|------|------|
| useClickOutside | ✅ 重複なし | 初の統一的な実装 |
| DragHandle | ✅ 重複なし | props渡しは重複ではない |
| TeardropMarker | ✅ 用途分離 | left/map で使い分け |
| time-validation | ✅ 重複なし | 時刻 vs 日付で分離 |
| amount-validation | ✅ 重複なし | 初の金額バリデーション |
| timezone-options | ✅ 重複なし | 選択肢 vs 検出で分離 |
| useItineraryEditor | ✅ 重複なし | 初の統一的な更新管理 |

---

## 📋 アクションアイテム

### 即座に対応すべき（30分）
- [ ] TripMap.tsxのティアドロップスタイルをglobals.cssへ移動
- [ ] TripMap.tsxのuseEffect削除

**効果**: 51行削減 + パフォーマンス向上

### 将来的に検討（オプション）
- [ ] TripMapでもTeardropMarkerコンポーネントを使えるようにする
  - Google Maps APIとReactコンポーネントの統合方法を検討
  - または、TeardropMarkerから純粋なDOM要素を生成するユーティリティを作成

---

## 🎯 結論

### 重複の評価
- **重大な重複**: 1件（TripMap.tsx のティアドロップスタイル）
- **軽微な重複**: なし
- **問題なし**: 7件

### 総合評価
**🟢 良好**: 今回作成したコンポーネント/フックは概ね重複なく、適切に設計されている。

TripMap.tsx の1件のみ対応すれば完璧！

---

**作成者**: AI Assistant  
**ステータス**: 重複チェック完了、1件の対応推奨

