import { isValidTimeFormat, formatTimeForDisplay } from "../time-validation";

describe("time-validation", () => {
	describe("isValidTimeFormat", () => {
		it("should return true for valid time formats", () => {
			expect(isValidTimeFormat("09:00")).toBe(true);
			expect(isValidTimeFormat("23:59")).toBe(true);
			expect(isValidTimeFormat("00:00")).toBe(true);
		});

		it("should return false for invalid time formats", () => {
			expect(isValidTimeFormat("25:00")).toBe(false); // Invalid hour
			expect(isValidTimeFormat("09:60")).toBe(false); // Invalid minute
			expect(isValidTimeFormat("abc")).toBe(false);
			expect(isValidTimeFormat("9:0")).toBe(false);
		});

		it("should allow 1 digit hour format", () => {
			expect(isValidTimeFormat("9:00")).toBe(true); // Valid with 1-digit hour
			expect(isValidTimeFormat("9:30")).toBe(true);
		});
	});

	describe("formatTimeForDisplay", () => {
		it("should format time strings correctly", () => {
			expect(formatTimeForDisplay("09:00")).toBe("9:00");
			expect(formatTimeForDisplay("23:59")).toBe("23:59");
			expect(formatTimeForDisplay("00:00")).toBe("0:00");
		});

		it("should return default for empty time", () => {
			expect(formatTimeForDisplay("")).toBe("--:--");
		});
	});
});
