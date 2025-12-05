# PDFテンプレートファイルのリファクタリング計画

## 📊 現状分析

- **ファイル**: `lib/utils/magazine-pdf-template.ts`
- **総行数**: 1,946行
- **問題点**:
  - ロジックとHTMLフラグメントが混在
  - スタイル定義が巨大（約870行）
  - 各ページテンプレート関数が混在
  - 編集・保守が困難

## 🎯 リファクタリング方針

### ディレクトリ構造

```
lib/utils/pdf/
├── index.ts                    # メインエクスポート（後方互換性）
├── types.ts                    # 型定義
├── styles.ts                   # CSSスタイル定義（約870行）
├── templates/                  # ページテンプレート
│   ├── cover.ts               # 表紙（約175行）
│   ├── toc.ts                 # 目次（約120行）
│   ├── reservations.ts        # 予約情報（約280行）
│   ├── itinerary.ts           # 旅程（約200行）
│   ├── emergency.ts           # 緊急連絡先（約20行）
│   ├── checklist.ts           # チェックリスト（約20行）
│   ├── memo.ts                # メモ（約40行）
│   └── back-cover.ts          # 裏表紙（約20行）
├── helpers/                    # ヘルパー関数
│   ├── utils.ts               # 共通ユーティリティ（escapeHtml, QR生成）
│   ├── reservation.ts         # 予約関連ヘルパー
│   ├── lodging.ts             # Lodging関連ヘルパー
│   └── map.ts                 # 地図関連ヘルパー
└── generator.ts                # メインPDF生成関数（約50行）
```

### 分割後のファイルサイズ予想

- `styles.ts`: 約870行（スタイルのみ）
- 各テンプレート: 50-280行
- ヘルパー: 20-100行
- 合計: 同じ行数だが、構造が明確

## 💡 メリット

1. **保守性向上**: 各ページを独立して編集可能
2. **可読性向上**: ファイルが小さくなり、目的が明確
3. **テスト容易性**: 各モジュールを個別にテスト可能
4. **再利用性**: ヘルパー関数を他の場所でも利用可能
5. **Git管理**: 変更箇所が明確（diffが見やすい）

## 🔄 移行戦略

### フェーズ1: 型定義とヘルパーの分離（非破壊的）
- `types.ts`を作成
- `helpers/utils.ts`を作成
- 元のファイルからインポートして使用

### フェーズ2: スタイルの分離（非破壊的）
- `styles.ts`を作成
- 元のファイルからインポート

### フェーズ3: テンプレートの分離（非破壊的）
- 各テンプレートファイルを作成
- `index.ts`で再エクスポート
- 元のファイルは後方互換性のために残す

### フェーズ4: 元ファイルの削除（破壊的）
- すべてのインポートが新しい構造を参照することを確認
- 元のファイルを削除

## 🔧 改善ポイント（実運用で効く追加改善）

### 1. PdfContext型の統一

各テンプレートで受け取る引数を統一するために、**PdfContext型**を定義：

```typescript
// types.ts
export interface PdfContext {
  trip: Trip;
  days: Day[];
  itinerariesByDay: Record<string, Itinerary[]>;
  config: PdfConfig;
  mapImages?: Record<string, string>;  // base64 map images
}
```

これにより、各テンプレート関数の引数がスッキリしてメンテナンスしやすくなる。

### 2. styles.tsの関数化（テーマ対応）

スタイル定義を関数化して、将来的なテーマ切り替えを可能に：

```typescript
export function generateMagazineStyles(options: StyleOptions = {}): string {
  const theme = options.theme || "light";
  const isDark = theme === "dark";
  // テーマに応じた色設定
  ...
}
```

→ 将来的に「夜景モードの旅のしおり」などに対応可能。

### 3. テンプレートは `string[]` を返す

ページ跨ぎの判断が難しいPDFでは、**1ページ1関数ではなく、ページ配列を返す**設計が安全：

```typescript
export function generateItineraryPages(ctx: PdfContext): string[] {
  return [
    /* 1ページ目HTML */,
    /* 2ページ目HTML */,
  ];
}
```

→ 後からgeneratorが合成しやすく、ページ跨ぎのバグを防げる。

### 4. generator.tsは「オーケストレーター」のみ

generator.tsは以下の責務のみ：
- スタイル呼び出し
- テンプレート呼び出し
- 結果の結合

```typescript
export function generateMagazinePdfHtml(ctx: PdfContext) {
  const styles = generateMagazineStyles(ctx.config);
  
  const pages = [
    ...generateCoverPage(ctx),
    ...generateTocPage(ctx),
    ...generateReservationsPage(ctx),
    ...generateItineraryPages(ctx),
    ...generateEmergencyPage(ctx),
    ...generateChecklistPage(ctx),
    ...generateMemoPage(ctx),
    ...generateBackCoverPage(ctx),
  ];
  
  return `
    <html>
      <head><style>${styles}</style></head>
      <body>${pages.join('\f')}</body>
    </html>
  `;
}
```

→ フレーム側の責務が明確で後悔しない。

## 📝 実装例

### index.ts（後方互換性を保つ）

```typescript
// すべてを再エクスポート（既存コードとの互換性を保つ）
export * from './types';
export { generateMagazineStyles } from './styles';
export { generateCoverPage } from './templates/cover';
export { generateTocPage } from './templates/toc';
export { generateReservationsPage } from './templates/reservations';
export { generateItineraryPages } from './templates/itinerary';
export { generateEmergencyPage } from './templates/emergency';
export { generateChecklistPage } from './templates/checklist';
export { generateMemoPage } from './templates/memo';
export { generateBackCoverPage } from './templates/back-cover';
export { generateMagazinePdfHtml } from './generator';
```

### フェーズ3.5: 旧ファイル → 新構造のエイリアス差し替え

移行前に、元のファイルを新構造へのエイリアスに変更：

```typescript
// magazine-pdf-template.ts（移行期間中）
export * from './pdf';
```

→ 移行ミスが起きた場合、IDEのジャンプでもすぐ追える。

この構造により、既存のコードを変更せずにリファクタリングできます。
