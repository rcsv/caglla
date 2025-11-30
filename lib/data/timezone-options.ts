export interface TimezoneOption {
	value: string;
	label: string; // 後方互換性のため残す（i18n化後は使用しない）
	i18nKey: string; // i18nキー（例: 'timezone.japan_tokyo'）
	offset: number;
	region: "Global" | "Asia" | "Americas" | "Europe" | "Oceania" | "Pacific";
}

export const TIMEZONE_OPTIONS: readonly TimezoneOption[] = [
	{
		value: "UTC",
		label: "UTC",
		i18nKey: "timezone.UTC",
		offset: 0,
		region: "Global",
	},
	{
		value: "Asia/Tokyo",
		label: "日本 (Tokyo)",
		i18nKey: "timezone.japan_tokyo",
		offset: 540,
		region: "Asia",
	},
	{
		value: "America/New_York",
		label: "アメリカ (New York)",
		i18nKey: "timezone.america_new_york",
		offset: -300,
		region: "Americas",
	},
	{
		value: "America/Los_Angeles",
		label: "アメリカ (Los Angeles)",
		i18nKey: "timezone.america_los_angeles",
		offset: -480,
		region: "Americas",
	},
	{
		value: "Europe/London",
		label: "イギリス (London)",
		i18nKey: "timezone.europe_london",
		offset: 0,
		region: "Europe",
	},
	{
		value: "Europe/Paris",
		label: "フランス (Paris)",
		i18nKey: "timezone.europe_paris",
		offset: 60,
		region: "Europe",
	},
	{
		value: "Asia/Seoul",
		label: "韓国 (Seoul)",
		i18nKey: "timezone.asia_seoul",
		offset: 540,
		region: "Asia",
	},
	{
		value: "Asia/Shanghai",
		label: "中国 (Shanghai)",
		i18nKey: "timezone.asia_shanghai",
		offset: 480,
		region: "Asia",
	},
	{
		value: "Asia/Hong_Kong",
		label: "香港 (Hong Kong)",
		i18nKey: "timezone.asia_hong_kong",
		offset: 480,
		region: "Asia",
	},
	{
		value: "Asia/Singapore",
		label: "シンガポール (Singapore)",
		i18nKey: "timezone.asia_singapore",
		offset: 480,
		region: "Asia",
	},
	{
		value: "Asia/Bangkok",
		label: "タイ (Bangkok)",
		i18nKey: "timezone.asia_bangkok",
		offset: 420,
		region: "Asia",
	},
	{
		value: "Asia/Kolkata",
		label: "インド (Kolkata)",
		i18nKey: "timezone.asia_kolkata",
		offset: 330,
		region: "Asia",
	},
	{
		value: "Australia/Sydney",
		label: "オーストラリア (Sydney)",
		i18nKey: "timezone.australia_sydney",
		offset: 600,
		region: "Oceania",
	},
	{
		value: "Pacific/Honolulu",
		label: "ハワイ (Honolulu)",
		i18nKey: "timezone.pacific_honolulu",
		offset: -600,
		region: "Pacific",
	},
	{
		value: "Pacific/Guam",
		label: "グアム (Guam)",
		i18nKey: "timezone.pacific_guam",
		offset: 600,
		region: "Pacific",
	},
	{
		value: "Pacific/Saipan",
		label: "サイパン (Saipan)",
		i18nKey: "timezone.pacific_saipan",
		offset: 600,
		region: "Pacific",
	},
] as const;

export function getTimezoneOption(
	timezone: string,
): TimezoneOption | undefined {
	return TIMEZONE_OPTIONS.find((opt) => opt.value === timezone);
}

export function getTimezonesByRegion(
	region: TimezoneOption["region"],
): TimezoneOption[] {
	return TIMEZONE_OPTIONS.filter((opt) => opt.region === region);
}

export function getPopularTimezones(): TimezoneOption[] {
	return TIMEZONE_OPTIONS.filter((opt) =>
		["Asia/Tokyo", "America/New_York", "Europe/London", "Asia/Seoul"].includes(
			opt.value,
		),
	);
}
