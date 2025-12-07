/**
 * チェックリスト自動生成エンジン
 *
 * Itineraryのアクティビティタグに基づき、チェックリスト項目を動的に生成
 */

import type {
	ChecklistItem,
	Itinerary,
	Trip,
	User,
} from "@/lib/core/types";
import { getChecklistRules } from "@/lib/data/checklist-rules";
import type { ChecklistCondition } from "@/lib/data/checklist-rules";
import { dateUtils } from "@/lib/utils/date";
import logger from "@/lib/core/logger";
import { getAppUrl } from "@/lib/utils/app-url";
import { generateLongDescription } from "@/lib/ai/gemini-client";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/utils/language";

interface DestinationInfo {
	countryCode?: string;
	continentCode?: string | null; // null も許可（getContinentCode が null を返す可能性があるため）
	cityName?: string;
}

interface GenerationContext {
	count: number;
	duration: number;
	destination: DestinationInfo;
	userCountryCode?: string; // ユーザーの居住国コード
}

/**
 * チェックリスト生成エンジン
 */
export class ChecklistGenerator {
	/**
	 * Trip全体のチェックリストを生成
	 */
	async generateTripChecklist(
		trip: Trip,
		user?: User,
	): Promise<ChecklistItem[]> {
		// ユーザーの言語設定を取得（サーバーサイドでは直接preferences.languageを参照）
		// 注意: getUserLanguage()は副作用がある可能性があるため、サーバーサイドでは直接参照
		// 設定変更はPOSTトリガー（/api/users）のみで行う
		const userLanguage: SupportedLanguage =
			user?.preferences?.language &&
			user.preferences.language !== "" &&
			isSupportedLanguage(user.preferences.language)
				? user.preferences.language
				: "en"; // デフォルトは英語
		
		// 決定された言語をサーバーコンソールに出力
		logger.info(
			`[ChecklistGenerator] 決定言語: ${userLanguage} (ユーザー設定: ${user?.preferences?.language || "未設定"}, ユーザーID: ${user?.id || "なし"})`,
		);
		logger.debug("ChecklistGenerator: User language", {
			userLanguage,
			userPreferencesLanguage: user?.preferences?.language,
			userId: user?.id,
		});

		const items: ChecklistItem[] = [];
		const activityCounts = new Map<string, number>();

		// 1. 全Itineraryからアクティビティタグを収集
		const allItineraries = this.getAllItineraries(trip);
		logger.debug("ChecklistGenerator: getAllItineraries", {
			count: allItineraries.length,
			tripId: trip.id,
		});
		allItineraries.forEach((itinerary) => {
			if (itinerary.activity_tag) {
				const key = itinerary.activity_tag.secondaryCategory;
				activityCounts.set(key, (activityCounts.get(key) || 0) + 1);
				logger.debug("ChecklistGenerator: Found activity tag", {
					itineraryId: itinerary.id,
					secondaryCategory: key,
					activityTag: itinerary.activity_tag,
				});
			} else {
				logger.debug("ChecklistGenerator: No activity tag", {
					itineraryId: itinerary.id,
				});
			}
		});

		logger.debug("ChecklistGenerator: Activity counts", {
			counts: Object.fromEntries(activityCounts),
			totalItineraries: allItineraries.length,
		});

		// 2. 旅行期間を計算
		const tripDuration = this.calculateTripDuration(trip);
		logger.debug("ChecklistGenerator: Trip duration", {
			duration: tripDuration,
		});

		// 3. 目的地情報を取得
		const destination = this.getDestinationInfo(trip);
		logger.debug("ChecklistGenerator: Destination info", { destination });

		// 4. 各アクティビティに対応するチェックリスト項目を生成
		// まず、すべてのアイテム情報を収集（longDescription生成は後で並列処理）
		const itemPromises: Array<{
			item: Omit<ChecklistItem, "longDescription">;
			longDescriptionPromise?: Promise<string | undefined>;
		}> = [];

		for (const [secondaryCategory, count] of Array.from(
			activityCounts.entries(),
		)) {
			const rules = getChecklistRules(secondaryCategory);
			logger.debug("ChecklistGenerator: Rules found", {
				secondaryCategory,
				count,
				rulesCount: rules.length,
			});

			for (const rule of rules) {
				for (const ruleItem of rule.items) {
					// 条件チェック
					const conditionResult = this.checkCondition(ruleItem.condition, {
						count,
						duration: tripDuration,
						destination,
						userCountryCode: user?.preferences?.home_country_code,
					});
					logger.debug("ChecklistGenerator: Condition check", {
						secondaryCategory,
						ruleItemTitle: ruleItem.title,
						conditionResult,
						condition: ruleItem.condition,
					});

					if (conditionResult) {
						// 動的な値置換（例: {count}日分 → 5日分）
						// i18nキーの場合は置換しない（クライアント側で解決）
						const title = ruleItem.title.startsWith("checklist.items.")
							? ruleItem.title
							: this.replaceDynamicValues(ruleItem.title, {
									count,
									duration: tripDuration,
								});

						// アイテムの基本情報を作成
						const baseItem: Omit<ChecklistItem, "longDescription"> = {
							id: this.generateId(),
							title,
							description: ruleItem.description,
							category: ruleItem.category,
							done: false,
							generatedFrom: secondaryCategory,
							ruleId: rule.id, // i18nキー解決用（ruleIdを保存）
							priority: ruleItem.priority || "medium",
							links: ruleItem.links || [],
							itemKey: ruleItem.itemKey, // i18nキー解決用
						};

						// longDescriptionがない場合、Gemini APIで生成を試みる（並列処理用にPromiseを保存）
						if (!ruleItem.longDescription) {
							itemPromises.push({
								item: baseItem,
								longDescriptionPromise: generateLongDescription({
									title,
									description: ruleItem.description || undefined, // undefined を明示的に渡す
									category: ruleItem.category,
									priority: ruleItem.priority,
									generatedFrom: secondaryCategory,
									language: userLanguage, // ユーザーの言語設定を渡す
								})
									.then((result) => result ?? undefined) // nullをundefinedに変換
									.catch((error) => {
										logger.warn(
											"Failed to generate longDescription with Gemini",
											{
												title,
												error: error instanceof Error
													? error.message
													: String(error),
											},
										);
										return undefined;
									}),
							});
						} else {
							// longDescriptionが既にある場合はそのまま使用
							itemPromises.push({
								item: {
									...baseItem,
									longDescription: ruleItem.longDescription,
								} as ChecklistItem,
			});
		}
					}
				}
			}
		}

		// すべてのlongDescription生成を並列実行
		// ただし、レート制限を考慮してバッチ処理（最大10件ずつ）
		const itemsNeedingGeneration = itemPromises.filter(
			(p) => p.longDescriptionPromise,
		);
		logger.debug("ChecklistGenerator: Starting parallel longDescription generation", {
			totalItems: itemPromises.length,
			itemsNeedingGeneration: itemsNeedingGeneration.length,
		});

		// バッチ処理: レート制限を考慮して、1リクエストごとに最小間隔を挟む
		// これにより burst 制限に引っかかることを防ぐ
		const itemsWithLongDescription: ChecklistItem[] = [];
		const REQUEST_INTERVAL_MS = 700; // 0.7秒間隔（10件/分のレート制限に対応）

		for (const promise of itemPromises) {
			if (promise.longDescriptionPromise) {
				const longDescription = await promise.longDescriptionPromise;
				itemsWithLongDescription.push({
					...promise.item,
					longDescription,
				} as ChecklistItem);
				// 次のリクエストまで間隔を空ける
				await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
			} else {
				// longDescriptionが既にある場合
				itemsWithLongDescription.push(promise.item as ChecklistItem);
			}
		}

		items.push(...itemsWithLongDescription);

		logger.debug("ChecklistGenerator: Completed parallel longDescription generation", {
			itemsCount: items.length,
		});

		// 5. 旅のしおりの印刷用URLを準備物として追加
		const tripSlug = trip.slug || trip.id;
		const baseUrl = getAppUrl();
		const printUrl = `${baseUrl}/dev-tools/pdf-preview/${tripSlug}`;
		const printUrlItem: ChecklistItem = {
			id: this.generateId(),
			title: "checklist.printUrl.title", // i18nキー
			description: "checklist.printUrl.description", // i18nキー
			category: "preparation",
			done: false,
			priority: "high",
			links: [
				{
					type: "official",
					label: "checklist.printUrl.linkLabel", // i18nキー
					url: printUrl,
				},
			],
		};
		items.push(printUrlItem);

		// 6. 重複を除去（同じタイトルの項目は1つにまとめる）
		const uniqueItems = this.deduplicateItems(items);

		// 7. 優先度順にソート
		return this.sortByPriority(uniqueItems);
	}

	/**
	 * 全Itineraryを取得
	 */
	private getAllItineraries(trip: Trip): Itinerary[] {
		if (!trip.days) return [];

		return trip.days.flatMap((day) => day.itineraries || []);
	}

	/**
	 * 旅行期間を計算（日数）
	 */
	private calculateTripDuration(trip: Trip): number {
		if (!trip.start_date || !trip.end_date) {
			return 0;
		}

		const start = dateUtils.toDate(trip.start_date);
		const end = dateUtils.toDate(trip.end_date);

		if (!start || !end) return 0;

		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return diffDays + 1; // 開始日も含めるため+1
	}

	/**
	 * 目的地情報を取得
	 */
	private getDestinationInfo(trip: Trip): DestinationInfo {
		const info: DestinationInfo = {};

		if (trip.destination_place) {
			const place = trip.destination_place;

			// 国コードを抽出
			const countryComponent = place.address_components?.find((component) =>
				component.types.includes("country"),
			);
			if (countryComponent) {
				info.countryCode = countryComponent.short_name;
			}

			// 都市名を抽出
			const cityComponent = place.address_components?.find(
				(component) =>
					component.types.includes("locality") ||
					component.types.includes("administrative_area_level_1"),
			);
			if (cityComponent) {
				info.cityName = cityComponent.long_name;
			}

			// 大陸コードを推定（国コードから）
			if (info.countryCode) {
				info.continentCode = this.getContinentCode(info.countryCode);
			}
		}

		return info;
	}

	/**
	 * 国コードから大陸コードを取得
	 * 判定不可能な場合は null を返す
	 */
	private getContinentCode(countryCode: string): string | null {
		const continentMap: { [key: string]: string } = {
			// Asia
			JP: "AS",
			CN: "AS",
			KR: "AS",
			TH: "AS",
			VN: "AS",
			IN: "AS",
			ID: "AS",
			MY: "AS",
			SG: "AS",
			PH: "AS",
			// Europe
			GB: "EU",
			FR: "EU",
			DE: "EU",
			IT: "EU",
			ES: "EU",
			NL: "EU",
			BE: "EU",
			CH: "EU",
			AT: "EU",
			GR: "EU",
			// North America
			US: "NA",
			CA: "NA",
			MX: "NA",
			// South America
			BR: "SA",
			AR: "SA",
			CL: "SA",
			PE: "SA",
			CO: "SA",
			// Africa
			EG: "AF",
			ZA: "AF",
			KE: "AF",
			NG: "AF",
			MA: "AF",
			// Oceania
			AU: "OC",
			NZ: "OC",
			FJ: "OC",
		};

		// 判定不可能な場合は null を返す（条件判定ロジックと一貫性を保つ）
		return continentMap[countryCode] || null;
	}

	/**
	 * 条件チェック
	 */
	private checkCondition(
		condition: ChecklistCondition | undefined,
		context: GenerationContext,
	): boolean {
		if (!condition) return true;

		switch (condition.type) {
			case "always":
				return true;

			case "count":
				if (condition.minCount && context.count < condition.minCount)
					return false;
				if (condition.maxCount && context.count > condition.maxCount)
					return false;
				return true;

			case "duration":
				if (condition.minDays && context.duration < condition.minDays)
					return false;
				if (condition.maxDays && context.duration > condition.maxDays)
					return false;
				return true;

			case "destination": {
				// 国コードまたは大陸コードが不明な場合は、destination系の条件を無視
				// （手動入力で作成された旅行の場合、destination_place_idがないため）
				// 判定不可能な場合は true を返して、ユーザーに自然な動作を提供
				if (
					!context.destination.countryCode &&
					!context.destination.continentCode
				) {
					return true;
				}

				// 国際旅行チェック：ユーザーの居住国と旅行先が異なる場合のみ国際的な項目を表示
				const isInternationalTrip =
					context.userCountryCode &&
					context.destination.countryCode &&
					context.userCountryCode !== context.destination.countryCode;

				if (condition.countries && context.destination.countryCode) {
					// 国際的な項目（ESTA、eTA、ETIAS等）は国際旅行の場合のみ表示
					if (
						condition.countries.includes("US") ||
						condition.countries.includes("CA") ||
						condition.countries.includes("AU") ||
						condition.countries.includes("NZ") ||
						condition.countries.includes("GB") ||
						condition.countries.includes("DE") ||
						condition.countries.includes("FR") ||
						condition.countries.includes("IT") ||
						condition.countries.includes("ES")
					) {
						// 国際的な項目は国際旅行の場合のみ
						if (!isInternationalTrip) {
							return false;
						}
					}

					if (!condition.countries.includes(context.destination.countryCode)) {
						return false;
					}
				}
				if (condition.continents && context.destination.continentCode) {
					if (
						!condition.continents.includes(context.destination.continentCode)
					) {
						return false;
					}
				}
				return true;
			}

			default:
				return false;
		}
	}

	/**
	 * 動的な値の置換
	 */
	/**
	 * 動的な値を置換
	 * {token} 形式のトークンを一括置換できる柔軟な実装
	 */
	private replaceDynamicValues(
		text: string,
		values: Record<string, string | number>,
	): string {
		return Object.entries(values).reduce(
			(acc, [key, value]) =>
				acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
			text,
		);
	}

	/**
	 * 重複項目を除去
	 * タイトルを trim + lowercase にして堅牢な重複判定を行う
	 */
	private deduplicateItems(items: ChecklistItem[]): ChecklistItem[] {
		const seen = new Map<string, ChecklistItem>();

		items.forEach((item) => {
			// タイトルを正規化（trim + lowercase）して重複判定の精度を向上
			const normalizedTitle = item.title.trim().toLowerCase();
			const key = `${normalizedTitle}:${item.category}`;
			const existing = seen.get(key);
			if (!existing) {
				seen.set(key, item);
			} else {
				// 既存項目の優先度が低い場合は上書き
				if (
					this.priorityValue(item.priority) >
					this.priorityValue(existing.priority)
				) {
					seen.set(key, item);
				}
			}
		});

		return Array.from(seen.values());
	}

	/**
	 * 優先度の数値化
	 */
	private priorityValue(priority?: "high" | "medium" | "low"): number {
		switch (priority) {
			case "high":
				return 3;
			case "medium":
				return 2;
			case "low":
				return 1;
			default:
				return 0;
		}
	}

	/**
	 * 優先度順にソート
	 */
	private sortByPriority(items: ChecklistItem[]): ChecklistItem[] {
		// カテゴリーの順序マップ（将来の拡張に対応）
		const categoryOrder: Record<string, number> = {
			preparation: 1,
			packing: 2,
		};

		return items.sort((a, b) => {
			// 優先度の比較
			const priorityDiff =
				this.priorityValue(b.priority) - this.priorityValue(a.priority);
			if (priorityDiff !== 0) return priorityDiff;

			// カテゴリーの比較（順序マップを使用）
			const categoryDiff =
				(categoryOrder[a.category] ?? 99) - (categoryOrder[b.category] ?? 99);
			if (categoryDiff !== 0) return categoryDiff;

			// タイトルのアルファベット順
			return a.title.localeCompare(b.title);
		});
	}

	/**
	 * ユニークIDの生成
	 * crypto.randomUUID()を使用して衝突を防ぐ
	 */
	private generateId(): string {
		return crypto.randomUUID();
	}
}

/**
 * チェックリスト生成エンジンのシングルトンインスタンス
 */
export const checklistGenerator = new ChecklistGenerator();
