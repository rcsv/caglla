# テストヘルパー

v3.0.0のテスト基盤として提供されるテストヘルパー関数のドキュメントです。

## 📁 構成

- `test-firestore.ts`: Firestore エミュレータ用のヘルパー
- `test-auth.ts`: 認証テスト用のヘルパー
- `test-data.ts`: テストデータファクトリー
- `index.ts`: 統合エクスポート

## 🚀 使用方法

### Firestore エミュレータの使用

```typescript
import { setupTestFirestore, getTestFirestore, teardownTestFirestore } from '@/lib/__tests__/helpers'

describe('Firestore Operations', () => {
  beforeAll(async () => {
    await setupTestFirestore()
  })

  afterAll(async () => {
    await teardownTestFirestore()
  })

  it('should work with Firestore emulator', async () => {
    const db = getTestFirestore()
    const docRef = db.collection('trips').doc('test-trip-1')
    await docRef.set({ title: 'Test Trip' })
    
    const doc = await docRef.get()
    expect(doc.data()?.title).toBe('Test Trip')
  })
})
```

### テストデータの生成

```typescript
import { createMockTrip, createMockPublicTrip, createMockTrips } from '@/lib/__tests__/helpers'

describe('Trip Operations', () => {
  it('should create a private trip', () => {
    const trip = createMockTrip({ title: 'My Trip' })
    expect(trip.access_level).toBe('private')
    expect(trip.title).toBe('My Trip')
  })

  it('should create a public trip', () => {
    const trip = createMockPublicTrip({ title: 'Public Trip' })
    expect(trip.access_level).toBe('public')
  })

  it('should create multiple trips', () => {
    const trips = createMockTrips(5, { access_level: 'public' })
    expect(trips).toHaveLength(5)
    expect(trips.every(t => t.access_level === 'public')).toBe(true)
  })
})
```

### 認証ヘッダーの生成

```typescript
import { createAuthHeader, createUnauthenticatedHeader } from '@/lib/__tests__/helpers'

describe('API Authentication', () => {
  it('should include auth header', () => {
    const headers = createAuthHeader('test-user-1')
    expect(headers.authorization).toContain('Bearer')
  })

  it('should work without auth header', () => {
    const headers = createUnauthenticatedHeader()
    expect(headers.authorization).toBeUndefined()
  })
})
```

## 🔧 セットアップ

### 1. Firestore エミュレータの起動

テスト実行前に、Firestore エミュレータを起動する必要があります：

```bash
# Firestore エミュレータのみ起動
firebase emulators:start --only firestore

# すべてのエミュレータを起動（Firestore + Auth + UI）
firebase emulators:start
```

### 2. 環境変数の設定

エミュレータを使用する場合は、環境変数が自動的に設定されます。
手動で設定する場合：

```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
```

### 3. Jest設定

`jest.config.js` でエミュレータ用の設定が既に含まれています（`jest.setup.js`）。

## 📝 注意事項

1. **エミュレータの起動**: テスト実行前にエミュレータが起動している必要があります
2. **データの独立性**: 各テストケースで必要なデータのみをセットアップ・クリーンアップしてください
3. **並列実行**: エミュレータは複数のテストを並列実行できますが、データの競合に注意してください

## 🔗 関連ドキュメント

- [v3 Implementation Order](../docs/planning/v3-implementation-order.md)
- [Firebase Emulator Documentation](https://firebase.google.com/docs/emulator-suite)

