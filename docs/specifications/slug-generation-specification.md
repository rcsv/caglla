# スラッグ生成仕様書

## 概要

Caglla Travel Managerでは、旅行データとユーザーデータのURL生成のためにスラッグベースのシステムを採用しています。このドキュメントでは、スラッグ生成の仕様と実装詳細について説明します。

## スラッグ生成の基本仕様

### 1. スラッグの用途

- **旅行スラッグ**: 旅行データのURL生成（`/[userSlug]/[tripSlug]`）
- **ユーザースラッグ**: ユーザーデータのURL生成（`/[userSlug]`）

### 2. スラッグ生成の優先順位

1. **通常のスラッグ生成**: ひらがな・カタカナ・英数字を含む文字列
2. **フォールバック**: 漢字のみや特殊文字のみの場合はハッシュ文字列を生成

## スラッグ生成アルゴリズム

### 1. 基本的な変換処理

```typescript
function generateSlug(text: string): string {
  const slug = text
    // ひらがな・カタカナをローマ字に変換
    .replace(/[\u3041-\u3096]/g, (char) => hiraganaToRomaji(char))
    .replace(/[\u30A1-\u30F6]/g, (char) => katakanaToRomaji(char))
    // 英数字以外を削除
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    // スペースをハイフンに変換
    .replace(/\s+/g, '-')
    // 連続するハイフンを単一に
    .replace(/-+/g, '-')
    // 先頭・末尾のハイフンを削除
    .replace(/^-+|-+$/g, '')
    // 小文字に変換
    .toLowerCase()
    // 最大50文字に制限
    .substring(0, 50)
  
  // 空文字列の場合はハッシュ文字列を生成
  if (!slug || slug.length === 0) {
    return generateHashSlug(text)
  }
  
  return slug
}
```

### 2. フォールバック機能

漢字のみや特殊文字のみの文字列の場合、以下のハッシュ文字列を生成：

```typescript
function generateHashSlug(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit整数に変換
  }
  
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  return hashStr.substring(0, 8)
}
```

## 変換例

### 通常のスラッグ生成

| 入力 | 出力 | 説明 |
|------|------|------|
| `Tokyo` | `tokyo` | 英数字はそのまま |
| `東京 Tokyo` | `tokyo` | 漢字は削除、英数字は残る |
| `おおさか` | `oosaka` | ひらがなはローマ字に変換 |
| `オオサカ` | `oosaka` | カタカナはローマ字に変換 |
| `大阪 旅行` | `oosaka` | 漢字は削除、ひらがなは変換 |

### フォールバック（ハッシュ文字列）

| 入力 | 出力 | 説明 |
|------|------|------|
| `長野市` | `024319ab` | 漢字のみの場合はハッシュ |
| `東京` | `000cd55b` | 漢字のみの場合はハッシュ |
| `大阪府大阪市` | `6dab433a` | 漢字のみの場合はハッシュ |
| `   ` | `00007c20` | 空白のみの場合はハッシュ |

## ユニークスラッグ生成

### 重複処理

既存のスラッグと重複する場合は連番を付与：

```typescript
function generateUniqueSlug(baseText: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(baseText)
  
  // 空スラッグの場合はハッシュ文字列を使用
  if (!baseSlug || baseSlug.length === 0) {
    const hashSlug = generateHashSlug(baseText)
    if (!existingSlugs.includes(hashSlug)) {
      return hashSlug
    }
    // ハッシュスラッグも重複している場合は連番を付与
    let counter = 1
    let uniqueSlug = `${hashSlug}-${counter}`
    while (existingSlugs.includes(uniqueSlug)) {
      counter++
      uniqueSlug = `${hashSlug}-${counter}`
    }
    return uniqueSlug
  }
  
  // 通常の重複処理
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }
  
  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`
  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }
  
  return uniqueSlug
}
```

### 重複処理例

| ベース文字列 | 既存スラッグ | 生成されるスラッグ |
|-------------|-------------|------------------|
| `Tokyo` | `[]` | `tokyo` |
| `Tokyo` | `['tokyo']` | `tokyo-1` |
| `Tokyo` | `['tokyo', 'tokyo-1']` | `tokyo-2` |
| `長野市` | `[]` | `024319ab` |
| `長野市` | `['024319ab']` | `024319ab-1` |

## 旅行作成時のスラッグ生成

### タイトルと目的地の処理

旅行作成時は以下の優先順位でスラッグを生成：

1. **タイトルが入力されている場合**: タイトルからスラッグを生成
2. **タイトルが空の場合**: 目的地からスラッグを生成

```typescript
// API側の処理
const finalTitle = title || destination
const tripSlug = generateUniqueSlug(finalTitle, existingSlugs)
```

### 実装例

```typescript
// フロントエンド側
const response = await makeAuthenticatedRequest('/api/trips', {
  method: 'POST',
  body: JSON.stringify({
    title: formData.title || formData.destination, // タイトル未入力時は目的地を使用
    destination: formData.destination,
    // ... その他のフィールド
  }),
})
```

## URL構造

### 旅行詳細ページ

- **新しい形式**: `/[userSlug]/[tripSlug]`
- **古い形式**: `/trip/[tripId]` (リダイレクト用)

### リダイレクト処理

古いURL形式にアクセスした場合は、新しいスラッグベースのURLにリダイレクト：

```typescript
// /trip/[id]/page.tsx
const slugs = await getSlugsFromTripId(id)
if (slugs) {
  const newUrl = `/${slugs.userSlug}/${slugs.tripSlug}`
  router.replace(newUrl)
}
```

## スラッグの妥当性検証

### 検証ルール

1. **必須**: スラッグは必須
2. **長さ**: 1文字以上50文字以下
3. **文字種**: 小文字の英数字とハイフンのみ
4. **ハイフン**: 先頭・末尾にハイフンは不可
5. **連続ハイフン**: 連続するハイフンは不可

### 検証関数

```typescript
function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug) {
    return { isValid: false, error: 'スラッグは必須です' }
  }
  
  if (slug.length < 1) {
    return { isValid: false, error: 'スラッグは1文字以上である必要があります' }
  }
  
  if (slug.length > 50) {
    return { isValid: false, error: 'スラッグは50文字以下である必要があります' }
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'スラッグは小文字の英数字とハイフンのみ使用できます' }
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, error: 'スラッグはハイフンで始まったり終わったりできません' }
  }
  
  if (slug.includes('--')) {
    return { isValid: false, error: 'スラッグに連続するハイフンは使用できません' }
  }
  
  return { isValid: true }
}
```

## 実装ファイル

- **メイン実装**: `lib/slug-utils.ts`
- **データ取得ヘルパー**: `lib/slug-data-helpers.ts`
- **旅行作成API**: `app/api/trips/route.ts`
- **リダイレクトページ**: `app/trip/[id]/page.tsx`

## 注意事項

1. **ハッシュの一意性**: ハッシュ文字列は完全に一意ではありませんが、実用上は十分です
2. **パフォーマンス**: 大量のスラッグ生成時は、ハッシュ計算のオーバーヘッドを考慮してください
3. **国際化**: 現在は日本語と英語のみ対応、他の言語の追加時は変換ルールの拡張が必要です
4. **後方互換性**: 既存のIDベースURLはリダイレクトで対応しています

## 更新履歴

- **2024-12-XX**: 初版作成
- **2024-12-XX**: 漢字のみの文字列に対するフォールバック機能を追加
