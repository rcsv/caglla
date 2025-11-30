import { parseOpeningHours } from "@/components/modals/utils/parse-opening-hours";
import { t } from "@/lib/i18n";

describe("parseOpeningHours", () => {
	it("returns null when weekdayText is undefined", () => {
		expect(parseOpeningHours(undefined)).toBeNull();
	});

	it("parses English opening hours and detects open status", () => {
		const weekdayText = [
			"Monday: 9:00 AM – 6:00 PM",
			"Tuesday: 9:00 AM – 6:00 PM",
			"Wednesday: 9:00 AM – 6:00 PM",
			"Thursday: 9:00 AM – 6:00 PM",
			"Friday: 9:00 AM – 6:00 PM",
			"Saturday: 10:00 AM – 4:00 PM",
			"Sunday: Closed",
		];

		const result = parseOpeningHours(
			weekdayText,
			"en",
			new Date("2024-03-04T10:30:00"),
		); // Monday

		expect(result).not.toBeNull();
		expect(result?.isOpen).toBe(true);
		expect(result?.currentHours).toBe("09:00 - 18:00");
		expect(result?.openDays[6]).toBe(false); // Sunday closed
	});

	it("parses Japanese 24 hour schedule", () => {
		const weekdayText = [
			"月曜日: 24時間営業",
			"火曜日: 24時間営業",
			"水曜日: 24時間営業",
			"木曜日: 24時間営業",
			"金曜日: 24時間営業",
			"土曜日: 24時間営業",
			"日曜日: 24時間営業",
		];

		const result = parseOpeningHours(
			weekdayText,
			"ja",
			new Date("2024-03-05T02:15:00"),
		); // Tuesday

		expect(result).not.toBeNull();
		expect(result?.isOpen).toBe(true);
		expect(result?.currentHours).toBe(t("poi.openingHours.open24h", "ja"));
	});

	it("handles closed day detection", () => {
		const weekdayText = [
			"Monday: Closed",
			"Tuesday: 9:00 AM – 5:00 PM",
			"Wednesday: 9:00 AM – 5:00 PM",
			"Thursday: 9:00 AM – 5:00 PM",
			"Friday: 9:00 AM – 5:00 PM",
			"Saturday: 10:00 AM – 3:00 PM",
			"Sunday: 10:00 AM – 3:00 PM",
		];

		const result = parseOpeningHours(
			weekdayText,
			"en",
			new Date("2024-03-04T12:00:00"),
		); // Monday

		expect(result).not.toBeNull();
		expect(result?.isOpen).toBe(false);
		expect(result?.currentHours).toBe(t("poi.openingHours.closedDay", "en"));
	});
});
