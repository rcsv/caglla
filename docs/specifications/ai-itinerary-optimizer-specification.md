# AI旅程最適化アシスタント機能 仕様書

**対象バージョン**: v1.12.0  
**作成日**: 2025-10-20  
**ステータス**: 設計中

---

## 📌 エグゼクティブサマリー

### 概要
OpenAI GPT-4を活用して、ユーザーの旅行履歴・好み・予算・目的に基づいて最適な旅程を自動提案するAIアシスタント機能。

### 目的
- 旅程計画の手間を大幅削減
- 個人の好みに合わせたパーソナライズ提案
- 効率的な時間配分と予算配分
- 新しい発見と旅の質向上

### 主要機能
- **スマート旅程生成**: 目的地・日数・予算から自動で旅程を生成
- **パーソナライズ提案**: 過去の旅行履歴から好みを学習
- **予算最適化**: 予算内で最大限楽しめるプランを提案
- **混雑回避提案**: 人気スポットの混雑時間帯を避けた提案
- **リアルタイム調整**: 天候・交通状況に応じた動的な旅程調整

---

## 🎯 ユーザーストーリー

### ストーリー1: 新規旅行の自動生成
1. ユーザーが「東京3泊4日、予算10万円、美術館とカフェが好き」と入力
2. AIが過去の旅行履歴を分析し、好みを把握
3. 具体的な旅程（訪問スポット、時間配分、予算配分）を自動生成
4. ユーザーは内容を確認し、気に入った部分を採用

### ストーリー2: 既存旅程の最適化
1. ユーザーが作成中の旅程を選択
2. 「この旅程を最適化」ボタンをクリック
3. AIが移動時間・費用・混雑状況を分析し、改善案を提示
4. 「訪問順序を変更すると2時間短縮できます」などの具体的な提案

### ストーリー3: リアルタイム提案
1. 旅行当日、雨が降ってきた
2. AIが「屋外予定を屋内に変更しませんか？」と提案
3. 近くの美術館・ショッピングモールなど代替案を表示
4. ワンクリックで旅程を差し替え

---

## 🏗️ 技術スタック

### AI/ML
- **OpenAI GPT-4**: 自然言語処理・旅程生成
- **LangChain**: LLMアプリケーションフレームワーク
- **Vector Database (Pinecone)**: ユーザー好みのベクトル検索

### データソース
- **Google Places API**: スポット情報・レビュー・営業時間
- **Google Distance Matrix API**: 移動時間・距離計算
- **OpenWeatherMap API**: 天気予報
- **過去の旅行履歴**: Firestoreから取得

### Firebase
- **Firestore**: AI提案履歴・ユーザー好み保存
- **Cloud Functions**: バックグラウンドAI処理
- **Authentication**: ユーザー認証

---

## 📊 データモデル

### 1. AI提案履歴（Firestoreコレクション: `users/{userId}/ai_suggestions`）

```typescript
interface AISuggestion {
  id: string
  userId: string
  
  // 入力情報
  input: {
    type: 'new-trip' | 'optimize-trip' | 'realtime-adjustment'
    destination?: string
    countries?: string[]
    days?: number
    budget?: number
    currency?: string
    interests?: string[] // ['art', 'cafe', 'nature', 'history', ...]
    travelStyle?: 'relaxed' | 'packed' | 'balanced'
    companions?: 'solo' | 'couple' | 'family' | 'friends'
    customPrompt?: string // ユーザーの自由入力
    
    // 最適化の場合
    existingTripId?: string
    existingItineraries?: any[]
  }
  
  // AI出力
  output: {
    generatedItineraries: Array<{
      dayNumber: number
      date: string
      itineraries: Array<{
        startTime: string
        endTime: string
        title: string
        description: string
        placeId?: string
        placeName?: string
        vicinity?: string
        activityType: string
        estimatedCost?: number
        estimatedDuration?: number
        travelTimeFromPrevious?: number
        travelMode?: 'DRIVING' | 'WALKING' | 'TRANSIT'
        confidence: number // 0-100: 提案の確信度
        reasoning: string // なぜこれを提案したか
      }>
      totalCost: number
      totalDuration: number
    }>
    totalEstimatedCost: number
    optimizationSuggestions?: string[] // 改善提案
    warnings?: string[] // 注意事項
    alternatives?: any[] // 代替案
  }
  
  // メタデータ
  status: 'generating' | 'completed' | 'failed' | 'applied' | 'rejected'
  processingTimeMs: number
  tokensUsed: number
  costUSD: number
  modelVersion: string // 'gpt-4-turbo-preview'
  
  // ユーザーフィードバック
  userRating?: number // 1-5
  userFeedback?: string
  appliedItems?: string[] // 採用した提案のID
  
  createdAt: number
  updatedAt: number
}
```

### 2. ユーザー好みプロファイル（Firestoreコレクション: `users/{userId}/preferences`）

```typescript
interface UserTravelPreferences {
  userId: string
  
  // 学習済みの好み
  interests: {
    [category: string]: number // 0-100のスコア
    // 例: { 'art': 85, 'nature': 60, 'shopping': 30 }
  }
  
  preferredActivityTypes: {
    [type: string]: number
    // 例: { 'sightseeing': 90, 'dining': 70, 'shopping': 40 }
  }
  
  budgetProfile: {
    averageDailyCost: number
    accommodationBudgetRatio: number // 0-1
    diningBudgetRatio: number
    activityBudgetRatio: number
    transportBudgetRatio: number
  }
  
  travelStyle: {
    pacePreference: 'relaxed' | 'balanced' | 'packed'
    morningPersonScore: number // 0-100: 朝型か夜型か
    planningStyle: 'structured' | 'flexible' | 'spontaneous'
  }
  
  preferredDestinations: {
    [country: string]: number // 訪問回数・好みスコア
  }
  
  avoidances: string[] // 避けたいもの ['crowded', 'expensive', 'heights']
  
  // メタデータ
  lastUpdatedAt: number
  learningDataCount: number // 学習に使用した旅行データ数
  confidenceScore: number // 0-100: プロファイルの信頼度
}
```

### 3. AI設定（Firestoreコレクション: `users/{userId}/ai_settings`）

```typescript
interface AISettings {
  userId: string
  
  // 機能ON/OFF
  isEnabled: boolean
  autoSuggestEnabled: boolean // 旅程作成時に自動提案
  realtimeAdjustmentEnabled: boolean // リアルタイム調整
  
  // 提案の傾向設定
  suggestionStyle: 'conservative' | 'balanced' | 'adventurous'
  creativityLevel: number // 0-100: AIの創造性レベル
  
  // 通知設定
  notifyOnNewSuggestion: boolean
  notifyOnWeatherChange: boolean
  
  // プライバシー
  allowLearningFromHistory: boolean // 過去データから学習するか
  allowAnonymousDataSharing: boolean // 匿名データの研究利用許可
  
  createdAt: number
  updatedAt: number
}
```

---

## 🔧 API設計

### 1. AI提案生成API

#### `POST /api/ai/generate-itinerary`
新規旅程を自動生成

**Request:**
```typescript
{
  destination: string
  countries?: string[]
  startDate: string // ISO 8601
  endDate: string
  budget?: number
  currency?: string
  interests?: string[]
  travelStyle?: 'relaxed' | 'packed' | 'balanced'
  companions?: 'solo' | 'couple' | 'family' | 'friends'
  customPrompt?: string
}
```

**Response:**
```typescript
{
  success: boolean
  suggestionId: string
  suggestion: AISuggestion
}
```

#### `POST /api/ai/optimize-itinerary`
既存旅程を最適化

**Request:**
```typescript
{
  tripId: string
  optimizationGoals?: Array<'time' | 'cost' | 'experience' | 'avoid-crowds'>
  constraints?: {
    maxBudget?: number
    maxDailyHours?: number
    mustVisitPlaces?: string[]
  }
}
```

**Response:**
```typescript
{
  success: boolean
  suggestionId: string
  optimizations: Array<{
    type: 'reorder' | 'replace' | 'remove' | 'add'
    target: string // itinerary ID
    suggestion: string
    estimatedImprovement: {
      timeSavedMinutes?: number
      costSavedAmount?: number
      experienceScore?: number // 0-100
    }
  }>
}
```

#### `POST /api/ai/realtime-adjustment`
リアルタイム旅程調整提案

**Request:**
```typescript
{
  tripId: string
  currentLocation?: {
    lat: number
    lng: number
  }
  currentTime: string // ISO 8601
  context?: 'weather-change' | 'delay' | 'early-finish' | 'custom'
  contextDetails?: any
}
```

**Response:**
```typescript
{
  success: boolean
  adjustments: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low'
    message: string
    alternatives: Array<{
      itineraryId: string
      replacement: any
      reasoning: string
    }>
  }>
}
```

---

### 2. ユーザー好み管理API

#### `GET /api/ai/preferences`
ユーザー好みプロファイルを取得

**Response:**
```typescript
{
  preferences: UserTravelPreferences
}
```

#### `POST /api/ai/preferences/refresh`
旅行履歴から好みを再学習

**Response:**
```typescript
{
  success: boolean
  preferences: UserTravelPreferences
  learningDataCount: number
}
```

#### `PATCH /api/ai/preferences`
好みを手動で調整

**Request:**
```typescript
{
  interests?: { [category: string]: number }
  avoidances?: string[]
  travelStyle?: any
}
```

---

### 3. AI設定API

#### `GET /api/ai/settings`
AI設定を取得

**Response:**
```typescript
{
  settings: AISettings
}
```

#### `PATCH /api/ai/settings`
AI設定を更新

**Request:**
```typescript
{
  isEnabled?: boolean
  autoSuggestEnabled?: boolean
  suggestionStyle?: 'conservative' | 'balanced' | 'adventurous'
  creativityLevel?: number
}
```

---

### 4. フィードバックAPI

#### `POST /api/ai/suggestions/{id}/feedback`
AI提案へのフィードバック

**Request:**
```typescript
{
  rating: number // 1-5
  feedback?: string
  appliedItems?: string[]
}
```

**Response:**
```typescript
{
  success: boolean
}
```

---

## 🤖 AI処理ロジック

### プロンプト設計

#### 1. **旅程生成プロンプト**

```typescript
const systemPrompt = `
あなたは経験豊富な旅行プランナーです。ユーザーの好みや予算に基づいて、最適な旅程を提案してください。

【重要な原則】
1. 移動時間を現実的に見積もる（Google Distance Matrix APIを活用）
2. 営業時間・定休日を考慮する
3. 予算を超えないように注意する
4. 混雑を避ける時間帯を選ぶ
5. 食事の時間を適切に配置する
6. 余裕を持った時間配分（詰め込みすぎない）

【出力形式】JSON
{
  "days": [
    {
      "dayNumber": 1,
      "date": "2025-10-25",
      "itineraries": [
        {
          "startTime": "09:00",
          "endTime": "11:00",
          "title": "東京国立博物館",
          "description": "日本最古の博物館。国宝・重要文化財を多数展示。",
          "placeId": "ChIJ...",
          "placeName": "東京国立博物館",
          "vicinity": "東京都台東区上野公園13-9",
          "activityType": "sightseeing",
          "estimatedCost": 1000,
          "estimatedDuration": 120,
          "travelTimeFromPrevious": 0,
          "travelMode": "WALKING",
          "confidence": 90,
          "reasoning": "ユーザーは美術館・博物館への関心が高いため。朝一番の空いている時間帯を選択。"
        },
        ...
      ],
      "totalCost": 15000,
      "totalDuration": 480
    }
  ],
  "totalEstimatedCost": 45000,
  "optimizationSuggestions": [
    "2日目の移動時間を短縮するため、訪問順序を変更することをおすすめします。",
    "予算に余裕があるため、高級レストランを1回追加できます。"
  ],
  "warnings": [
    "3日目は祝日のため、観光地が混雑する可能性があります。"
  ]
}
`

const userPrompt = `
【旅行情報】
- 目的地: ${input.destination}
- 期間: ${input.startDate} 〜 ${input.endDate}（${input.days}日間）
- 予算: ${input.budget} ${input.currency}
- 興味: ${input.interests.join(', ')}
- 旅行スタイル: ${input.travelStyle}
- 同行者: ${input.companions}

【ユーザーの過去の好み】
${JSON.stringify(userPreferences, null, 2)}

【追加リクエスト】
${input.customPrompt || 'なし'}

上記の情報を元に、最適な旅程を提案してください。
`
```

#### 2. **旅程最適化プロンプト**

```typescript
const optimizationPrompt = `
以下の既存旅程を分析し、改善案を提案してください。

【既存旅程】
${JSON.stringify(existingItineraries, null, 2)}

【最適化目標】
${optimizationGoals.join(', ')}

【制約条件】
- 最大予算: ${constraints.maxBudget}
- 1日の最大時間: ${constraints.maxDailyHours}時間
- 必須訪問地: ${constraints.mustVisitPlaces.join(', ')}

【改善の観点】
1. 移動時間の削減（訪問順序の最適化）
2. 待ち時間の削減（混雑回避）
3. 予算の効率化（コスパの良い選択肢）
4. 体験の質向上（より良いスポット・レストラン）

【出力形式】JSON
{
  "optimizations": [
    {
      "type": "reorder",
      "target": "itinerary-id-123",
      "suggestion": "「浅草寺」と「スカイツリー」の訪問順序を入れ替えると、移動時間が30分短縮されます。",
      "estimatedImprovement": {
        "timeSavedMinutes": 30,
        "costSavedAmount": 0,
        "experienceScore": 85
      }
    },
    ...
  ]
}
`
```

#### 3. **リアルタイム調整プロンプト**

```typescript
const realtimePrompt = `
旅行中のリアルタイム状況変化に対して、適切な代替案を提案してください。

【現在の状況】
- 現在地: ${currentLocation}
- 現在時刻: ${currentTime}
- 状況: ${context}（${contextDetails}）

【予定されている旅程】
${JSON.stringify(upcomingItineraries, null, 2)}

【天気情報】
${JSON.stringify(weatherData, null, 2)}

【提案の観点】
1. 屋内/屋外の切り替え（天候変化時）
2. 近隣の代替スポット（遅延時）
3. 時間調整（早く終わった場合）

【出力形式】JSON
{
  "adjustments": [
    {
      "priority": "high",
      "message": "雨が降り始めました。屋外予定を屋内に変更することをおすすめします。",
      "alternatives": [
        {
          "itineraryId": "itinerary-id-456",
          "replacement": {
            "title": "国立新美術館",
            "placeId": "ChIJ...",
            "reasoning": "近くの屋内施設。ユーザーの美術館への関心が高い。"
          }
        }
      ]
    }
  ]
}
`
```

---

### 学習アルゴリズム

#### ユーザー好みの学習

```typescript
async function learnUserPreferences(userId: string): Promise<UserTravelPreferences> {
  // 1. 過去の旅行データを取得
  const trips = await getCompletedTrips(userId)
  const itineraries = await getAllItineraries(userId)
  
  // 2. 興味カテゴリのスコア算出
  const interestScores: { [category: string]: number } = {}
  for (const itinerary of itineraries) {
    const category = itinerary.activityType
    interestScores[category] = (interestScores[category] || 0) + 1
  }
  
  // 正規化（0-100スケール）
  const maxCount = Math.max(...Object.values(interestScores))
  for (const category in interestScores) {
    interestScores[category] = (interestScores[category] / maxCount) * 100
  }
  
  // 3. 予算プロファイル算出
  const totalCosts = trips.map(t => t.totalCost || 0)
  const averageDailyCost = totalCosts.reduce((a, b) => a + b, 0) / trips.length / 
                           trips.reduce((acc, t) => acc + t.days, 0)
  
  // 4. 旅行スタイル推定
  const averageItinerariesPerDay = itineraries.length / trips.reduce((acc, t) => acc + t.days, 0)
  const pacePreference = 
    averageItinerariesPerDay > 6 ? 'packed' :
    averageItinerariesPerDay < 4 ? 'relaxed' : 'balanced'
  
  // 5. 朝型・夜型スコア算出
  const morningActivities = itineraries.filter(i => 
    new Date(i.startTime).getHours() < 10
  ).length
  const morningPersonScore = (morningActivities / itineraries.length) * 100
  
  return {
    userId,
    interests: interestScores,
    preferredActivityTypes: { /* ... */ },
    budgetProfile: {
      averageDailyCost,
      accommodationBudgetRatio: 0.4,
      diningBudgetRatio: 0.3,
      activityBudgetRatio: 0.2,
      transportBudgetRatio: 0.1
    },
    travelStyle: {
      pacePreference,
      morningPersonScore,
      planningStyle: 'balanced'
    },
    preferredDestinations: { /* ... */ },
    avoidances: [],
    lastUpdatedAt: Date.now(),
    learningDataCount: trips.length,
    confidenceScore: Math.min(trips.length * 10, 100)
  }
}
```

---

## 💰 コスト試算

### OpenAI GPT-4 Turbo
- **料金**: 
  - 入力: $0.01/1K tokens
  - 出力: $0.03/1K tokens
- **旅程生成1回あたりのトークン数**:
  - システムプロンプト: 500 tokens
  - ユーザー入力: 1,000 tokens
  - AI出力: 3,000 tokens
- **コスト**: (1,500 × $0.01 + 3,000 × $0.03) / 1,000 = **$0.105/回（約15円）**

### 月間コスト試算
- 100ユーザー × 月5回生成 = 500回/月
- **500回 × $0.105 = $52.5/月（約7,800円）**

### Pinecone（Vector Database）
- **料金**: $70/月（Starter）
- 100,000ベクトル、クエリ無制限

### 総コスト
- **月額約$122.5（約18,300円）**（ユーザー100人想定）
- **ユーザー1人あたり約183円/月**

---

## 📊 プラン別制限

### Season Traveler（無料プラン）
- AI旅程生成: ❌ 利用不可
- 理由: AIコストが高いため

### Backpacker（月額480円）
- AI旅程生成: ⚠️ 制限付き
- 月間生成上限: **5回/月**
- 最適化提案: ❌ 利用不可
- リアルタイム調整: ❌ 利用不可

### Globetrotter（月額980円）
- AI旅程生成: ✅ フル機能
- 月間生成上限: **無制限**
- 最適化提案: ✅ 利用可能
- リアルタイム調整: ✅ 利用可能
- 高度なパーソナライズ: ✅ 有効

---

## 🔐 セキュリティ・プライバシー

### データ保護
- **ユーザーデータ**: 匿名化してAI学習に使用（オプトアウト可能）
- **API通信**: HTTPS暗号化
- **ログ保存**: AI入出力を30日間保存（デバッグ用、その後自動削除）

### ユーザー制御
- **学習ON/OFF**: 過去データからの学習を無効化可能
- **データ削除**: AI提案履歴・好みプロファイルをいつでも削除可能
- **透明性**: AIがどのデータを使ったか表示

### OpenAI利用規約遵守
- **Data Usage Policy**: ユーザーデータはモデル学習に使用されない（Opt-out設定）
- **コンプライアンス**: GDPR・個人情報保護法に準拠

---

## 📱 UI/UX設計

### 1. AI旅程生成ダイアログ

**場所**: 新規旅行作成時

**UI要素**:
```tsx
<AIItineraryGeneratorDialog>
  <DialogHeader>
    <Icon name="sparkles" />
    AIが旅程を自動生成
  </DialogHeader>
  
  <DialogBody>
    <Input label="目的地" value={destination} required />
    <DateRangePicker label="期間" startDate={startDate} endDate={endDate} required />
    <Input label="予算" type="number" value={budget} suffix={currency} />
    
    <MultiSelect label="興味・好み" value={interests}>
      <Option value="art">美術館・博物館</Option>
      <Option value="nature">自然・ハイキング</Option>
      <Option value="shopping">ショッピング</Option>
      <Option value="dining">グルメ・レストラン</Option>
      <Option value="history">歴史・文化</Option>
      <Option value="nightlife">ナイトライフ</Option>
    </MultiSelect>
    
    <RadioGroup label="旅行スタイル" value={travelStyle}>
      <Radio value="relaxed">ゆったり（1日3-4箇所）</Radio>
      <Radio value="balanced">バランス（1日5-6箇所）</Radio>
      <Radio value="packed">詰め込み（1日7箇所以上）</Radio>
    </RadioGroup>
    
    <Select label="同行者" value={companions}>
      <option value="solo">一人旅</option>
      <option value="couple">カップル・夫婦</option>
      <option value="family">家族</option>
      <option value="friends">友人</option>
    </Select>
    
    <Textarea 
      label="追加リクエスト（オプション）" 
      value={customPrompt}
      placeholder="例: 朝はゆっくりしたい、ベジタリアン対応のレストランを含めて"
    />
    
    <Toggle 
      label="過去の旅行履歴から好みを学習"
      checked={allowLearning}
    />
  </DialogBody>
  
  <DialogFooter>
    <CancelButton>キャンセル</CancelButton>
    <GenerateButton onClick={handleGenerate}>
      <Icon name="sparkles" />
      AIに旅程を作成させる
    </GenerateButton>
  </DialogFooter>
</AIItineraryGeneratorDialog>
```

### 2. AI提案結果画面

**UI要素**:
```tsx
<AISuggestionResult>
  <ResultHeader>
    <Icon name="check-circle" color="green" />
    <Title>AI旅程が完成しました！</Title>
    <Subtitle>
      {days}日間、推定予算 {formatCost(totalEstimatedCost)}
    </Subtitle>
  </ResultHeader>
  
  <ConfidenceScore>
    <Label>提案の信頼度</Label>
    <ProgressBar value={confidenceScore} max={100} />
    <Text>{confidenceScore}%</Text>
  </ConfidenceScore>
  
  <OptimizationSuggestions>
    <Heading>💡 最適化のヒント</Heading>
    {optimizationSuggestions.map(s => (
      <SuggestionItem key={s}>{s}</SuggestionItem>
    ))}
  </OptimizationSuggestions>
  
  <Warnings>
    <Heading>⚠️ 注意事項</Heading>
    {warnings.map(w => (
      <WarningItem key={w}>{w}</WarningItem>
    ))}
  </Warnings>
  
  <DaysList>
    {generatedItineraries.map(day => (
      <DayCard key={day.dayNumber}>
        <DayHeader>
          Day {day.dayNumber} - {formatDate(day.date)}
        </DayHeader>
        
        <ItinerariesList>
          {day.itineraries.map(itinerary => (
            <ItineraryCard key={itinerary.id}>
              <TimeRange>
                {itinerary.startTime} - {itinerary.endTime}
              </TimeRange>
              <ItineraryInfo>
                <Title>{itinerary.title}</Title>
                <Description>{itinerary.description}</Description>
                <Meta>
                  <Cost>{formatCost(itinerary.estimatedCost)}</Cost>
                  <Duration>{itinerary.estimatedDuration}分</Duration>
                  {itinerary.travelTimeFromPrevious > 0 && (
                    <TravelTime>
                      移動 {itinerary.travelTimeFromPrevious}分
                    </TravelTime>
                  )}
                </Meta>
                <AIReasoning>
                  <Icon name="sparkles" size="small" />
                  {itinerary.reasoning}
                </AIReasoning>
              </ItineraryInfo>
              <Actions>
                <EditButton>編集</EditButton>
                <RemoveButton>削除</RemoveButton>
              </Actions>
            </ItineraryCard>
          ))}
        </ItinerariesList>
        
        <DayFooter>
          <TotalCost>合計: {formatCost(day.totalCost)}</TotalCost>
          <TotalDuration>所要時間: {day.totalDuration / 60}時間</TotalDuration>
        </DayFooter>
      </DayCard>
    ))}
  </DaysList>
  
  <ResultFooter>
    <ReGenerateButton>
      <Icon name="refresh" />
      別の案を生成
    </ReGenerateButton>
    <ApplyButton onClick={handleApply}>
      <Icon name="check" />
      この旅程を採用
    </ApplyButton>
  </ResultFooter>
  
  <FeedbackSection>
    <Heading>この提案はいかがでしたか？</Heading>
    <StarRating value={rating} onChange={setRating} />
    <Textarea 
      placeholder="フィードバックをお聞かせください（任意）"
      value={feedback}
      onChange={setFeedback}
    />
    <SubmitButton onClick={handleSubmitFeedback}>
      フィードバックを送信
    </SubmitButton>
  </FeedbackSection>
</AISuggestionResult>
```

### 3. 旅程最適化ボタン

**場所**: 旅行詳細ページ > ヘッダー

**UI要素**:
```tsx
<TripHeaderActions>
  <OptimizeButton onClick={handleOptimize}>
    <Icon name="sparkles" />
    AIで最適化
  </OptimizeButton>
</TripHeaderActions>

<OptimizationDialog>
  <DialogHeader>旅程を最適化</DialogHeader>
  
  <DialogBody>
    <CheckboxGroup label="最適化の目標">
      <Checkbox value="time">移動時間を短縮</Checkbox>
      <Checkbox value="cost">コストを削減</Checkbox>
      <Checkbox value="experience">体験の質を向上</Checkbox>
      <Checkbox value="avoid-crowds">混雑を回避</Checkbox>
    </CheckboxGroup>
    
    <ConstraintsSection>
      <Heading>制約条件（オプション）</Heading>
      <Input label="最大予算" type="number" value={maxBudget} />
      <Input label="1日の最大時間" type="number" value={maxDailyHours} suffix="時間" />
      <MultiSelect label="必須訪問地" value={mustVisitPlaces} />
    </ConstraintsSection>
  </DialogBody>
  
  <DialogFooter>
    <CancelButton>キャンセル</CancelButton>
    <OptimizeButton onClick={handleRunOptimization}>
      最適化を実行
    </OptimizeButton>
  </DialogFooter>
</OptimizationDialog>
```

---

## 🧪 テスト戦略

### 1. ユニットテスト
- プロンプト生成ロジックのテスト
- ユーザー好み学習アルゴリズムのテスト
- JSON出力のパース・バリデーション

### 2. 統合テスト
- OpenAI API統合のテスト
- Google Places API連携のテスト
- Firestore読み書きのテスト

### 3. E2Eテスト
- ユーザーが旅程生成を実行
- AI提案を確認・編集・採用
- フィードバック送信

### 4. 品質テスト
- **精度評価**: 人間の評価者による提案品質チェック
- **コスト監視**: トークン使用量・コストのモニタリング
- **レスポンス時間**: 生成時間が10秒以内か確認

---

## 🚀 実装ステップ

### Phase 1: 基礎実装（2週間）
- [ ] OpenAI API統合
- [ ] LangChain セットアップ
- [ ] プロンプトエンジニアリング
- [ ] Firestoreスキーマ実装

### Phase 2: 旅程生成機能（2週間）
- [ ] 旅程生成API実装
- [ ] Google Places API統合
- [ ] Distance Matrix API統合
- [ ] JSON出力パース・バリデーション

### Phase 3: 学習機能（2週間）
- [ ] ユーザー好み学習アルゴリズム
- [ ] 好みプロファイル生成
- [ ] Vector Database統合（Pinecone）

### Phase 4: 最適化機能（1週間）
- [ ] 旅程最適化API実装
- [ ] 改善提案生成ロジック

### Phase 5: リアルタイム調整（1週間）
- [ ] リアルタイム調整API実装
- [ ] 天気API統合
- [ ] 代替案生成ロジック

### Phase 6: UI実装（2週間）
- [ ] AI旅程生成ダイアログ
- [ ] 提案結果画面
- [ ] 最適化ダイアログ
- [ ] フィードバックUI

### Phase 7: テスト・品質改善（2週間）
- [ ] ユニットテスト作成
- [ ] 統合テスト
- [ ] 精度評価
- [ ] プロンプト改善

### Phase 8: ドキュメント・リリース（1週間）
- [ ] ユーザーガイド作成
- [ ] API仕様書更新
- [ ] リリースノート作成

**総工数**: 約13週間（3.25ヶ月）

---

## ⚠️ リスク・課題

### 技術的リスク
1. **AI精度**: 提案品質にばらつき → プロンプト改善・人間レビュー
2. **レスポンス時間**: 生成に時間がかかる → ストリーミングレスポンス・進捗表示
3. **コスト増大**: ユーザー増加でAIコスト急増 → プラン制限・キャッシュ活用

### ビジネスリスク
1. **期待値ギャップ**: AIの提案がユーザー期待に届かない → オンボーディングで適切な期待値設定
2. **依存リスク**: OpenAI API障害時の対応 → フォールバック機能
3. **競合**: 他サービスも同様機能追加の可能性 → 精度・パーソナライズで差別化

---

## 🔄 将来の拡張

### v1.13.0以降
- **マルチモーダルAI**: 写真から旅程生成（GPT-4 Vision）
- **音声入力**: 音声で旅行希望を伝える
- **協調フィルタリング**: 他ユーザーの好みから推薦
- **旅行コンシェルジュチャット**: AIとの対話で旅程をブラッシュアップ
- **予算自動最適化**: 為替レート・価格変動に応じた動的調整

---

## 📚 参考資料

### 公式ドキュメント
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)
- [Pinecone Documentation](https://docs.pinecone.io/)

### 既存実装
- `lib/travel/route-optimization.ts`: ルート最適化ロジック
- `lib/api/google/places.ts`: Google Places API統合
- `lib/utils/date.ts`: 日付処理ユーティリティ

---

**このドキュメントは実装開始前に関係者のレビューを受けてください。**

