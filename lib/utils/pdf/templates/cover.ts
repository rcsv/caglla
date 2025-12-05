/**
 * 表紙ページテンプレート
 */

import type { PdfContext } from "../types";
import { escapeHtml } from "../helpers/utils";
import { generateQRCode } from "../helpers/utils";
import { toDateOrNull } from "@/lib/firebase/timestamp-utils";
import { dateUtils } from "@/lib/utils/date";

/**
 * 表紙ページを生成
 * @returns ページHTMLの配列（1ページ分）
 */
export async function generateCoverPage(ctx: PdfContext): Promise<string[]> {
	const { trip, days, itinerariesByDay } = ctx;
	
	const startDate = trip.start_date
		? dateUtils.formatDate(toDateOrNull(trip.start_date) || new Date())
		: "未定";
	const endDate = trip.end_date
		? dateUtils.formatDate(toDateOrNull(trip.end_date) || new Date())
		: "未定";

	// 背景画像のURL（旅行データから取得）
	const backgroundImage = trip.cover_image ?? trip.image_url ?? "";

	// QRコード生成
	let qrCodeHtml = "";
	if (ctx.config.tripUrl) {
		const qrDataURL = await generateQRCode(ctx.config.tripUrl);
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
	const issueNo = (days?.length || 1).toString();

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

	if (itinerariesByDay) {
		for (const dayId in itinerariesByDay) {
			const itineraries = itinerariesByDay[dayId] || [];
			for (const itinerary of itineraries) {
				const primaryCategory = itinerary.activity_tag?.primaryCategory;
				if (!primaryCategory) continue;

				const title = itinerary.title;
				if (
					primaryCategory === "exploration" ||
					primaryCategory === "adventure" ||
					primaryCategory === "culture"
				) {
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

	const pageHtml = `
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
              ${qrCodeHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

	return [pageHtml];
}
