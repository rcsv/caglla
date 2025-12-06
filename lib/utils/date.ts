// Date utility functions
import {
	isValidDate as isValidTimestamp,
	toDateOrNull,
} from "@/lib/firebase/timestamp-utils";
import type { FirestoreDate } from "@/lib/core/types";
import { t } from "@/lib/i18n";
import { getUserLanguage } from "@/lib/utils/language";
import type { SupportedLanguage } from "@/lib/core/types";

/**
 * 相対時間をフォーマット（例: "45分前", "2時間前", "昨日"）
 * @param date - フォーマットする日付
 * @returns 相対時間の文字列
 */
export function formatRelativeTime(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) {
		return t("home.mainTabs.relativeTime.justNow");
	} else if (diffMins < 60) {
		return t("home.mainTabs.relativeTime.minutesAgo", { minutes: diffMins });
	} else if (diffHours < 24) {
		return t("home.mainTabs.relativeTime.hoursAgo", { hours: diffHours });
	} else if (diffDays === 1) {
		return t("home.mainTabs.relativeTime.yesterday");
	} else if (diffDays < 7) {
		return t("home.mainTabs.relativeTime.daysAgo", { days: diffDays });
	} else {
		return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
	}
}

/**
 * 日付をロケール形式でフォーマット（シンプル版）
 * @param date - フォーマットする日付（Date、文字列、null、undefined）
 * @returns フォーマットされた日付文字列、または空文字列
 */
export function formatDate(
	date?: Date | string | null,
): string {
	if (!date) return "";
	const d = typeof date === "string" ? new Date(date) : date;
	if (isNaN(d.getTime())) return "";
	return d.toLocaleDateString();
}

export const dateUtils = {
	// Check if a date is valid (delegated to timestamp-utils)
	isValidDate: (date: FirestoreDate | null | undefined): boolean => {
		return isValidTimestamp(date);
	},

	// Format date safely
	// language: Optional language parameter ('ja' or 'en'), defaults to 'ja' for backward compatibility
	formatDate: (
		date: FirestoreDate,
		options?: Intl.DateTimeFormatOptions,
		language?: SupportedLanguage,
	): string => {
		if (!dateUtils.isValidDate(date)) {
			const lang = language || getUserLanguage();
			return t("date.notSet", lang);
		}

		const d = toDateOrNull(date);
		if (!d) {
			const lang = language || getUserLanguage();
			return t("date.notSet", lang);
		}

		const lang = language || getUserLanguage();
		const locale = lang === "ja" ? "ja-JP" : "en-US";

		// デフォルトオプション（yearを含む）
		const defaultOptions: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long",
		};

		// オプションでyearがundefinedの場合、除外する
		const finalOptions = { ...defaultOptions, ...options };
		if (options && "year" in options && options.year === undefined) {
			delete finalOptions.year;
		}

		return d.toLocaleDateString(locale, finalOptions);
	},

	// Format date range safely with unified rules
	formatDateRange: (
		startDate: FirestoreDate,
		endDate: FirestoreDate,
		language?: SupportedLanguage,
	): string => {
		if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
			const lang = language || getUserLanguage();
			return t("date.notSet", lang);
		}

		const start = toDateOrNull(startDate);
		const end = toDateOrNull(endDate);

		if (!start || !end) {
			const lang = language || getUserLanguage();
			return t("date.notSet", lang);
		}

		// Calculate trip duration (more accurate calculation)
		const tripDuration =
			Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		// Apply unified date range formatting rules (without relative time)
		return dateUtils.formatUnifiedDateRangeWithoutRelativeTime(
			start,
			end,
			tripDuration,
		);
	},

	// Unified date range formatting without relative time information
	formatUnifiedDateRangeWithoutRelativeTime: (
		start: Date,
		end: Date,
		tripDuration: number,
	): string => {
		const startYear = start.getFullYear();
		const startMonth = start.getMonth() + 1;
		const startDay = start.getDate();

		const endYear = end.getFullYear();
		const endMonth = end.getMonth() + 1;
		const endDay = end.getDate();

		// Rule 1: Single day - don't show end date
		if (
			startYear === endYear &&
			startMonth === endMonth &&
			startDay === endDay
		) {
			return `${startMonth}/${startDay}`;
		}

		// Rule 2: Same month - omit end month
		if (startYear === endYear && startMonth === endMonth) {
			return `${startMonth}/${startDay} - ${endDay}`;
		}

		// Rule 3: Same year - omit end year
		if (startYear === endYear) {
			return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
		}

		// Rule 4: Different years - show both years
		return `${startYear}/${startMonth}/${startDay} - ${endYear}/${endMonth}/${endDay}`;
	},

	// Get today's date (start of day)
	getToday: (): Date => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return today;
	},

	// Check if a trip is in the future (start date is today or later)
	isFutureTrip: (startDate: FirestoreDate | null | undefined): boolean => {
		if (!dateUtils.isValidDate(startDate)) return false;

		const tripStart = toDateOrNull(startDate);
		if (!tripStart) return false;

		tripStart.setHours(0, 0, 0, 0);
		const today = dateUtils.getToday();
		return tripStart >= today;
	},

	// Check if a trip is in the past (start date is before today)
	isPastTrip: (startDate: FirestoreDate | null | undefined): boolean => {
		if (!dateUtils.isValidDate(startDate)) return false;

		const tripStart = toDateOrNull(startDate);
		if (!tripStart) return false;

		tripStart.setHours(0, 0, 0, 0);
		const today = dateUtils.getToday();
		return tripStart < today;
	},

	// Sort trips by date (future trips ascending, past trips descending)
	sortTripsByDate: <T extends { start_date?: FirestoreDate }>(
		trips: T[],
	): { futureTrips: T[]; pastTrips: T[] } => {
		const today = dateUtils.getToday();

		const futureTrips: T[] = trips
			.filter((trip) => dateUtils.isFutureTrip(trip.start_date))
			.sort((a, b) => {
				if (!a.start_date || !b.start_date) return 0;

				const dateA = toDateOrNull(a.start_date);
				const dateB = toDateOrNull(b.start_date);

				if (!dateA || !dateB) return 0;
				return dateA.getTime() - dateB.getTime();
			});

		const pastTrips: T[] = trips
			.filter((trip) => dateUtils.isPastTrip(trip.start_date))
			.sort((a, b) => {
				if (!a.start_date || !b.start_date) return 0;

				const dateA = toDateOrNull(a.start_date);
				const dateB = toDateOrNull(b.start_date);

				if (!dateA || !dateB) return 0;
				return dateB.getTime() - dateA.getTime();
			});

		return { futureTrips, pastTrips };
	},

	// Format future trip date range with unified rules
	formatFutureTripDate: (
		startDate: FirestoreDate,
		endDate: FirestoreDate,
		language?: SupportedLanguage,
	): string => {
		if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
			return t("date.notSet", language);
		}

		const start = toDateOrNull(startDate);
		const end = toDateOrNull(endDate);

		if (!start || !end) {
			return t("date.notSet", language);
		}

		const today = dateUtils.getToday();

		// Calculate days until trip
		const daysUntil = Math.ceil(
			(start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
		);

		// Calculate trip duration (more accurate calculation)
		const tripDuration =
			Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		// Apply unified date range formatting rules
		const lang = language || getUserLanguage();
		return dateUtils.formatUnifiedDateRange(
			start,
			end,
			daysUntil,
			tripDuration,
			lang,
		);
	},

	// Unified date range formatting with consistent rules
	formatUnifiedDateRange: (
		start: Date,
		end: Date,
		daysUntil: number,
		tripDuration: number,
		language?: SupportedLanguage,
	): string => {
		const lang = language || getUserLanguage();
		const startYear = start.getFullYear();
		const startMonth = start.getMonth() + 1;
		const startDay = start.getDate();

		const endYear = end.getFullYear();
		const endMonth = end.getMonth() + 1;
		const endDay = end.getDate();

		// Rule 1: Single day - don't show end date
		if (
			startYear === endYear &&
			startMonth === endMonth &&
			startDay === endDay
		) {
			const durationText =
				tripDuration === 1
					? t("date.dayTrip", lang)
					: `${tripDuration}${t("date.days", lang)}`;
			return `${startMonth}/${startDay} (${daysUntil}${t("date.daysLater", lang)}、${durationText})`;
		}

		// Rule 2: Same month - omit end month
		if (startYear === endYear && startMonth === endMonth) {
			return `${startMonth}/${startDay} - ${endDay} (${daysUntil}${t("date.daysLater", lang)}、${tripDuration}${t("date.days", lang)})`;
		}

		// Rule 3: Same year - omit end year
		if (startYear === endYear) {
			return `${startMonth}/${startDay} - ${endMonth}/${endDay} (${daysUntil}${t("date.daysLater", lang)}、${tripDuration}${t("date.days", lang)})`;
		}

		// Rule 4: Different years - show both years
		return `${startYear}/${startMonth}/${startDay} - ${endYear}/${endMonth}/${endDay} (${daysUntil}${t("date.daysLater", lang)}、${tripDuration}${t("date.days", lang)})`;
	},

	// Format past trip date range with relative time
	formatPastTripDate: (
		startDate: FirestoreDate,
		endDate: FirestoreDate,
		language?: SupportedLanguage,
	): string => {
		if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
			const lang = language || getUserLanguage();
			return t("date.notSet", lang);
		}

		const start = toDateOrNull(startDate);
		if (!start) {
			const lang = language || getUserLanguage();
			return t("date.notSet", lang);
		}

		const lang = language || getUserLanguage();
		const locale = lang === "ja" ? "ja-JP" : "en-US";
		const today = dateUtils.getToday();

		// Calculate years and months difference
		const startYear = start.getFullYear();
		const startMonth = start.getMonth();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth();

		const yearDiff = currentYear - startYear;
		const monthDiff = currentMonth - startMonth;
		const totalMonths = yearDiff * 12 + monthDiff;

		let timeAgo: string;
		if (totalMonths < 12) {
			// Less than 1 year
			if (totalMonths === 0) {
				timeAgo = t("date.thisMonth", lang);
			} else {
				timeAgo = `${totalMonths}${t("date.monthsAgo", lang)}`;
			}
			const monthName = start.toLocaleDateString(locale, { month: "long" });
			return `${timeAgo} (${monthName})`;
		} else {
			// 1+ years ago
			const yearName = start.toLocaleDateString(locale, {
				year: "numeric",
				month: "long",
			});
			return `${yearDiff}${t("date.yearsAgo", lang)} (${yearName})`;
		}
	},

	// Format trip date range in compact format
	// language: Optional language parameter ('ja' or 'en'), defaults to 'ja' for backward compatibility
	formatTripDateRange: (
		startDate: FirestoreDate,
		endDate: FirestoreDate,
		language: "ja" | "en" = "ja",
	): string => {
		if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
			return ""; // Return empty string to indicate error, component will handle i18n
		}

		const start = toDateOrNull(startDate);
		const end = toDateOrNull(endDate);

		if (!start || !end) {
			return ""; // Return empty string to indicate error, component will handle i18n
		}

		const locale = language === "ja" ? "ja-JP" : "en-US";

		const startYear = start.getFullYear();
		const startMonth = start.getMonth() + 1;
		const startDay = start.getDate();
		const startWeekday = start.toLocaleDateString(locale, { weekday: "short" });

		const endYear = end.getFullYear();
		const endMonth = end.getMonth() + 1;
		const endDay = end.getDate();
		const endWeekday = end.toLocaleDateString(locale, { weekday: "short" });

		// Same year
		if (startYear === endYear) {
			// Same month
			if (startMonth === endMonth) {
				// Same day (1-day trip)
				if (startDay === endDay) {
					if (language === "ja") {
						return `${startYear}年${startMonth}月${startDay}日 (${startWeekday})`;
					} else {
						// English format: "Nov 8 (Sat)"
						const startDateStr = start.toLocaleDateString(locale, {
							month: "short",
							day: "numeric",
						});
						return `${startDateStr} (${startWeekday})`;
					}
				}
				// Different days in same month
				if (language === "ja") {
					return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endDay} (${endWeekday})`;
				} else {
					// English format: "Nov 8 (Sat) - 9 (Sun)"
					const startDateStr = start.toLocaleDateString(locale, {
						month: "short",
						day: "numeric",
					});
					return `${startDateStr} (${startWeekday}) - ${endDay} (${endWeekday})`;
				}
			} else {
				// Different months
				if (language === "ja") {
					return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endMonth}月${endDay}日(${endWeekday})`;
				} else {
					// English format: "Nov 8 (Sat) - Dec 9 (Sun)"
					const startDateStr = start.toLocaleDateString(locale, {
						month: "short",
						day: "numeric",
					});
					const endDateStr = end.toLocaleDateString(locale, {
						month: "short",
						day: "numeric",
					});
					return `${startDateStr} (${startWeekday}) - ${endDateStr} (${endWeekday})`;
				}
			}
		} else {
			// Different years
			if (language === "ja") {
				return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endYear}年${endMonth}月${endDay}日 (${endWeekday})`;
			} else {
				// English format: "Nov 8, 2025 (Sat) - Jan 9, 2026 (Sun)"
				const startDateStr = start.toLocaleDateString(locale, {
					year: "numeric",
					month: "short",
					day: "numeric",
				});
				const endDateStr = end.toLocaleDateString(locale, {
					year: "numeric",
					month: "short",
					day: "numeric",
				});
				return `${startDateStr} (${startWeekday}) - ${endDateStr} (${endWeekday})`;
			}
		}
	},

	// Format duration in a compact way (e.g., 32h32m -> 32.5h)
	formatDurationCompact: (totalMinutes: number): string => {
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		// Round minutes to nearest 15-minute interval
		const roundedMinutes = Math.round(minutes / 15) * 15;

		// Convert to decimal hours
		const decimalHours = hours + roundedMinutes / 60;

		// Format with appropriate decimal places
		if (roundedMinutes === 0) {
			return `${hours}h`;
		} else if (roundedMinutes === 60) {
			return `${hours + 1}h`;
		} else {
			return `${decimalHours}h`;
		}
	},

	// Convert date to yyyy-mm-dd format for URL parameters
	toUrlDateString: (date: FirestoreDate): string => {
		if (!dateUtils.isValidDate(date)) {
			throw new Error("Invalid date provided");
		}

		const d = toDateOrNull(date);
		if (!d) {
			throw new Error("Invalid date provided");
		}

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	},

	// Parse yyyy-mm-dd format from URL parameters
	fromUrlDateString: (dateString: string): Date => {
		if (!dateString || typeof dateString !== "string") {
			throw new Error("Invalid date string provided");
		}

		// Validate format (yyyy-mm-dd)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(dateString)) {
			throw new Error("Date string must be in yyyy-mm-dd format");
		}

		const date = new Date(dateString + "T00:00:00.000Z");

		if (isNaN(date.getTime())) {
			throw new Error("Invalid date string provided");
		}

		return date;
	},

	// Check if two dates are the same day (ignoring time)
	isSameDay: (date1: FirestoreDate, date2: FirestoreDate): boolean => {
		if (!dateUtils.isValidDate(date1) || !dateUtils.isValidDate(date2)) {
			return false;
		}

		const d1 = toDateOrNull(date1);
		const d2 = toDateOrNull(date2);

		if (!d1 || !d2) {
			return false;
		}

		return (
			d1.getFullYear() === d2.getFullYear() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getDate() === d2.getDate()
		);
	},

	// Convert any date format to Date object (returns null if invalid)
	toDate: (date: FirestoreDate | null | undefined): Date | null => {
		return toDateOrNull(date);
	},
};
