# v3.0.0 実装着手順序（テストファースト）

## 📋 概要

v3.0.0のリファクタリングを**テストファースト**で進めるための着手順序とテスト戦略を定義します。

---

## 🎯 テスト戦略（E2Eなしでも可能な方法）

### 1. **ユニットテスト**（最優先）

**対象:**
- ビジネスロジック関数
- 権限チェック関数
- データ変換関数
- バリデーション関数

**テストツール:**
- Jest（既に設定済み）
- `@testing-library/jest-dom`

**例:**
```typescript
// lib/auth/permissions.test.ts
describe('canView', () => {
  it('should allow viewing public trips', () => {
    expect(canView({ access_level: 'public' }, null)).toBe(true)
  })
  
  it('should deny viewing private trips for non-owners', () => {
    expect(canView({ access_level: 'private', user_id: 'user1' }, 'user2')).toBe(false)
  })
})
```

---

### 2. **インテグレーションテスト**（API Routes）

**対象:**
- API Routes（Next.js Route Handlers）
- Firestore操作の統合テスト

**テストツール:**
- Jest（既に設定済み）
- Firestore エミュレータ（推奨）
- `@firebase/rules-unit-testing`（セキュリティルールテスト）

**例:**
```typescript
// app/api/social/__tests__/like.test.ts
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'

describe('POST /api/social/like', () => {
  let testEnv: RulesTestEnvironment
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId: 'test-project' })
  })
  
  it('should toggle like successfully', async () => {
    const response = await POST('/api/social/like', {
      tripId: 'trip1',
      userId: 'user1'
    })
    expect(response.status).toBe(200)
    expect(response.json().liked).toBe(true)
  })
})
```

---

### 3. **コンポーネントテスト**（React Testing Library）

**対象:**
- UIコンポーネント
- インタラクションロジック
- 状態管理

**テストツール:**
- Jest + React Testing Library（既に設定済み）
- `@testing-library/user-event`

**例:**
```typescript
// components/social/__tests__/LikeButton.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LikeButton } from '../LikeButton'

describe('LikeButton', () => {
  it('should toggle like on click', async () => {
    const user = userEvent.setup()
    const onToggle = jest.fn()
    
    render(<LikeButton liked={false} count={10} onToggle={onToggle} />)
    
    const button = screen.getByRole('button', { name: /10/i })
    await user.click(button)
    
    expect(onToggle).toHaveBeenCalledWith(true)
  })
})
```

---

### 4. **Firestore エミュレータテスト**（推奨）

**対象:**
- Firestoreトランザクション
- セキュリティルール
- データ整合性

**テストツール:**
- Firebase Emulator Suite
- `@firebase/rules-unit-testing`

**セットアップ:**
```bash
# firebase.json にエミュレータ設定を追加
{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "auth": {
      "port": 9099
    }
  }
}
```

**テスト例:**
```typescript
// lib/firebase/__tests__/social-operations.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

describe('toggleLike transaction', () => {
  it('should increment likes_count atomically', async () => {
    const testEnv = await initializeTestEnvironment({ projectId: 'test' })
    const db = testEnv.authenticatedContext('user1').firestore()
    
    await db.collection('trips').doc('trip1').set({
      social_stats: { likes_count: 5 }
    })
    
    await toggleLike('user1', 'trip1', db)
    
    const trip = await db.collection('trips').doc('trip1').get()
    expect(trip.data()?.social_stats.likes_count).toBe(6)
  })
})
```

---

### 5. **モックを使ったテスト**（外部API依存の場合）

**対象:**
- Google Maps API呼び出し
- 外部サービス統合

**テストツール:**
- Jest Mocks
- MSW (Mock Service Worker) - より高度な場合

---

## 🚀 推奨着手順序（テストファースト）

### **Phase 0: テスト基盤整備**（1週間）

1. **Firestore エミュレータ設定**
   - `firebase.json` にエミュレータ設定追加
   - テスト用Firestoreクライアント作成
   - CI/CDでのエミュレータ実行設定

2. **テストヘルパー整備**
   - `lib/__tests__/helpers/` ディレクトリ作成
   - Firestoreテストヘルパー作成
   - 認証テストヘルパー作成
   - モックデータファクトリー作成

3. **テストカバレッジ設定**
   - カバレッジ目標設定（80%以上）
   - カバレッジレポート確認

---

### **Phase 1-1: 型定義と権限管理**（1週間）✅

**テストファーストで進める:**

1. **型定義追加** ✅
   - `lib/core/types/social.ts` に SNS関連型を追加 ✅
   - 識別子型システム（`UserId`, `UserSlug`, `TripId`, `TripSlug`）実装 ✅
   - 型テスト（TypeScriptの型チェックで十分）✅

2. **権限管理システム実装** ✅
   ```bash
   # 1. テストを先に書く ✅
   lib/core/__tests__/permissions.test.ts
   
   # 2. 実装する ✅
   lib/core/permissions.ts
   
   # 3. テスト実行 ✅
   pnpm test lib/core/__tests__/permissions.test.ts
   ```

   **テスト対象:** ✅
   - `canViewTrip(trip, userId)` ✅
   - `canEditTrip(user, trip)` ✅
   - `canCommentOnTrip(trip, userId)` ✅
   - `canLikeTrip(trip, userId)` ✅

3. **識別子比較関数の実装** ✅
   - `isSameUserId()`, `isSameUserSlug()`, `isSameTripId()`, `isSameTripSlug()` ✅
   - `isSameUser()`, `isSameTrip()` （非同期、実データベースクエリを伴う）✅
   - 型安全性による混同防止システム ✅

---

### **Phase 1-1.5: 認証プロバイダーマルチ対応化**（v3.0.0での適用）

**重要**: 現行システム（v2.*）への適用は危険と判断。v3.0.0のリファクタリングと同時に適用する。

**基本方針**:
1. **関数によるラップ**: 文字列比較を直接行わず、`isSameUser()`, `isSameTrip()` などのbooleanを返す関数でラップ
2. **影響範囲の最小化**: 文字列比較の直接使用を禁止し、関数経由のみで比較を行う
3. **型安全性**: Phase 1-1で実装した `UserId`, `UserSlug`, `TripId`, `TripSlug` のBranded Typesを活用

**タスク**:
1. **User型定義の拡張**
   - `google_id: string` → `auth_uid: string` にリネーム（後方互換性のため `google_id?` も残す）
   - `lib/core/types/user.ts` を更新

2. **比較関数の拡張**
   - `isSameUser(authUid: UserId, userSlug: UserSlug): Promise<boolean>` を実装
   - `lib/auth/identity-helpers.ts` に追加

3. **Firestoreルールの更新**
   - `auth_uid` と `google_id` の両方をチェック（後方互換性）
   - `firestore.rules` を更新

4. **データマイグレーション**
   - 既存の `google_id` を `auth_uid` にコピーするスクリプト
   - `scripts/migrate-auth-uid.ts` を作成

5. **コード全体の段階的更新**
   - `getUserByGoogleId()` → `getUserByAuthUid()` に置き換え
   - 文字列比較を `isSameUser()` などの関数呼び出しに置き換え

**詳細**: `docs/planning/auth-provider-migration-plan.md` を参照

---

### **Phase 1-2: Firestore スキーマ拡張**（2週間）

**テストファーストで進める:**

1. **既存Tripドキュメントのバックフィル**
   ```bash
   # 1. バックフィルスクリプトのテストを先に書く
   scripts/__tests__/backfill-social-stats.test.ts
   
   # 2. バックフィルスクリプト実装
   scripts/backfill-social-stats.ts
   
   # 3. エミュレータでテスト
   pnpm test scripts
   ```

2. **Firestore セキュリティルール**
   ```bash
   # 1. セキュリティルールのテストを先に書く
   firestore.rules.test.ts
   
   # 2. セキュリティルール実装
   firestore.rules
   
   # 3. エミュレータでテスト
   pnpm test:rules
   ```

   **テスト対象:**
   - `trip_likes` コレクションの読み書き権限
   - `trip_comments` コレクションの読み書き権限
   - `user_follows` コレクションの読み書き権限
   - 公開旅行データのみフィードAPIから参照可能

---

### **Phase 1-3: API Routes実装**（3週間）

**テストファーストで進める:**

1. **いいねAPI** (`/api/social/like`)
   ```bash
   # 1. テストを先に書く
   app/api/social/__tests__/like.test.ts
   
   # 2. API実装
   app/api/social/like/route.ts
   
   # 3. テスト実行
   pnpm test app/api/social
   ```

   **テスト対象:**
   - いいねの追加/削除
   - トランザクションの整合性
   - 権限チェック（公開旅行のみ）
   - エラーハンドリング

2. **コメントAPI** (`/api/social/comment`)
   ```bash
   # 同様の流れ
   app/api/social/__tests__/comment.test.ts
   app/api/social/comment/route.ts
   ```

3. **フォローAPI** (`/api/social/follow`)
   ```bash
   # 同様の流れ
   app/api/social/__tests__/follow.test.ts
   app/api/social/follow/route.ts
   ```

4. **フィードAPI** (`/api/social/feed`)
   ```bash
   # フィード取得のテスト
   app/api/social/__tests__/feed.test.ts
   app/api/social/feed/route.ts
   ```

---

### **Phase 1-4: Firestore操作関数**（2週間）

**テストファーストで進める:**

1. **Social Operations実装**
   ```bash
   # 1. テストを先に書く（エミュレータ使用）
   lib/firebase/__tests__/social-operations.test.ts
   
   # 2. 実装
   lib/firebase/social-operations.ts
   
   # 3. テスト実行
   pnpm test lib/firebase
   ```

   **テスト対象:**
   - `toggleLike(userId, tripId)`
   - `addComment(userId, tripId, content)`
   - `deleteComment(userId, commentId)`
   - `toggleFollow(followerId, followingId)`
   - トランザクションの整合性

---

### **Phase 2: UI実装**（後回し）

Phase 1が完了してから、UIコンポーネントを実装します。

1. **Route Groups導入**（既存ページの移行）
2. **Parallel Routes実装**
3. **Social Components実装**
4. **Feed ページ実装**

**各コンポーネントで:**
- React Testing Libraryでテスト
- Storybook（任意）で視覚的テスト

---

## 📊 テストカバレッジ目標

### Phase 1完了時:
- **ユニットテスト**: 90%以上
- **インテグレーションテスト**: 80%以上
- **全体**: 80%以上

### カバレッジ測定:
```bash
pnpm test:coverage
```

---

## 🔧 必要な追加設定

### 1. Firestore エミュレータ設定

**`firebase.json`:**
```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "auth": {
      "port": 9099
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 2. テスト用Firestoreクライアント

**`lib/firebase/__tests__/test-client.ts`:**
```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'

export async function getTestFirestore(): Promise<RulesTestEnvironment> {
  return await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      host: 'localhost',
      port: 8080
    }
  })
}
```

### 3. Jest設定拡張

**`jest.config.js`:**
```javascript
module.exports = {
  // ... 既存設定
  
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Firestore エミュレータ用の環境変数
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
}
```

---

## ✅ チェックリスト

### Phase 0: テスト基盤
- [ ] Firestore エミュレータ設定
- [ ] テストヘルパー整備
- [ ] CI/CDでのエミュレータ実行設定
- [ ] カバレッジ設定確認

### Phase 1-1: 型定義と権限管理 ✅
- [x] SNS関連型定義追加 ✅
- [x] 権限管理システムのテスト作成 ✅
- [x] 権限管理システム実装 ✅
- [x] 識別子型システム実装 ✅
- [x] 比較関数の実装 ✅
- [x] テストカバレッジ90%以上 ✅

### Phase 1-1.5: 認証プロバイダーマルチ対応化（v3.0.0での適用）
- [ ] User型定義の拡張（`auth_uid` フィールド追加）
- [ ] 比較関数の拡張（`isSameUser()` 実装）
- [ ] Firestoreルールの更新
- [ ] データマイグレーションスクリプト作成
- [ ] コード全体の段階的更新

### Phase 1-2: Firestore スキーマ拡張
- [x] バックフィルスクリプトのテスト作成 ✅
- [x] バックフィルスクリプト実装 ✅
- [x] セキュリティルールのテスト作成 ✅（構造のみ、エミュレータ起動後に完全実装）
- [x] セキュリティルール実装 ✅（trip_likes, trip_comments, user_follows）
- [ ] エミュレータでのテスト完了（エミュレータ起動後に実装）

### Phase 1-3: API Routes実装
- [ ] いいねAPIのテスト作成
- [ ] いいねAPI実装
- [ ] コメントAPIのテスト作成
- [ ] コメントAPI実装
- [ ] フォローAPIのテスト作成
- [ ] フォローAPI実装
- [ ] フィードAPIのテスト作成
- [ ] フィードAPI実装
- [ ] すべてのAPIテストが通過

### Phase 1-4: Firestore操作関数
- [ ] Social Operationsのテスト作成
- [ ] Social Operations実装
- [ ] トランザクションテスト完了
- [ ] テストカバレッジ80%以上

---

## 🎯 次のステップ

1. **Phase 0を開始**: テスト基盤整備
2. **Phase 1-1を開始**: 型定義と権限管理システムのテストから実装
3. **段階的に進行**: 各Phaseでテストが通過してから次へ

---

**作成日**: 2025-01-XX  
**最終更新**: 2025-01-XX

