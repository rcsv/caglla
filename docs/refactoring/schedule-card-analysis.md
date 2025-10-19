# ScheduleCard.tsx 詳細分析

## 📊 現在の構造分析

### 総行数: 1,252行

---

## 🔍 セクション別分析

### 1. インポートと定数定義（1-45行: 45行）
```typescript
// imports: 15行
// teardropStyles (ハードコード): 26行
```
**削減可能**: 26行
- ティアドロップスタイルをCSSファイルまたはコンポーネント化

---

### 2. Props定義（46-87行: 42行）
```typescript
interface ScheduleCardProps { ... }
```
**削減不可**: 必要なProps定義

---

### 3. State管理（89-126行: 38行）
```typescript
// 17個のuseState
// - isEditingDescription, description
// - isEditingTitle, title
// - startTime, endTime, isSaving
// - showMenu, showDaySelector, showDuplicateSelector
// - isExpanded, isEditingTime, tempStartTime, tempEndTime
// - destinationTimezone, userTimezone
// - isEditingCost, tempCostAmount, tempCostCurrency
// - showReservationModal
```
**削減可能**: 20行（カスタムフックに移行）
- `useInlineEditor`で4つのstateを2行に統合
- `useTimezoneState`で関連stateをグループ化

---

### 4. 予約情報の保存処理（129-156行: 28行）
```typescript
const handleReservationSave = async (reservation: ReservationInfo) => { ... }
```
**削減可能**: 20行（`useItineraryEditor`フックに統合）

---

### 5. メニュー外側クリック処理（159-191行: 33行）
```typescript
// 2つのuseEffect for menu handling
```
**削減可能**: 25行（`useClickOutside`カスタムフックに統合）

---

### 6. itinerary変更時の同期処理（194-214行: 21行）
```typescript
useEffect(() => { 
  // タイトル、時間、説明の同期
}, [itinerary.id, ...])
```
**削減可能**: 10行（`useItinerarySync`フックに統合）

---

### 7. タイムゾーン・通貨の自動取得（217-243行: 27行）
```typescript
// ブラウザタイムゾーン取得
// 場所からタイムゾーン自動取得
// 場所から通貨自動取得
```
**削減可能**: 20行（`useAutoDetectTimezone`、`useAutoDetectCurrency`フックに分離）

---

### 8. 画像キャッシュ処理（246-282行: 37行）
```typescript
const [cachedImage, setCachedImage] = useState<CachedImageInfo | null>(null)
const [imageLoading, setImageLoading] = useState(false)
const [photoUrl, setPhotoUrl] = useState<string | null>(null)

useEffect(() => {
  const loadImage = async () => { ... }
  loadImage()
}, [itinerary.place_data?.photos])
```
**削減可能**: 35行（`useScheduleCardImage`フックに統合）

---

### 9. タイトル編集ハンドラー（285-324行: 40行）
```typescript
const handleTitleClick = () => { ... }
const handleTitleSave = async () => { ... }
const handleTitleCancel = () => { ... }
```
**削減可能**: 35行（`useInlineEditor`フックに統合）

---

### 10. 説明編集ハンドラー（327-365行: 39行）
```typescript
const handleDescriptionClick = () => { ... }
const handleDescriptionSave = async () => { ... }
const handleDescriptionCancel = () => { ... }
```
**削減可能**: 35行（`useInlineEditor`フックに統合）

---

### 11. 時間・タイムゾーン更新（368-409行: 42行）
```typescript
const handleTimeUpdate = async (field: 'start_time' | 'end_time', value: string) => { ... }
const handleTimezoneUpdate = async (timezone: string) => { ... }
```
**削減可能**: 35行（`useItineraryEditor`フックに統合）

---

### 12. 通貨更新（412-431行: 20行）
```typescript
const handleCurrencyUpdate = async (currency: string) => { ... }
```
**削減可能**: 18行（`useItineraryEditor`フックに統合）

---

### 13. 時間編集処理（434-487行: 54行）
```typescript
const handleTimeEditStart = () => { ... }
const handleTimeSave = async () => { ... }
const handleTimeCancel = () => { ... }
const isValidTimeFormat = (time: string) => { ... }
```
**削減可能**: 45行
- バリデーション: `lib/utils/time-validation.ts`へ
- 編集ロジック: `useInlineEditor`フックへ

---

### 14. 費用編集処理（489-541行: 53行）
```typescript
const handleCostEditStart = () => { ... }
const handleCostSave = async () => { ... }
const handleCostCancel = () => { ... }
const isValidAmount = (amount: string) => { ... }
```
**削減可能**: 45行
- バリデーション: `lib/utils/amount-validation.ts`へ
- 編集ロジック: `useInlineEditor`フックへ

---

### 15. メニュー操作ハンドラー（544-571行: 28行）
```typescript
const handleMenuAction = (action: string) => { ... }
```
**削減可能**: 20行（`ScheduleCardMenu`コンポーネントに移動）

---

### 16. 日程選択・複製処理（574-635行: 62行）
```typescript
const handleDaySelect = async (targetDayId: string) => { ... }
const handleDuplicateSelect = async (targetDayId: string) => { ... }
```
**削減可能**: 50行（`ScheduleCardMenu`コンポーネントに移動）

---

### 17. フィルタリング・表示ロジック（638-658行: 21行）
```typescript
const filteredDaysForMove = availableDays.filter(...)
const filteredDaysForDuplicate = availableDays
const shouldTruncate = description.length > MAX_CHARS
const displayText = shouldTruncate && !isExpanded ? ... : ...
const toggleExpanded = () => { ... }
const formatTimeForDisplay = (time: string): string => { ... }
```
**削減可能**: 15行
- `formatTimeForDisplay`: `lib/utils/time-validation.ts`へ
- 説明文の展開ロジック: `ExpandableText`コンポーネントへ

---

### 18. JSX: メインコンテナ（660-680行: 21行）
```typescript
return (
  <div className="relative overflow-visible" id={`itinerary-${itinerary.id}`}>
    <div className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 ...">
      {/* ドラッグハンドル */}
      {/* マーカー */}
      {/* カード本体 */}
    </div>
  </div>
)
```
**削減不可**: 必要な構造

---

### 19. JSX: ドラッグハンドル（670-681行: 12行）
```typescript
{dragHandleProps && (
  <div {...dragHandleProps.attributes} {...dragHandleProps.listeners} className="...">
    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
      <path d="..." />
    </svg>
  </div>
)}
```
**削減可能**: 10行（`DragHandle`コンポーネントに抽出）

---

### 20. JSX: ティアドロップマーカー（684-690行: 7行）
```typescript
<div className="relative mt-3">
  <div className={`teardrop-marker-left ${isSelected ? 'selected' : ''}`}>
    <div className="teardrop-label-left">
      {displayNumber || itinerary.sort_number}
    </div>
  </div>
</div>
```
**削減可能**: 5行（`TeardropMarker`コンポーネントに抽出）

---

### 21. JSX: カード画像（696-742行: 47行）
```typescript
<div className="flex-shrink-0 w-32 h-18 relative">
  {photoUrl ? (
    <>
      <img src={photoUrl} alt={itinerary.title} ... />
      {/* キャッシュインジケーター */}
      {/* ローディングインジケーター */}
    </>
  ) : (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      {/* プレースホルダー */}
    </div>
  )}
</div>
```
**削減可能**: 45行（`ScheduleCardImage`コンポーネントに抽出）

---

### 22. JSX: タイトル編集（747-778行: 32行）
```typescript
<div className="flex items-center space-x-2 mb-3">
  {isEditingTitle ? (
    <input ref={titleRef} value={title} onChange={...} ... />
  ) : (
    <h4 className="..." onClick={handleTitleClick}>
      {itinerary.title}
    </h4>
  )}
  {/* Star Rating */}
</div>
```
**削減可能**: 25行（`InlineTitleEditor`コンポーネントに抽出）

---

### 23. JSX: 説明編集（781-830行: 50行）
```typescript
<div className="mb-4">
  {isEditingDescription ? (
    <textarea ref={descriptionRef} value={description} ... />
  ) : (
    <div onClick={handleDescriptionClick} className="...">
      {description ? (
        <div>
          <div className="whitespace-pre-wrap">{displayText}</div>
          {shouldTruncate && (
            <button onClick={toggleExpanded} ...>
              {isExpanded ? '折りたたむ' : '続きを読む'}
            </button>
          )}
        </div>
      ) : (
        <span className="text-gray-400 italic">...</span>
      )}
    </div>
  )}
</div>
```
**削減可能**: 45行（`InlineDescriptionEditor`コンポーネントに抽出）

---

### 24. JSX: 時間編集フォーム（833-917行: 85行）
```typescript
{isEditingTime ? (
  <div className="space-y-2">
    {/* 開始時間・終了時間入力 */}
    {/* タイムゾーン選択（877-893行のハードコード） */}
    {/* 保存・キャンセルボタン */}
    {/* バリデーションエラー */}
  </div>
) : ...}
```
**削減可能**: 80行（`InlineTimeEditor`コンポーネントに抽出）

---

### 25. JSX: 費用編集フォーム（918-974行: 57行）
```typescript
{isEditingCost ? (
  <div className="space-y-2">
    {/* 金額入力 */}
    {/* 通貨選択（945-950行） */}
    {/* 保存・キャンセルボタン */}
    {/* バリデーションエラー */}
  </div>
) : ...}
```
**削減可能**: 55行（`InlineCostEditor`コンポーネントに抽出）

---

### 26. JSX: 情報表示（976-1031行: 56行）
```typescript
<div className="flex items-center space-x-4">
  {/* 時間要素 */}
  <div className="flex items-center space-x-1">
    <IconRenderer iconName="clock" ... />
    <span onClick={handleTimeEditStart}>...</span>
  </div>
  
  {/* 費用要素 */}
  <div className="flex items-center space-x-1">
    <IconRenderer iconName="money" ... />
    <span onClick={handleCostEditStart}>...</span>
  </div>
  
  {/* 予約要素 */}
  <div className="flex items-center space-x-1">
    <IconRenderer iconName="reservation" ... />
    <span onClick={...}>予約</span>
  </div>
</div>
```
**削減可能**: 50行（`ScheduleInfoDisplay`コンポーネントに抽出）

---

### 27. JSX: アクティビティタグ（1035-1061行: 27行）
```typescript
<div className="mb-4 px-2">
  <ActivityTagSelector
    currentTag={itinerary.activity_tag}
    onTagChange={async (tag) => { ... }}
  />
</div>
```
**削減可能**: 20行（ハンドラーを`useItineraryEditor`フックに統合）

---

### 28. JSX: ハンバーガーメニュー（1064-1228行: 165行）
```typescript
<div className="flex-shrink-0 p-4">
  <div className="relative" ref={menuRef}>
    <button onClick={() => setShowMenu(!showMenu)}>...</button>
    
    {showMenu && (
      <div className="fixed bg-white rounded-md shadow-lg ...">
        {/* 上に移動 */}
        {/* 下に移動 */}
        {/* 別の日程に移動 + カスケードメニュー */}
        {/* 別の日程に複製 + カスケードメニュー */}
        {/* 予約情報 */}
        {/* 削除 */}
      </div>
    )}
  </div>
</div>
```
**削減可能**: 160行（`ScheduleCardMenu`コンポーネントに抽出）

---

### 29. JSX: 接続点（1232-1237行: 6行）
```typescript
<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
  <svg width="8" height="12" viewBox="0 0 8 12" className="text-gray-300">
    <path d="..." fill="currentColor"/>
  </svg>
</div>
```
**削減可能**: 5行（`TeardropConnector`コンポーネントに抽出、または不要なら削除）

---

### 30. JSX: 予約情報モーダル（1240-1249行: 10行）
```typescript
<ReservationInfoModal
  isOpen={showReservationModal}
  onClose={() => setShowReservationModal(false)}
  onSave={handleReservationSave}
  ...
/>
```
**削減不可**: 必要なモーダル

---

## 📊 削減可能箇所のサマリー

| セクション | 現在の行数 | 削減可能行数 | 削減後 | 移動先 |
|-----------|----------|------------|--------|--------|
| ティアドロップスタイル | 26 | 26 | 0 | `TeardropMarker.tsx` |
| State管理 | 38 | 20 | 18 | カスタムフック |
| 予約保存処理 | 28 | 20 | 8 | `useItineraryEditor` |
| メニュー外側クリック | 33 | 25 | 8 | `useClickOutside` |
| 同期処理 | 21 | 10 | 11 | `useItinerarySync` |
| 自動検出 | 27 | 20 | 7 | `useAutoDetect*` |
| 画像キャッシュ | 37 | 35 | 2 | `useScheduleCardImage` |
| タイトル編集 | 40 | 35 | 5 | `useInlineEditor` |
| 説明編集 | 39 | 35 | 4 | `useInlineEditor` |
| 時間・TZ更新 | 42 | 35 | 7 | `useItineraryEditor` |
| 通貨更新 | 20 | 18 | 2 | `useItineraryEditor` |
| 時間編集処理 | 54 | 45 | 9 | `useInlineEditor` + utils |
| 費用編集処理 | 53 | 45 | 8 | `useInlineEditor` + utils |
| メニュー操作 | 28 | 20 | 8 | `ScheduleCardMenu` |
| 日程選択・複製 | 62 | 50 | 12 | `ScheduleCardMenu` |
| フィルタリング | 21 | 15 | 6 | utils + components |
| ドラッグハンドル | 12 | 10 | 2 | `DragHandle` |
| マーカー | 7 | 5 | 2 | `TeardropMarker` |
| 画像 | 47 | 45 | 2 | `ScheduleCardImage` |
| タイトル | 32 | 25 | 7 | `InlineTitleEditor` |
| 説明 | 50 | 45 | 5 | `InlineDescriptionEditor` |
| 時間編集フォーム | 85 | 80 | 5 | `InlineTimeEditor` |
| 費用編集フォーム | 57 | 55 | 2 | `InlineCostEditor` |
| 情報表示 | 56 | 50 | 6 | `ScheduleInfoDisplay` |
| アクティビティタグ | 27 | 20 | 7 | ハンドラー統合 |
| メニュー | 165 | 160 | 5 | `ScheduleCardMenu` |
| 接続点 | 6 | 5 | 1 | `TeardropConnector` |
| **合計** | **1,013** | **879** | **134** | - |

※ Props定義、メインコンテナ、モーダル等の削減不可部分を除く

---

## 🎯 リファクタリング後の予想構造

```
ScheduleCard.tsx (約550-600行)
├─ imports (20行)
├─ Props定義 (40行)
├─ カスタムフック呼び出し (30行)
├─ 残りのハンドラー (50行)
├─ JSX構造 (350-400行)
│  ├─ メインコンテナ (20行)
│  ├─ DragHandle (2行)
│  ├─ TeardropMarker (2行)
│  ├─ カード本体 (320-370行)
│  │  ├─ ScheduleCardImage (2行)
│  │  ├─ メインコンテンツ (250-300行)
│  │  │  ├─ InlineTitleEditor (7行)
│  │  │  ├─ InlineDescriptionEditor (5行)
│  │  │  ├─ 条件分岐 (10行)
│  │  │  │  ├─ InlineTimeEditor (5行)
│  │  │  │  ├─ InlineCostEditor (2行)
│  │  │  │  └─ ScheduleInfoDisplay (6行)
│  │  │  └─ ActivityTagSelector (7行)
│  │  └─ ScheduleCardMenu (5行)
│  └─ ReservationInfoModal (10行)
└─ 閉じタグ (10行)
```

---

## ✅ 結論

**現在**: 1,252行
**削減可能**: 約700行（56%削減）
**リファクタリング後**: 約550-600行

### 最も効果的な施策トップ5

1. **ScheduleCardMenuの分離**: 160行削減
2. **InlineTimeEditorの分離**: 80行削減
3. **InlineCostEditorの分離**: 55行削減
4. **ScheduleInfoDisplayの分離**: 50行削減
5. **ScheduleCardImageの分離**: 45行削減

これら5つだけで**390行（31%）の削減**が可能です。

