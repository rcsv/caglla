# Firestoreエミュレータでの統合テスト

## 概要

エミュレータでの統合テストは、**実際のFirestoreエミュレータ**を使って以下を検証するテストです：

1. **セキュリティルールのテスト**: `@firebase/rules-unit-testing`を使用して、`firestore.rules`が正しく動作することを確認
2. **バックフィルスクリプトの統合テスト**: 実際のFirestoreエミュレータに対してバックフィルスクリプトを実行し、データが正しく更新されることを確認

---

## セキュリティルールのテスト

### 1. エミュレータの起動

```bash
# Firestoreエミュレータのみ起動
pnpm emulators:start:firestore

# または、すべてのエミュレータを起動
pnpm emulators:start
```

エミュレータは `localhost:8080` で起動します。

### 2. テストの実行

```bash
# エミュレータを起動した状態で、別のターミナルで実行
pnpm test:firestore
```

### 3. テストの実装例

`firestore.rules.test.ts` では、以下のようにテストを実装します：

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import * as fs from 'fs'
import * as path from 'path'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  // Firestoreルールファイルを読み込む
  const rulesPath = path.join(__dirname, 'firestore.rules')
  const rules = fs.readFileSync(rulesPath, 'utf8')

  // テスト環境を初期化（エミュレータに接続）
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules,  // firestore.rules の内容
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('trip_likes collection', () => {
  it('should allow authenticated users to read likes for public trips', async () => {
    // 1. 管理者権限で公開トリップを作成
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore()
      await adminDb.collection('trips').doc('public-trip-1').set({
        id: 'public-trip-1',
        user_id: 'user2',
        title: 'Public Trip',
        access_level: 'public',
        created_at: new Date(),
        updated_at: new Date(),
      })
    })

    // 2. user1として認証されたコンテキストを取得
    const user1Context = testEnv.authenticatedContext('user1')

    // 3. user1が公開トリップのいいねを読めることを確認
    const user1Db = user1Context.firestore()
    const likeRef = user1Db.collection('trip_likes').doc('user1_public-trip-1')

    // セキュリティルールに基づいて読み取りが成功するかテスト
    await expect(likeRef.get()).resolves.toBeDefined()
  })

  it('should deny reading likes for private trips', async () => {
    // 1. プライベートトリップを作成
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore()
      await adminDb.collection('trips').doc('private-trip-1').set({
        id: 'private-trip-1',
        user_id: 'user2',
        title: 'Private Trip',
        access_level: 'private',
        created_at: new Date(),
        updated_at: new Date(),
      })
    })

    // 2. user1がプライベートトリップのいいねを読めないことを確認
    const user1Context = testEnv.authenticatedContext('user1')
    const user1Db = user1Context.firestore()
    const likeRef = user1Db.collection('trip_likes').doc('user1_private-trip-1')

    // セキュリティルールにより読み取りが拒否されることをテスト
    await expect(likeRef.get()).rejects.toThrow()
  })
})
```

### テストで検証する内容

- ✅ **読み取り権限**: 公開トリップのいいねは読める、プライベートトリップのいいねは読めない
- ✅ **書き込み権限**: クライアントからの直接書き込みは拒否される（サーバー管理のみ）
- ✅ **認証状態**: 認証済みユーザーのみアクセス可能
- ✅ **所有権**: コメントの作成者のみ更新・削除可能

---

## バックフィルスクリプトの統合テスト

### 1. エミュレータでの実行

バックフィルスクリプトをエミュレータに対して実行するテスト：

```typescript
import { getTestFirestore } from '@/lib/__tests__/helpers/test-firestore'
import { backfillSocialStats } from '@/scripts/backfill-social-stats'
import { createMockTrip } from '@/lib/__tests__/helpers/test-data'

describe('backfillSocialStats integration', () => {
  let db: Firestore

  beforeAll(async () => {
    db = getTestFirestore() // エミュレータに接続
  })

  it('should add social_stats to trips without social_stats', async () => {
    // 1. social_statsがないTripをエミュレータに作成
    const tripWithoutStats = createMockTrip({
      id: 'trip-without-stats',
      user_id: 'user1',
      access_level: 'public',
    })
    
    const { social_stats, ...tripData } = tripWithoutStats
    await db.collection('trips').doc(tripWithoutStats.id).set(tripData)

    // 2. バックフィルスクリプトを実行（エミュレータに対して）
    await backfillSocialStats(db, 500, false)

    // 3. social_statsが追加されたことを確認
    const updatedTrip = await db.collection('trips').doc(tripWithoutStats.id).get()
    const updatedData = updatedTrip.data() as Trip

    expect(updatedData.social_stats).toBeDefined()
    expect(updatedData.social_stats?.likes_count).toBe(0)
    expect(updatedData.social_stats?.comments_count).toBe(0)
    // ...
  })
})
```

### テストで検証する内容

- ✅ **データ追加**: `social_stats`がないTripにデフォルト値が追加される
- ✅ **データ保持**: 既存の`social_stats`は変更されない
- ✅ **部分的なデータ**: 一部フィールドが欠けている場合は補完される
- ✅ **バッチ処理**: 複数のTripを一度に処理できる

---

## 実行手順

### 手順1: エミュレータを起動

```bash
# ターミナル1: エミュレータを起動
pnpm emulators:start:firestore
```

### 手順2: テストを実行

```bash
# ターミナル2: テストを実行
pnpm test:firestore
```

### 手順3: 結果を確認

テストが通過すれば、セキュリティルールとバックフィルスクリプトが正しく動作していることを確認できます。

---

## メリット

1. **実際の環境に近い**: 本番環境のFirestoreと同様の動作を再現
2. **セキュリティルールの検証**: ルールが正しく動作することを確実に確認
3. **統合テスト**: 複数のコンポーネントが連携して動作することを確認
4. **開発効率**: 本番環境を使わずにテストできる

---

## 注意事項

- **エミュレータの起動**: テスト実行前に必ずエミュレータを起動する
- **ポートの競合**: `8080`ポートが使用中でないことを確認
- **データのクリーンアップ**: テスト間でデータが残らないよう、各テストでクリーンアップする
- **パフォーマンス**: エミュレータは本番環境より遅い場合がある

---

## 次のステップ

Phase 1-2完了後、エミュレータでの統合テストを実装することで：

1. ✅ セキュリティルールが正しく動作することを確認
2. ✅ バックフィルスクリプトが正しく動作することを確認
3. ✅ Phase 1-3（API Routes実装）に進む前に、基盤が堅牢であることを保証

---

**作成日**: 2025-01-XX  
**関連ドキュメント**: 
- `docs/planning/v3-implementation-order.md`
- `lib/__tests__/helpers/test-firestore.ts`

