/**
 * チェックリスト自動生成エンジン
 *
 * Itineraryのアクティビティタグに基づき、チェックリスト項目を動的に生成
 */

import {
	Trip,
	Itinerary,
	ChecklistItem,
	ActivityTag,
	User,
} from "@/lib/core/types";
import { getChecklistRules } from "@/lib/data/checklist-rules";
import type { ChecklistCondition } from "@/lib/data/checklist-rules";
import { dateUtils } from "@/lib/utils/date";
import logger from "@/lib/core/logger";
import { getAppUrl } from "@/lib/utils/app-url";
import { generateLongDescription } from "@/lib/ai/gemini-client";

interface DestinationInfo {
	countryCode?: string;
	continentCode?: string;
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
		for (const [secondaryCategory, count] of Array.from(
			activityCounts.entries(),
		)) {
			const rules = getChecklistRules(secondaryCategory);
			logger.debug("ChecklistGenerator: Rules found", {
				secondaryCategory,
				count,
				rulesCount: rules.length,
			});

			rules.forEach((rule) => {
				rule.items.forEach((ruleItem) => {
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
						const title = this.replaceDynamicValues(ruleItem.title, {
							count,
							duration: tripDuration,
						});

						// longDescriptionがない場合、Gemini APIで生成を試みる
						let longDescription = ruleItem.longDescription;
						if (!longDescription) {
							try {
								longDescription = await generateLongDescription({
									title,
									description: ruleItem.description,
									category: ruleItem.category,
									priority: ruleItem.priority,
									generatedFrom: secondaryCategory,
								});
							} catch (error) {
								logger.warn(
									"Failed to generate longDescription with Gemini",
									{
										title,
										error: error instanceof Error
											? error.message
											: String(error),
									},
								);
								// エラーが発生しても処理を続行
							}
						}

						items.push({
							id: this.generateId(),
							title,
							description: ruleItem.description,
							longDescription,
							category: ruleItem.category,
							done: false,
							generatedFrom: secondaryCategory,
							priority: ruleItem.priority || "medium",
							links: ruleItem.links || [],
						});
						logger.debug("ChecklistGenerator: Item added", {
							title,
							category: ruleItem.category,
							hasLongDescription: !!longDescription,
						});
					}
				});
			});
		}

		// 5. 旅のしおりの印刷用URLを準備物として追加
		const tripSlug = trip.slug || trip.id;
		const baseUrl = getAppUrl();
		const printUrl = `${baseUrl}/dev-tools/pdf-preview/${tripSlug}`;
		const printUrlItem: ChecklistItem = {
			id: this.generateId(),
			title: "旅のしおりの印刷用URL",
			description: "印刷プレビューでPDF化できます",
			category: "preparation",
			done: false,
			priority: "high",
			links: [
				{
					type: "official",
					label: "印刷プレビューを開く",
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
	 */
	private getContinentCode(countryCode: string): string {
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

		return continentMap[countryCode] || "UNKNOWN";
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

			case "destination":
				// 国コードまたは大陸コードが不明な場合は、destination系の条件をスキップ
				// （手動入力で作成された旅行の場合、destination_place_idがないため）
				if (
					!context.destination.countryCode &&
					!context.destination.continentCode
				) {
					return false;
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

			default:
				return false;
		}
	}

	/**
	 * 動的な値の置換
	 */
	private replaceDynamicValues(
		text: string,
		values: { count: number; duration: number },
	): string {
		return text
			.replace(/\{count\}/g, values.count.toString())
			.replace(/\{duration\}/g, values.duration.toString());
	}

	/**
	 * 重複項目を除去
	 */
	private deduplicateItems(items: ChecklistItem[]): ChecklistItem[] {
		const seen = new Map<string, ChecklistItem>();

		items.forEach((item) => {
			const key = `${item.title}:${item.category}`;
			if (!seen.has(key)) {
				seen.set(key, item);
			} else {
				// 既存項目の優先度が低い場合は上書き
				const existing = seen.get(key)!;
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
		return items.sort((a, b) => {
			// 優先度の比較
			const priorityDiff =
				this.priorityValue(b.priority) - this.priorityValue(a.priority);
			if (priorityDiff !== 0) return priorityDiff;

			// カテゴリーの比較（preparation を先に）
			if (a.category !== b.category) {
				return a.category === "preparation" ? -1 : 1;
			}

			// タイトルのアルファベット順
			return a.title.localeCompare(b.title);
		});
	}

	/**
	 * ユニークIDの生成
	 */
	private generateId(): string {
		return `checklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

/**
 * チェックリスト生成エンジンのシングルトンインスタンス
 */
export const checklistGenerator = new ChecklistGenerator();
