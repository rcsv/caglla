# チェックリスト機能 改善提案仕様書

本書は、既存のチェックリスト機能仕様に対して、検索性・状態保持・UX/運用面の改善案をまとめたものです。段階的な導入を前提に、実装オプション・メリット/デメリット・導入ステップを整理します。

---

## 1. Firestore検索性の向上（プリセット検索）

### 1.1 方針
プリセット（`checklist_presets`）の検索性を高め、タイトル・説明・タグ・人気順/新着順の高速検索を可能にする。

### 1.2 選択肢
- 選択肢A（推奨）: Firebase Extensions「Search with Algolia」
  - Firestore→Algoliaをイベント連動で自動同期
  - インデックス: `title`, `description`, `tags[]`, `usage_count`, `created_at`, `user_id`
  - ソート/ランキング: usage_count降順 > created_at降順、typo耐性、facets（tags）
  - 日本語対応: AlgoliaのJapanese plugin/同義語辞書を活用
  - 導入ポイント: 同期対象は`checklist_presets`に限定。Backfillを必ず実施。APIキーは`lib/env-validation.ts`で検証
- 選択肢B: Meilisearch/Typesense（セルフホスト）
  - Firestore→Pub/Sub→Cloud Runで同期
  - 日本語はn-gramトークナイズで対応
  - コスト最適・ベンダーロックイン回避だが運用負荷増

### 1.3 API/UIの変更点
- 検索APIをAlgoliaに切替（サーバールートまたはクライアント直叩き＋署名）
- クエリ: `query`/`sort(popular|recent)`/`tags[]`/`page`/`hitsPerPage`
- UI: タグフィルタ（facets）とソート切替を追加

### 1.4 環境変数（例）
- `ALGOLIA_APP_ID`
- `ALGOLIA_SEARCH_API_KEY`（クライアント用）
- `ALGOLIA_ADMIN_API_KEY`（サーバ用/拡張機能）
- `ALGOLIA_INDEX_PRESETS`（例: `caglla_presets_prod`）

### 1.5 導入ステップ
1) 拡張の導入とIndex作成 → 2) 既存データのBackfill → 3) API切替 → 4) UIのフィルタ/ソートを有効化

---

## 2. チェックリストの状態保持 改善

### 2.1 ドキュメント構造の見直し（配列→サブコレクション）
- 現状: `trip_checklists/{tripId}.items[]` で配列一括保存
- 問題: 部分更新が高コスト/同時編集に弱い/差分追跡困難
- 提案: `trip_checklists/{tripId}/items/{itemId}` 形式
  - メリット: 部分更新・並び順・権限・監査・同時編集に強い
  - 追加フィールド例:
    - `sortOrder: number`
    - `quantity?: number`, `unit?: string`, `note?: string`, `dueDate?: Timestamp`
    - `locked?: boolean`（再生成時に保護）
    - `sourceRuleId?: string`（生成元ルールの識別子）

### 2.2 共同編集/個人差分の両立
- 共同編集不要: 従来どおりtrip共有の単一状態
- 共同編集や個別完了を分離したい場合:
  - ベース: `trip_checklists/{tripId}/items/{itemId}`（項目定義）
  - 個人差分: `trip_checklist_states/{tripId}_{uid}/{itemId}`（完了/数量/メモなど）
  - 表示: ベース×ユーザー状態をマージ

### 2.3 再生成との整合性（手動編集の保護）
- `sourceRuleId` と `locked` を導入
  - 自動生成項目は `sourceRuleId` を保持
  - 再生成は同一 `sourceRuleId` の未ロック項目だけ上書き/再配置
  - 手動追加（`locked=true`/`isCustom=true`）は温存

### 2.4 オフライン/保存体験
- 楽観的更新 + デバウンス（200–500ms） + 自動リトライ
- トースト通知（保存中/成功/失敗）
- モバイルはIndexedDB/LocalStorageでローカルキャッシュ

### 2.5 パフォーマンス/コスト
- 部分更新で書き込み量を削減
- `usage_count` や `sortOrder` は `FieldValue.increment(1)` で安全に更新
- 必須インデックス: `tripId+sortOrder` の複合のみ（最小）

### 2.6 セキュリティルール例
```javascript
// items（ベース）
match /trip_checklists/{tripId}/items/{itemId} {
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/trips/$(tripId)).data.user_id == request.auth.uid;
}
// states（ユーザー差分）
match /trip_checklist_states/{stateId}/{itemId} {
  allow read, write: if request.auth != null &&
    stateId.split('_')[1] == request.auth.uid; // key = `${tripId}_${uid}`
}
```

### 2.7 段階的移行案
- Phase 1: 既存配列→サブコレ投入の二重書き（readは従来）
- Phase 2: readをサブコレへ切替（暗黙移行完了）
- Phase 3: 旧フィールドを削除、インデックス最適化

---

## 3. 追加改善（実装負荷の低い順）

### 3.1 UI/UX
- ヘッダーをsticky化、全選択/全解除、カテゴリ折りたたみ
- キーボード操作: Enterで追加、⌘/Ctrl+Kで検索、⌘/Ctrl+Backspaceで削除
- 数量（例: “下着 × 3”）のインライン編集

### 3.2 生成ロジック
- 行程・目的地の変更時に差分プレビュー（自動追従の候補を提示→反映）
- 季節タグ（winter/summer）を導入しルール精度を向上

### 3.3 分析/品質
- Firestore→BigQuery Exportで採用率/完了率を可視化
- ルール命中率・削除率を計測してルール改善サイクル構築

### 3.4 セキュリティ/運用
- 生成APIにレート制限（IP/uid×分）
- 公開プリセットの通報/非表示フラグ（簡易モデレーション）

---

## 4. 導入優先度（提案）
- P0: サブコレ化による状態保持の改善（Phase 1→2）
- P1: Algolia拡張による検索性向上（Backfill含む）
- P2: 生成ロジックの差分プレビュー
- P3: UI/UXの操作向上（sticky/ショートカット/数量編集）

---

## 5. 参考：必要な型拡張（例）
```ts
export interface ChecklistItemBase {
  id: string
  title: string
  description?: string
  category: 'preparation' | 'packing'
  priority?: 'high' | 'medium' | 'low'
  sortOrder?: number
  sourceRuleId?: string
  locked?: boolean
}

export interface ChecklistUserState {
  done?: boolean
  quantity?: number
  note?: string
  updated_at: FirestoreDate
}
```

---

## 6. 導入チェックリスト
- サブコレ化: 二重書き開始→read切替→旧フィールド削除
- Algolia: 拡張導入→Index設計→Backfill→API切替→UI対応
- Rules/Indexes: セキュリティルールと複合インデックスを適用
- 計測: usage_count/適用率/完了率をBigQueryで可視化
