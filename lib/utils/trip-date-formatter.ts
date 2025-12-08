import { Day } from "@/lib/core/types";
import { dateUtils } from "@/lib/utils/date";
import { getUserLanguage } from "@/lib/utils/language";
import type { User } from "@/lib/core/types";

export interface FormattedDay {
	id: string;
	date: string;
	title?: string;
}

/**
 * Tripの日付をフォーマットして利用可能な日付リストを作成
 * 複数の年が含まれる場合は年も表示
 *
 * @param days Tripの日付配列
 * @param user ユーザー情報（言語設定の取得に使用）
 * @returns フォーマットされた日付リスト
 */
export function formatAvailableDays(
	days: Day[],
	user: User | null | undefined,
): FormattedDay[] {
	const sortedDays = days.sort(
		(a, b) => (a.day_number || 0) - (b.day_number || 0),
	);

	// 複数の年が含まれるかチェック
	const years = new Set<number>();
	sortedDays.forEach((day) => {
		if (day.date) {
			try {
				const date = dateUtils.toDate(day.date);
				if (date) {
					years.add(date.getFullYear());
				}
			} catch {
				// 日付が無効な場合はスキップ
			}
		}
	});

	// 複数の年が含まれる場合は年も表示、そうでなければ省略
	const includeYear = years.size > 1;

	return sortedDays.map((day) => ({
		id: day.id,
		date: dateUtils.formatDate(
			day.date,
			{
				month: "long",
				day: "numeric",
				weekday: "short",
				year: includeYear ? "numeric" : undefined,
			},
			getUserLanguage(user),
		),
		title: day.description,
	}));
}

