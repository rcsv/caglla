"use client";

import { useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import { dispatchPOIOpen } from "../../poi-events";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";
import type { Itinerary, Trip } from "@/lib/core/types";

type UpdateTripFn = (updates: Partial<Trip> | ((prev: Trip) => Trip)) => void;

type UseItineraryActionsParams = {
	trip: Trip | null;
	updateTrip: UpdateTripFn;
	refreshTrip: () => Promise<void>;
	setSelectedDayId: (dayId: string | null) => void;
	setSelectedItineraryId: (itineraryId: string | null) => void;
	updateQuery: (params: Record<string, string | null>) => void;
};

export default function useItineraryActions({
	trip,
	updateTrip,
	refreshTrip,
	setSelectedDayId,
	setSelectedItineraryId,
	updateQuery,
}: UseItineraryActionsParams) {
	const getAllItineraries = useCallback((): Itinerary[] => {
		if (!trip?.days) return [];
		const itineraries: Itinerary[] = [];
		trip.days.forEach((day) => {
			if (day.itineraries) {
				itineraries.push(...day.itineraries);
			}
		});
		return itineraries;
	}, [trip]);

	const findItineraryById = useCallback(
		(id: string): Itinerary | null => {
			if (!trip?.days) return null;
			for (const day of trip.days) {
				const itinerary = day.itineraries?.find((item) => item.id === id);
				if (itinerary) return itinerary;
			}
			return null;
		},
		[trip],
	);

	const handleScheduleAdded = useCallback(
		(newItinerary: Itinerary) => {
			if (!trip) return;

			updateTrip((prevTrip) => {
				if (!prevTrip) return prevTrip;

				return {
					...prevTrip,
					days:
						prevTrip.days?.map((day) => {
							if (day.id === newItinerary.day_id) {
								const currentItineraries = day.itineraries || [];
								const updatedExisting = currentItineraries.map((item) => {
									if (item.id === newItinerary.id) return item;
									if (
										(item.sort_number || 0) >= (newItinerary.sort_number || 0)
									) {
										return {
											...item,
											sort_number: (item.sort_number || 0) + 1,
										};
									}
									return item;
								});
								const sortedItineraries = [
									...updatedExisting,
									newItinerary,
								].sort((a, b) => a.sort_number - b.sort_number);
								return {
									...day,
									itineraries: sortedItineraries,
								};
							}
							return day;
						}) || [],
				};
			});

			setSelectedDayId(newItinerary.day_id);
			setSelectedItineraryId(newItinerary.id);
			updateQuery({ si: newItinerary.id, mf: "single" });

			if (newItinerary.place_data?.place_id) {
				dispatchPOIOpen({
					placeId: newItinerary.place_data.place_id,
					name: newItinerary.title,
					location: {
						lat: newItinerary.place_data.geometry!.location.lat,
						lng: newItinerary.place_data.geometry!.location.lng,
					},
					placeData: newItinerary.place_data,
				});
			} else if (newItinerary.place_id) {
				dispatchPOIOpen({
					placeId: newItinerary.place_id,
					name: newItinerary.title,
					location: { lat: 0, lng: 0 },
					placeData: undefined,
				});
			}
		},
		[trip, updateTrip, setSelectedDayId, setSelectedItineraryId, updateQuery],
	);

	const handleScheduleUpdated = useCallback(
		(updatedItinerary: Itinerary) => {
			if (!trip) return;

			updateTrip((prevTrip) => {
				if (!prevTrip) return prevTrip;

				return {
					...prevTrip,
					days:
						prevTrip.days?.map((day) => {
							if (day.id === updatedItinerary.day_id) {
								return {
									...day,
									itineraries:
										day.itineraries?.map((itinerary) => {
											if (itinerary.id === updatedItinerary.id) {
												return {
													...itinerary,
													...updatedItinerary,
													place_data:
														updatedItinerary.place_data || itinerary.place_data,
												};
											}
											return itinerary;
										}) || [],
								};
							}
							return day;
						}) || [],
				};
			});
		},
		[trip, updateTrip],
	);

	const handleScheduleDelete = useCallback(
		async (itineraryId: string) => {
			try {
				const response = await makeAuthenticatedRequest(
					`/api/itineraries/${itineraryId}`,
					{ method: "DELETE" },
				);

				if (response.ok) {
					updateTrip((prevTrip) => {
						if (!prevTrip) return prevTrip;
						return {
							...prevTrip,
							days:
								prevTrip.days?.map((day) => {
									const filteredItineraries =
										day.itineraries?.filter(
											(itinerary) => itinerary.id !== itineraryId,
										) || [];
									const renumberedItineraries = filteredItineraries
										.sort((a, b) => a.sort_number - b.sort_number)
										.map((itinerary, index) => ({
											...itinerary,
											sort_number: index + 1,
										}));
									return {
										...day,
										itineraries: renumberedItineraries,
									};
								}) || [],
						};
					});
					await refreshTrip();
				} else {
					logger.error("Failed to delete itinerary");
					alert(t("common.deleteFailed"));
				}
			} catch (error) {
				logger.error("Error deleting itinerary:", error);
				alert(t("common.deleteFailed"));
			}
		},
		[updateTrip, refreshTrip],
	);

	const reorderRequest = useCallback(
		async (dayId: string, updates: Itinerary[]) => {
			const response = await makeAuthenticatedRequest(
				"/api/itineraries/reorder",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						dayId,
						itineraryIds: updates.map((item) => item.id),
					}),
				},
			);
			return response;
		},
		[],
	);

	const handleMoveUp = useCallback(
		async (itineraryId: string, dayId: string) => {
			if (!trip) return;

			const day = trip.days?.find((d) => d.id === dayId);
			if (!day || !day.itineraries) return;

			const sortedItineraries = [...day.itineraries].sort(
				(a, b) => a.sort_number - b.sort_number,
			);
			const currentIndex = sortedItineraries.findIndex(
				(item) => item.id === itineraryId,
			);
			if (currentIndex <= 0) return;

			const newItineraries = [...sortedItineraries];
			const temp = newItineraries[currentIndex];
			newItineraries[currentIndex] = newItineraries[currentIndex - 1];
			newItineraries[currentIndex - 1] = temp;

			try {
				const response = await reorderRequest(dayId, newItineraries);
				if (response.ok) {
					updateTrip((prevTrip) => {
						if (!prevTrip) return prevTrip;
						return {
							...prevTrip,
							days:
								prevTrip.days?.map((d) => {
									if (d.id === dayId) {
										return {
											...d,
											itineraries: newItineraries.map((item, index) => ({
												...item,
												sort_number: index + 1,
											})),
										};
									}
									return d;
								}) || [],
						};
					});
					await refreshTrip();
				}
			} catch (error) {
				logger.error("Error moving up:", error);
			}
		},
		[trip, reorderRequest, updateTrip, refreshTrip],
	);

	const handleMoveDown = useCallback(
		async (itineraryId: string, dayId: string) => {
			if (!trip) return;

			const day = trip.days?.find((d) => d.id === dayId);
			if (!day || !day.itineraries) return;

			const sortedItineraries = [...day.itineraries].sort(
				(a, b) => a.sort_number - b.sort_number,
			);
			const currentIndex = sortedItineraries.findIndex(
				(item) => item.id === itineraryId,
			);
			if (currentIndex >= sortedItineraries.length - 1 || currentIndex === -1)
				return;

			const newItineraries = [...sortedItineraries];
			const temp = newItineraries[currentIndex];
			newItineraries[currentIndex] = newItineraries[currentIndex + 1];
			newItineraries[currentIndex + 1] = temp;

			try {
				const response = await reorderRequest(dayId, newItineraries);
				if (response.ok) {
					updateTrip((prevTrip) => {
						if (!prevTrip) return prevTrip;
						return {
							...prevTrip,
							days:
								prevTrip.days?.map((d) => {
									if (d.id === dayId) {
										return {
											...d,
											itineraries: newItineraries.map((item, index) => ({
												...item,
												sort_number: index + 1,
											})),
										};
									}
									return d;
								}) || [],
						};
					});
					await refreshTrip();
				}
			} catch (error) {
				logger.error("Error moving down:", error);
			}
		},
		[trip, reorderRequest, updateTrip, refreshTrip],
	);

	const handleMoveToDay = useCallback(
		async (itineraryId: string, targetDayId: string) => {
			if (!trip) return;

			const sourceDay = trip.days?.find((d) =>
				d.itineraries?.some((item) => item.id === itineraryId),
			);
			const targetDay = trip.days?.find((d) => d.id === targetDayId);
			if (!sourceDay || !targetDay) return;

			const itineraryToMove = sourceDay.itineraries?.find(
				(item) => item.id === itineraryId,
			);
			if (!itineraryToMove) return;

			try {
				// サーバーに移動を永続化
				const response = await makeAuthenticatedRequest(
					"/api/itineraries/move-to-day",
					{
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							itinerary_id: itineraryId,
							target_day_id: targetDayId,
						}),
					},
				);

				if (!response.ok) {
					logger.error("Failed to move itinerary to day");
					alert(t("common.updateFailed"));
					return;
				}

				// ローカル状態を更新
				updateTrip((prevTrip) => {
					if (!prevTrip) return prevTrip;
					return {
						...prevTrip,
						days:
							prevTrip.days?.map((d) => {
								if (d.id === sourceDay.id) {
									return {
										...d,
										itineraries:
											d.itineraries?.filter(
												(item) => item.id !== itineraryId,
											) || [],
									};
								}
								if (d.id === targetDayId) {
									const maxSortNumber =
										d.itineraries?.reduce(
											(max, item) => Math.max(max, item.sort_number),
											0,
										) || 0;
									return {
										...d,
										itineraries: [
											...(d.itineraries || []),
											{
												...itineraryToMove,
												day_id: targetDayId,
												sort_number: maxSortNumber + 1,
											},
										],
									};
								}
								return d;
							}) || [],
					};
				});
				await refreshTrip();
			} catch (error) {
				logger.error("Error moving itinerary:", error);
				alert(t("common.updateFailed"));
			}
		},
		[trip, updateTrip, refreshTrip],
	);

	const handleDuplicateToDay = useCallback(
		async (itineraryId: string, targetDayId: string) => {
			if (!trip) return;

			const sourceDay = trip.days?.find((d) =>
				d.itineraries?.some((item) => item.id === itineraryId),
			);
			const targetDay = trip.days?.find((d) => d.id === targetDayId);
			if (!sourceDay || !targetDay) return;

			const originalItinerary = sourceDay.itineraries?.find(
				(item) => item.id === itineraryId,
			);
			if (!originalItinerary) return;

			try {
				// サーバーに重複を永続化
				const response = await makeAuthenticatedRequest(
					"/api/itineraries/duplicate-to-day",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							itinerary_id: itineraryId,
							target_day_id: targetDayId,
						}),
					},
				);

				if (!response.ok) {
					logger.error("Failed to duplicate itinerary to day");
					alert(t("common.updateFailed"));
					return;
				}

				// サーバーから返された重複されたitineraryを取得
				const duplicatedItinerary = await response.json();

				// ローカル状態を更新
				updateTrip((prevTrip) => {
					if (!prevTrip) return prevTrip;
					return {
						...prevTrip,
						days:
							prevTrip.days?.map((d) => {
								if (d.id === targetDayId) {
									return {
										...d,
										itineraries: [
											...(d.itineraries || []),
											{
												...duplicatedItinerary,
												// サーバーから返されたデータを使用
											},
										],
									};
								}
								return d;
							}) || [],
					};
				});
				await refreshTrip();
			} catch (error) {
				logger.error("Error duplicating itinerary:", error);
				alert(t("common.updateFailed"));
			}
		},
		[trip, updateTrip, refreshTrip],
	);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || !trip) return;

			const activeId = active.id as string;
			const overId = over.id as string;
			if (activeId === overId) return;

			const activeItinerary = findItineraryById(activeId);
			const overItinerary = findItineraryById(overId);
			if (!activeItinerary || !overItinerary) return;
			if (activeItinerary.day_id !== overItinerary.day_id) return;

			const dayId = activeItinerary.day_id;
			const day = trip.days?.find((d) => d.id === dayId);
			if (!day?.itineraries) return;

			const sortedItineraries = [...day.itineraries].sort(
				(a, b) => a.sort_number - b.sort_number,
			);
			const activeIndex = sortedItineraries.findIndex(
				(item) => item.id === activeId,
			);
			const overIndex = sortedItineraries.findIndex(
				(item) => item.id === overId,
			);
			if (activeIndex === -1 || overIndex === -1) return;

			const newItineraries = [...sortedItineraries];
			const [removed] = newItineraries.splice(activeIndex, 1);
			newItineraries.splice(overIndex, 0, removed);

			try {
				const response = await reorderRequest(dayId, newItineraries);
				if (response.ok) {
					updateTrip((prevTrip) => {
						if (!prevTrip) return prevTrip;
						return {
							...prevTrip,
							days:
								prevTrip.days?.map((d) => {
									if (d.id === dayId) {
										return {
											...d,
											itineraries: newItineraries.map((item, index) => ({
												...item,
												sort_number: index + 1,
											})),
										};
									}
									return d;
								}) || [],
						};
					});
					await refreshTrip();
				} else {
					logger.error("Failed to reorder itineraries");
					alert(t("tripSlugPage.orderUpdateFailed"));
				}
			} catch (error) {
				logger.error("Error reordering itineraries:", error);
				alert(t("tripSlugPage.orderUpdateFailed"));
			}
		},
		[trip, findItineraryById, reorderRequest, updateTrip, refreshTrip],
	);

	const handleReorderItineraries = useCallback(
		async (dayId: string, reorderedItineraries: Itinerary[]) => {
			if (!trip) return;

			try {
				const response = await reorderRequest(dayId, reorderedItineraries);
				if (response.ok) {
					updateTrip((prevTrip) => {
						if (!prevTrip) return prevTrip;
						return {
							...prevTrip,
							days:
								prevTrip.days?.map((d) => {
									if (d.id === dayId) {
										return {
											...d,
											itineraries: reorderedItineraries.map((item, index) => ({
												...item,
												sort_number: index + 1,
											})),
										};
									}
									return d;
								}) || [],
						};
					});
					await refreshTrip();
				} else {
					logger.error("Failed to reorder itineraries");
					alert(t("tripSlugPage.orderUpdateFailed"));
				}
			} catch (error) {
				logger.error("Error reordering itineraries:", error);
				alert(t("tripSlugPage.orderUpdateFailed"));
			}
		},
		[trip, reorderRequest, updateTrip, refreshTrip],
	);

	return {
		getAllItineraries,
		handleScheduleAdded,
		handleScheduleUpdated,
		handleScheduleDelete,
		handleMoveUp,
		handleMoveDown,
		handleMoveToDay,
		handleDuplicateToDay,
		handleDragEnd,
		handleReorderItineraries,
	};
}
