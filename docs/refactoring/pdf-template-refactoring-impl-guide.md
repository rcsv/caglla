# PDFテンプレートリファクタリング実装ガイド

## 📋 実装手順

### ステップ1: ヘルパー関数の分離

#### helpers/reservation.ts
```typescript
import type { Itinerary, ReservationInfo, ReservationType } from "@/lib/core/types";
import type { PdfContext } from "../types";

export function extractReservations(ctx: PdfContext): Array<{
  itinerary: Itinerary;
  reservation: ReservationInfo;
}> {
  // 実装...
}

export function getReservationTypeLabel(type: ReservationType): string {
  // 実装...
}

export function getReservationSiteLabel(site?: string): string {
  // 実装...
}
```

#### helpers/lodging.ts
```typescript
import type { Itinerary } from "@/lib/core/types";
import { escapeHtml } from "./utils";

export function extractLodgingItineraries(itineraries: Itinerary[]): Itinerary[] {
  // 実装...
}

export function generateLodgingSidebar(lodgingItineraries: Itinerary[]): string {
  // 実装...
}
```

#### helpers/map.ts
```typescript
export function generateStaticMapUrl(
  destinationPlaceId?: string,
  destinationPlace?: any,
): string | null {
  // 実装...
}
```

### ステップ2: テンプレート関数の実装（string[]を返す）

各テンプレートは必ず `string[]` を返す（ページ跨ぎ対応）。

#### templates/cover.ts の例
```typescript
import type { PdfContext } from "../types";
import { escapeHtml } from "../helpers/utils";
import { generateQRCode } from "../helpers/utils";

export async function generateCoverPage(ctx: PdfContext): Promise<string[]> {
  // 1ページ分のHTMLを返す（配列の1要素として）
  const html = `...`;
  return [html];
}
```

#### templates/itinerary.ts の例
```typescript
import type { PdfContext } from "../types";

export function generateItineraryPages(ctx: PdfContext): string[] {
  // 複数ページを返す場合でも配列で返す
  return ctx.days.map(day => {
    return `...`; // 1ページ分のHTML
  });
}
```

### ステップ3: generator.ts（オーケストレーターのみ）

```typescript
import type { PdfContext, TripPdfData } from "./types";
import { createPdfContext } from "./types";
import { generateMagazineStyles } from "./styles";
import { generateCoverPage } from "./templates/cover";
import { generateTocPage } from "./templates/toc";
import { generateReservationsPage } from "./templates/reservations";
import { generateItineraryPages } from "./templates/itinerary";
import { generateEmergencyPage } from "./templates/emergency";
import { generateChecklistPage } from "./templates/checklist";
import { generateMemoPage } from "./templates/memo";
import { generateBackCoverPage } from "./templates/back-cover";
import { escapeHtml } from "./helpers/utils";

export async function generateMagazinePdfHtml(
  data: TripPdfData,
  tripUrl?: string,
): Promise<string> {
  // TripPdfDataをPdfContextに変換
  const ctx: PdfContext = createPdfContext(data, { tripUrl });
  
  // スタイル生成
  const styles = generateMagazineStyles(ctx.config);
  
  // 各ページテンプレートを呼び出し（すべて string[] を返す）
  const coverPages = await generateCoverPage(ctx);
  const tocPages = generateTocPage(ctx);
  const reservationPages = generateReservationsPage(ctx);
  const itineraryPages = generateItineraryPages(ctx);
  const emergencyPages = generateEmergencyPage(ctx);
  const checklistPages = generateChecklistPage(ctx);
  const memoPages = generateMemoPage(ctx);
  const backCoverPages = generateBackCoverPage(ctx);
  
  // すべてのページを結合
  const allPages = [
    ...coverPages,
    ...tocPages,
    ...reservationPages,
    ...itineraryPages,
    ...emergencyPages,
    ...checklistPages,
    ...memoPages,
    ...backCoverPages,
  ];
  
  // HTMLドキュメントを生成
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(ctx.trip.title || "無題の旅行")} - Travel Companion</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=New+Tegomin&family=Yuji+Boku&display=swap" rel="stylesheet">
      ${styles}
    </head>
    <body>
      ${allPages.join("\f")}
    </body>
    </html>
  `;
}
```

### ステップ4: index.ts（後方互換性）

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

### ステップ5: 移行期間のエイリアス

```typescript
// magazine-pdf-template.ts（移行期間中）
export * from './pdf';
```

これにより、既存のインポート `import { ... } from '@/lib/utils/magazine-pdf-template'` がそのまま動作する。
