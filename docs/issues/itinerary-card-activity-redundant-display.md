# Itinerary Cardのアクティビティ表示の冗長性改善

## 問題

Itinerary Cardの下半分で、同じアクティビティ情報が3回表示されていた：
1. セレクトボックス（Primary CategoryとSecondary Category）
2. 「Selected:」の下に選択中のタグを表示
3. 説明文（2段階目が選択されている場合）

これらが冗長に表示され、UIが煩雑になっていた。

## 解決方法

1. **冗長な表示を削除**:
   - 「Selected:」の表示を削除
   - 説明文を削除
   - セレクトボックスのみを残す

2. **写真側にフロートアイコンを追加**:
   - アクティビティが選択されている場合、写真の右下にフロートでアイコンを1つだけ表示
   - 白背景＋半透明＋シャドウで視認性を確保
   - SVGアイコンを使用（`iconName`が設定されている場合のみ）

## 実装内容

### 1. `lib/data/activity-categories.ts`
- `getSecondaryCategoryIconName()`関数を追加
- SecondaryCategoryの`iconName`を取得する関数

### 2. `components/trip/ActivityTagSelector.tsx`
- 「Selected:」の表示を削除（130-137行目）
- 説明文を削除（140-145行目）
- セレクトボックスのみを残す

### 3. `components/trip/ScheduleCardImage.tsx`
- `activityIconName`プロップを追加
- 写真の右下にフロートアイコンを表示
- 白背景＋半透明＋シャドウで視認性を確保

### 4. `components/trip/ScheduleCard.tsx`
- `getSecondaryCategoryIconName`をインポート
- `ScheduleCardImage`に`activityIconName`プロップを渡す

## UI改善

### Before
- セレクトボックス
- 「Selected: 🏨 Lodging → 🔑 Check-in」
- 「Hotel/Accommodation check-in」

### After
- セレクトボックスのみ
- 写真の右下にフロートアイコン（🔑など）を1つだけ表示

## 動作確認

- ✅ 冗長な表示が削除されたことを確認
- ✅ 写真の右下にアイコンが表示されることを確認
- ✅ アイコンがない場合は表示されないことを確認
- ✅ アイコンの視認性が確保されていることを確認

