/**
 * PDFテンプレートシステム - メインエクスポート
 * 後方互換性のための再エクスポート
 */

// 型定義
export * from './types';

// スタイル
export { generateMagazineStyles } from './styles';

// テンプレート関数
export { generateCoverPage } from './templates/cover';
export { generateTocPage } from './templates/toc';
export { generateReservationsPage } from './templates/reservations';
export { generateItineraryPages } from './templates/itinerary';
export { generateEmergencyPage } from './templates/emergency';
export { generateChecklistPage } from './templates/checklist';
export { generateMemoPage } from './templates/memo';
export { generateBackCoverPage } from './templates/back-cover';

// メインPDF生成関数
export { generateMagazinePdfHtml } from './generator';

// ヘルパー関数（必要に応じて）
export { escapeHtml, generateQRCode } from './helpers/utils';
export { generateStaticMapUrl } from './helpers/map';
export { extractReservations, getReservationTypeLabel, getReservationSiteLabel } from './helpers/reservation';
export { extractLodgingItineraries, generateLodgingSidebar } from './helpers/lodging';
