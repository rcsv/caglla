# API認証・認可の欠如問題

## 🔴 セキュリティ問題の概要

**発見日**: 2025年10月21日  
**発見元**: CodeRabbit PR #25 レビュー  
**重要度**: Critical  
**ステータス**: 未対応（v1.8.2で対応予定）

---

## 📋 問題の詳細

### 影響を受けるエンドポイント

#### `app/api/itineraries/route.ts`
- **POST** `/api/itineraries` - 新規旅程作成
- **GET** `/api/itineraries` - 旅程一覧取得

### 現在の問題点

1. **認証の欠如**
   - Bearer token検証がない
   - 未認証ユーザーがAPIを呼び出し可能
   - `adminAuth.verifyIdToken()`による認証が未実装

2. **認可の欠如**
   - day → trip の所有権確認がない
   - 他のユーザーの旅程にアクセス可能
   - trip.user_id と認証ユーザーのuidの照合がない

3. **エラーハンドリング不足**
   - 401 Unauthorized のレスポンスがない
   - 403 Forbidden のレスポンスがない
   - 404 Not Found のエラーハンドリングが不完全

---

## 🎯 必要な対応

### Phase 1: 認証の実装

```typescript
import { adminAuth } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  // 1. Bearer tokenの取得
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }

  const token = authHeader.split('Bearer ')[1]

  // 2. トークンの検証
  let decodedToken
  try {
    decodedToken = await adminAuth.verifyIdToken(token)
  } catch (error) {
    logger.error('Token verification failed:', error)
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  const userId = decodedToken.uid

  // ... 以降の処理
}
```

### Phase 2: 認可の実装

```typescript
// day_id から trip_id を取得
const daySnap = await adminDb.collection(COLLECTIONS.DAYS).doc(day_id).get()
if (!daySnap.exists) {
  return NextResponse.json({ error: 'Day not found' }, { status: 404 })
}

const dayData = daySnap.data()
if (!dayData?.trip_id) {
  return NextResponse.json({ error: 'Day has no trip_id' }, { status: 400 })
}

// trip の所有権確認
const tripSnap = await adminDb.collection(COLLECTIONS.TRIPS).doc(dayData.trip_id).get()
if (!tripSnap.exists) {
  return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
}

const tripData = tripSnap.data()
if (tripData?.user_id !== userId) {
  return NextResponse.json({ error: 'Forbidden: You do not own this trip' }, { status: 403 })
}
```

### Phase 3: エラーハンドリングの強化

- 401: 認証失敗
- 403: 認可失敗（所有権なし）
- 404: リソース未発見
- 400: バリデーションエラー
- 500: サーバーエラー

---

## 🔍 影響範囲の調査

### 認証が必要な他のエンドポイント

以下のエンドポイントも同様の問題がある可能性があります：

```bash
# 認証実装済み（23ファイル）
app/api/itineraries/insert/route.ts ✅
app/api/trips/accessible/route.ts ✅
app/api/trips/route.ts ✅
# ... 他20ファイル

# 要確認
app/api/itineraries/route.ts ❌
app/api/itineraries/[id]/route.ts ❓
app/api/venue/search/route.ts ❓
```

全APIエンドポイントの認証・認可状況を監査する必要があります。

---

## 📅 対応スケジュール

### v1.8.2 セキュリティパッチ（緊急）

**対象**: 
- `app/api/itineraries/route.ts` の認証・認可実装

**タスク**:
- [ ] 認証ミドルウェアの実装
- [ ] POST/GETエンドポイントへの認証追加
- [ ] day → trip 所有権確認の実装
- [ ] エラーハンドリングの強化
- [ ] セキュリティテストの実施
- [ ] ドキュメント更新

**推定工数**: 2-3時間

### v1.9.0+ セキュリティ監査（包括的）

**対象**:
- 全APIエンドポイントの認証・認可監査
- 統一的な認証ミドルウェアの実装
- 権限管理システムの整備

**タスク**:
- [ ] 全APIエンドポイントの認証状況調査
- [ ] 認証ミドルウェアの共通化
- [ ] ロールベースアクセス制御（RBAC）の検討
- [ ] セキュリティベストプラクティスの適用
- [ ] セキュリティ監査レポート作成

**推定工数**: 1-2週間

---

## 🔗 関連リンク

- **発見元PR**: #25 (型安全性改善)
- **CodeRabbitレビュー**: https://github.com/rcsv/caglla/pull/25#pullrequestreview-3358393986
- **Firebase Admin Auth**: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- **セキュリティガイドライン**: `docs/security/README.md`

---

## 📝 備考

- この問題は開発中に発見されたため、本番環境への影響は限定的
- 優先度は高いが、型安全性改善（v1.8.1）とは独立して対応可能
- 認証実装は既存の23ファイルで実装済みのパターンを参考にできる

---

**作成日**: 2025年10月21日  
**最終更新**: 2025年10月21日  
**担当者**: TBD

