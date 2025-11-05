# POIDialog 日程追加ダイアログのi18n化と日付フォーマットの改善

## 問題

POIDialogの「旅程に追加」ボタンをクリックして表示される日程選択ダイアログが、以下の問題を抱えています：

1. **日本語文字列がハードコードされている**
   - "追加する日を選択" (447行目)
   - 日付の表示形式がロケールに依存していない

2. **日付フォーマットが現地ロケールに合わせていない**
   - `day.date` がそのまま表示されている（456行目）
   - ユーザーの言語設定に応じた日付フォーマットが適用されていない

## 現状

### 該当箇所

```typescript
// components/modals/POIDialog.tsx:447-456
<div className="text-xs font-medium text-gray-500 px-2 py-1 sticky top-0 bg-white border-b border-gray-100">
  追加する日を選択
</div>
<div className="max-h-[240px] overflow-y-auto scrollbar-hide">
  {availableDays.map((day) => (
    <button
      key={day.id}
      onClick={() => handleAddToDay(day.id)}
      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors"
    >
      <div className="font-medium text-gray-900">{day.date}</div>
      {day.title && (
        <div className="text-xs text-gray-600">{day.title}</div>
      )}
    </button>
  ))}
</div>
```

### 問題点

1. **"追加する日を選択"** がハードコードされている
2. **`day.date`** がそのまま表示されているため、ロケールに依存しない形式になっている
3. `availableDays` の `date` フィールドがどのような形式で渡されているか不明

## 解決策

### Phase 1: 文字列のi18n化

1. **i18nキーの追加**
   ```typescript
   // lib/i18n/index.ts
   'poi.daySelector.title': 'Select day to add'
   'poi.daySelector.title': '追加する日を選択'
   ```

2. **文字列の置き換え**
   ```typescript
   <div className="text-xs font-medium text-gray-500 px-2 py-1 sticky top-0 bg-white border-b border-gray-100">
     {t('poi.daySelector.title')}
   </div>
   ```

### Phase 2: 日付フォーマットの改善

1. **`availableDays` の形式確認**
   - `day.date` がどのような形式（ISO文字列、Dateオブジェクト、日本語フォーマットなど）かを確認
   - 親コンポーネント（`TripMap` や `TripPageLayout`）でどのように生成されているかを調査

2. **日付フォーマット関数の適用**
   ```typescript
   import { dateUtils } from '@/lib/utils/date'
   import { getUserLanguage } from '@/lib/utils/language'
   import { useAuth } from '@/lib/contexts/auth'
   
   // コンポーネント内
   const { user } = useAuth()
   const language = getUserLanguage(user)
   
   // 日付表示
   <div className="font-medium text-gray-900">
     {day.date 
       ? (() => {
           const date = typeof day.date === 'string' 
             ? new Date(day.date) 
             : day.date
           return dateUtils.formatDate(date, language)
         })()
       : day.date
     }
   </div>
   ```

3. **`dateUtils.formatDate` の確認**
   - 既存の `lib/utils/date.ts` に適切なフォーマット関数があるか確認
   - なければ、`toLocaleDateString` を使用してロケール対応の日付フォーマットを実装

### Phase 3: 曜日の表示（オプション）

日付と一緒に曜日も表示する場合：

```typescript
const date = typeof day.date === 'string' ? new Date(day.date) : day.date
const locale = language === 'ja' ? 'ja-JP' : 'en-US'
const formattedDate = date.toLocaleDateString(locale, {
  month: 'short',
  day: 'numeric',
  weekday: 'short'
})
```

## 実装手順

1. **調査**
   - `availableDays` がどこで生成されているか確認
   - `day.date` の形式を確認
   - 既存の日付フォーマット関数を確認

2. **i18nキーの追加**
   - `lib/i18n/index.ts` に `poi.daySelector.title` を追加

3. **文字列の置き換え**
   - "追加する日を選択" を `t('poi.daySelector.title')` に置き換え

4. **日付フォーマットの実装**
   - `getUserLanguage` を使用してユーザーの言語を取得
   - 日付をロケール対応の形式にフォーマット
   - `dateUtils` または `toLocaleDateString` を使用

5. **テスト**
   - 日本語環境で日付が正しく表示されることを確認
   - 英語環境で日付が正しく表示されることを確認
   - フィルタリングされた日付でも正しく表示されることを確認

## 受け入れ基準

- [ ] "追加する日を選択" がi18n化されている
- [ ] 日付がユーザーの言語設定に応じて正しくフォーマットされている
- [ ] 日本語環境では「1月1日 (月)」のような形式で表示される
- [ ] 英語環境では「Jan 1, Mon」のような形式で表示される
- [ ] 既存の機能（日程選択、フィルタリング）が正常に動作する

## 関連ファイル

- `components/modals/POIDialog.tsx` (447-456行目)
- `lib/i18n/index.ts` (i18nキーの追加)
- `lib/utils/date.ts` (日付フォーマット関数の確認・追加)
- `components/trip/TripMap.tsx` (availableDays の生成元を確認)

## ステータス

✅ **解決済み**（2025-11-05）

## 備考

- `availableDays` は `TripMap` や `TripPageLayout` から渡されている可能性が高い
- `day.date` の形式を確認してから適切なフォーマット関数を選択する必要がある
- 既存の `dateUtils.formatTripDateRange` や `formatFutureTripDate` などの関数を参考にする

