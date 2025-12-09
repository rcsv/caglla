import { useReducer, useRef, useEffect } from "react";

/**
 * POIDialogのUI状態
 */
export interface POIDialogState {
	showDaySelector: boolean;
	popupPosition: "top" | "bottom";
	showAllHours: boolean;
	currentPhotoIndex: number;
	showImageGallery: boolean;
	showAllReviews: boolean;
}

/**
 * POIDialogのアクション
 */
export type POIDialogAction =
	| { type: "TOGGLE_DAY_SELECTOR" }
	| { type: "SET_POPUP_POSITION"; position: "top" | "bottom" }
	| { type: "SHOW_ALL_HOURS"; show: boolean }
	| { type: "SET_PHOTO_INDEX"; index: number }
	| { type: "SHOW_GALLERY"; show: boolean }
	| { type: "SHOW_REVIEWS"; show: boolean }
	| { type: "RESET" };

const initialState: POIDialogState = {
	showDaySelector: false,
	popupPosition: "bottom",
	showAllHours: false,
	currentPhotoIndex: 0,
	showImageGallery: false,
	showAllReviews: false,
};

/**
 * POIDialogの状態遷移を管理するreducer
 */
function reducer(
	state: POIDialogState,
	action: POIDialogAction,
): POIDialogState {
	switch (action.type) {
		case "TOGGLE_DAY_SELECTOR":
			return { ...state, showDaySelector: !state.showDaySelector };
		case "SET_POPUP_POSITION":
			return { ...state, popupPosition: action.position };
		case "SHOW_ALL_HOURS":
			return { ...state, showAllHours: action.show };
		case "SET_PHOTO_INDEX":
			return { ...state, currentPhotoIndex: action.index };
		case "SHOW_GALLERY":
			return { ...state, showImageGallery: action.show };
		case "SHOW_REVIEWS":
			return { ...state, showAllReviews: action.show };
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

export interface UsePOIDialogStateReturn {
	// 状態（reducerから取得）
	state: POIDialogState;
	// アクション発行関数
	dispatch: React.Dispatch<POIDialogAction>;
	// Refs
	buttonRef: React.RefObject<HTMLButtonElement>;
	popupRef: React.RefObject<HTMLDivElement>;
	hoursRef: React.RefObject<HTMLDivElement>;
}

/**
 * POIDialogのUI状態を管理するカスタムフック（useReducer版）
 *
 * @param placeId 現在のplaceId（変更時に状態をリセット）
 * @returns 状態、dispatch、refs
 */
export function usePOIDialogState(
	placeId: string | undefined,
): UsePOIDialogStateReturn {
	const [state, dispatch] = useReducer(reducer, initialState);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const hoursRef = useRef<HTMLDivElement>(null);

	// placeIdが変わった時にUI状態をリセット
	// dispatchはuseReducerから返される安定した参照なので依存配列に含めない
	// placeIdの変更を検知してリセットするため、意図的にplaceIdのみを依存配列に含める
	useEffect(() => {
		dispatch({ type: "RESET" });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [placeId]);

	return {
		state,
		dispatch,
		buttonRef,
		popupRef,
		hoursRef,
	};
}

