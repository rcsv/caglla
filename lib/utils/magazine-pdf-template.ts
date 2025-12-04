/**
 * PDF テンプレートシステム - 旅行雑誌風デザイン
 * スッキリ系の旅行雑誌をモチーフにしたPDF生成
 *
 * 基本構成:
 * - A4サイズ縦型、左開き
 * - 長辺閉じを前提としたレイアウト
 * - ヘッダ・フッタ付き（表紙・裏表紙除く）
 * - ページ番号表示
 */

import type { Trip, Day, Itinerary, ReservationInfo, ReservationType } from "@/lib/core/types";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { dateUtils } from "@/lib/utils/date";
import QRCode from "qrcode";
import Image from "next/image";

export interface TripPdfData {
	trip: Trip;
	days: Day[];
	itinerariesByDay: Record<string, Itinerary[]>;
	reservations?: any[]; // 予約情報（将来実装）
	checklist?: any[]; // チェックリスト（将来実装）
}

export interface PageTemplate {
	type:
		| "cover"
		| "toc"
		| "reservations"
		| "itinerary"
		| "emergency"
		| "checklist"
		| "memo"
		| "back-cover";
	title?: string;
	subtitle?: string;
	content: string;
	pageNumber?: number;
	isNewPage?: boolean;
}

/**
 * HTML特殊文字をエスケープ
 */
export function escapeHtml(text: string | undefined | null): string {
	if (!text) return "";

	const map: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;",
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * QRコードを生成
 */
async function generateQRCode(url: string): Promise<string> {
	try {
		const qrDataURL = await QRCode.toDataURL(url, {
			width: 64,
			margin: 1,
			color: {
				dark: "#000000",
				light: "#FFFFFF",
			},
		});
		return qrDataURL;
	} catch (error) {
		console.error("QR code generation failed:", error);
		return "";
	}
}

/**
 * 基本スタイル（旅行雑誌風）
 */
export function generateMagazineStyles(): string {
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
        color: #333;
        font-size: 12pt;
        background: white;
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
        border-bottom: 1px solid #333;
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
        border-top: 1px solid #333;
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
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
      }
      
      .cover-frame {
        width: 100%;
        height: 100%;
        background: #ffffff;
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
        border-bottom: 1px solid #333;
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
      
      /* チェックリストページスタイル */
      .checklist-page {
        padding-top: 80px; /* 20mm ≈ 80px */
      }
      
      .checklist-content {
        font-size: 11pt;
        color: #666;
        font-style: italic;
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

/**
 * 表紙ページを生成
 */
export async function generateCoverPage(
	data: TripPdfData,
	tripUrl?: string,
): Promise<string> {
	const { trip } = data;
	const startDate = trip.start_date
		? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date())
		: "未定";
	const endDate = trip.end_date
		? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date())
		: "未定";

	// 背景画像のURL（旅行データから取得）
	const backgroundImage =
		(trip as any).cover_image || (trip as any).image_url || "";

	// QRコード生成
	let qrCodeHtml = "";
	if (tripUrl) {
		const qrDataURL = await generateQRCode(tripUrl);
		if (qrDataURL) {
			qrCodeHtml = `
        <div class="cover-qr">
          <img src="${qrDataURL}" alt="QR Code" width="80" height="80" />
        </div>
      `;
		}
	}

	// 左帯のタイトルテキスト
	const spineTitle = "CAGLLA";

	// 号数っぽい表示（単純に日数ベースでなんちゃってNo.を作る）
	const issueNo = (data.days?.length || 1).toString();

	// 月・年の表示（開始日ベース）
	const startDateObj = trip.start_date
		? toDateOrNull(trip.start_date) || new Date()
		: new Date();
	const monthLabel = startDateObj.toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	// カテゴリ別にItineraryを分類
	const exploreItineraries: string[] = []; // exploration, adventure, culture
	const playItineraries: string[] = []; // entertainment
	const lodgingItineraries: string[] = []; // accommodation
	const diningItineraries: string[] = []; // dining

	if (data.itinerariesByDay) {
		for (const dayId in data.itinerariesByDay) {
			const itineraries = data.itinerariesByDay[dayId] || [];
			for (const itinerary of itineraries) {
				const primaryCategory = itinerary.activity_tag?.primaryCategory;
				if (!primaryCategory) continue;

				const title = itinerary.title;
				if (primaryCategory === "exploration" || 
				    primaryCategory === "adventure" || 
				    primaryCategory === "culture") {
					exploreItineraries.push(title);
				} else if (primaryCategory === "entertainment") {
					playItineraries.push(title);
				} else if (primaryCategory === "accommodation") {
					lodgingItineraries.push(title);
				} else if (primaryCategory === "dining") {
					diningItineraries.push(title);
				}
			}
		}
	}

	// 各カテゴリのテキストを生成（フォールバックテキスト + リスト）
	const exploreIntro = "Discover hidden gems and cultural experiences.";
	const exploreText =
		exploreItineraries.length > 0
			? `${exploreIntro} ${exploreItineraries.join(", ")}`
			: exploreIntro;

	const playIntro = "Fun activities and entertainment spots.";
	const playText =
		playItineraries.length > 0
			? `${playIntro} ${playItineraries.join(", ")}`
			: playIntro;

	const lodgingIntro = "Hotels, ryokan, and hidden spots chosen for this trip.";
	const lodgingText =
		lodgingItineraries.length > 0
			? `${lodgingIntro} ${lodgingItineraries.join(", ")}`
			: lodgingIntro;

	const diningIntro = "Restaurants, cafes, and local food experiences.";
	const diningText =
		diningItineraries.length > 0
			? `${diningIntro} ${diningItineraries.join(", ")}`
			: diningIntro;

	return `
    <div class="page cover-page">
      <div class="cover-frame">
        <div class="cover-left">
          <div class="cover-trip-title">
            ${escapeHtml(trip.title?.trim() || "Trip itinerary")}
          </div>
          <div class="cover-left-issue">NO.${issueNo}</div>
          <div class="cover-left-title">${spineTitle}</div>
        </div>
        <div class="cover-right">
          <div class="cover-photo" style="${
						backgroundImage
							? `background-image: url('${escapeHtml(backgroundImage)}');`
							: "background-image: linear-gradient(135deg, #9ca3af, #6b7280);"
					}">
            <div class="cover-photo-content">
              <div>
                <div class="cover-issue-meta">
                  <div><strong>${monthLabel.toUpperCase()}</strong></div>
                  <div>TRIP SNAPSHOT</div>
                  <div>${escapeHtml(trip.destination || "DESTINATION")}</div>
                </div>

                <div class="cover-main-title">
                  ${escapeHtml(trip.title?.trim() || "Trip itinerary")}
                </div>
                <div class="cover-main-subtitle">
                  ${startDate} – ${endDate}
                </div>

                <div class="cover-section-group">
                  <div class="cover-section">
                    <div class="cover-section-title">EXPLORE</div>
                    <div class="cover-section-line"></div>
                    <div class="cover-section-body">
                      ${escapeHtml(exploreText)}
                    </div>
                  </div>
                  <div class="cover-section">
                    <div class="cover-section-title">LODGING</div>
                    <div class="cover-section-line"></div>
                    <div class="cover-section-body">
                      ${escapeHtml(lodgingText)}
                    </div>
                  </div>
                  <div class="cover-section">
                    <div class="cover-section-title">DINING</div>
                    <div class="cover-section-line"></div>
                    <div class="cover-section-body">
                      ${escapeHtml(diningText)}
                    </div>
                  </div>
                  <div class="cover-section">
                    <div class="cover-section-title">PLAY</div>
                    <div class="cover-section-line"></div>
                    <div class="cover-section-body">
                      ${escapeHtml(playText)}
                    </div>
                  </div>
                  <div class="cover-section">
                    <div class="cover-section-title">VOYAGE</div>
                    <div class="cover-section-line"></div>
                    <div class="cover-section-body">
                      A curated itinerary to experience this place like a local.
                    </div>
                  </div>
                </div>
              </div>
              ${qrCodeHtml ? `<div class="cover-qr">${qrCodeHtml}</div>` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Google Maps Static APIのURLを生成（place_id はサポート外のため lat/lng 必須）
 * 
 * 注意: Static Maps APIは `place_id:` を `center` パラメータにサポートしていないため、
 * 緯度経度（lat, lng）を使用する必要があります。
 */
function generateStaticMapUrl(
	destinationPlaceId?: string,
	destinationPlace?: any,
): string | null {
	const apiKey =
		// process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
		process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

	if (!apiKey) {
		return null;
	}

	// 地図のサイズ（目次ページの .toc-map のサイズに合わせる）
	// Static Maps API の最大サイズは 640x640 だが、400x320 は安全
	const width = 400;
	const height = 320;
	const zoom = 12;

	let centerParam = "";

	// geometry.location が lat()/lng() を持つケースと、生の number ケース両方に対応
	if (destinationPlace?.geometry?.location) {
		const loc = destinationPlace.geometry.location;

		// 関数形式（lat(), lng()）と生の値（lat, lng）の両方に対応
		const lat =
			typeof loc.lat === "function" ? loc.lat() : loc.lat;
		const lng =
			typeof loc.lng === "function" ? loc.lng() : loc.lng;

		// 型チェック：数値であることを確認
		if (typeof lat === "number" && typeof lng === "number") {
			centerParam = `${lat},${lng}`;
		}
	}

	// geometry がない → place_id だけでは Static Maps は生成不可
	if (!centerParam) {
		// ログ出力：キャッシュが遅れている可能性や、データ構造の問題を記録
		console.warn(
			"[generateStaticMapUrl] geometry.location が無いため Static Map を生成できません。",
			{
				destinationPlaceId,
				hasDestinationPlace: !!destinationPlace,
				hasGeometry: !!destinationPlace?.geometry,
				hasLocation: !!destinationPlace?.geometry?.location,
			},
		);
		return null;
	}

	// Google Maps Static API URL
	const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
	const params = new URLSearchParams({
		center: centerParam,
		zoom: zoom.toString(),
		size: `${width}x${height}`,
    scale: "2",
		maptype: "roadmap",
		format: "png",
		key: apiKey,
	});

	return `${baseUrl}?${params.toString()}`;
}

/**
 * 目次ページを生成
 */
export function generateTocPage(data: TripPdfData): string {
	const { trip, days } = data;
	const startDate = trip.start_date
		? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date())
		: "未定";
	const endDate = trip.end_date
		? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date())
		: "未定";

	// 自動生成の格言
	const quotes = [
		"This trip isn't just a plan. It's a story waiting to be written.",
		"Adventure awaits those who dare to explore.",
		"Travel is the only thing you buy that makes you richer.",
		"The world is a book, and those who do not travel read only one page.",
		"Life is either a daring adventure or nothing at all.",
	];
	const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

	// Google Maps Static APIのURLを生成
	const mapUrl = generateStaticMapUrl(
		trip.destination_place_id,
		(trip as any).destination_place,
	);
	const mapImageHtml = mapUrl
		? `<img src="${escapeHtml(mapUrl)}" alt="Destination Map" style="width: 100%; height: 100%; object-fit: cover;" />`
		: `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 10pt;">🗺️ 主要目的地の地図<br><small>${escapeHtml(trip.destination || "目的地")}</small></div>`;

	// 表紙画像の取得
	const coverImage =
		(trip as any).cover_image || (trip as any).image_url || "";

	return `
    <div class="page toc-page">
      <div class="page-header">
        <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - TABLE OF CONTENTS</div>
      </div>
      
      <div class="toc-header">
        <div class="toc-brand-title">CAGLLA</div>
        <div class="toc-title">TABLE OF CONTENTS</div>
      </div>
      
      <div class="toc-content">
        <div class="toc-left">
          <div class="toc-main-title">${escapeHtml(trip.title || "無題の旅行")}</div>
          <div class="toc-meta">${days.length}日間の旅行 | ${escapeHtml(trip.destination || "目的地")}</div>
          <div class="toc-meta-sub">${startDate} - ${endDate}</div>
          <div class="toc-meta-description">${escapeHtml(trip.description || "No description")}</div>
          
          <div class="toc-section">
            <div class="toc-section-title">ARTICLES</div>
            <div class="toc-item">
              <div class="toc-item-title">Reservations</div>
              <div class="toc-item-page">2</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">Daily Schedule</div>
              <div class="toc-item-page">3</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">Emergency Contacts</div>
              <div class="toc-item-page">${3 + days.length}</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">MEMO メモ</div>
              <div class="toc-item-page">${4 + days.length}</div>
            </div>
          </div>
          
          <div class="toc-section">
            <div class="toc-section-title">Appendix</div>
            <div class="toc-item">
              <div class="toc-item-title">A. CHECKLIST チェックリスト</div>
              <div class="toc-item-page">i</div>
            </div>
          </div>
        </div>
        
        <div class="toc-right">

          
          <div class="toc-map">
            ${mapImageHtml}
          </div>
          
          <div class="toc-quote">
            "${randomQuote}"
          </div>
          
          <div class="toc-colophon">
            <div>This travel companion book was created using "Caglla Travel Manager".</div>
            <div>Published on ${new Date().toLocaleDateString("ja-JP")}</div>
            <div>Website: https://caglla.travel</div>
            <div>Printed in PDF</div>
            <div>Version: 1.0</div>
            <br>
            <div>This booklet is for reference only. Please verify all information before your trip.</div>
          </div>

          ${coverImage ? `
          <div class="toc-cover-image">
            <div class="toc-cover-image-title">Cover Image</div>
            <img src="${escapeHtml(coverImage)}" alt="Cover Image" />
            <div class="toc-cover-caption">
              Local image of the destination. Selected by: ${escapeHtml((trip as any).creator_name || (trip as any).creator?.name || "Unknown")}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
      
      <div class="page-footer">
        <div>CAGLLA TRAVEL MANAGER | 1</div>
      </div>
    </div>
  `;
}

/**
 * 予約情報を抽出（itinerariesByDayから）
 */
function extractReservations(data: TripPdfData): Array<{
	itinerary: Itinerary;
	reservation: ReservationInfo;
}> {
	const reservations: Array<{ itinerary: Itinerary; reservation: ReservationInfo }> = [];
	
	if (!data.itinerariesByDay) return reservations;
	
	for (const dayId in data.itinerariesByDay) {
		const itineraries = data.itinerariesByDay[dayId] || [];
		for (const itinerary of itineraries) {
			if (itinerary.reservation) {
				reservations.push({
					itinerary,
					reservation: itinerary.reservation,
				});
			}
		}
	}
	
	return reservations;
}

/**
 * 予約タイプのラベルを取得
 */
function getReservationTypeLabel(type: ReservationType): string {
	const labels: Record<ReservationType, string> = {
		flight: "Flight",
		hotel: "Hotel",
		rental_car: "Rental Car",
		dining: "Dining",
		other: "Other",
	};
	return labels[type] || type;
}

/**
 * 予約サイトのラベルを取得
 */
function getReservationSiteLabel(site?: string): string {
	if (!site) return "";
	const labels: Record<string, string> = {
		expedia: "Expedia",
		booking_com: "Booking.com",
		agoda: "Agoda",
		airbnb: "Airbnb",
		kayak: "Kayak",
		skyscanner: "Skyscanner",
		tripadvisor: "TripAdvisor",
		opentable: "OpenTable",
		tabelog: "Tabelog",
		hot_pepper: "Hot Pepper",
		ana: "ANA",
		jal: "JAL",
		rakuten_travel: "Rakuten Travel",
		jalan: "Jalan",
	};
	return labels[site] || site;
}

/**
 * 予約情報ページを生成
 */
export function generateReservationsPage(data: TripPdfData): string {
	const reservations = extractReservations(data);
	
	// 予約タイプ別にグループ化
	const reservationsByType = reservations.reduce(
		(acc, { itinerary, reservation }) => {
			const type = reservation.type;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push({ itinerary, reservation });
			return acc;
		},
		{} as Record<ReservationType, Array<{ itinerary: Itinerary; reservation: ReservationInfo }>>,
	);
	
	// 予約タイプの順序
	const typeOrder: ReservationType[] = ["flight", "hotel", "rental_car", "dining", "other"];
	
	// 予約がない場合
	if (reservations.length === 0) {
		return `
    <div class="page reservations-page">
      <div class="page-header">
        <div>${escapeHtml(data.trip.title || "無題の旅行").toUpperCase()} - RESERVATIONS</div>
      </div>
      
      <div class="page-title">Reservations</div>
      <div class="page-subtitle">予約情報</div>
      
      <div class="reservation-empty">
        No reservations found. Please add reservations to your itinerary.
      </div>
      
      <div class="page-footer">
        <div>2 | caglla travel manager</div>
      </div>
    </div>
  `;
	}
	
	// 各予約タイプのセクションを生成
	const sections = typeOrder
		.filter((type) => reservationsByType[type] && reservationsByType[type].length > 0)
		.map((type) => {
			const typeReservations = reservationsByType[type];
			const reservationCards = typeReservations
				.map(({ itinerary, reservation }) => {
					if (type === "flight") {
						return generateFlightReservationCard(itinerary, reservation);
					} else {
						return generateStandardReservationCard(itinerary, reservation);
					}
				})
				.join("");
			
			return `
        <div class="reservation-section">
          <div class="reservation-section-title">${getReservationTypeLabel(type)}</div>
          ${reservationCards}
        </div>
      `;
		})
		.join("");
	
	return `
    <div class="page reservations-page">
      <div class="page-header">
        <div>${escapeHtml(data.trip.title || "無題の旅行").toUpperCase()} - RESERVATIONS</div>
      </div>
      
      <div class="page-title">Reservations</div>
      <div class="page-subtitle">予約情報</div>
      
      <div class="reservations-content">
        ${sections}
      </div>
      
      <div class="page-footer">
        <div>2 | caglla travel manager</div>
      </div>
    </div>
  `;
}

/**
 * フライト予約カードを生成
 */
function generateFlightReservationCard(
	itinerary: Itinerary,
	reservation: ReservationInfo,
): string {
	const departure = reservation.departure_airport || "";
	const arrival = reservation.arrival_airport || "";
	const flightNumber = reservation.flight_number || "";
	const airline = reservation.airline || "";
	
	const departureDate = reservation.departure_at
		? toDateOrNull(reservation.departure_at)
		: null;
	const arrivalDate = reservation.arrival_at
		? toDateOrNull(reservation.arrival_at)
		: null;
	
	const formatDateTime = (date: Date | null): string => {
		if (!date) return "";
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};
	
	const departureTime = formatDateTime(departureDate);
	const arrivalTime = formatDateTime(arrivalDate);
	
	return `
    <div class="reservation-card">
      <div class="reservation-card-title">${escapeHtml(itinerary.title || "Flight")}</div>
      
      ${departure && arrival ? `
        <div class="flight-info">
          <div class="flight-route">
            <div class="flight-airport">${escapeHtml(departure)}</div>
            <div class="flight-arrow">→</div>
            <div class="flight-airport">${escapeHtml(arrival)}</div>
          </div>
          <div class="flight-details">
            ${flightNumber ? `<div class="flight-number">${escapeHtml(flightNumber)}</div>` : ""}
            ${airline ? `<div>${escapeHtml(airline)}</div>` : ""}
          </div>
        </div>
      ` : ""}
      
      ${departureTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Departure:</span>
          <span class="reservation-info-value">${escapeHtml(departureTime)}</span>
        </div>
      ` : ""}
      
      ${arrivalTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Arrival:</span>
          <span class="reservation-info-value">${escapeHtml(arrivalTime)}</span>
        </div>
      ` : ""}
      
      ${reservation.confirmation_number ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Confirmation:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.confirmation_number)}</span>
        </div>
      ` : ""}
      
      ${reservation.reservation_site ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Booking Site:</span>
          <span class="reservation-info-value">${escapeHtml(getReservationSiteLabel(reservation.reservation_site))}</span>
        </div>
      ` : ""}
      
      ${reservation.notes ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Notes:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.notes)}</span>
        </div>
      ` : ""}
    </div>
  `;
}

/**
 * 標準予約カードを生成（ホテル、レンタカー、食事、その他）
 */
function generateStandardReservationCard(
	itinerary: Itinerary,
	reservation: ReservationInfo,
): string {
	const startDate = reservation.start_date
		? toDateOrNull(reservation.start_date)
		: null;
	const endDate = reservation.end_date
		? toDateOrNull(reservation.end_date)
		: null;
	
	const formatDateTime = (date: Date | null): string => {
		if (!date) return "";
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};
	
	const startTime = formatDateTime(startDate);
	const endTime = formatDateTime(endDate);
	
	return `
    <div class="reservation-card">
      <div class="reservation-card-title">${escapeHtml(itinerary.title || "Reservation")}</div>
      
      ${startTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Start:</span>
          <span class="reservation-info-value">${escapeHtml(startTime)}</span>
        </div>
      ` : ""}
      
      ${endTime ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">End:</span>
          <span class="reservation-info-value">${escapeHtml(endTime)}</span>
        </div>
      ` : ""}
      
      ${reservation.confirmation_number ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Confirmation:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.confirmation_number)}</span>
        </div>
      ` : ""}
      
      ${reservation.reservation_site ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Booking Site:</span>
          <span class="reservation-info-value">${escapeHtml(getReservationSiteLabel(reservation.reservation_site))}</span>
        </div>
      ` : ""}
      
      ${itinerary.location || itinerary.place_data?.formatted_address ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Location:</span>
          <span class="reservation-info-value">${escapeHtml(itinerary.location || itinerary.place_data?.formatted_address || "")}</span>
        </div>
      ` : ""}
      
      ${reservation.notes ? `
        <div class="reservation-info-row">
          <span class="reservation-info-label">Notes:</span>
          <span class="reservation-info-value">${escapeHtml(reservation.notes)}</span>
        </div>
      ` : ""}
    </div>
  `;
}

/**
 * Lodging（宿泊）のitineraryを抽出
 */
function extractLodgingItineraries(itineraries: Itinerary[]): Itinerary[] {
	return itineraries.filter((itinerary) => {
		const primaryCategory = itinerary.activity_tag?.primaryCategory;
		return primaryCategory === "accommodation";
	});
}

/**
 * Lodgingサイドバーを生成
 */
function generateLodgingSidebar(lodgingItineraries: Itinerary[]): string {
	if (lodgingItineraries.length === 0) return "";

	const lodgingCards = lodgingItineraries.map((lodging) => {
		const photoRef = lodging.place_data?.photos?.[0]?.photo_reference;
		const photoUrl = photoRef
			? `/api/places/photo?photoreference=${encodeURIComponent(photoRef)}&maxwidth=400`
			: null;
		const address = lodging.location || lodging.place_data?.formatted_address || "";
		const name = lodging.title || "";

		return `
      <div class="lodging-card">
        ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(name)}" class="lodging-photo" />` : ""}
        ${name ? `<div class="lodging-name">${escapeHtml(name)}</div>` : ""}
        ${address ? `<div class="lodging-address">${escapeHtml(address)}</div>` : ""}
      </div>
    `;
	}).join("");

	return `
    <div class="itinerary-sidebar">
      <div class="lodging-sidebar">
        <div class="lodging-sidebar-title">Lodging</div>
        ${lodgingCards}
      </div>
    </div>
  `;
}

/**
 * 旅程ページを生成
 */
export function generateItineraryPages(data: TripPdfData): string {
	const { trip, days, itinerariesByDay } = data;

	return days
		.sort((a, b) => {
			const dateA = toDateOrNull(a.date);
			const dateB = toDateOrNull(b.date);
			if (!dateA || !dateB) return 0;
			return dateA.getTime() - dateB.getTime();
		})
		.map((day, index) => {
			const dayDate = toDateOrNull(day.date);
			const dayTitle = dayDate
				? `${dateUtils.formatDate(dayDate)} (Day ${index + 1})`
				: `Day ${index + 1}`;

			const itineraries = itinerariesByDay[day.id] || [];
			const sortedItineraries = itineraries.sort((a, b) => {
				const timeA = a.start_time || "";
				const timeB = b.start_time || "";
				return timeA.localeCompare(timeB);
			});

			// Lodging（accommodation）を抽出
			const lodgingItineraries = extractLodgingItineraries(sortedItineraries);
			const lodgingSidebar = generateLodgingSidebar(lodgingItineraries);

			// 2段組レイアウトかどうか（5つ以上の予定がある場合）
			const useTwoColumns = sortedItineraries.length >= 5;
			const gridClass = useTwoColumns ? "two-columns" : "";
			
			// 列優先レイアウトのための行数を計算
			const itemCount = sortedItineraries.length;
			const rowCount = useTwoColumns ? Math.ceil(itemCount / 2) : itemCount;
			const gridStyle = useTwoColumns
				? `style="grid-template-rows: repeat(${rowCount}, auto);"`
				: "";

			const itineraryItems =
				sortedItineraries.length > 0
					? sortedItineraries
							.map((item, itemIndex) => {
								// 2列レイアウトの場合の矢印を決定
								let arrows = "";
								if (useTwoColumns) {
									const rowCount = Math.ceil(itemCount / 2);
									const isLeftColumn = itemIndex < rowCount;
									const isRightColumn = itemIndex >= rowCount;
									const isLastInLeftColumn = itemIndex === rowCount - 1;
									const isFirstInRightColumn = itemIndex === rowCount;
									const isLastItem = itemIndex === itemCount - 1;
									
									// 左列のアイテム（最後以外）→ 下矢印
									if (isLeftColumn && !isLastInLeftColumn) {
										arrows += '<div class="itinerary-arrow down">↓</div>';
									}
									// 左列の最後のアイテム → 右下矢印（下と右の組み合わせ）
									if (isLastInLeftColumn) {
										arrows += '<div class="itinerary-arrow down">↓</div>';
										arrows += '<div class="itinerary-arrow horizontal left-to-right">→</div>';
									}
									// 右列の最初のアイテム → 上矢印
									if (isFirstInRightColumn) {
										arrows += '<div class="itinerary-arrow up">↑</div>';
									}
									// 右列のアイテム（最後以外）→ 下矢印
									if (isRightColumn && !isLastItem) {
										arrows += '<div class="itinerary-arrow down">↓</div>';
									}
								}
								
								return `
            <div class="itinerary-item">
              ${item.start_time ? `<div class="itinerary-time">⏰ ${item.start_time}</div>` : ""}
              <div class="itinerary-name">${escapeHtml(item.title || "無題の旅程")}</div>
              ${item.description ? `<div class="itinerary-description">${escapeHtml(item.description)}</div>` : ""}
              ${(item as any).note ? `<div class="itinerary-note">${escapeHtml((item as any).note)}</div>` : ""}
              ${(item as any).address ? `<div class="itinerary-address">📍 ${escapeHtml((item as any).address)}</div>` : ""}
              ${arrows}
            </div>
          `;
							})
							.join("")
					: '<div class="reservations-content">予定なし</div>';

			return `
        <div class="page itinerary-page">
          <div class="page-header">
            <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - DAILY SCHEDULE</div>
          </div>
          
          <div class="itinerary-page-content">
            <div class="itinerary-main">
              <div class="day-title">${dayTitle}</div>
              <div class="itinerary-items-grid ${gridClass}" ${gridStyle}>
                ${itineraryItems}
              </div>
            </div>
            ${lodgingSidebar}
          </div>
          
          <div class="page-footer">
            <div>${3 + index} | caglla travel manager</div>
          </div>
        </div>
      `;
		})
		.join("");
}

/**
 * 緊急連絡先ページを生成
 */
export function generateEmergencyPage(data: TripPdfData): string {
	const { trip, days } = data;

	return `
    <div class="page emergency-page">
      <div class="page-header">
        <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - EMERGENCY CONTACTS</div>
      </div>
      
      <div class="page-title">Emergency Contacts</div>
      <div class="page-subtitle">緊急連絡先</div>
      
      <div class="emergency-content">
        not implemented yet
      </div>
      
      <div class="page-footer">
        <div>${3 + days.length} | caglla travel manager</div>
      </div>
    </div>
  `;
}

/**
 * チェックリストページを生成
 */
export function generateChecklistPage(data: TripPdfData): string {
	return `
    <div class="page checklist-page">
      <div class="page-header">
        <div>APPENDIX - CHECKLIST</div>
      </div>
      
      <div class="page-title">Checklist</div>
      <div class="page-subtitle">チェックリスト</div>
      
      <div class="checklist-content">
        not implemented yet
      </div>
      
      <div class="page-footer">
        <div>i | caglla travel manager</div>
      </div>
    </div>
  `;
}

/**
 * メモページを生成
 */
export function generateMemoPage(data: TripPdfData): string {
	const { trip, days } = data;

	const memoQuotes = [
		"To travel is to live. - Hans Christian Andersen",
		"The journey of a thousand miles begins with a single step. - Lao Tzu",
		"Adventure awaits those who dare to explore. - Unknown",
		"Travel makes one modest. You see what a tiny place you occupy in the world. - Gustave Flaubert",
		"Life is either a daring adventure or nothing at all. - Helen Keller",
	];
	const randomQuote = memoQuotes[Math.floor(Math.random() * memoQuotes.length)];

	return `
    <div class="page memo-page">
      <div class="page-header">
        <div>${escapeHtml(trip.title || "無題の旅行").toUpperCase()} - MEMO</div>
      </div>
      
      <div class="page-title">Memo</div>
      <div class="page-subtitle">メモ</div>
      
      <div class="memo-subtitle">My highlight</div>
      
      <div class="memo-lines">
        ${Array.from({ length: 20 }, () => '<div class="memo-line"></div>').join("")}
      </div>
      
      <div class="memo-quote">
        ${randomQuote}
      </div>
      
      <div class="page-footer">
        <div>${4 + days.length} | caglla travel manager</div>
      </div>
    </div>
  `;
}

/**
 * 裏表紙ページを生成
 */
export function generateBackCoverPage(data: TripPdfData): string {
	return `
    <div class="page back-cover-page">
      <div class="back-cover-title">Caglla</div>
      <div class="back-cover-meta">
        Travel Manager<br>
        <br>
        Website: https://caglla.travel<br>
        Version: 1.0<br>
        <br>
        This travel companion book was created using Caglla Travel Manager.<br>
        Please make sure to double-check all reservations, times, and contact details before departure.
      </div>
    </div>
  `;
}

/**
 * 完全なPDF用HTMLドキュメントを生成
 */
export async function generateMagazinePdfHtml(
	data: TripPdfData,
	tripUrl?: string,
): Promise<string> {
	const { trip } = data;

	const pages = [
		await generateCoverPage(data, tripUrl),
		generateTocPage(data),
		generateReservationsPage(data),
		generateItineraryPages(data),
		generateEmergencyPage(data),
		generateChecklistPage(data),
		generateMemoPage(data),
		generateBackCoverPage(data),
	].join("");

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
      ${generateMagazineStyles()}
    </head>
    <body>
      ${pages}
    </body>
    </html>
  `;
}
