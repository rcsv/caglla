# クォータ管理付きファイルアップロード機能 仕様書

**対象バージョン**: v1.12.0  
**作成日**: 2025-10-20  
**ステータス**: 設計中

---

## 📌 エグゼクティブサマリー

### 概要
Firebase Storageを活用し、プラン別のストレージクォータ管理・写真圧縮・進捗表示・一括アップロードを備えた高機能ファイルアップロードシステム。

### 目的
- プラン別のストレージ容量制限管理
- アップロード体験の向上（進捗表示、エラーハンドリング）
- ストレージコスト最適化（画像圧縮、重複排除）
- セキュリティ強化（ファイル検証、不正アップロード防止）

### 主要機能
- **プラン別クォータ管理**: 各プランの上限に応じた制限
- **自動画像圧縮**: アップロード前の自動リサイズ・圧縮
- **進捗表示**: リアルタイムアップロード進捗
- **一括アップロード**: 複数ファイルの並列処理
- **重複排除**: 同じファイルの重複保存を防止
- **使用量可視化**: ストレージ使用状況のダッシュボード

---

## 🎯 ユーザーストーリー

### ストーリー1: 写真アップロード
1. ユーザーが旅程に写真を追加
2. 複数枚の写真をドラッグ&ドロップ
3. 自動で画像圧縮・最適化
4. 進捗バーで各ファイルのアップロード状況を表示
5. 完了後、旅程に写真が表示される

### ストーリー2: クォータ制限
1. 無料プラン（50MB）のユーザーが写真をアップロード
2. 使用量が45MBに達すると警告表示
3. 50MBを超えるとアップロード不可
4. 「プランをアップグレード」ボタンが表示される

### ストーリー3: ストレージ管理
1. ユーザーが「ストレージ使用状況」画面を開く
2. 旅行ごとのファイル使用量を確認
3. 不要な写真を削除してスペース確保
4. 使用量がリアルタイムで更新される

---

## 🏗️ 技術スタック

### ストレージ
- **Firebase Storage**: ファイル保存
- **Firestore**: メタデータ管理・使用量トラッキング

### 画像処理
- **Browser Image Compression**: クライアント側圧縮（`browser-image-compression`）
- **Sharp**: サーバー側圧縮（Cloud Functions）

### UI/UX
- **React Dropzone**: ドラッグ&ドロップUI
- **Progress Bar**: アップロード進捗表示

---

## 📊 データモデル

### 1. ストレージ使用量（Firestoreコレクション: `users/{userId}/storage_usage`）

```typescript
interface StorageUsage {
  userId: string
  
  // 使用量サマリー
  totalUsedBytes: number
  totalUsedGB: number
  quotaLimitGB: number
  usagePercentage: number
  
  // 旅行別使用量
  tripUsage: {
    [tripId: string]: {
      tripId: string
      tripTitle: string
      usedBytes: number
      fileCount: number
      lastUpdatedAt: number
    }
  }
  
  // ファイルタイプ別使用量
  fileTypeUsage: {
    images: number
    documents: number
    videos: number
    other: number
  }
  
  // 統計
  totalFiles: number
  largestFileBytes: number
  averageFileSizeBytes: number
  
  // メタデータ
  lastCalculatedAt: number
  lastUploadAt?: number
}
```

### 2. アップロードファイルメタデータ（Firestoreコレクション: `users/{userId}/uploaded_files`）

```typescript
interface UploadedFile {
  id: string // ファイルID
  userId: string
  
  // ファイル情報
  fileName: string
  originalFileName: string
  fileType: string // MIME type
  fileSizeBytes: number
  fileExtension: string
  
  // Storage情報
  storagePath: string // Firebase Storageのパス
  downloadUrl: string
  thumbnailUrl?: string // サムネイル（画像の場合）
  
  // 関連情報
  tripId?: string
  itineraryId?: string
  attachedTo: 'trip' | 'itinerary' | 'user-avatar' | 'other'
  
  // 画像メタデータ（画像の場合）
  imageMetadata?: {
    width: number
    height: number
    originalWidth: number
    originalHeight: number
    compressionRatio: number // 圧縮率
    format: 'jpeg' | 'png' | 'webp'
  }
  
  // 重複チェック用
  fileHash: string // SHA-256ハッシュ
  isDuplicate: boolean
  originalFileId?: string // 重複の場合、元ファイルID
  
  // メタデータ
  uploadedAt: number
  uploadedBy: string // userId
  lastAccessedAt?: number
  accessCount: number
  
  // 削除管理
  isDeleted: boolean
  deletedAt?: number
}
```

### 3. アップロードセッション（Firestoreコレクション: `users/{userId}/upload_sessions`）

```typescript
interface UploadSession {
  id: string
  userId: string
  
  // セッション情報
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  startedAt: number
  completedAt?: number
  
  // ファイル情報
  files: Array<{
    fileId: string
    fileName: string
    fileSizeBytes: number
    status: 'pending' | 'uploading' | 'completed' | 'failed'
    progress: number // 0-100
    uploadedBytes: number
    errorMessage?: string
  }>
  
  totalFiles: number
  completedFiles: number
  failedFiles: number
  totalBytes: number
  uploadedBytes: number
  overallProgress: number // 0-100
  
  // エラー情報
  errors: Array<{
    fileId: string
    errorCode: string
    errorMessage: string
    timestamp: number
  }>
  
  createdAt: number
  updatedAt: number
}
```

---

## 🔧 API設計

### 1. ストレージ使用量API

#### `GET /api/storage/usage`
現在のストレージ使用量を取得

**Response:**
```typescript
{
  usage: StorageUsage
  plan: SubscriptionPlan
  isNearLimit: boolean // 80%以上使用中
  isOverLimit: boolean
}
```

#### `POST /api/storage/recalculate`
使用量を再計算（手動トリガー）

**Response:**
```typescript
{
  success: boolean
  usage: StorageUsage
}
```

---

### 2. ファイルアップロードAPI

#### `POST /api/storage/upload/initialize`
アップロードセッションを初期化

**Request:**
```typescript
{
  files: Array<{
    fileName: string
    fileType: string
    fileSizeBytes: number
    fileHash: string
  }>
  tripId?: string
  itineraryId?: string
  attachedTo: 'trip' | 'itinerary' | 'user-avatar' | 'other'
}
```

**Response:**
```typescript
{
  success: boolean
  sessionId: string
  quotaCheck: {
    currentUsageGB: number
    quotaLimitGB: number
    remainingGB: number
    canUpload: boolean
    blockedFiles?: string[] // クォータ超過でブロックされたファイル
  }
  duplicateCheck: {
    [fileHash: string]: {
      isDuplicate: boolean
      existingFileId?: string
      existingFileUrl?: string
    }
  }
  uploadUrls: {
    [fileName: string]: string // Firebase Storage署名付きURL
  }
}
```

#### `POST /api/storage/upload/complete`
アップロード完了を通知

**Request:**
```typescript
{
  sessionId: string
  fileId: string
  storagePath: string
  downloadUrl: string
}
```

**Response:**
```typescript
{
  success: boolean
  file: UploadedFile
  updatedUsage: StorageUsage
}
```

#### `POST /api/storage/upload/cancel`
アップロードをキャンセル

**Request:**
```typescript
{
  sessionId: string
}
```

**Response:**
```typescript
{
  success: boolean
}
```

---

### 3. ファイル管理API

#### `GET /api/storage/files`
アップロード済みファイル一覧を取得

**Query Parameters:**
- `tripId`: string（オプション）
- `attachedTo`: 'trip' | 'itinerary' | 'user-avatar' | 'other'（オプション）
- `limit`: number
- `offset`: number

**Response:**
```typescript
{
  files: UploadedFile[]
  total: number
  hasMore: boolean
}
```

#### `DELETE /api/storage/files/{fileId}`
ファイルを削除

**Response:**
```typescript
{
  success: boolean
  freedSpaceGB: number
  updatedUsage: StorageUsage
}
```

#### `POST /api/storage/files/{fileId}/duplicate`
重複ファイルを参照として登録

**Request:**
```typescript
{
  tripId?: string
  itineraryId?: string
}
```

**Response:**
```typescript
{
  success: boolean
  file: UploadedFile
}
```

---

## 📦 クォータ管理

### プラン別ストレージ制限

| プラン | ストレージ容量 | 旅行あたり写真数 | 備考 |
|--------|---------------|-----------------|------|
| **Season Traveler** | **50MB** | 5枚 | 無料プラン |
| **Backpacker** | **500MB** | 50枚 | 月額480円 |
| **Globetrotter** | **無制限** | 無制限 | 月額980円 |

### クォータチェックロジック

```typescript
async function checkQuota(
  userId: string, 
  uploadSizeBytes: number
): Promise<QuotaCheckResult> {
  // 1. ユーザープラン取得
  const subscription = await getSubscription(userId)
  const plan = subscription.plan
  
  // 2. 現在の使用量取得
  const usage = await getStorageUsage(userId)
  
  // 3. クォータ制限チェック
  const quotaLimitBytes = plan.limits.storageGB * 1024 * 1024 * 1024
  const afterUploadUsage = usage.totalUsedBytes + uploadSizeBytes
  
  if (plan.limits.storageGB === -1) {
    // 無制限プラン
    return {
      canUpload: true,
      currentUsageGB: usage.totalUsedGB,
      quotaLimitGB: -1,
      remainingGB: -1
    }
  }
  
  if (afterUploadUsage > quotaLimitBytes) {
    // クォータ超過
    return {
      canUpload: false,
      currentUsageGB: usage.totalUsedGB,
      quotaLimitGB: plan.limits.storageGB,
      remainingGB: (quotaLimitBytes - usage.totalUsedBytes) / 1024 / 1024 / 1024,
      errorMessage: `ストレージ容量が不足しています。残り${remaining.toFixed(2)}GBです。`
    }
  }
  
  // 4. 警告チェック（80%以上使用）
  const usagePercentage = (afterUploadUsage / quotaLimitBytes) * 100
  const isNearLimit = usagePercentage >= 80
  
  return {
    canUpload: true,
    currentUsageGB: usage.totalUsedGB,
    quotaLimitGB: plan.limits.storageGB,
    remainingGB: (quotaLimitBytes - afterUploadUsage) / 1024 / 1024 / 1024,
    isNearLimit,
    warningMessage: isNearLimit ? 
      `ストレージ使用率が${usagePercentage.toFixed(0)}%に達しています。` : undefined
  }
}
```

---

## 🖼️ 画像圧縮戦略

### クライアント側圧縮（推奨）

```typescript
import imageCompression from 'browser-image-compression'

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // 最大1MB
    maxWidthOrHeight: 1920, // 最大1920px
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8
  }
  
  try {
    const compressedFile = await imageCompression(file, options)
    
    console.log('Original size:', file.size / 1024 / 1024, 'MB')
    console.log('Compressed size:', compressedFile.size / 1024 / 1024, 'MB')
    console.log('Compression ratio:', 
      ((1 - compressedFile.size / file.size) * 100).toFixed(2) + '%'
    )
    
    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    return file // 圧縮失敗時は元ファイルを返す
  }
}
```

### サムネイル生成

```typescript
async function generateThumbnail(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.1, // 最大100KB
    maxWidthOrHeight: 400, // 最大400px
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.7
  }
  
  return await imageCompression(file, options)
}
```

### サーバー側圧縮（Cloud Functions）

```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as sharp from 'sharp'

export const compressImageOnUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name
  const contentType = object.contentType
  
  // 画像ファイルのみ処理
  if (!contentType || !contentType.startsWith('image/')) {
    return
  }
  
  const bucket = admin.storage().bucket(object.bucket)
  const tempFilePath = `/tmp/${path.basename(filePath)}`
  
  // ダウンロード
  await bucket.file(filePath).download({ destination: tempFilePath })
  
  // 圧縮
  const compressedFilePath = `/tmp/compressed_${path.basename(filePath)}`
  await sharp(tempFilePath)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(compressedFilePath)
  
  // 再アップロード
  await bucket.upload(compressedFilePath, {
    destination: filePath,
    metadata: {
      contentType: 'image/jpeg',
      metadata: {
        compressed: 'true'
      }
    }
  })
  
  // サムネイル生成
  const thumbnailPath = filePath.replace(/(\.[\w\d_-]+)$/i, '_thumb$1')
  const thumbnailFilePath = `/tmp/thumb_${path.basename(filePath)}`
  
  await sharp(tempFilePath)
    .resize(400, 400, { fit: 'inside' })
    .jpeg({ quality: 70 })
    .toFile(thumbnailFilePath)
  
  await bucket.upload(thumbnailFilePath, {
    destination: thumbnailPath,
    metadata: {
      contentType: 'image/jpeg'
    }
  })
  
  // 一時ファイル削除
  fs.unlinkSync(tempFilePath)
  fs.unlinkSync(compressedFilePath)
  fs.unlinkSync(thumbnailFilePath)
})
```

---

## 🔁 重複排除戦略

### ファイルハッシュ生成

```typescript
async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
```

### 重複チェック

```typescript
async function checkDuplicate(
  userId: string, 
  fileHash: string
): Promise<DuplicateCheckResult> {
  const existingFile = await db
    .collection('users')
    .doc(userId)
    .collection('uploaded_files')
    .where('fileHash', '==', fileHash)
    .where('isDeleted', '==', false)
    .limit(1)
    .get()
  
  if (existingFile.empty) {
    return {
      isDuplicate: false
    }
  }
  
  const file = existingFile.docs[0].data() as UploadedFile
  
  return {
    isDuplicate: true,
    existingFileId: file.id,
    existingFileUrl: file.downloadUrl,
    message: `同じファイルが既にアップロードされています（${file.fileName}）`
  }
}
```

### 重複時の処理

**オプション1: 既存ファイルを参照**（推奨）
- 新規アップロードせず、既存ファイルのURLを参照
- ストレージ容量を節約

**オプション2: 上書き確認**
- ユーザーに確認してから新規アップロード

**オプション3: 強制アップロード**
- 重複を無視して新規アップロード

---

## 📱 UI/UX設計

### 1. ファイルアップロードコンポーネント

```tsx
<FileUploadZone>
  <Dropzone
    onDrop={handleDrop}
    accept={{
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    }}
    maxSize={50 * 1024 * 1024} // 50MB
    multiple
  >
    {({ getRootProps, getInputProps, isDragActive }) => (
      <DropzoneArea {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <DragActiveMessage>
            <Icon name="upload" size="large" />
            <Text>ここにドロップしてアップロード</Text>
          </DragActiveMessage>
        ) : (
          <DefaultMessage>
            <Icon name="image" size="large" />
            <Text>ファイルをドラッグ&ドロップ または クリックして選択</Text>
            <Hint>最大50MB、JPEG/PNG/GIF/WebP形式</Hint>
          </DefaultMessage>
        )}
      </DropzoneArea>
    )}
  </Dropzone>
  
  {/* アップロード中のファイル一覧 */}
  {uploadingFiles.length > 0 && (
    <UploadingFilesList>
      {uploadingFiles.map(file => (
        <UploadingFileCard key={file.fileId}>
          <FileInfo>
            <FileName>{file.fileName}</FileName>
            <FileSize>{formatBytes(file.fileSizeBytes)}</FileSize>
          </FileInfo>
          
          <ProgressBar value={file.progress} max={100} />
          
          <ProgressText>
            {file.status === 'uploading' && `${file.progress}%`}
            {file.status === 'completed' && '✓ 完了'}
            {file.status === 'failed' && `✗ 失敗: ${file.errorMessage}`}
          </ProgressText>
          
          {file.status === 'uploading' && (
            <CancelButton onClick={() => handleCancel(file.fileId)}>
              キャンセル
            </CancelButton>
          )}
        </UploadingFileCard>
      ))}
    </UploadingFilesList>
  )}
  
  {/* 全体の進捗 */}
  {uploadSession && (
    <OverallProgress>
      <ProgressHeader>
        <Text>
          アップロード中: {uploadSession.completedFiles}/{uploadSession.totalFiles}
        </Text>
        <Text>
          {formatBytes(uploadSession.uploadedBytes)} / {formatBytes(uploadSession.totalBytes)}
        </Text>
      </ProgressHeader>
      <ProgressBar value={uploadSession.overallProgress} max={100} />
    </OverallProgress>
  )}
</FileUploadZone>
```

### 2. ストレージ使用状況ダッシュボード

```tsx
<StorageUsageDashboard>
  <UsageSummary>
    <UsageHeader>
      <Title>ストレージ使用状況</Title>
      <PlanBadge plan={plan}>{plan.name}</PlanBadge>
    </UsageHeader>
    
    <UsageBar>
      <ProgressBar 
        value={usage.usagePercentage} 
        max={100}
        color={getUsageColor(usage.usagePercentage)}
      />
      <UsageText>
        {usage.totalUsedGB.toFixed(2)}GB / {usage.quotaLimitGB === -1 ? '無制限' : `${usage.quotaLimitGB}GB`}
        {usage.quotaLimitGB !== -1 && ` (${usage.usagePercentage.toFixed(0)}%)`}
      </UsageText>
    </UsageBar>
    
    {usage.usagePercentage >= 80 && (
      <WarningMessage color={usage.usagePercentage >= 100 ? 'red' : 'yellow'}>
        <Icon name="warning" />
        {usage.usagePercentage >= 100 
          ? 'ストレージ容量が上限に達しています。ファイルを削除するか、プランをアップグレードしてください。'
          : 'ストレージ容量が残り少なくなっています。'
        }
      </WarningMessage>
    )}
    
    {plan.id !== 'globetrotter' && (
      <UpgradeButton onClick={handleUpgrade}>
        <Icon name="arrow-up" />
        プランをアップグレード
      </UpgradeButton>
    )}
  </UsageSummary>
  
  <UsageBreakdown>
    <SectionHeader>ファイルタイプ別</SectionHeader>
    <FileTypeList>
      <FileTypeItem>
        <Icon name="image" />
        <Label>画像</Label>
        <Size>{formatBytes(usage.fileTypeUsage.images)}</Size>
      </FileTypeItem>
      <FileTypeItem>
        <Icon name="file" />
        <Label>ドキュメント</Label>
        <Size>{formatBytes(usage.fileTypeUsage.documents)}</Size>
      </FileTypeItem>
      <FileTypeItem>
        <Icon name="video" />
        <Label>動画</Label>
        <Size>{formatBytes(usage.fileTypeUsage.videos)}</Size>
      </FileTypeItem>
      <FileTypeItem>
        <Icon name="folder" />
        <Label>その他</Label>
        <Size>{formatBytes(usage.fileTypeUsage.other)}</Size>
      </FileTypeItem>
    </FileTypeList>
  </UsageBreakdown>
  
  <TripUsageList>
    <SectionHeader>旅行別使用状況</SectionHeader>
    {Object.values(usage.tripUsage).map(trip => (
      <TripUsageCard key={trip.tripId}>
        <TripInfo>
          <TripTitle>{trip.tripTitle}</TripTitle>
          <FileCount>{trip.fileCount}ファイル</FileCount>
        </TripInfo>
        <TripSize>{formatBytes(trip.usedBytes)}</TripSize>
        <ManageButton onClick={() => handleManageTrip(trip.tripId)}>
          管理
        </ManageButton>
      </TripUsageCard>
    ))}
  </TripUsageList>
  
  <RecalculateButton onClick={handleRecalculate}>
    使用量を再計算
  </RecalculateButton>
</StorageUsageDashboard>
```

### 3. クォータ超過ダイアログ

```tsx
<QuotaExceededDialog>
  <DialogHeader>
    <Icon name="warning" color="red" />
    ストレージ容量が不足しています
  </DialogHeader>
  
  <DialogBody>
    <Message>
      アップロードしようとしているファイルのサイズが、
      残りのストレージ容量を超えています。
    </Message>
    
    <UsageInfo>
      <InfoRow>
        <Label>現在の使用量</Label>
        <Value>{usage.totalUsedGB.toFixed(2)}GB</Value>
      </InfoRow>
      <InfoRow>
        <Label>プラン上限</Label>
        <Value>{plan.limits.storageGB}GB</Value>
      </InfoRow>
      <InfoRow>
        <Label>残り容量</Label>
        <Value color="red">{remainingGB.toFixed(2)}GB</Value>
      </InfoRow>
    </UsageInfo>
    
    <SolutionsSection>
      <SectionHeader>解決方法</SectionHeader>
      <SolutionsList>
        <SolutionItem>
          <Icon name="trash" />
          <Text>不要なファイルを削除してスペースを確保</Text>
          <ActionButton onClick={() => navigate('/storage')}>
            ファイル管理
          </ActionButton>
        </SolutionItem>
        <SolutionItem>
          <Icon name="arrow-up" />
          <Text>プランをアップグレードして容量を増やす</Text>
          <ActionButton onClick={() => navigate('/subscription')} primary>
            プランを見る
          </ActionButton>
        </SolutionItem>
      </SolutionsList>
    </SolutionsSection>
  </DialogBody>
  
  <DialogFooter>
    <CancelButton onClick={handleClose}>閉じる</CancelButton>
  </DialogFooter>
</QuotaExceededDialog>
```

---

## 💰 コスト試算

### Firebase Storage
- **料金**: 
  - ストレージ: $0.026/GB/月
  - ダウンロード: $0.12/GB
  - アップロード: 無料
- **予想使用量**:
  - 100ユーザー × 平均200MB = 20GB
  - ストレージ: 20GB × $0.026 = **$0.52/月**
  - ダウンロード: 月間100GB × $0.12 = **$12/月**

### Firestore
- **ストレージ**: ファイルメタデータ → 微小コスト
- **読み取り/書き込み**: 月間50,000回 → 無料枠内

### 総コスト
- **月額約$12.5（約1,900円）**（ユーザー100人想定）
- **ユーザー1人あたり約19円/月**

---

## 🔐 セキュリティ

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // ユーザーファイル
    match /users/{userId}/{allPaths=**} {
      // 読み取り: 本人のみ
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // 書き込み: 本人のみ、かつクォータチェック
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      checkQuota(userId, request.resource.size);
    }
    
    // クォータチェック関数
    function checkQuota(userId, uploadSize) {
      let usage = firestore.get(/databases/(default)/documents/users/$(userId)/storage_usage/summary);
      let plan = firestore.get(/databases/(default)/documents/users/$(userId)/subscription/current);
      let quotaBytes = plan.data.limits.storageGB * 1024 * 1024 * 1024;
      
      // 無制限プランの場合
      if (plan.data.limits.storageGB == -1) {
        return true;
      }
      
      // クォータチェック
      return usage.data.totalUsedBytes + uploadSize <= quotaBytes;
    }
  }
}
```

### ファイルバリデーション

```typescript
function validateFile(file: File): ValidationResult {
  const errors: string[] = []
  
  // ファイルサイズチェック（最大50MB）
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`ファイルサイズが大きすぎます（最大${formatBytes(MAX_FILE_SIZE)}）`)
  }
  
  // ファイルタイプチェック
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ]
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push(`サポートされていないファイル形式です（${file.type}）`)
  }
  
  // ファイル名チェック
  const INVALID_CHARS = /[<>:"|?*]/
  if (INVALID_CHARS.test(file.name)) {
    errors.push('ファイル名に使用できない文字が含まれています')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

---

## 🧪 テスト戦略

### 1. ユニットテスト
- クォータチェックロジックのテスト
- 画像圧縮機能のテスト
- ファイルハッシュ生成のテスト
- バリデーション機能のテスト

### 2. 統合テスト
- Firebase Storage連携のテスト
- アップロード→メタデータ保存の一連のフロー
- 重複チェック機能のテスト

### 3. E2Eテスト
- ユーザーがファイルをアップロード
- 進捗表示の動作確認
- クォータ超過時の挙動確認
- ファイル削除→使用量更新の確認

### 4. パフォーマンステスト
- 大量ファイル（50枚）の一括アップロード
- 大容量ファイル（50MB）のアップロード
- 並列アップロードのパフォーマンス

---

## 🚀 実装ステップ

### Phase 1: 基礎実装（1週間）
- [ ] Firestoreスキーマ実装
- [ ] 基本的なAPI実装
- [ ] Firebase Storage連携

### Phase 2: クォータ管理（1週間）
- [ ] 使用量計算ロジック
- [ ] クォータチェック機能
- [ ] プラン別制限実装

### Phase 3: 画像圧縮（1週間）
- [ ] クライアント側圧縮実装
- [ ] サムネイル生成
- [ ] サーバー側圧縮（Cloud Functions）

### Phase 4: アップロードUI（1週間）
- [ ] ドラッグ&ドロップUI
- [ ] 進捗表示
- [ ] エラーハンドリング

### Phase 5: 重複排除（1週間）
- [ ] ファイルハッシュ生成
- [ ] 重複チェック機能
- [ ] 重複時の処理

### Phase 6: 使用量ダッシュボード（1週間）
- [ ] 使用状況表示UI
- [ ] 旅行別使用量表示
- [ ] ファイル管理UI

### Phase 7: テスト・デバッグ（1週間）
- [ ] ユニットテスト作成
- [ ] 統合テスト
- [ ] パフォーマンステスト

### Phase 8: ドキュメント・リリース（1週間）
- [ ] ユーザーガイド作成
- [ ] API仕様書更新
- [ ] リリースノート作成

**総工数**: 約8週間（2ヶ月）

---

## ⚠️ リスク・課題

### 技術的リスク
1. **Firebase Storage制限**: クォータ超過 → モニタリング必須
2. **圧縮品質**: 圧縮しすぎると画質劣化 → 適切なバランス調整
3. **アップロード失敗**: ネットワークエラー → リトライ機能必須

### ビジネスリスク
1. **ストレージコスト**: ユーザー増加でコスト増 → プラン制限で抑制
2. **ユーザー不満**: クォータ制限への不満 → 丁寧な説明・アップグレード誘導

---

## 🔄 将来の拡張

### v1.13.0以降
- **動画アップロード対応**: MP4等の動画ファイル
- **一括ダウンロード**: 旅行の全ファイルをZIPでダウンロード
- **CDN統合**: Firebase Hosting CDNで高速配信
- **AIタグ付け**: 画像認識で自動タグ付け
- **ゴミ箱機能**: 削除ファイルの一時保管

---

## 📚 参考資料

### 公式ドキュメント
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- [React Dropzone](https://react-dropzone.js.org/)

### 既存実装
- `lib/storage/image-upload.ts`: 画像アップロード機能
- `lib/subscription/plan-limits.ts`: プラン制限チェック
- `components/ui/ImageUpload.tsx`: 画像アップロードUI

---

**このドキュメントは実装開始前に関係者のレビューを受けてください。**

