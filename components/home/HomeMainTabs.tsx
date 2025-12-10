"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { t, type TranslationKey } from "@/lib/i18n";
import type { Trip } from "@/lib/core/types";
import { FriendsTimeline } from "./tabs/FriendsTimeline";
import { IdeasCatalog } from "./tabs/IdeasCatalog";
import { MyShareManager } from "./tabs/MyShareManager";

type TabId = "friends" | "ideas" | "shares";

const TAB_OPTIONS: Array<{
	id: TabId;
	icon: string;
}> = [
	{
		id: "friends",
		icon: "mdi:account-group",
	},
	{
		id: "ideas",
		icon: "mdi:lightbulb-on",
	},
	{
		id: "shares",
		icon: "mdi:tray-arrow-up",
	},
];

const SEARCH_PLACEHOLDERS: Record<TabId, TranslationKey> = {
	friends: "home.mainTabs.searchPlaceholder.friends",
	ideas: "home.mainTabs.searchPlaceholder.ideas",
	shares: "home.mainTabs.searchPlaceholder.shares",
};

const getSearchPlaceholder = (tabId: TabId): string => {
	return t(SEARCH_PLACEHOLDERS[tabId]);
};

const FILTER_CHIPS: Record<TabId, TranslationKey[]> = {
	friends: [
		"home.mainTabs.filterChips.friends.all",
		"home.mainTabs.filterChips.friends.active",
		"home.mainTabs.filterChips.friends.recent",
		"home.mainTabs.filterChips.friends.templates",
	],
	ideas: [
		"home.mainTabs.filterChips.ideas.area",
		"home.mainTabs.filterChips.ideas.duration",
		"home.mainTabs.filterChips.ideas.budget",
		"home.mainTabs.filterChips.ideas.theme",
	],
	shares: [
		"home.mainTabs.filterChips.shares.public",
		"home.mainTabs.filterChips.shares.expires",
		"home.mainTabs.filterChips.shares.followers",
	],
};

const getFilterChips = (tabId: TabId): string[] => {
	return FILTER_CHIPS[tabId].map((key) => t(key));
};

interface HomeMainTabsProps {
	mySharedTrips?: Trip[] | null;
	mySharesLoading?: boolean;
	onMySharesRefresh?: () => void;
}

export function HomeMainTabs({
	mySharedTrips,
	mySharesLoading = false,
	onMySharesRefresh,
}: HomeMainTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>("friends");
	const [searchQuery, setSearchQuery] = useState("");
	const [activeFilter, setActiveFilter] = useState<string | null>(null);
	const searchTimeoutRef = useRef<NodeJS.Timeout>();

	// タブが切り替わったら検索クエリをリセット
	useEffect(() => {
		setSearchQuery("");
		setActiveFilter(null);
	}, [activeTab]);

	// 検索入力のデバウンス処理
	const handleSearchChange = useCallback((value: string) => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		searchTimeoutRef.current = setTimeout(() => {
			setSearchQuery(value);
		}, 300);
	}, []);

	const handleFilterClick = useCallback((filter: string) => {
		setActiveFilter((prev) => (prev === filter ? null : filter));
	}, []);

	const renderTabContent = () => {
		switch (activeTab) {
			case "friends":
				return (
					<FriendsTimeline
						searchQuery={searchQuery}
						filter={activeFilter}
					/>
				);
			case "ideas":
				return (
					<IdeasCatalog searchQuery={searchQuery} filter={activeFilter} />
				);
			case "shares":
				return (
					<MyShareManager
						trips={mySharedTrips}
						loading={mySharesLoading}
						onRefresh={onMySharesRefresh}
						searchQuery={searchQuery}
						filter={activeFilter}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* タブボタン（CodePen風のタブグループを意識したスタイル） */}
			<section className="rounded-sm border border-slate-200 bg-white/95 p-6 shadow-sm">
				<div className="inline-flex w-full max-w-full rounded-full bg-slate-100 p-1 shadow-inner">
					{TAB_OPTIONS.map((tab) => {
						const isActive = activeTab === tab.id;
						const labelKey = `home.mainTabs.${tab.id}` as const;
						const label = t(labelKey);
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`relative flex-1 min-w-[0] px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
									isActive
										? "bg-white text-slate-900 shadow-md"
										: "text-slate-500 hover:text-slate-800 hover:bg-white/70"
								}`}
							>
								<Icon
									icon={tab.icon}
									className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`}
								/>
								<span className="truncate">{label}</span>
							</button>
						);
					})}
				</div>

				{/* 検索＋フィルタ */}
				<div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="relative flex-1">
						<Icon
							icon="mdi:magnify"
							className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
						/>
						<input
							type="search"
							placeholder={getSearchPlaceholder(activeTab)}
							className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						{getFilterChips(activeTab).map((chip) => {
							const isActive = activeFilter === chip;
							return (
								<button
									key={`${activeTab}-${chip}`}
									type="button"
									onClick={() => handleFilterClick(chip)}
									className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
										isActive
											? "border-indigo-400 bg-indigo-50 text-indigo-600"
											: "border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
									}`}
								>
									{chip}
								</button>
							);
						})}
					</div>
				</div>
			</section>

			{/* タブコンテンツ */}
			{renderTabContent()}
		</div>
	);
}
