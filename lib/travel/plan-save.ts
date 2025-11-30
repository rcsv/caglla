import { adminDb } from "../firebase/admin";
import logger from "@/lib/core/logger";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import type {
	User,
	Trip,
	Day,
	Itinerary,
	TripFormData,
	ItineraryFormData,
	DayFormData,
	PlaceData,
} from "@/lib/core/types";

// プラン保存用の型定義
export interface PlanSaveData {
	trip: TripFormData;
	days: Array<{
		day: DayFormData;
		itineraries: ItineraryFormData[];
	}>;
}

export interface PlanSaveResult {
	trip: Trip;
	days: Day[];
	itineraries: Itinerary[];
}

// プラン保存操作クラス
export class PlanSaveOperations {
	/**
	 * 完全なプラン（旅行、日程、旅程）を一括で保存する
	 */
	async saveCompletePlan(
		userId: string,
		planData: PlanSaveData,
	): Promise<PlanSaveResult> {
		try {
			// 1. 旅行を作成
			const trip = await this.createTripForPlan(userId, planData.trip);

			// 2. 日程と旅程を順次作成
			const days: Day[] = [];
			const itineraries: Itinerary[] = [];

			for (const dayData of planData.days) {
				// 日程を作成
				const day = await this.createDayForPlan(trip.id, dayData.day);
				days.push(day);

				// 旅程を作成
				for (const itineraryData of dayData.itineraries) {
					const itinerary = await this.createItineraryForPlan(
						day.id,
						itineraryData,
					);
					itineraries.push(itinerary);
				}
			}

			return {
				trip,
				days,
				itineraries,
			};
		} catch (error) {
			logger.error("Error saving complete plan:", error);
			throw new Error("プランの保存に失敗しました");
		}
	}

	/**
	 * テンプレート化されたTrip（tripsコレクション）からPrivate Tripを生成する
	 */
	async createReplicaFromTripTemplate(
		templateTripId: string,
		userId: string,
		options?: { titleOverride?: string },
	): Promise<PlanSaveResult> {
		try {
			const template = await this.getTripWithDetails(templateTripId);
			if (!template) {
				throw new Error("Template trip not found");
			}

			const templateTrip = template.trip;
			const templateDays = template.days || [];

			const inferredDayCount =
				typeof templateTrip.day_count === "number" && templateTrip.day_count > 0
					? templateTrip.day_count
					: templateDays.length > 0
						? templateDays.length
						: undefined;

			const tripData: TripFormData = {
				title: options?.titleOverride || templateTrip.title,
				description: templateTrip.description,
				// start_date / end_date は API route で後から設定されるため、ここでは省略
				access_level: "private",
				image_url: templateTrip.image_url,
				destination: templateTrip.destination,
				destination_place_id: templateTrip.destination_place_id,
				is_template: false,
				day_count: inferredDayCount,
			};

			const replicaTrip = await this.createTripForPlan(userId, tripData);

			const days: Day[] = [];
			const itineraries: Itinerary[] = [];

			for (const templateDay of templateDays) {
				const newDay = await this.createDayForPlan(replicaTrip.id, {
					day_number: templateDay.day_number,
					description: templateDay.description,
				});
				days.push(newDay);

				for (const templateItinerary of templateDay.itineraries || []) {
					const itineraryData: ItineraryFormData = {
						title: templateItinerary.title,
						description: templateItinerary.description,
						location: templateItinerary.location,
						place_id:
							templateItinerary.place_id ||
							templateItinerary.place_data?.place_id ||
							null,
						place_data: templateItinerary.place_data || null,
						start_time: templateItinerary.start_time,
						end_time: templateItinerary.end_time,
						timezone: templateItinerary.timezone,
						cost_amount: templateItinerary.cost_amount ?? null,
						cost_currency: templateItinerary.cost_currency,
						activity_tag: templateItinerary.activity_tag || null,
					};

					const newItinerary = await this.createItineraryForPlan(
						newDay.id,
						itineraryData,
					);

					// 追加フィールド（reservationなど）をコピー
					const extraUpdate: Record<string, unknown> = {};
					if (templateItinerary.reservation) {
						extraUpdate.reservation = templateItinerary.reservation;
					}
					if (templateItinerary.place_data) {
						extraUpdate.place_data = templateItinerary.place_data;
					}
					if (Object.keys(extraUpdate).length > 0) {
						await adminDb
							.collection(COLLECTIONS.ITINERARIES)
							.doc(newItinerary.id)
							.update(extraUpdate)
							.catch((error) => {
								logger.error(
									"Failed to copy itinerary extra fields during replica creation",
									{
										error,
										itineraryId: newItinerary.id,
									},
								);
							});
					}

					itineraries.push(newItinerary);
				}
			}

			return {
				trip: replicaTrip,
				days,
				itineraries,
			};
		} catch (error) {
			logger.error("Error creating replica from template trip:", error);
			throw new Error("テンプレートからのレプリカ作成に失敗しました");
		}
	}

	/**
	 * 既存のプランを更新する
	 */
	async updateCompletePlan(
		tripId: string,
		planData: PlanSaveData,
	): Promise<PlanSaveResult> {
		try {
			// 1. 旅行を更新
			const trip = await this.updateTripForPlan(tripId, planData.trip);

			// 2. 既存の日程と旅程を削除
			await this.deleteExistingPlanData(tripId);

			// 3. 新しい日程と旅程を作成
			const days: Day[] = [];
			const itineraries: Itinerary[] = [];

			for (const dayData of planData.days) {
				const day = await this.createDayForPlan(tripId, dayData.day);
				days.push(day);

				for (const itineraryData of dayData.itineraries) {
					const itinerary = await this.createItineraryForPlan(
						day.id,
						itineraryData,
					);
					itineraries.push(itinerary);
				}
			}

			return {
				trip,
				days,
				itineraries,
			};
		} catch (error) {
			logger.error("Error updating complete plan:", error);
			throw new Error("プランの更新に失敗しました");
		}
	}

	/**
	 * プランを複製する
	 */
	async duplicatePlan(
		sourceTripId: string,
		userId: string,
		newTitle?: string,
	): Promise<PlanSaveResult> {
		try {
			// 1. 元のプランデータを取得
			const sourceTrip = await this.getTripWithDetails(sourceTripId);
			if (!sourceTrip) {
				throw new Error("元のプランが見つかりません");
			}

			// 2. 新しいプランを作成
			const newTripData: TripFormData = {
				title: newTitle || `${sourceTrip.trip.title} (コピー)`,
				description: sourceTrip.trip.description,
				start_date: sourceTrip.trip.start_date?.toString(),
				end_date: sourceTrip.trip.end_date?.toString(),
				access_level: sourceTrip.trip.access_level,
				image_url: sourceTrip.trip.image_url,
				destination: sourceTrip.trip.destination,
				is_template: false,
				day_count: sourceTrip.trip.day_count,
			};

			const newTrip = await this.createTripForPlan(userId, newTripData);

			// 3. 日程と旅程を複製
			const days: Day[] = [];
			const itineraries: Itinerary[] = [];

			for (const day of sourceTrip.days) {
				const newDay = await this.createDayForPlan(newTrip.id, {
					day_number: day.day_number,
					description: day.description,
				});
				days.push(newDay);

				for (const itinerary of day.itineraries || []) {
					const newItinerary = await this.createItineraryForPlan(newDay.id, {
						title: itinerary.title,
						description: itinerary.description,
						location: itinerary.location,
						place_id:
							itinerary.place_id || itinerary.place_data?.place_id || null,
						start_time: itinerary.start_time,
						end_time: itinerary.end_time,
						cost_amount: itinerary.cost_amount,
						cost_currency: itinerary.cost_currency,
					});
					itineraries.push(newItinerary);
				}
			}

			return {
				trip: newTrip,
				days,
				itineraries,
			};
		} catch (error) {
			logger.error("Error duplicating plan:", error);
			throw new Error("プランの複製に失敗しました");
		}
	}

	/**
	 * プランをテンプレートとして保存する
	 */
	async saveAsTemplate(tripId: string, templateName: string): Promise<void> {
		try {
			const tripData = await this.getTripWithDetails(tripId);
			if (!tripData) {
				throw new Error("プランが見つかりません");
			}

			// テンプレート用のコレクションに保存
			const templateData = {
				name: templateName,
				trip_data: tripData.trip,
				days_data: tripData.days,
				itineraries_data: tripData.itineraries,
				created_at: new Date(),
				updated_at: new Date(),
			};

			await adminDb.collection("templates").add(templateData);
		} catch (error) {
			logger.error("Error saving as template:", error);
			throw new Error("テンプレートの保存に失敗しました");
		}
	}

	/**
	 * テンプレートからプランを作成する
	 */
	async createFromTemplate(
		templateId: string,
		userId: string,
		customizations?: Partial<TripFormData>,
	): Promise<PlanSaveResult> {
		try {
			const templateDoc = await adminDb
				.collection("templates")
				.doc(templateId)
				.get();
			if (!templateDoc.exists) {
				throw new Error("テンプレートが見つかりません");
			}

			const templateData = templateDoc.data();

			// カスタマイズを適用
			const tripData: TripFormData = {
				title: customizations?.title || templateData.trip_data.title,
				description:
					customizations?.description || templateData.trip_data.description,
				start_date:
					customizations?.start_date ||
					templateData.trip_data.start_date?.toString(),
				end_date:
					customizations?.end_date ||
					templateData.trip_data.end_date?.toString(),
				access_level:
					customizations?.access_level || templateData.trip_data.access_level,
				image_url:
					customizations?.image_url || templateData.trip_data.image_url,
				destination:
					customizations?.destination || templateData.trip_data.destination,
				is_template: false,
				day_count: templateData.trip_data.day_count,
			};

			// プランを作成
			const planData: PlanSaveData = {
				trip: tripData,
				days: templateData.days_data.map((day: Day) => ({
					day: {
						day_number: day.day_number,
						description: day.description,
					},
					itineraries: (day.itineraries || []).map((itinerary: Itinerary) => ({
						title: itinerary.title,
						description: itinerary.description,
						location: itinerary.location,
						place_id:
							itinerary.place_id || itinerary.place_data?.place_id || null,
						start_time: itinerary.start_time,
						end_time: itinerary.end_time,
						cost_amount: itinerary.cost_amount,
						cost_currency: itinerary.cost_currency,
					})),
				})),
			};

			return await this.saveCompletePlan(userId, planData);
		} catch (error) {
			logger.error("Error creating from template:", error);
			throw new Error("テンプレートからのプラン作成に失敗しました");
		}
	}

	// プライベートメソッド

	private async createTripForPlan(
		userId: string,
		tripData: TripFormData,
	): Promise<Trip> {
		const now = new Date();
		const isTemplate = Boolean(tripData.is_template);
		const baseData: Record<string, unknown> = {
			user_id: userId,
			title: tripData.title,
			description: tripData.description,
			destination: tripData.destination,
			access_level: tripData.access_level,
			image_url: tripData.image_url,
			status: "PLANNING",
			created_at: now,
			updated_at: now,
			is_template: isTemplate,
			day_count: isTemplate ? (tripData.day_count ?? null) : tripData.day_count,
			likes_count:
				typeof tripData.likes_count === "number" &&
				Number.isFinite(tripData.likes_count)
					? Math.max(0, Math.floor(tripData.likes_count))
					: 0,
		};

		// start_date / end_date: undefined を避けるため、値がある場合のみ追加
		if (tripData.start_date) {
			baseData.start_date = new Date(tripData.start_date);
		}
		if (tripData.end_date) {
			baseData.end_date = new Date(tripData.end_date);
		}

		// destination_place_id: undefined を避けるため、値がある場合のみ追加
		if (tripData.destination_place_id) {
			baseData.destination_place_id = tripData.destination_place_id;
		}

		if (!isTemplate) {
			baseData.day_count = tripData.day_count ?? undefined;
		}

		const tripDoc = await adminDb.collection(COLLECTIONS.TRIPS).add(baseData);

		const tripSnap = await tripDoc.get();
		return {
			id: tripSnap.id,
			...tripSnap.data(),
		} as Trip;
	}

	private async updateTripForPlan(
		tripId: string,
		tripData: TripFormData,
	): Promise<Trip> {
		const tripRef = adminDb.collection(COLLECTIONS.TRIPS).doc(tripId);
		const isTemplate = Boolean(tripData.is_template);
		const updateData: Record<string, unknown> = {
			title: tripData.title,
			description: tripData.description,
			destination: tripData.destination,
			access_level: tripData.access_level,
			image_url: tripData.image_url,
			updated_at: new Date(),
			is_template: isTemplate,
			day_count: isTemplate
				? (tripData.day_count ?? null)
				: (tripData.day_count ?? undefined),
		};

		// start_date / end_date: undefined を避けるため、値がある場合のみ追加
		if (tripData.start_date) {
			updateData.start_date = new Date(tripData.start_date);
		}
		if (tripData.end_date) {
			updateData.end_date = new Date(tripData.end_date);
		}

		await tripRef.update(updateData);

		const tripSnap = await tripRef.get();
		return {
			id: tripSnap.id,
			...tripSnap.data(),
		} as Trip;
	}

	private async createDayForPlan(
		tripId: string,
		dayData: DayFormData,
	): Promise<Day> {
		const dayDoc = await adminDb.collection(COLLECTIONS.DAYS).add({
			trip_id: tripId,
			day_number: dayData.day_number,
			description: dayData.description,
			created_at: new Date(),
			updated_at: new Date(),
		});

		const daySnap = await dayDoc.get();
		return {
			id: daySnap.id,
			...daySnap.data(),
		} as Day;
	}

	private async createItineraryForPlan(
		dayId: string,
		itineraryData: ItineraryFormData,
	): Promise<Itinerary> {
		// sort_numberを決定
		const existingItineraries = await adminDb
			.collection(COLLECTIONS.ITINERARIES)
			.where("day_id", "==", dayId)
			.orderBy("sort_number", "desc")
			.limit(1)
			.get();

		const nextSortNumber = existingItineraries.empty
			? 1
			: existingItineraries.docs[0].data().sort_number + 1;

		const baseData: Record<string, unknown> = {
			day_id: dayId,
			sort_number: nextSortNumber,
			title: itineraryData.title,
			description: itineraryData.description,
			location: itineraryData.location,
			place_id:
				itineraryData.place_id || itineraryData.place_data?.place_id || null,
			activity_tag: itineraryData.activity_tag || null,
			place_data: itineraryData.place_data || null,
			created_at: new Date(),
			updated_at: new Date(),
		};

		// start_time / end_time / timezone / cost_amount / cost_currency: undefined を避けるため、値がある場合のみ追加
		if (itineraryData.start_time !== undefined) {
			baseData.start_time = itineraryData.start_time;
		}
		if (itineraryData.end_time !== undefined) {
			baseData.end_time = itineraryData.end_time;
		}
		if (itineraryData.timezone !== undefined) {
			baseData.timezone = itineraryData.timezone;
		}
		if (itineraryData.cost_amount !== undefined) {
			baseData.cost_amount = itineraryData.cost_amount;
		}
		if (itineraryData.cost_currency !== undefined) {
			baseData.cost_currency = itineraryData.cost_currency;
		}

		const itineraryDoc = await adminDb
			.collection(COLLECTIONS.ITINERARIES)
			.add(baseData);

		const itinerarySnap = await itineraryDoc.get();
		return {
			id: itinerarySnap.id,
			...itinerarySnap.data(),
		} as Itinerary;
	}

	private async deleteExistingPlanData(tripId: string): Promise<void> {
		// 既存の日程を取得
		const daysSnapshot = await adminDb
			.collection(COLLECTIONS.DAYS)
			.where("trip_id", "==", tripId)
			.get();

		// 各日程の旅程を削除
		for (const dayDoc of daysSnapshot.docs) {
			const itinerariesSnapshot = await adminDb
				.collection(COLLECTIONS.ITINERARIES)
				.where("day_id", "==", dayDoc.id)
				.get();

			for (const itineraryDoc of itinerariesSnapshot.docs) {
				await itineraryDoc.ref.delete();
			}

			// 日程を削除
			await dayDoc.ref.delete();
		}
	}

	private async getTripWithDetails(tripId: string): Promise<{
		trip: Trip;
		days: Day[];
		itineraries: Itinerary[];
	} | null> {
		try {
			// 旅行を取得
			const tripDoc = await adminDb
				.collection(COLLECTIONS.TRIPS)
				.doc(tripId)
				.get();
			if (!tripDoc.exists) {
				return null;
			}

			const trip = {
				id: tripDoc.id,
				...tripDoc.data(),
			} as Trip;

			// 日程を取得
			const daysSnapshot = await adminDb
				.collection(COLLECTIONS.DAYS)
				.where("trip_id", "==", tripId)
				.orderBy("day_number", "asc")
				.get();

			const days = daysSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Day[];

			// 旅程を取得
			const itineraries: Itinerary[] = [];
			for (const day of days) {
				const itinerariesSnapshot = await adminDb
					.collection(COLLECTIONS.ITINERARIES)
					.where("day_id", "==", day.id)
					.orderBy("sort_number", "asc")
					.get();

				const dayItineraries = itinerariesSnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Itinerary[];

				itineraries.push(...dayItineraries);
				day.itineraries = dayItineraries;
			}

			return {
				trip,
				days,
				itineraries,
			};
		} catch (error) {
			logger.error("Error getting trip with details:", error);
			return null;
		}
	}
}

// シングルトンインスタンス
export const planSaveOperations = new PlanSaveOperations();
