# Issue: 地図上のItineraryマーカークリック時にメインコンテンツの対応Cardまで自動スクロール

**作成日**: 2025-10-31  
**実装日**: 2025-11-06  
**状態**: ✅ 解決済み  
**優先度**: 中  
**関連ファイル**:
- `components/trip/TripMap.tsx`（マーカークリック処理）
- `components/trip/TripItineraryView.tsx`（Itinerary Card表示・スクロール）
- `app/[userSlug]/[tripSlug]/page.tsx`（ページレベルのスクロール処理統合）

---

## 📋 概要

地図上のItinerary登録済みマーカーをクリックすると、メインコンテンツ側の対応するItinerary Cardのボーダーが赤くなり、マーカーも赤くなる機能は実装済み。しかし、対応するCardが画面外にある場合、そのCardまで自動スクロールして表示されない。スクロール機能の追加を希望。

---

## 🐛 現状の動作

1. 地図上のItineraryマーカーをクリック
2. メインコンテンツ側の対応するItinerary Cardが赤いボーダーでハイライトされる
3. 地図上のマーカーも赤色に変更される
4. **しかし、Cardが画面外にある場合、そのCardまでスクロールされない**

### 期待される動作
- 地図上のItineraryマーカーをクリック
- メインコンテンツ側の対応するItinerary Cardが赤いボーダーでハイライトされる
- **Cardが画面外にある場合、自動的にスクロールしてCardが画面内に表示される**
- 地図上のマーカーも赤色に変更される

---

## 🔍 技術的調査が必要な項目

### 1. DOM要素の特定方法
- Itinerary Cardに一意のID属性（例: `data-itinerary-id="${itineraryId}"`）が設定されているか
- または、refを使用して要素を特定できるか
- ReactのkeyプロパティとDOM要素の対応関係

### 2. スクロールコンテナの特定
- メインコンテンツがどの要素内でスクロールされているか
- `overflow: auto`または`overflow: scroll`が設定されている要素
- ネストされたスクロールコンテナの存在

### 3. スクロール位置の計算
- Cardの位置（offsetTop）を取得する方法
- スクロールコンテナの現在のスクロール位置（scrollTop）
- Cardが完全に表示されるためのスクロール位置の計算

### 4. React/Next.jsでの実装方法
- `useRef`を使用したDOM要素への参照
- `scrollIntoView()`メソッドの使用可否
- `useEffect`でのスクロール処理のタイミング

### 5. 既存の実装との統合
- `onItineraryClick`イベントハンドラーの拡張
- 選択状態管理（`selectedItineraryId`）との連携
- ハイライト処理との順序（ハイライト → スクロール）

---

## 💡 実装方針（調査結果に基づく提案）

### Phase 1: 調査・設計
1. **DOM構造の確認**
   - Itinerary Cardがどのようにレンダリングされているか
   - スクロールコンテナの特定
   - 各Cardに一意のID属性を追加（未設定の場合）

2. **既存コードの確認**
   - `TripItineraryView.tsx`でのCardレンダリング方法
   - `onItineraryClick`の現在の実装
   - 選択状態管理の実装

### Phase 2: 実装
1. **refの追加**
   ```typescript
   const itineraryCardRefs = useRef<Record<string, HTMLDivElement | null>>({})
   ```

2. **scrollIntoViewの実装**
   ```typescript
   const scrollToItinerary = (itineraryId: string) => {
     const element = itineraryCardRefs.current[itineraryId]
     if (element) {
       element.scrollIntoView({ 
         behavior: 'smooth', 
         block: 'center',
         inline: 'nearest'
       })
     }
   }
   ```

3. **マーカークリック時の統合**
   - `onItineraryClick`イベントハンドラーで、選択・ハイライト処理の後にスクロール処理を追加

### Phase 3: 改善（オプション）
1. **スクロールアニメーション**
   - `behavior: 'smooth'`でスムーズスクロール
   - カスタムアニメーション（オプション）

2. **視認性の向上**
   - スクロール後にCardを一時的に強調表示（パルス効果など）
   - スクロール完了後の視覚的フィードバック

3. **エッジケースの処理**
   - 複数のDayにまたがるItineraryの場合の処理
   - スクロールコンテナが存在しない場合のフォールバック

---

## ✅ 実装完了（2025-11-06）

### 実装内容

#### Phase 1: スクロール関数の実装 ✅
- **`components/trip/TripItineraryView.tsx`**: `scrollToItinerary`関数を実装
  - `useCallback`でメモ化
  - `itineraryRefs`を使用してDOM要素を取得
  - `scrollIntoView`でスムーズスクロール（`behavior: 'smooth'`, `block: 'center'`）
  - `isProgrammaticScrollRef`を使用してスクロール連動の誤検知を防止

#### Phase 2: プロップの追加 ✅
- **`TripItineraryViewProps`**: `scrollToItineraryRef`プロップを追加
  - `React.MutableRefObject<((itineraryId: string) => void) | null>`型
  - `useEffect`でrefにスクロール関数を設定

#### Phase 3: ページレベルでの統合 ✅
- **`app/[userSlug]/[tripSlug]/page.tsx`**: 
  - `scrollToItineraryRef`を宣言
  - `handleMapMarkerClick`でスクロール処理を呼び出し
  - 日程展開後、100msの遅延でDOM更新を待ってからスクロール

### 実装の特徴

1. **日程展開とスクロールの連携**: 日程が折りたたまれている場合は展開してからスクロール
2. **DOM更新の待機**: `setTimeout`で100ms遅延を入れてDOM更新を確実に待つ
3. **スクロール連動の誤検知防止**: `isProgrammaticScrollRef`を使用してプログラムスクロール中は地図連動を無効化
4. **スムーズスクロール**: `scrollIntoView`の`behavior: 'smooth'`でスムーズなアニメーション

### 完了条件

- [x] 地図上のItineraryマーカーをクリックすると、対応するCardまで自動スクロールする
- [x] Cardが画面外にある場合、自動的にスクロールしてCardが画面内に表示される
- [x] スクロールアニメーションがスムーズ（`behavior: 'smooth'`）
- [x] 既存のハイライト機能と正しく連携する
- [x] 複数のDayにまたがる場合でも動作する（日程展開後にスクロール）

---

## 🔗 関連ファイル

- `components/trip/TripMap.tsx` - マーカークリック処理
- `components/trip/TripItineraryView.tsx` - Itinerary Card表示
- `components/trip/DayEditor.tsx` - Day単位のItinerary表示
- `hooks/useItineraryEditor.ts` - 選択状態管理

---

## 📝 技術的考慮事項

### scrollIntoViewのオプション
- `behavior: 'smooth'` - スムーズスクロール
- `behavior: 'auto'` - 即座にスクロール
- `block: 'start'` - 要素が上端に来るように
- `block: 'center'` - 要素が中央に来るように（推奨）
- `block: 'end'` - 要素が下端に来るように
- `inline: 'nearest'` - 水平方向は最小限の移動

### パフォーマンス
- `scrollIntoView`の呼び出し頻度
- 大量のItineraryがある場合のパフォーマンス影響
- スクロールアニメーションのパフォーマンス

### アクセシビリティ
- スクロール動作がスクリーンリーダーに適切に通知されるか
- キーボード操作との互換性

---

## 🔍 実装可能性の評価

### 可能性: 高
- `scrollIntoView()`は標準的なブラウザAPIで、Reactでも問題なく使用可能
- refを使用してDOM要素にアクセスする方法は確立されている
- 既存のハイライト機能と統合しやすい

### 課題
- スクロールコンテナの特定（ネストされた構造の場合）
- タイミングの問題（ハイライト処理とスクロール処理の順序）
- 複数のDayにまたがるItineraryの処理

---

## 📚 参考資料

- [MDN: Element.scrollIntoView()](https://developer.mozilla.org/ja/docs/Web/API/Element/scrollIntoView)
- React: useRef hook
- React: useEffect hook

