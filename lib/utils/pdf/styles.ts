/**
 * PDFテンプレート用のスタイル定義
 * 旅行雑誌風デザイン
 */

export interface StyleOptions {
	theme?: "light" | "dark";
}

/**
 * 基本スタイル（旅行雑誌風）
 */
export function generateMagazineStyles(options: StyleOptions = {}): string {
	const theme = options.theme || "light";
	const isDark = theme === "dark";

	// テーマに応じた色設定（将来的な拡張用）
	const bgColor = isDark ? "#000000" : "#ffffff";
	const textColor = isDark ? "#ffffff" : "#333333";
	const borderColor = isDark ? "#666666" : "#333333";

	return `
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }
      
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }
      
      body { 
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
        line-height: 1.6;
        color: ${textColor};
        font-size: 12pt;
        background: ${bgColor};
        width: 1048px; /* A4印刷時の正確なサイズ */
        margin: 0 auto;
      }
      
      .page {
        width: 1048px; /* A4幅: 210mm ≈ 1048px (300dpi) */
        height: 1482px; /* A4高さ: 297mm ≈ 1482px (300dpi) */
        padding: 80px 60px 80px 80px; /* 左開き用の余白調整 (20mm ≈ 80px) */
        position: relative;
        page-break-after: always;
        overflow: hidden;
        margin: 0 auto;
      }
      
      .page:last-child {
        page-break-after: avoid;
      }
      
      /* ヘッダー・フッター */
      .page-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 60px; /* 15mm ≈ 60px */
        border-bottom: 1px solid ${borderColor};
        display: flex;
        align-items: center;
        font-size: 10pt;
        color: #666;
        padding: 0 80px; /* ページのパディングに合わせる */
      }
      
      .page-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px; /* 10mm ≈ 40px */
        border-top: 1px solid ${borderColor};
        display: flex;
        align-items: center;
        font-size: 9pt;
        color: #666;
        padding: 0 80px; /* ページのパディングに合わせる */
      }
      
      .page-number {
        margin-left: auto;
      }
      
      /* 表紙スタイル（雑誌カバー風レイアウト） */
      .cover-page {
        background: ${bgColor};
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
      }
      
      .cover-frame {
        width: 100%;
        height: 100%;
        background: ${bgColor};
        padding: 48px 48px 48px 56px;
        display: flex;
        gap: 40px;
      }
      
      .cover-left {
        width: 22%;
        border-right: 1px solid #e5e5e5;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
      }
      
      .cover-trip-title {
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
        font-size: 9pt;
        font-weight: 600;
        color: #444;
        text-align: left;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 32px;
        line-height: 1.4;
      }
      
      .cover-left-title {
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
        font-size: 84pt;
        font-weight: 800;
        letter-spacing: 8px;
        color: #111;
        line-height: 1.2;
      }
      
      .cover-left-issue {
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
        font-size: 11pt;
        font-weight: 600;
        color: #111;
        align-self: flex-start;
        margin-top: auto;
        margin-bottom: 32px;
      }
      
      .cover-right {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .cover-photo {
        position: relative;
        flex: 1;
        background-color: #d4d4d4;
        border-radius: 8px;
        overflow: hidden;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }
      
      .cover-photo::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.35) 0%,
          rgba(0, 0, 0, 0.55) 40%,
          rgba(0, 0, 0, 0.75) 100%
        );
      }
      
      .cover-photo-content {
        position: relative;
        z-index: 1;
        height: 100%;
        padding: 40px 40px 48px 40px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: #ffffff;
      }
      
      .cover-issue-meta {
        font-size: 9pt;
        text-align: right;
        text-transform: uppercase;
        letter-spacing: 1px;
        line-height: 1.6;
      }
      
      .cover-issue-meta strong {
        font-weight: 700;
      }
      
      .cover-main-title {
        margin-top: 32px;
        font-size: 20pt;
        font-weight: 700;
        letter-spacing: 1px;
      }
      
      .cover-main-subtitle {
        font-size: 11pt;
        opacity: 0.9;
        margin-top: 8px;
      }
      
      .cover-section-group {
        margin-top: 60px;
        display: flex;
        flex-direction: column;
        gap: 32px;
        max-width: 70%;
      }
      
      .cover-section {
        font-size: 10pt;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .cover-section-title {
        font-weight: 700;
        font-size: 11pt;
      }
      
      .cover-section-line {
        width: 60px;
        height: 2px;
        background: #ffffff;
        margin: 8px 0 8px 0;
      }
      
      .cover-section-body {
        font-size: 9pt;
        line-height: 1.5;
        opacity: 0.9;
        max-height: 80px; /* 20mm ≈ 80px (約3-4行分) */
        overflow: hidden;
        word-wrap: break-word;
      }
      
      /* 表紙タイトルスタイル - モダンなサンセリフ */
      .cover-title {
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
        font-size: 72pt;
        font-weight: 700;
        color: white;
        margin-bottom: 24px;
        letter-spacing: -1px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        text-align: center;
        line-height: 1.1;
      }
      
      /* メインタイトルスタイル */
      .cover-title-yuji {
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
        font-size: 64pt;
        font-weight: 700;
        color: white;
        margin-bottom: 32px;
        letter-spacing: -0.5px;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
        text-align: center;
        line-height: 1.2;
      }
      
      .cover-subtitle {
        font-size: 28pt;
        font-weight: 300;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 48px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        letter-spacing: 0.5px;
      }
      
      .cover-meta {
        font-size: 16pt;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 80px;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        line-height: 1.6;
        font-weight: 400;
      }
      
      /* QRコード（右下の小さなパネル） */
      .cover-qr {
        align-self: flex-end;
        margin-top: 24px;
        margin-right: 20px;
        margin-bottom: 20px;
        width: 90px;
        height: 90px;
        background: #ffffff;
        padding: 0;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      }
      
      .cover-qr img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      
      .cover-qr-label {
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 8pt;
        color: white;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        white-space: nowrap;
      }
      
      /* 目次ページスタイル */
      .toc-page {
        display: flex;
        flex-direction: column;
        min-height: 100%;
        height: 1482px; /* A4高さ: 297mm ≈ 1482px (300dpi) - 他のページと同じ */
      }
      
      .toc-header {
        text-align: right;
        margin-bottom: 60px; /* 15mm ≈ 60px */
      }
      
      .toc-brand-title {
        font-size: 72pt;
        font-weight: 800;
        color: #111;
        letter-spacing: 4px;
        margin-bottom: 20px; /* 5mm ≈ 20px */
        text-transform: uppercase;
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
      }
      
      .toc-title {
        font-size: 14pt;
        font-weight: 300;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid ${borderColor};
        padding-bottom: 8px; /* 2mm ≈ 8px */
        margin-bottom: 20px; /* 5mm ≈ 20px */
      }
      
      .toc-main-title {
        font-size: 36pt;
        font-weight: 300;
        color: #333;
        margin-bottom: 12px; /* 3mm ≈ 12px */
      }
      
      .toc-meta {
        font-size: 12pt;
        color: #666;
        margin-bottom: 8px; /* 2mm ≈ 8px */
      }
      
      .toc-meta-sub {
        font-size: 11pt;
        color: #888;
        margin-bottom: 20px; /* 5mm ≈ 20px */
      }
      
      .toc-meta-description {
        font-size: 10pt;
        color: #666;
        line-height: 1.6;
        margin-bottom: 40px; /* 10mm ≈ 40px */
        max-height: 120px; /* 30mm ≈ 120px (約6行分) */
        overflow: hidden;
        word-wrap: break-word;
      }
      
      .toc-cover-image {
        margin-bottom: 40px; /* 10mm ≈ 40px */
      }
      
      .toc-cover-image-title {
        font-size: 11pt;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px; /* 3mm ≈ 12px */
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .toc-cover-image img {
        width: 100%;
        height: 200px; /* 50mm ≈ 200px */
        object-fit: cover;
        border: 1px solid #ddd;
        margin-bottom: 12px; /* 3mm ≈ 12px */
      }
      
      .toc-cover-caption {
        font-size: 9pt;
        color: #666;
        font-style: italic;
        line-height: 1.6;
        text-align: left;
      }
      
      .toc-content {
        display: flex;
        flex: 1;
        gap: 80px; /* 20mm ≈ 80px */
      }
      
      .toc-left {
        flex: 1;
      }
      
      .toc-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      .toc-section {
        margin-bottom: 60px; /* 15mm ≈ 60px */
      }
      
      .toc-section-title {
        font-size: 18pt;
        font-weight: 300;
        margin-bottom: 32px; /* 8mm ≈ 32px */
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .toc-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0; /* 3mm ≈ 12px */
        border-bottom: 1px dotted #ccc;
        font-size: 11pt;
      }
      
      .toc-item-title {
        flex: 1;
      }
      
      .toc-item-page {
        font-weight: bold;
        color: #2563eb;
      }
      
      .toc-map {
        width: 100%;
        height: 320px; /* 80mm ≈ 320px */
        background: #f8f9fa;
        border: 1px solid #ddd;
        margin-bottom: 40px; /* 10mm ≈ 40px */
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 10pt;
        overflow: hidden;
      }
      
      .toc-map img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .toc-quote {
        background: #f8f9fa;
        padding: 40px; /* 10mm ≈ 40px */
        border-left: 4px solid #2563eb;
        font-style: italic;
        font-size: 11pt;
        line-height: 1.8;
        margin-bottom: 40px; /* 10mm ≈ 40px */
      }
      
      .toc-colophon {
        font-size: 9pt;
        color: #999;
        line-height: 1.4;
      }
      
      /* 予約情報ページスタイル */
      .reservations-page {
        padding-top: 80px; /* 20mm ≈ 80px */
      }
      
      .page-title {
        font-size: 24pt;
        font-weight: 300;
        color: #333;
        margin-bottom: 20px; /* 5mm ≈ 20px */
      }
      
      .page-subtitle {
        font-size: 12pt;
        color: #666;
        margin-bottom: 60px; /* 15mm ≈ 60px */
      }
      
      .reservations-content {
        font-size: 11pt;
        color: #666;
      }
      
      .reservation-section {
        margin-bottom: 60px; /* 15mm ≈ 60px */
      }
      
      .reservation-section-title {
        font-size: 18pt;
        font-weight: 300;
        color: #2563eb;
        margin-bottom: 32px; /* 8mm ≈ 32px */
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 8px; /* 2mm ≈ 8px */
      }
      
      .reservation-card {
        background: #f8f9fa;
        border-left: 3px solid #2563eb;
        padding: 20px; /* 5mm ≈ 20px */
        margin-bottom: 24px; /* 6mm ≈ 24px */
      }
      
      .reservation-card-title {
        font-size: 14pt;
        font-weight: 500;
        color: #333;
        margin-bottom: 12px; /* 3mm ≈ 12px */
      }
      
      .reservation-info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px; /* 2mm ≈ 8px */
        font-size: 10pt;
        color: #666;
      }
      
      .reservation-info-label {
        font-weight: 600;
        color: #333;
        min-width: 100px;
      }
      
      .reservation-info-value {
        flex: 1;
        text-align: right;
        word-break: break-word;
      }
      
      .flight-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px; /* 4mm ≈ 16px */
        padding: 16px; /* 4mm ≈ 16px */
        background: white;
        border-radius: 4px;
      }
      
      .flight-route {
        display: flex;
        align-items: center;
        gap: 16px; /* 4mm ≈ 16px */
        flex: 1;
      }
      
      .flight-airport {
        font-size: 24pt;
        font-weight: 700;
        color: #2563eb;
        letter-spacing: 2px;
      }
      
      .flight-arrow {
        font-size: 16pt;
        color: #666;
      }
      
      .flight-details {
        text-align: right;
        font-size: 10pt;
        color: #666;
      }
      
      .flight-number {
        font-size: 12pt;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px; /* 1mm ≈ 4px */
      }
      
      .reservation-empty {
        text-align: center;
        padding: 60px 20px; /* 15mm ≈ 60px, 5mm ≈ 20px */
        color: #999;
        font-style: italic;
      }
      
      /* 旅程ページスタイル */
      .itinerary-page {
        padding-top: 80px; /* 20mm ≈ 80px */
      }
      
      .itinerary-page-content {
        display: flex;
        gap: 40px; /* 10mm ≈ 40px */
        position: relative;
      }
      
      .itinerary-main {
        flex: 1;
        min-width: 0;
      }
      
      .itinerary-sidebar {
        width: 20%;
        min-width: 160px;
        border-left: 1px solid #ddd;
        padding-left: 40px; /* 10mm ≈ 40px */
        position: relative;
      }
      
      .itinerary-sidebar::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 1px;
        background: #ddd;
      }
      
      .day-section {
        margin-bottom: 80px; /* 20mm ≈ 80px */
      }
      
      .day-title {
        font-size: 20pt;
        font-weight: 300;
        color: #2563eb;
        margin-bottom: 40px; /* 10mm ≈ 40px */
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .itinerary-items-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 32px; /* 8mm ≈ 32px */
      }
      
      .itinerary-items-grid.two-columns {
        grid-template-columns: 1fr 1fr;
        grid-auto-flow: column;
        gap: 24px; /* 6mm ≈ 24px */
      }
      
      .itinerary-item {
        margin-bottom: 0;
        padding: 20px; /* 5mm ≈ 20px */
        background: #f8f9fa;
        border-left: 3px solid #2563eb;
        break-inside: avoid;
        position: relative;
      }
      
      .itinerary-arrow {
        position: absolute;
        font-size: 20pt;
        color: #2563eb;
        font-weight: bold;
        pointer-events: none;
        z-index: 10;
        line-height: 1;
      }
      
      .itinerary-arrow.down {
        bottom: -28px; /* gap (24px) + 4px で中央に */
        left: 50%;
        transform: translateX(-50%);
      }
      
      .itinerary-arrow.up {
        top: -28px; /* gap (24px) + 4px で中央に */
        left: 50%;
        transform: translateX(-50%);
      }
      
      .itinerary-arrow.horizontal {
        top: 50%;
        transform: translateY(-50%);
        font-size: 18pt;
      }
      
      .itinerary-arrow.horizontal.left-to-right {
        right: -34px; /* gap (24px) + 10px */
      }
      
      .lodging-sidebar {
        margin-bottom: 40px; /* 10mm ≈ 40px */
      }
      
      .lodging-sidebar-title {
        font-size: 12pt;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px; /* 4mm ≈ 16px */
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .lodging-card {
        margin-bottom: 32px; /* 8mm ≈ 32px */
      }
      
      .lodging-photo {
        width: 100%;
        height: 120px; /* 30mm ≈ 120px */
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 12px; /* 3mm ≈ 12px */
        background: #e5e5e5;
      }
      
      .lodging-name {
        font-size: 11pt;
        font-weight: 500;
        color: #333;
        margin-bottom: 8px; /* 2mm ≈ 8px */
        line-height: 1.4;
      }
      
      .lodging-address {
        font-size: 9pt;
        color: #666;
        line-height: 1.4;
        word-break: break-word;
      }
      
      .itinerary-time {
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 8px; /* 2mm ≈ 8px */
        font-size: 10pt;
      }
      
      .itinerary-name {
        font-size: 13pt;
        font-weight: 500;
        margin-bottom: 8px; /* 2mm ≈ 8px */
      }
      
      .itinerary-description {
        color: #666;
        font-size: 10pt;
        margin-bottom: 8px; /* 2mm ≈ 8px */
        line-height: 1.4;
        max-height: 100px; /* 25mm ≈ 100px (約4-5行分) */
        overflow: hidden;
        word-wrap: break-word;
      }
      
      .itinerary-note {
        color: #666;
        font-size: 10pt;
        margin-top: 8px; /* 2mm ≈ 8px */
        white-space: pre-wrap;
        font-style: italic;
      }
      
      .itinerary-address {
        color: #888;
        font-size: 9pt;
        margin-top: 8px; /* 2mm ≈ 8px */
      }
      
      /* 緊急連絡先ページスタイル */
      .emergency-page {
        padding-top: 80px; /* 20mm ≈ 80px */
      }
      
      .emergency-content {
        font-size: 11pt;
        color: #666;
        font-style: italic;
      }
      
      /* チェックリストページスタイル（コンパクト形式） */
      .checklist-page {
        padding-top: 80px; /* 20mm ≈ 80px */
      }
      
      .checklist-content {
        margin-top: 40px; /* 10mm ≈ 40px */
      }
      
      .checklist-section {
        margin-bottom: 40px; /* 10mm ≈ 40px */
      }
      
      .checklist-section-title {
        font-size: 14pt;
        font-weight: 600;
        color: #2563eb;
        margin-bottom: 16px; /* 4mm ≈ 16px */
        padding-bottom: 8px; /* 2mm ≈ 8px */
        border-bottom: 2px solid #2563eb;
      }
      
      .checklist-items-compact {
        display: flex;
        flex-direction: column;
        gap: 6px; /* 1.5mm ≈ 6px */
      }
      
      .checklist-item-compact {
        display: flex;
        align-items: center;
        gap: 10px; /* 2.5mm ≈ 10px */
        padding: 4px 0; /* 1mm ≈ 4px */
        font-size: 10pt;
        line-height: 1.4;
      }
      
      .checklist-checkbox-compact {
        font-size: 12pt;
        color: #2563eb;
        font-weight: bold;
        min-width: 18px;
        flex-shrink: 0;
      }
      
      .checklist-title-compact {
        font-size: 10pt;
        color: #333;
        flex: 1;
      }
      
      /* メモページスタイル */
      .memo-page {
        padding-top: 80px; /* 20mm ≈ 80px */
      }
      
      .memo-subtitle {
        font-size: 18pt;
        font-weight: 300;
        color: #333;
        margin-bottom: 60px; /* 15mm ≈ 60px */
        font-style: italic;
      }
      
      .memo-lines {
        margin-bottom: 80px; /* 20mm ≈ 80px */
      }
      
      .memo-line {
        height: 24px; /* 6mm ≈ 24px */
        border-bottom: 1px dotted #ccc;
        margin-bottom: 12px; /* 3mm ≈ 12px */
      }
      
      .memo-quote {
        text-align: right;
        font-style: italic;
        font-size: 11pt;
        color: #666;
        margin-top: 80px; /* 20mm ≈ 80px */
      }
      
      /* 裏表紙スタイル */
      .back-cover-page {
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 160px 80px; /* 40mm ≈ 160px, 20mm ≈ 80px */
      }
      
      .back-cover-title {
        font-size: 24pt;
        font-weight: 300;
        color: #2563eb;
        margin-bottom: 80px; /* 20mm ≈ 80px */
      }
      
      .back-cover-meta {
        font-size: 12pt;
        color: #666;
        line-height: 1.8;
      }
      
      /* 印刷時の調整 */
      @media print {
        .page {
          margin: 0;
          padding: 80px 60px 80px 80px; /* 20mm ≈ 80px */
        }
      }
    </style>
  `;
}
