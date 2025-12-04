/**
 * PDF生成のメインオーケストレーター
 * スタイル呼び出し、テンプレート呼び出し、結果の結合のみを行う
 */

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

/**
 * 完全なPDF用HTMLドキュメントを生成
 */
export async function generateMagazinePdfHtml(
	data: TripPdfData,
	tripUrl?: string,
): Promise<string> {
	const { trip } = data;
	
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
      <title>${escapeHtml(trip.title || "無題の旅行")} - Travel Companion</title>
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
