/**
 * データエクスポート用ヘルパー関数
 *
 * Trip、Day、Itinerary、ReservationデータをCSV/JSON/iCal形式にエクスポートする機能を提供
 */

import type { Trip, Day, Itinerary, ReservationInfo } from "@/lib/core/types";

// ============================================================================
// JSON エクスポート
// ============================================================================

/**
 * Trip全体をJSON形式でエクスポート
 */
export function exportTripToJson(trip: Trip): string {
	const exportData = {
		trip: {
			id: trip.id,
			title: trip.title,
			slug: trip.slug,
			description: trip.description,
			destination: trip.destination,
			destination_place_id: trip.destination_place_id,
			start_date: trip.start_date,
			end_date: trip.end_date,
			status: trip.status,
			access_level: trip.access_level,
			image_url: trip.image_url,
			created_at: trip.created_at,
			updated_at: trip.updated_at,
		},
		days: trip.days?.map((day) => ({
			id: day.id,
			day_number: day.day_number,
			date: day.date,
			description: day.description,
			itineraries: day.itineraries?.map((itinerary) => ({
				id: itinerary.id,
				sort_number: itinerary.sort_number,
				title: itinerary.title,
				description: itinerary.description,
				location: itinerary.location,
				place_id: itinerary.place_id,
				start_time: itinerary.start_time,
				end_time: itinerary.end_time,
				timezone: itinerary.timezone,
				cost_amount: itinerary.cost_amount,
				cost_currency: itinerary.cost_currency,
				activity_tag: itinerary.activity_tag,
				reservation: itinerary.reservation,
			})),
		})),
		exported_at: new Date().toISOString(),
	};

	return JSON.stringify(exportData, null, 2);
}

/**
 * 予約情報のみをJSON形式でエクスポート
 */
export function exportReservationsToJson(trip: Trip): string {
	const reservations: any[] = [];

	trip.days?.forEach((day) => {
		day.itineraries?.forEach((itinerary) => {
			if (itinerary.reservation) {
				reservations.push({
					trip_title: trip.title,
					day_number: day.day_number,
					date: day.date,
					itinerary_title: itinerary.title,
					reservation: itinerary.reservation,
				});
			}
		});
	});

	return JSON.stringify(
		{
			trip_title: trip.title,
			reservations,
			exported_at: new Date().toISOString(),
		},
		null,
		2,
	);
}

// ============================================================================
// CSV エクスポート
// ============================================================================

/**
 * CSVエスケープ処理
 */
function escapeCsvValue(value: any): string {
	if (value === null || value === undefined) {
		return "";
	}

	const str = String(value);

	// カンマ、改行、ダブルクォートを含む場合はエスケープ
	if (str.includes(",") || str.includes("\n") || str.includes('"')) {
		return `"${str.replace(/"/g, '""')}"`;
	}

	return str;
}

/**
 * 日付をフォーマット（ISO 8601形式）
 */
function formatDate(date: any): string {
	if (!date) return "";

	// Firestoreタイムスタンプの場合
	if (date.toDate && typeof date.toDate === "function") {
		return date.toDate().toISOString();
	}

	// Date オブジェクトの場合
	if (date instanceof Date) {
		return date.toISOString();
	}

	// 文字列の場合
	return String(date);
}

/**
 * Trip全体をCSV形式でエクスポート（旅程一覧）
 */
export function exportTripToItineraryCSV(trip: Trip): string {
	const headers = [
		"Trip Title",
		"Day Number",
		"Date",
		"Sort Number",
		"Itinerary Title",
		"Description",
		"Location",
		"Start Time",
		"End Time",
		"Timezone",
		"Cost Amount",
		"Cost Currency",
		"Activity Tag",
		"Has Reservation",
	];

	const rows: string[][] = [headers];

	trip.days?.forEach((day) => {
		day.itineraries?.forEach((itinerary) => {
			rows.push([
				escapeCsvValue(trip.title),
				escapeCsvValue(day.day_number),
				escapeCsvValue(formatDate(day.date)),
				escapeCsvValue(itinerary.sort_number),
				escapeCsvValue(itinerary.title),
				escapeCsvValue(itinerary.description),
				escapeCsvValue(itinerary.location),
				escapeCsvValue(itinerary.start_time),
				escapeCsvValue(itinerary.end_time),
				escapeCsvValue(itinerary.timezone),
				escapeCsvValue(itinerary.cost_amount),
				escapeCsvValue(itinerary.cost_currency),
				escapeCsvValue(itinerary.activity_tag),
				escapeCsvValue(itinerary.reservation ? "Yes" : "No"),
			]);
		});
	});

	return rows.map((row) => row.join(",")).join("\n");
}

/**
 * 予約情報のみをCSV形式でエクスポート
 */
export function exportReservationsToCSV(trip: Trip): string {
	const headers = [
		"Trip Title",
		"Day Number",
		"Date",
		"Itinerary Title",
		"Reservation Type",
		"Confirmation Number",
		"Reservation Site",
		"Reservation URL",
		"Start Date",
		"End Date",
		"Flight Number",
		"Departure Airport",
		"Arrival Airport",
		"Departure At",
		"Arrival At",
		"Airline",
		"Notes",
	];

	const rows: string[][] = [headers];

	trip.days?.forEach((day) => {
		day.itineraries?.forEach((itinerary) => {
			if (itinerary.reservation) {
				const res = itinerary.reservation as ReservationInfo;
				rows.push([
					escapeCsvValue(trip.title),
					escapeCsvValue(day.day_number),
					escapeCsvValue(formatDate(day.date)),
					escapeCsvValue(itinerary.title),
					escapeCsvValue(res.type),
					escapeCsvValue(res.confirmation_number),
					escapeCsvValue(res.reservation_site),
					escapeCsvValue(res.reservation_url),
					escapeCsvValue(formatDate(res.start_date)),
					escapeCsvValue(formatDate(res.end_date)),
					escapeCsvValue(res.flight_number),
					escapeCsvValue(res.departure_airport),
					escapeCsvValue(res.arrival_airport),
					escapeCsvValue(formatDate(res.departure_at)),
					escapeCsvValue(formatDate(res.arrival_at)),
					escapeCsvValue(res.airline),
					escapeCsvValue(res.notes),
				]);
			}
		});
	});

	return rows.map((row) => row.join(",")).join("\n");
}

// ============================================================================
// ダウンロードヘルパー
// ============================================================================

/**
 * ブラウザでファイルをダウンロード
 */
export function downloadFile(
	content: string,
	filename: string,
	mimeType: string,
) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Trip全体をJSON形式でダウンロード
 */
export function downloadTripAsJson(trip: Trip) {
	const content = exportTripToJson(trip);
	const filename = `${trip.slug || trip.id}_trip.json`;
	downloadFile(content, filename, "application/json");
}

/**
 * Trip全体をCSV形式でダウンロード
 */
export function downloadTripAsCSV(trip: Trip) {
	const content = exportTripToItineraryCSV(trip);
	const filename = `${trip.slug || trip.id}_itinerary.csv`;
	downloadFile(content, filename, "text/csv;charset=utf-8");
}

/**
 * 予約情報をJSON形式でダウンロード
 */
export function downloadReservationsAsJson(trip: Trip) {
	const content = exportReservationsToJson(trip);
	const filename = `${trip.slug || trip.id}_reservations.json`;
	downloadFile(content, filename, "application/json");
}

/**
 * 予約情報をCSV形式でダウンロード
 */
export function downloadReservationsAsCSV(trip: Trip) {
	const content = exportReservationsToCSV(trip);
	const filename = `${trip.slug || trip.id}_reservations.csv`;
	downloadFile(content, filename, "text/csv;charset=utf-8");
}

// ============================================================================
// iCal エクスポート
// ============================================================================

/**
 * iCal形式のエスケープ処理
 * RFC 5545に準拠
 */
function escapeICalValue(value: string): string {
	return value
		.replace(/\\/g, "\\\\") // バックスラッシュをエスケープ
		.replace(/;/g, "\\;") // セミコロンをエスケープ
		.replace(/,/g, "\\,") // カンマをエスケープ
		.replace(/\n/g, "\\n"); // 改行をエスケープ
}

/**
 * 日時をiCal形式（UTC）に変換
 * 形式: YYYYMMDDTHHmmssZ
 */
function formatICalDateTime(date: Date): string {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * 日時をiCal形式（タイムゾーン指定）に変換
 * 形式: DTSTART;TZID=Pacific/Honolulu:YYYYMMDDTHHmmss
 * 
 * dateは、combineDateAndTimeで作成されたDateオブジェクトで、
 * ユーザーが入力した時刻（例：10:00）をローカル時刻として解釈している。
 * タイムゾーンを指定する場合、そのタイムゾーンでの時刻を正しく出力する。
 * 
 * 注意: dateオブジェクトは既にユーザーが入力した時刻（例：10:00）を
 * ローカル時刻として保持しているため、その時刻をそのままタイムゾーンで出力する。
 */
function formatICalDateTimeWithTimezone(
	date: Date,
	timezone: string | undefined,
): string {
	if (!timezone || timezone === "UTC") {
		return `DTSTART:${formatICalDateTime(date)}`;
	}

	// dateオブジェクトから年、月、日、時、分を取得
	// これらはユーザーが入力した時刻をローカル時刻として保持している
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");

	return `DTSTART;TZID=${timezone}:${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * 日付のみをiCal形式に変換
 * 形式: YYYYMMDD
 */
function formatICalDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

/**
 * Day の日付と時刻を合成して Date オブジェクトを生成
 * タイムゾーンを考慮して、指定されたタイムゾーンでの時刻として解釈する
 */
function combineDateAndTime(
	dayDate: any,
	time: string | undefined,
	_timezone?: string, // 未使用だが、将来の拡張のために保持
): Date | null {
	if (!time) return null;

	try {
		// Firestoreタイムスタンプの場合
		let baseDate: Date;
		if (dayDate.toDate && typeof dayDate.toDate === "function") {
			baseDate = dayDate.toDate();
		} else if (dayDate instanceof Date) {
			baseDate = dayDate;
		} else {
			baseDate = new Date(dayDate);
		}

		const [hours, minutes] = time.split(":").map((v) => parseInt(v, 10));
		if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

		// タイムゾーンが指定されている場合でも、dateオブジェクトは
		// ユーザーが入力した時刻をローカル時刻として保持する
		// iCal出力時には formatICalDateTimeWithTimezone で正しく変換される
		const result = new Date(baseDate);
		result.setHours(hours, minutes, 0, 0);
		return result;
	} catch {
		return null;
	}
}

/**
 * Trip全体をiCal形式でエクスポート（全Itinerary）
 */
export function exportTripToICal(trip: Trip): string {
	console.log(
		`[iCal Export Debug] Starting trip iCal export for: ${trip.title}`,
	);
	console.log(`[iCal Export Debug] Trip has ${trip.days?.length || 0} days`);

	const lines: string[] = [];

	// ヘッダー
	lines.push("BEGIN:VCALENDAR");
	lines.push("VERSION:2.0");
	lines.push("PRODID:-//rcsv//Caglla Travel Manager//EN");
	lines.push(`X-WR-CALNAME:${escapeICalValue(trip.title)}`);
	lines.push("CALSCALE:GREGORIAN");
	lines.push("METHOD:PUBLISH");
	lines.push("REFRESH-INTERVAL;VALUE=DURATION:PT1H"); // 1時間ごとに自動更新
	lines.push("X-PUBLISHED-TTL:PT1H"); // カレンダーアプリへのヒント

	let eventCount = 0;

	// 各Itineraryをイベントとして追加
	trip.days?.forEach((day) => {
		console.log(
			`[iCal Export Debug] Processing day ${day.day_number} with ${day.itineraries?.length || 0} itineraries`,
		);

		day.itineraries?.forEach((itinerary) => {
			// 時刻が設定されていないItineraryはスキップ
			if (!itinerary.start_time) {
				console.log(
					`[iCal Export Debug] Skipping event without start_time: ${itinerary.title}`,
				);
				return;
			}

			eventCount++;
			console.log(
				`[iCal Export Debug] Adding event ${eventCount}: ${itinerary.title}`,
			);
			console.log(
				`[iCal Export Debug] Itinerary data:`,
				{
					id: itinerary.id,
					title: itinerary.title,
					description: itinerary.description,
					location: itinerary.location,
					hasDescription: !!itinerary.description,
					hasLocation: !!itinerary.location,
				},
			);

			lines.push("BEGIN:VEVENT");

			// UID（ユニークID）
			lines.push(`UID:${itinerary.id}@caglla.travel`);

			// タイトル
			lines.push(`SUMMARY:${escapeICalValue(itinerary.title)}`);

			// 説明（旅行タイトル + 既存の説明 + by Caglla）
			let description = `Trip: ${trip.title}`;
			if (itinerary.description) {
				description += `\\n${itinerary.description}`;
			}
			description += "\\n\\nby Caglla";
			lines.push(`DESCRIPTION:${escapeICalValue(description)}`);

			// 場所（locationが未設定の場合はplace_dataから取得）
			// 優先順位: location > formatted_address > name
			const location =
				itinerary.location ||
				itinerary.place_data?.formatted_address ||
				itinerary.place_data?.name;
			if (location) {
				lines.push(`LOCATION:${escapeICalValue(location)}`);
			}

			// 日時（start_timeが必須）
			// タイムゾーンを考慮してローカル時刻で出力
			const timezone = itinerary.timezone || "UTC";
			const startDate = combineDateAndTime(day.date, itinerary.start_time, timezone);
			if (startDate) {
				lines.push(formatICalDateTimeWithTimezone(startDate, timezone));
			}

			if (itinerary.end_time) {
				const endDate = combineDateAndTime(day.date, itinerary.end_time, timezone);
				if (endDate) {
					// DTENDも同じタイムゾーン形式を使用
					const dtendLine = formatICalDateTimeWithTimezone(endDate, timezone);
					lines.push(dtendLine.replace("DTSTART", "DTEND"));
				}
			}

			// タイムスタンプ
			lines.push(`DTSTAMP:${formatICalDateTime(new Date())}`);

			// アラーム（30分前に通知）
			lines.push("BEGIN:VALARM");
			lines.push("ACTION:DISPLAY");
			lines.push(`DESCRIPTION:Reminder: ${escapeICalValue(itinerary.title)}`);
			lines.push("TRIGGER:-PT30M"); // 30分前
			lines.push("END:VALARM");

			lines.push("END:VEVENT");
		});
	});

	lines.push("END:VCALENDAR");

	const result = lines.join("\r\n");
	console.log(
		`[iCal Export Debug] Completed trip iCal export: ${eventCount} events, ${result.length} chars`,
	);

	return result;
}

/**
 * 予約情報のみをiCal形式でエクスポート
 */
export function exportReservationsToICal(trip: Trip): string {
	console.log(
		`[iCal Export Debug] Starting reservations iCal export for: ${trip.title}`,
	);

	const lines: string[] = [];

	// ヘッダー
	lines.push("BEGIN:VCALENDAR");
	lines.push("VERSION:2.0");
	lines.push("PRODID:-//rcsv//Caglla Travel Manager//EN");
	lines.push(`X-WR-CALNAME:${escapeICalValue(trip.title)} - Reservations`);
	lines.push("CALSCALE:GREGORIAN");
	lines.push("METHOD:PUBLISH");
	lines.push("REFRESH-INTERVAL;VALUE=DURATION:PT1H"); // 1時間ごとに自動更新
	lines.push("X-PUBLISHED-TTL:PT1H"); // カレンダーアプリへのヒント

	let reservationCount = 0;

	// 予約情報を持つItineraryのみをイベントとして追加
	trip.days?.forEach((day) => {
		day.itineraries?.forEach((itinerary) => {
			if (!itinerary.reservation) return;

			reservationCount++;
			console.log(
				`[iCal Export Debug] Adding reservation ${reservationCount}: ${itinerary.title}`,
			);

			const res = itinerary.reservation as ReservationInfo;

			lines.push("BEGIN:VEVENT");

			// UID（ユニークID）
			lines.push(`UID:${itinerary.id}-reservation@caglla.travel`);

			// タイトル（予約タイプを含める）
			const typeLabel =
				res.type === "flight"
					? "✈️ Flight"
					: res.type === "hotel"
						? "🏨 Hotel"
						: res.type === "rental_car"
							? "🚗 Rental Car"
							: res.type === "dining"
								? "🍽️ Dining"
								: "📋 Reservation";
			lines.push(
				`SUMMARY:${escapeICalValue(`${typeLabel}: ${itinerary.title}`)}`,
			);

			// 説明（旅行タイトル + 予約詳細 + by Caglla）
			let description = `Trip: ${trip.title}`;
			if (res.confirmation_number) {
				description += `\\nConfirmation: ${res.confirmation_number}`;
			}
			if (res.reservation_site) {
				description += `\\nSite: ${res.reservation_site}`;
			}
			if (res.flight_number) {
				description += `\\nFlight: ${res.flight_number}`;
			}
			if (res.departure_airport && res.arrival_airport) {
				description += `\\nRoute: ${res.departure_airport} → ${res.arrival_airport}`;
			}
			if (res.notes) {
				description += `\\nNotes: ${res.notes}`;
			}
			description += "\\n\\nby Caglla";
			lines.push(`DESCRIPTION:${escapeICalValue(description)}`);

			// 場所
			if (itinerary.location) {
				lines.push(`LOCATION:${escapeICalValue(itinerary.location)}`);
			}

			// 日時（予約タイプに応じて）
			if (res.type === "flight" && res.departure_at) {
				const departureDate = formatDate(res.departure_at);
				const arrivalDate = res.arrival_at ? formatDate(res.arrival_at) : null;

				if (departureDate) {
					lines.push(`DTSTART:${formatICalDateTime(new Date(departureDate))}`);
				}
				if (arrivalDate) {
					lines.push(`DTEND:${formatICalDateTime(new Date(arrivalDate))}`);
				}
			} else if (res.start_date) {
				const startDate = formatDate(res.start_date);
				const endDate = res.end_date ? formatDate(res.end_date) : null;

				if (startDate) {
					const start = new Date(startDate);
					lines.push(`DTSTART;VALUE=DATE:${formatICalDate(start)}`);
				}
				if (endDate) {
					const end = new Date(endDate);
					// 終日イベントの終了日は翌日
					end.setDate(end.getDate() + 1);
					lines.push(`DTEND;VALUE=DATE:${formatICalDate(end)}`);
				}
			} else if (itinerary.start_time) {
				// 予約日時が不明な場合はItineraryの日時を使用
				const startDate = combineDateAndTime(day.date, itinerary.start_time);
				const endDate = itinerary.end_time
					? combineDateAndTime(day.date, itinerary.end_time)
					: null;

				if (startDate) {
					lines.push(`DTSTART:${formatICalDateTime(startDate)}`);
				}
				if (endDate) {
					lines.push(`DTEND:${formatICalDateTime(endDate)}`);
				}
			}

			// アラーム（予約の1日前に通知）
			if (res.type === "flight" || res.type === "hotel") {
				lines.push("BEGIN:VALARM");
				lines.push("ACTION:DISPLAY");
				lines.push(`DESCRIPTION:Reminder: ${escapeICalValue(itinerary.title)}`);
				lines.push("TRIGGER:-PT24H"); // 24時間前
				lines.push("END:VALARM");
			}

			// アラーム（30分前に通知）
			lines.push("BEGIN:VALARM");
			lines.push("ACTION:DISPLAY");
			lines.push(`DESCRIPTION:Reminder: ${escapeICalValue(itinerary.title)}`);
			lines.push("TRIGGER:-PT30M"); // 30分前
			lines.push("END:VALARM");

			// タイムスタンプ
			lines.push(`DTSTAMP:${formatICalDateTime(new Date())}`);

			lines.push("END:VEVENT");
		});
	});

	lines.push("END:VCALENDAR");

	const result = lines.join("\r\n");
	console.log(
		`[iCal Export Debug] Completed reservations iCal export: ${reservationCount} reservations, ${result.length} chars`,
	);

	return result;
}

/**
 * Trip全体をiCal形式でダウンロード
 */
export function downloadTripAsICal(trip: Trip) {
	const content = exportTripToICal(trip);
	const filename = `${trip.slug || trip.id}_itinerary.ics`;
	downloadFile(content, filename, "text/calendar;charset=utf-8");
}

/**
 * 予約情報をiCal形式でダウンロード
 */
export function downloadReservationsAsICal(trip: Trip) {
	const content = exportReservationsToICal(trip);
	const filename = `${trip.slug || trip.id}_reservations.ics`;
	downloadFile(content, filename, "text/calendar;charset=utf-8");
}

// ============================================================================
// PDF エクスポート (SelectPdf API経由)
// ============================================================================

/**
 * Trip全体をPDF形式でエクスポート (SelectPdf API経由)
 *
 * @param tripId トリップID
 * @param token 認証トークン
 * @param onProgress 進捗コールバック (optional)
 * @throws Error if API call fails or user plan doesn't allow PDF export
 */
export async function exportTripToPdf(
	tripSlugOrId: string,
	token: string,
	onProgress?: (message: string) => void,
): Promise<void> {
	try {
		onProgress?.("PDF生成中...");

		const response = await fetch(`/api/trips/${tripSlugOrId}/pdf`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			if (response.status === 403) {
				if (errorData.message?.includes("Upgrade Required")) {
					throw new Error(
						"PDF Export requires Backpacker plan or higher. Please upgrade your plan.",
					);
				}
				throw new Error("You do not have permission to export this trip.");
			}

			if (response.status === 401) {
				throw new Error("Authentication failed. Please log in again.");
			}

			if (response.status === 404) {
				throw new Error("Trip not found.");
			}

			if (response.status === 503) {
				throw new Error("PDF export service is currently unavailable.");
			}

			throw new Error(errorData.error || "PDF generation failed");
		}

		onProgress?.("PDFをダウンロード中...");

		// PDFをBlobとして取得
		const blob = await response.blob();

		// Content-Dispositionヘッダーからファイル名を取得
		const contentDisposition = response.headers.get("content-disposition");
		let filename = "trip_itinerary.pdf";

		if (contentDisposition) {
			const filenameMatch = contentDisposition.match(
				/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
			);
			if (filenameMatch && filenameMatch[1]) {
				filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
			}
		}

		// ダウンロード
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		onProgress?.("完了！");
	} catch (error) {
		console.error("PDF export error:", error);
		throw error;
	}
}

/**
 * PDFエクスポートが利用可能かチェック
 *
 * @param userPlan ユーザーのプラン
 * @returns PDFエクスポートが利用可能かどうか
 */
export function canExportToPdf(userPlan: string): boolean {
	// season_traveler (無料プラン) は PDF エクスポートを利用できない
	return userPlan !== "season_traveler";
}
