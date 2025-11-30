"use client";

import React from "react";
import { TrainIcon } from "./TrainIcon";
import { ShoppingIcon } from "./ShoppingIcon";
import { DiningIcon } from "./DiningIcon";
import { HotelIcon } from "./HotelIcon";
import { SearchIcon } from "./SearchIcon";
import { AirplaneIcon } from "./AirplaneIcon";

// アイコン名からSVGコンポーネントへのマップ
const iconMap: Record<string, React.ComponentType<any>> = {
	train: TrainIcon,
	shopping: ShoppingIcon,
	dining: DiningIcon,
	hotel: HotelIcon,
	search: SearchIcon,
	airplane: AirplaneIcon,
};

export interface IconRendererProps {
	iconName?: string;
	fallbackEmoji?: string;
	className?: string;
	color?: string;
}

/**
 * アイコン名または絵文字をレンダリングするコンポーネント
 * アイコン名がマップに存在する場合はSVGを、そうでなければ絵文字を表示
 */
export const IconRenderer: React.FC<IconRendererProps> = ({
	iconName,
	fallbackEmoji,
	className = "w-4 h-4",
	color = "currentColor",
}) => {
	// Iconify 優先マップ（存在すればこちらを使用）
	const iconifyMap: Record<string, string> = {
		// 既存6種
		train: "tabler:train",
		shopping: "tabler:shopping-bag",
		dining: "tabler:tools-kitchen-2",
		hotel: "tabler:bed",
		search: "tabler:search",
		airplane: "tabler:plane",
		warning: "tabler:alert-triangle",

		// 追加アイコン
		backpack: "tabler:backpack",
		bookmark: "tabler:bookmark",
		calendar: "tabler:calendar",
		chart: "tabler:chart-bar",
		clipboard: "tabler:clipboard-list",
		clock: "tabler:clock",
		close: "tabler:x",
		cloud: "tabler:cloud",
		collapse: "tabler:chevron-up",
		expand: "tabler:chevron-down",
		lightbulb: "tabler:bulb",
		location: "tabler:map-pin",
		mail: "tabler:mail",
		menu: "tabler:menu",
		money: "tabler:coins",
		piechart: "tabler:chart-pie",
		pin: "tabler:pin",
		planner: "tabler:clipboard-text",
		prohibition: "tabler:ban",
		publicaccess: "tabler:world",
		reservation: "tabler:calendar-check",
		rocket: "tabler:rocket",
		summary: "tabler:list-details",
		parking: "tabler:parking",
		user: "tabler:user",
		plus: "tabler:plus",
		car: "tabler:car",
		tree: "tabler:tree",
		bed: "tabler:bed",
	};
	if (iconName && iconifyMap[iconName]) {
		const UnifiedIcon = require("./UnifiedIcon").UnifiedIcon;
		return (
			<UnifiedIcon
				icon={iconifyMap[iconName]}
				className={className}
				color={color}
			/>
		);
	}
	if (iconName && iconMap[iconName]) {
		const IconComponent = iconMap[iconName];
		return <IconComponent className={className} color={color} />;
	}
	if (fallbackEmoji) {
		return <span className={className}>{fallbackEmoji}</span>;
	}
	return null;
};

export default IconRenderer;
