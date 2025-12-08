import { useReducer, useCallback } from "react";
import { PlaceData } from "@/lib/core/types";

export interface TripMapState {
	focusMode: "all" | "day" | "single";
	selectedItineraryId: string | null;
	scrollSyncEnabled: boolean;
	poiData: {
		placeId: string;
		name: string;
		location: { lat: number; lng: number };
		placeData?: PlaceData;
	} | null;
	searchResults: any[];
	viewport: {
		center?: { lat: number; lng: number };
		bounds?: {
			north: number;
			south: number;
			east: number;
			west: number;
		};
	};
	userMovedMap: boolean; // ユーザーが手動で地図を動かしたか
}

export type TripMapAction =
	| { type: "SET_FOCUS_MODE"; payload: "all" | "day" | "single" }
	| { type: "SELECT_ITINERARY"; payload: string | null }
	| { type: "SET_SCROLL_SYNC"; payload: boolean }
	| { type: "SET_POI_DATA"; payload: TripMapState["poiData"] }
	| { type: "SET_SEARCH_RESULTS"; payload: any[] }
	| { type: "SET_VIEWPORT"; payload: TripMapState["viewport"] }
	| { type: "USER_MOVED_MAP"; payload: boolean }
	| { type: "RESET_VIEWPORT" };

const initialState: TripMapState = {
	focusMode: "all",
	selectedItineraryId: null,
	scrollSyncEnabled: true,
	poiData: null,
	searchResults: [],
	viewport: {},
	userMovedMap: false,
};

function tripMapReducer(
	state: TripMapState,
	action: TripMapAction,
): TripMapState {
	switch (action.type) {
		case "SET_FOCUS_MODE":
			return { ...state, focusMode: action.payload };
		case "SELECT_ITINERARY":
			return { ...state, selectedItineraryId: action.payload };
		case "SET_SCROLL_SYNC":
			return { ...state, scrollSyncEnabled: action.payload };
		case "SET_POI_DATA":
			return { ...state, poiData: action.payload };
		case "SET_SEARCH_RESULTS":
			return { ...state, searchResults: action.payload };
		case "SET_VIEWPORT":
			return { ...state, viewport: action.payload };
		case "USER_MOVED_MAP":
			return { ...state, userMovedMap: action.payload };
		case "RESET_VIEWPORT":
			return { ...state, viewport: {}, userMovedMap: false };
		default:
			return state;
	}
}

export interface UseTripMapStateReturn {
	state: TripMapState;
	actions: {
		setFocusMode: (mode: "all" | "day" | "single") => void;
		selectItinerary: (id: string | null) => void;
		setScrollSync: (enabled: boolean) => void;
		setPoiData: (data: TripMapState["poiData"]) => void;
		setSearchResults: (results: any[]) => void;
		setViewport: (viewport: TripMapState["viewport"]) => void;
		userMovedMap: (moved: boolean) => void;
		resetViewport: () => void;
	};
}

export function useTripMapState(
	initialProps?: Partial<TripMapState>,
): UseTripMapStateReturn {
	const [state, dispatch] = useReducer(tripMapReducer, {
		...initialState,
		...initialProps,
	});

	const actions = {
		setFocusMode: useCallback(
			(mode: "all" | "day" | "single") =>
				dispatch({ type: "SET_FOCUS_MODE", payload: mode }),
			[],
		),
		selectItinerary: useCallback(
			(id: string | null) =>
				dispatch({ type: "SELECT_ITINERARY", payload: id }),
			[],
		),
		setScrollSync: useCallback(
			(enabled: boolean) =>
				dispatch({ type: "SET_SCROLL_SYNC", payload: enabled }),
			[],
		),
		setPoiData: useCallback(
			(data: TripMapState["poiData"]) =>
				dispatch({ type: "SET_POI_DATA", payload: data }),
			[],
		),
		setSearchResults: useCallback(
			(results: any[]) =>
				dispatch({ type: "SET_SEARCH_RESULTS", payload: results }),
			[],
		),
		setViewport: useCallback(
			(viewport: TripMapState["viewport"]) =>
				dispatch({ type: "SET_VIEWPORT", payload: viewport }),
			[],
		),
		userMovedMap: useCallback(
			(moved: boolean) =>
				dispatch({ type: "USER_MOVED_MAP", payload: moved }),
			[],
		),
		resetViewport: useCallback(
			() => dispatch({ type: "RESET_VIEWPORT" }),
			[],
		),
	};

	return { state, actions };
}

