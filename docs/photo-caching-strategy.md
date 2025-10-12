# 写真キャッシュ戦略

## 📸 現在の問題

Google Places Photo APIは**毎回課金**されます：
- 写真取得: **$7.00/1,000件**
- 同じ写真を何度も取得すると、無駄なコストが発生

## 💡 解決策: Firebase Storage キャッシュ

### 実装方針

1. **初回取得時**: Google Places Photo APIから写真をダウンロード
2. **Firebase Storage保存**: 写真を`/photos/{photoReference}`に保存
3. **2回目以降**: Firebase Storageから直接配信（無料）

### キャッシュキー設計

```typescript
// photo_reference から一意のキーを生成
const cacheKey = `photos/${photoReference.replace(/[^a-zA-Z0-9]/g, '_')}`
```

### 実装箇所

#### 1. `/app/api/places/photo/route.ts` の修正

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const photoreference = searchParams.get('photoreference')
  const maxwidth = searchParams.get('maxwidth') || '400'

  if (!photoreference) {
    return NextResponse.json({ error: 'Photo reference is required' }, { status: 400 })
  }

  try {
    // 1. Firebase Storage からキャッシュを確認
    const cachedPhoto = await getCachedPhoto(photoreference, maxwidth)
    if (cachedPhoto) {
      return new NextResponse(cachedPhoto, {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000' }
      })
    }

    // 2. キャッシュがない場合はGoogle Places APIから取得
    const photoData = await fetchFromGooglePlacesAPI(photoreference, maxwidth)
    
    // 3. Firebase Storageに保存（非同期）
    saveToCache(photoreference, maxwidth, photoData).catch(console.error)
    
    return new NextResponse(photoData, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000' }
    })
  } catch (error) {
    logger.error('Photo fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
}
```

#### 2. キャッシュ管理関数

```typescript
// lib/photo-cache.ts
import { getStorage, ref, getBytes, uploadBytes } from 'firebase/storage'

export async function getCachedPhoto(photoReference: string, maxWidth: string): Promise<ArrayBuffer | null> {
  try {
    const storage = getStorage()
    const cacheKey = `photos/${photoReference.replace(/[^a-zA-Z0-9]/g, '_')}_${maxWidth}`
    const photoRef = ref(storage, cacheKey)
    
    const data = await getBytes(photoRef)
    return data
  } catch (error) {
    return null // キャッシュなし
  }
}

export async function saveToCache(photoReference: string, maxWidth: string, photoData: ArrayBuffer): Promise<void> {
  try {
    const storage = getStorage()
    const cacheKey = `photos/${photoReference.replace(/[^a-zA-Z0-9]/g, '_')}_${maxWidth}`
    const photoRef = ref(storage, cacheKey)
    
    await uploadBytes(photoRef, photoData, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000' // 1年キャッシュ
    })
  } catch (error) {
    logger.error('Failed to cache photo:', error)
  }
}
```

### コスト削減効果

| シナリオ | 旧方式 | 新方式（キャッシュ） | 削減率 |
|---------|--------|---------------------|--------|
| 初回表示 | $7.00/1,000件 | $7.00/1,000件 | 0% |
| 2回目以降 | $7.00/1,000件 | $0.00/1,000件 | **100%** |
| 平均（50%キャッシュヒット） | $7.00/1,000件 | $3.50/1,000件 | **50%** |

### 実装優先度

- **高**: 写真取得が多いPOI（観光地、レストラン等）
- **中**: 一般的なPOI
- **低**: 写真が少ないPOI

## 🚀 実装タイミング

1. **今すぐ**: 基本キャッシュ機能
2. **後日**: キャッシュ期限管理、圧縮最適化
3. **将来**: CDN連携、画像最適化

この実装により、写真取得コストを大幅に削減できます！
