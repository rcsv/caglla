/**
 * 単位系のデフォルト値決定とユーティリティ
 */

import type { UnitSystem, User } from "@/lib/core/types";

/**
 * ヤードポンド法を使用する国コード
 * アメリカ、リベリア、ミャンマー
 */
const IMPERIAL_COUNTRIES = ["US", "LR", "MM"] as const;

/**
 * 国コードに基づいてデフォルトの単位系を決定
 * @param countryCode 国コード（ISO 3166-1 alpha-2）
 * @returns デフォルトの単位系
 */
export function getDefaultUnitSystem(countryCode?: string | null): UnitSystem {
	if (!countryCode) {
		return "metric"; // デフォルトはメートル法
	}

	return IMPERIAL_COUNTRIES.includes(countryCode.toUpperCase() as any)
		? "imperial"
		: "metric";
}

/**
 * ユーザーの単位系を取得（デフォルト値付き）
 * @param user ユーザーオブジェクト
 * @returns 単位系
 */
export function getUserUnitSystem(user?: User | null): UnitSystem {
	if (user?.preferences?.unit_system) {
		return user.preferences.unit_system;
	}

	// home_country_codeに基づいて自動決定
	return getDefaultUnitSystem(user?.preferences?.home_country_code);
}

/**
 * 単位系から温度単位を取得
 * @param unitSystem 単位系
 * @returns 温度単位（'celsius' または 'fahrenheit'）
 */
export function getTemperatureUnit(
	unitSystem: UnitSystem,
): "celsius" | "fahrenheit" {
	return unitSystem === "imperial" ? "fahrenheit" : "celsius";
}

/**
 * 単位系から距離単位を取得
 * @param unitSystem 単位系
 * @returns 距離単位（'metric' または 'imperial'）
 */
export function getDistanceUnit(unitSystem: UnitSystem): "metric" | "imperial" {
	return unitSystem;
}
