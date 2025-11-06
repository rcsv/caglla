# Issue: iCal共有機能をBackpacker以上の機能として、Season TravelerではDisabled表示にする

**作成日**: 2025-11-05  
**解決日**: 2025-11-05  
**状態**: ✅ 解決済み  
**優先度**: 中  
**種類**: 機能追加  
**関連Issue**: 
- #43 (Trip Imageアップロード時の認証エラーとi18n問題)

---

## 📋 概要

iCalによるスケジュール共有・確認機能をBackpacker以上のプラン機能として制限し、Season Travelerの画面上ではiCal共有モードが表示されているがDisabled状態になるようにする。

---

## 🐛 現状の問題

### 現在の動作

1. Season Travelerでも、FloatingTitleBarのメニューから「Calendar Publish」が表示される
2. メニュー項目をクリックすると、`ICalPublishModal`が開く
3. `ICalPublishModal`内では、プランチェックが行われ、Season Travelerの場合に警告メッセージが表示される
4. 「Enable」ボタンは`disabled`状態になっているが、メニュー項目自体はクリック可能

### 期待される動作

- Season Travelerでも、iCal共有機能へのアクセス（メニュー項目）は表示される
- ただし、メニュー項目自体が`disabled`状態になり、クリックできない
- 視覚的にも、`disabled`状態であることが分かる（グレーアウトなど）
- Backpacker以上のプランでは、メニュー項目が有効になり、クリック可能

---

## 🔍 原因分析

### 現在の実装

#### 1. メニュー項目の定義（`app/[userSlug]/[tripSlug]/page.tsx`）

```typescript
{
  id: 'calendar-publish',
  label: t('trip.calendarPublish'),
  icon: 'mdi:calendar-sync',
  onClick: () => setShowICalPublishModal(true),
  // ❌ disabledプロパティが設定されていない
}
```

#### 2. API側のプランチェック（`app/api/trips/[tripSlug]/ical-token/route.ts`）

```typescript
// ✅ API側では既にプランチェックが実装されている
if (userPlan === 'season_traveler') {
  return NextResponse.json({ 
    error: 'iCal publishing requires Backpacker or higher plan',
    required_plan: 'backpacker'
  }, { status: 403 })
}
```

#### 3. モーダル内のプランチェック（`components/modals/ICalPublishModal.tsx`）

```typescript
// ✅ モーダル内でもプランチェックが実装されている
const isBackpackerOrHigher = userPlan !== 'season_traveler'

// ✅ ボタンはdisabledになっている
<Button
  onClick={handleEnable}
  disabled={isLoading || !isBackpackerOrHigher}
  // ...
/>
```

### 問題点

1. **メニュー項目のdisabled状態が未設定**
   - `FloatingTitleBar`の`menuItems`に`disabled`プロパティを設定できるが、現在は設定されていない
   - Season Travelerでもメニュー項目がクリック可能な状態

2. **プランチェックの場所**
   - API側とモーダル内でプランチェックが実装されているが、メニュー項目レベルでのチェックがない

3. **ユーザー体験**
   - メニュー項目をクリックしてモーダルを開くまで、プラン制限が分からない
   - メニュー項目自体がdisabledであれば、プラン制限が一目で分かる

---

## 💡 解決方針

### Phase 1: メニュー項目にプランチェックを追加

1. **プラン情報の取得**
   - `useSubscription`フックを使用して、現在のユーザープランを取得
   - `userPlan`が`'season_traveler'`の場合、メニュー項目を`disabled`にする

2. **メニュー項目の更新**
   - `calendar-publish`メニュー項目に`disabled`プロパティを追加
   - `disabled`の値は、プランチェックの結果に基づく

3. **視覚的フィードバック**
   - `FloatingTitleBar`コンポーネントで、`disabled`状態のメニュー項目が既にスタイリングされている
   - グレーアウト表示で、クリックできないことが分かる

### Phase 2: プラン制限の定義を追加

1. **RestrictionTypeの追加**
   - `lib/subscription/restriction.ts`に`ICAL_SHARING`を追加（必要に応じて）

2. **プラン設定の更新**
   - `PLAN_CONFIGS`に`ICAL_SHARING`の有効/無効を定義
   - Season Traveler: `false`
   - Backpacker以上: `true`

3. **プランチェック機能の追加**
   - `RestrictionProvider`に`hasICalSharing`メソッドを追加（必要に応じて）

---

## 🔗 関連ファイル

- `app/[userSlug]/[tripSlug]/page.tsx` - メニュー項目の定義（`calendar-publish`）
- `components/planner/FloatingTitleBar.tsx` - メニュー項目の表示（`disabled`プロパティのサポート）
- `components/modals/ICalPublishModal.tsx` - iCal共有モーダル（プランチェック実装済み）
- `app/api/trips/[tripSlug]/ical-token/route.ts` - iCalトークン生成API（プランチェック実装済み）
- `lib/contexts/subscription.tsx` - プラン情報の取得（`useSubscription`フック）
- `lib/subscription/restriction.ts` - プラン制限の定義（必要に応じて更新）

---

## 📝 技術的検討事項

### 現在のメニュー項目定義

```typescript
// app/[userSlug]/[tripSlug]/page.tsx
{
  id: 'calendar-publish',
  label: t('trip.calendarPublish'),
  icon: 'mdi:calendar-sync',
  onClick: () => setShowICalPublishModal(true),
}
```

### 改善案

```typescript
// app/[userSlug]/[tripSlug]/page.tsx
const { userPlan } = useSubscription()
const canUseICalSharing = userPlan !== 'season_traveler'

// ...
{
  id: 'calendar-publish',
  label: t('trip.calendarPublish'),
  icon: 'mdi:calendar-sync',
  onClick: () => setShowICalPublishModal(true),
  disabled: !canUseICalSharing, // ✅ プランチェックを追加
}
```

### FloatingTitleBarのdisabledサポート

`FloatingTitleBar`コンポーネントは既に`disabled`プロパティをサポートしています：

```typescript
// components/planner/FloatingTitleBar.tsx
<button
  disabled={item.disabled}
  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
    item.disabled 
      ? 'text-gray-400 cursor-not-allowed'  // ✅ グレーアウト表示
      : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none'
  }`}
>
```

### プラン制限の定義（オプション）

必要に応じて、`RestrictionType`に`ICAL_SHARING`を追加：

```typescript
// lib/subscription/restriction.ts
export enum RestrictionType {
  // ... 既存の定義
  ICAL_SHARING = 'ical_sharing'
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  [PlanId.SEASON_TRAVELER]: {
    // ...
    features_enabled: {
      // ...
      [RestrictionType.ICAL_SHARING]: false
    }
  },
  [PlanId.BACKPACKER]: {
    // ...
    features_enabled: {
      // ...
      [RestrictionType.ICAL_SHARING]: true
    }
  },
  // ...
}
```

---

## ✅ 完了条件

- [x] `app/[userSlug]/[tripSlug]/page.tsx`で、`calendar-publish`メニュー項目に`disabled`プロパティを追加
- [x] `useSubscription`フックを使用して、現在のユーザープランを取得
- [ ] Season Travelerの場合、メニュー項目が`disabled`状態になることを確認（動作確認待ち）
- [ ] Backpacker以上のプランでは、メニュー項目が有効になることを確認（動作確認待ち）
- [ ] メニュー項目の`disabled`状態が視覚的に分かる（グレーアウト表示）ことを確認（動作確認待ち）
- [ ] クリックできない状態になっていることを確認（動作確認待ち）
- [ ] （オプション）`RestrictionType`に`ICAL_SHARING`を追加して、プラン設定を明確化（未実装、優先度低）

---

## ✅ 解決内容（2025-11-05）

### 実装した変更

1. **`useSubscription`フックのインポート**
   - `app/[userSlug]/[tripSlug]/page.tsx`に`useSubscription`をインポート
   - `subscriptionStatus`から`userPlan`を取得（`subscriptionStatus.plan?.id || 'season_traveler'`）

2. **メニュー項目に`disabled`プロパティを追加**
   - `calendar-publish`メニュー項目に`disabled: userPlan === 'season_traveler'`を追加
   - Season Travelerの場合、メニュー項目が`disabled`状態になる

### 実装詳細

```typescript
// app/[userSlug]/[tripSlug]/page.tsx
const { subscriptionStatus } = useSubscription()
const userPlan = subscriptionStatus.plan?.id || 'season_traveler'

// ...

menuItems={[
  // ...
  {
    id: 'calendar-publish',
    label: t('trip.calendarPublish'),
    icon: 'mdi:calendar-sync',
    onClick: () => setShowICalPublishModal(true),
    disabled: userPlan === 'season_traveler', // ✅ 追加
  },
  // ...
]}
```

### 期待される動作

- **Season Traveler**: メニュー項目がグレーアウト表示され、クリックできない
- **Backpacker以上**: メニュー項目が有効になり、クリック可能

### 補足

- `FloatingTitleBar`コンポーネントは既に`disabled`プロパティをサポートしており、グレーアウト表示が実装済み
- API側とモーダル側のプランチェックは既に実装済みのため、メニュー項目レベルのチェックのみ追加
- `RestrictionType`への`ICAL_SHARING`追加は将来の改善として保留（優先度低）

---

## 🔍 デバッグ手順

1. **プラン情報の確認**
   - `useSubscription`フックで取得できる`userPlan`の値を確認
   - Season Traveler: `'season_traveler'`
   - Backpacker: `'backpacker'`
   - Globetrotter: `'globetrotter'`

2. **メニュー項目の状態確認**
   - Season Travelerでメニューを開き、`calendar-publish`項目がグレーアウト表示されているか確認
   - クリックできない状態になっているか確認

3. **プラン変更後の確認**
   - Backpacker以上のプランに変更後、メニュー項目が有効になるか確認
   - クリック可能になり、`ICalPublishModal`が開くか確認

---

## 📝 補足

### iCal共有機能の現在の制限

- API側: Backpacker以上のプランが必要（`app/api/trips/[tripSlug]/ical-token/route.ts`）
- モーダル側: Backpacker以上のプランが必要（`components/modals/ICalPublishModal.tsx`）
- メニュー項目: 現在は制限なし（本Issueで対応）

### プラン制限の統一

将来的には、プラン制限を`RestrictionType`で一元管理することを推奨します。これにより、プラン制限の追加・変更が容易になります。

### ユーザー体験の改善

- Season Travelerでも機能の存在を示す（メニュー項目を表示）
- プラン制限を明確に示す（disabled状態で視覚的に分かる）
- アップグレードを促す（モーダル内の警告メッセージ）

---

## 🔗 関連情報

- [Subscription System Documentation](docs/subscription/)
- [Plan Limits Documentation](docs/subscription/plan-limits.md)
- [iCal Sharing Feature](docs/features/ical-sharing.md)（存在する場合）

