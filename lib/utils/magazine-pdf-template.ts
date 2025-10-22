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

import type { Trip, Day, Itinerary } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { dateUtils } from '@/lib/utils/date'
import QRCode from 'qrcode'

export interface TripPdfData {
  trip: Trip
  days: Day[]
  itinerariesByDay: Record<string, Itinerary[]>
  reservations?: any[] // 予約情報（将来実装）
  checklist?: any[] // チェックリスト（将来実装）
}

export interface PageTemplate {
  type: 'cover' | 'toc' | 'reservations' | 'itinerary' | 'emergency' | 'checklist' | 'memo' | 'back-cover'
  title?: string
  subtitle?: string
  content: string
  pageNumber?: number
  isNewPage?: boolean
}

/**
 * HTML特殊文字をエスケープ
 */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
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
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrDataURL
  } catch (error) {
    console.error('QR code generation failed:', error)
    return ''
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
      
      /* 表紙スタイル */
      .cover-page {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 160px 80px; /* 40mm ≈ 160px, 20mm ≈ 80px */
        position: relative;
        overflow: hidden;
      }
      
      .cover-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 1;
      }
      
      .cover-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 2;
      }
      
      .cover-content {
        position: relative;
        z-index: 3;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      /* 表紙タイトルスタイル - New Tegomin */
      .cover-title {
        font-family: 'New Tegomin', 'Hiragino Mincho Pro', 'Yu Mincho', serif;
        font-size: 180px;
        font-weight: normal;
        color: white;
        margin-bottom: 80px; /* 20mm ≈ 80px */
        letter-spacing: 2px;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
        text-align: center;
        line-height: 0.9;
      }
      
      /* Yuji Boku版のタイトルスタイル */
      .cover-title-yuji {
        font-family: 'Yuji Boku', 'Hiragino Mincho Pro', 'Yu Mincho', serif;
        font-size: 180px;
        font-weight: normal;
        color: white;
        margin-bottom: 40px; /* 10mm ≈ 40px */
        letter-spacing: 2px;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
        text-align: center;
        line-height: 0.9;
      }
      
      .cover-subtitle {
        font-size: 24pt;
        font-weight: 300;
        color: #333;
        margin-bottom: 40px; /* 10mm ≈ 40px */
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .cover-meta {
        font-size: 14pt;
        color: #666;
        margin-bottom: 120px; /* 30mm ≈ 120px */
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .cover-features {
        display: flex;
        flex-wrap: wrap;
        gap: 80px; /* 20mm ≈ 80px */
        justify-content: center;
        margin-top: 80px; /* 20mm ≈ 80px */
      }
      
      .cover-feature {
        text-align: center;
        max-width: 240px; /* 60mm ≈ 240px */
      }
      
      .cover-feature-icon {
        font-size: 32pt;
        margin-bottom: 20px; /* 5mm ≈ 20px */
      }
      
      .cover-feature-title {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 8px; /* 2mm ≈ 8px */
      }
      
      .cover-feature-desc {
        font-size: 10pt;
        color: #666;
      }
      
      /* 縦書きテキスト */
      .vertical-text {
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-size: 8pt;
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 2px;
        line-height: 1.8;
        z-index: 4;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      }
      
      /* QRコード */
      .cover-qr {
        position: absolute;
        bottom: 40px;
        right: 40px;
        width: 80px;
        height: 80px;
        background: white;
        padding: 8px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        z-index: 4;
      }
      
      .cover-qr img {
        width: 100%;
        height: 100%;
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
        height: 100%;
      }
      
      .toc-header {
        text-align: right;
        margin-bottom: 80px; /* 20mm ≈ 80px */
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
        margin-bottom: 20px; /* 5mm ≈ 20px */
      }
      
      .toc-meta {
        font-size: 12pt;
        color: #666;
        margin-bottom: 60px; /* 15mm ≈ 60px */
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
        font-style: italic;
      }
      
      /* 旅程ページスタイル */
      .itinerary-page {
        padding-top: 80px; /* 20mm ≈ 80px */
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
      
      .itinerary-item {
        margin-bottom: 32px; /* 8mm ≈ 32px */
        padding: 20px; /* 5mm ≈ 20px */
        background: #f8f9fa;
        border-left: 3px solid #2563eb;
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
  `
}

/**
 * 表紙ページを生成
 */
export async function generateCoverPage(data: TripPdfData, tripUrl?: string): Promise<string> {
  const { trip } = data
  const startDate = trip.start_date ? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date()) : '未定'
  const endDate = trip.end_date ? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date()) : '未定'
  
  // 背景画像のURL（旅行データから取得）
  const backgroundImage = (trip as any).cover_image || (trip as any).image_url || ''
  
  // QRコード生成
  let qrCodeHtml = ''
  if (tripUrl) {
    const qrDataURL = await generateQRCode(tripUrl)
    if (qrDataURL) {
      qrCodeHtml = `
        <div class="cover-qr">
          <img src="${qrDataURL}" alt="QR Code" />
          <div class="cover-qr-label">Trip URL</div>
        </div>
      `
    }
  }
  
  // 縦書きテキスト（JOURNEY OF FREEDOM風）
  const verticalText = 'JOURNEY OF FREEDOM'
  
  return `
    <div class="page cover-page">
      ${backgroundImage ? `<div class="cover-background" style="background-image: url('${backgroundImage}')"></div>` : ''}
      <div class="cover-overlay"></div>
      <div class="vertical-text">${verticalText}</div>
      ${qrCodeHtml}
      <div class="cover-content">
        <div>
          <div class="cover-title">旅のしおり</div>
          <!-- Yuji Bokuに変更する場合: <div class="cover-title-yuji">旅のしおり</div> -->
          <div class="cover-subtitle">${escapeHtml((trip as any).name || '無題の旅行')}</div>
          <div class="cover-meta">
            ${startDate} 〜 ${endDate}
            ${trip.destination ? `<br>📍 ${escapeHtml(trip.destination)}` : ''}
          </div>
        </div>
        <div class="cover-features">
          <div class="cover-feature">
            <div class="cover-feature-icon">🏨</div>
            <div class="cover-feature-title">宿泊先</div>
            <div class="cover-feature-desc">厳選されたホテル・宿泊施設</div>
          </div>
          <div class="cover-feature">
            <div class="cover-feature-icon">🎯</div>
            <div class="cover-feature-title">主要アクティビティ</div>
            <div class="cover-feature-desc">現地の魅力を最大限に</div>
          </div>
          <div class="cover-feature">
            <div class="cover-feature-icon">🗺️</div>
            <div class="cover-feature-title">詳細ルート</div>
            <div class="cover-feature-desc">最適化された旅程プラン</div>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * 目次ページを生成
 */
export function generateTocPage(data: TripPdfData): string {
  const { trip, days } = data
  const startDate = trip.start_date ? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date()) : '未定'
  const endDate = trip.end_date ? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date()) : '未定'
  
  // 自動生成の格言
  const quotes = [
    "This trip isn't just a plan. It's a story waiting to be written.",
    "Adventure awaits those who dare to explore.",
    "Travel is the only thing you buy that makes you richer.",
    "The world is a book, and those who do not travel read only one page.",
    "Life is either a daring adventure or nothing at all."
  ]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
  
  return `
    <div class="page toc-page">
      <div class="page-header">
        <div>${escapeHtml((trip as any).name || '無題の旅行').toUpperCase()} - TABLE OF CONTENTS</div>
      </div>
      
      <div class="toc-header">
        <div class="toc-title">TABLE OF CONTENTS</div>
      </div>
      
      <div class="toc-content">
        <div class="toc-left">
          <div class="toc-main-title">${escapeHtml((trip as any).name || '無題の旅行')}</div>
          <div class="toc-meta">${days.length}日間の旅行 | ${startDate} - ${endDate}</div>
          
          <div class="toc-section">
            <div class="toc-section-title">table of contents 目次</div>
            <div class="toc-item">
              <div class="toc-item-title">RESERVATIONS 予約情報</div>
              <div class="toc-item-page">2</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">DAILY SCHEDULE 毎日の日程</div>
              <div class="toc-item-page">3</div>
            </div>
            <div class="toc-item">
              <div class="toc-item-title">EMERGENCY CONTACTS 緊急連絡先</div>
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
            <div>🗺️ 主要目的地の地図<br><small>${escapeHtml(trip.destination || '目的地')}</small></div>
          </div>
          
          <div class="toc-quote">
            "${randomQuote}"
          </div>
          
          <div class="toc-colophon">
            <div>This travel companion book was created using "Caglla Travel Manager".</div>
            <div>Published on ${new Date().toLocaleDateString('ja-JP')}</div>
            <div>Website: https://caglla.com</div>
            <div>Printed in PDF</div>
            <div>Version: 1.0</div>
            <br>
            <div>This booklet is for reference only. Please verify all information before your trip.</div>
          </div>
        </div>
      </div>
      
      <div class="page-footer">
        <div>CAGLLA TRAVEL MANAGER | 1</div>
      </div>
    </div>
  `
}

/**
 * 予約情報ページを生成
 */
export function generateReservationsPage(data: TripPdfData): string {
  return `
    <div class="page reservations-page">
      <div class="page-header">
        <div>${escapeHtml((data.trip as any).name || '無題の旅行').toUpperCase()} - RESERVATIONS</div>
      </div>
      
      <div class="page-title">Reservations</div>
      <div class="page-subtitle">予約情報</div>
      
      <div class="reservations-content">
        not implemented yet
      </div>
      
      <div class="page-footer">
        <div>2 | caglla travel manager</div>
      </div>
    </div>
  `
}

/**
 * 旅程ページを生成
 */
export function generateItineraryPages(data: TripPdfData): string {
  const { trip, days, itinerariesByDay } = data
  
  return days
    .sort((a, b) => {
      const dateA = toDateOrNull(a.date)
      const dateB = toDateOrNull(b.date)
      if (!dateA || !dateB) return 0
      return dateA.getTime() - dateB.getTime()
    })
    .map((day, index) => {
      const dayDate = toDateOrNull(day.date)
      const dayTitle = dayDate 
        ? `${dateUtils.formatDate(dayDate)} (Day ${index + 1})`
        : `Day ${index + 1}`
      
      const itineraries = itinerariesByDay[day.id] || []
      const sortedItineraries = itineraries
        .sort((a, b) => {
          const timeA = a.start_time || ''
          const timeB = b.start_time || ''
          return timeA.localeCompare(timeB)
        })
      
      const itineraryItems = sortedItineraries.length > 0
        ? sortedItineraries.map(item => `
            <div class="itinerary-item">
              ${item.start_time ? `<div class="itinerary-time">⏰ ${item.start_time}</div>` : ''}
              <div class="itinerary-name">${escapeHtml(item.title || '無題の旅程')}</div>
              ${item.description ? `<div class="itinerary-description">${escapeHtml(item.description)}</div>` : ''}
              ${(item as any).note ? `<div class="itinerary-note">${escapeHtml((item as any).note)}</div>` : ''}
              ${(item as any).address ? `<div class="itinerary-address">📍 ${escapeHtml((item as any).address)}</div>` : ''}
            </div>
          `).join('')
        : '<div class="reservations-content">予定なし</div>'
      
      return `
        <div class="page itinerary-page">
          <div class="page-header">
            <div>${escapeHtml((trip as any).name || '無題の旅行').toUpperCase()} - DAILY SCHEDULE</div>
          </div>
          
          <div class="day-title">${dayTitle}</div>
          ${itineraryItems}
          
          <div class="page-footer">
            <div>${3 + index} | caglla travel manager</div>
          </div>
        </div>
      `
    }).join('')
}

/**
 * 緊急連絡先ページを生成
 */
export function generateEmergencyPage(data: TripPdfData): string {
  const { trip, days } = data
  
  return `
    <div class="page emergency-page">
      <div class="page-header">
        <div>${escapeHtml((trip as any).name || '無題の旅行').toUpperCase()} - EMERGENCY CONTACTS</div>
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
  `
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
  `
}

/**
 * メモページを生成
 */
export function generateMemoPage(data: TripPdfData): string {
  const { trip, days } = data
  
  const memoQuotes = [
    "To travel is to live. - Hans Christian Andersen",
    "The journey of a thousand miles begins with a single step. - Lao Tzu",
    "Adventure awaits those who dare to explore. - Unknown",
    "Travel makes one modest. You see what a tiny place you occupy in the world. - Gustave Flaubert",
    "Life is either a daring adventure or nothing at all. - Helen Keller"
  ]
  const randomQuote = memoQuotes[Math.floor(Math.random() * memoQuotes.length)]
  
  return `
    <div class="page memo-page">
      <div class="page-header">
        <div>${escapeHtml((trip as any).name || '無題の旅行').toUpperCase()} - MEMO</div>
      </div>
      
      <div class="page-title">Memo</div>
      <div class="page-subtitle">メモ</div>
      
      <div class="memo-subtitle">My highlight</div>
      
      <div class="memo-lines">
        ${Array.from({ length: 20 }, () => '<div class="memo-line"></div>').join('')}
      </div>
      
      <div class="memo-quote">
        ${randomQuote}
      </div>
      
      <div class="page-footer">
        <div>${4 + days.length} | caglla travel manager</div>
      </div>
    </div>
  `
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
        Website: https://caglla.com<br>
        Version: 1.0<br>
        <br>
        This travel companion book was created using Caglla Travel Manager.<br>
        Please make sure to double-check all reservations, times, and contact details before departure.
      </div>
    </div>
  `
}

/**
 * 完全なPDF用HTMLドキュメントを生成
 */
export async function generateMagazinePdfHtml(data: TripPdfData, tripUrl?: string): Promise<string> {
  const { trip } = data
  
  const pages = [
    await generateCoverPage(data, tripUrl),
    generateTocPage(data),
    generateReservationsPage(data),
    generateItineraryPages(data),
    generateEmergencyPage(data),
    generateChecklistPage(data),
    generateMemoPage(data),
    generateBackCoverPage(data)
  ].join('')
  
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml((trip as any).name || '無題の旅行')} - Travel Companion</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=New+Tegomin&family=Yuji+Boku&display=swap" rel="stylesheet">
      ${generateMagazineStyles()}
    </head>
    <body>
      ${pages}
    </body>
    </html>
  `
}
