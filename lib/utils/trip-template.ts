/**
 * PDF/HTML テンプレート共通ロジック
 * PDFエクスポートとHTMLプレビューで共有するテンプレート生成機能
 */

import type { Trip, Day, Itinerary } from '@/lib/core/types'
import { toDateOrNull } from '@/lib/firebase/timestamp-utils'
import { dateUtils } from '@/lib/utils/date'

export interface TripTemplateData {
  trip: Trip
  days: Day[]
  itinerariesByDay: Record<string, Itinerary[]>
}

export interface TemplateOptions {
  includePreviewControls?: boolean
  includePreviewHeader?: boolean
  customStyles?: string
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
 * 基本スタイルを生成
 */
export function generateBaseStyles(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
        line-height: 1.6;
        color: #333;
        padding: 40px;
        font-size: 12pt;
      }
      .header {
        border-bottom: 3px solid #2563eb;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .title { 
        font-size: 24pt;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 10px;
      }
      .trip-meta {
        color: #666;
        font-size: 11pt;
      }
      .day-section {
        page-break-inside: avoid;
        margin-bottom: 30px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        background: #f9fafb;
      }
      .day-header {
        font-size: 16pt;
        font-weight: bold;
        color: #1e40af;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #ddd;
      }
      .itinerary-item {
        margin-bottom: 15px;
        padding: 12px;
        background: white;
        border-left: 4px solid #3b82f6;
        border-radius: 4px;
      }
      .itinerary-time {
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 5px;
      }
      .itinerary-name {
        font-size: 13pt;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .itinerary-description {
        color: #666;
        font-size: 9pt;
        margin-bottom: 3px;
        line-height: 1.3;
      }
      .itinerary-note {
        color: #666;
        font-size: 10pt;
        margin-top: 5px;
        white-space: pre-wrap;
      }
      .itinerary-address {
        color: #888;
        font-size: 9pt;
        margin-top: 3px;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        text-align: center;
        color: #999;
        font-size: 9pt;
      }
      .no-itineraries {
        color: #999;
        font-style: italic;
        padding: 20px;
        text-align: center;
      }
    </style>
  `
}

/**
 * プレビュー用の追加スタイルを生成
 */
export function generatePreviewStyles(): string {
  return `
    <style>
      body { 
        background: #f8f9fa;
      }
      .preview-header {
        background: #2563eb;
        color: white;
        padding: 20px;
        margin: -40px -40px 30px -40px;
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
      }
      .preview-controls {
        background: white;
        border: 2px solid #2563eb;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 30px;
        text-align: center;
      }
      .preview-controls button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 0 10px;
        font-size: 12pt;
      }
      .preview-controls button:hover {
        background: #1d4ed8;
      }
      .preview-controls .info {
        color: #666;
        font-size: 10pt;
        margin-top: 10px;
      }
      .header {
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .day-section {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .itinerary-item {
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .footer {
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      @media print {
        body { background: white; }
        .preview-header, .preview-controls { display: none; }
        .header, .day-section, .footer { box-shadow: none; }
      }
    </style>
  `
}

/**
 * プレビューヘッダーを生成
 */
export function generatePreviewHeader(): string {
  return `
    <div class="preview-header">
      📄 PDFデザインプレビュー - 開発用表示
    </div>
  `
}

/**
 * プレビューコントロールを生成
 */
export function generatePreviewControls(): string {
  return `
    <div class="preview-controls">
      <button onclick="window.print()">🖨️ 印刷プレビュー</button>
      <button onclick="window.location.reload()">🔄 リロード</button>
      <button onclick="window.close()">❌ 閉じる</button>
      <div class="info">
        💡 このプレビューはPDFと同じデザインです。印刷プレビューでPDF出力時の見た目を確認できます。
      </div>
    </div>
  `
}

/**
 * トリップヘッダーを生成
 */
export function generateTripHeader(trip: Trip): string {
  const startDate = trip.start_date ? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date()) : '未定'
  const endDate = trip.end_date ? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date()) : '未定'
  
  return `
    <div class="header">
      <div class="title">${escapeHtml(trip.name || '無題の旅行')}</div>
      <div class="trip-meta">
        📅 ${startDate} 〜 ${endDate}
        ${trip.destination ? ` | 📍 ${escapeHtml(trip.destination)}` : ''}
      </div>
    </div>
  `
}

/**
 * 日程セクションを生成
 */
export function generateDaySections(data: TripTemplateData): string {
  const { days, itinerariesByDay } = data
  
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
        ? `${dateUtils.formatDate(dayDate)} (${index + 1}日目)`
        : `${index + 1}日目`
      
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
              <div class="itinerary-name">${escapeHtml(item.title || item.name || '無題の旅程')}</div>
              ${item.description ? `<div class="itinerary-description">${escapeHtml(item.description)}</div>` : ''}
              ${item.note ? `<div class="itinerary-note">${escapeHtml(item.note)}</div>` : ''}
              ${item.address ? `<div class="itinerary-address">📍 ${escapeHtml(item.address)}</div>` : ''}
            </div>
          `).join('')
        : '<div class="no-itineraries">予定なし</div>'
      
      return `
        <div class="day-section">
          <div class="day-header">${dayTitle}</div>
          ${itineraryItems}
        </div>
      `
    }).join('')
}

/**
 * フッターを生成
 */
export function generateFooter(): string {
  return `
    <div class="footer">
      Generated by Caglla Travel Manager | ${new Date().toLocaleDateString('ja-JP')}
    </div>
  `
}

/**
 * 完全なHTMLドキュメントを生成
 */
export function generateTripHtml(
  data: TripTemplateData, 
  options: TemplateOptions = {}
): string {
  const { trip } = data
  const { 
    includePreviewControls = false, 
    includePreviewHeader = false,
    customStyles = ''
  } = options

  // スタイルの組み合わせ
  const styles = generateBaseStyles() + 
    (includePreviewControls ? generatePreviewStyles() : '') +
    customStyles

  // コンテンツの組み合わせ
  const previewHeader = includePreviewHeader ? generatePreviewHeader() : ''
  const previewControls = includePreviewControls ? generatePreviewControls() : ''
  const header = generateTripHeader(trip)
  const daySections = generateDaySections(data)
  const footer = generateFooter()

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(trip.name || '無題の旅行')} - ${includePreviewControls ? 'プレビュー' : '旅程表'}</title>
      ${styles}
    </head>
    <body>
      ${previewHeader}
      ${previewControls}
      ${header}
      ${daySections}
      ${footer}
    </body>
    </html>
  `
}
