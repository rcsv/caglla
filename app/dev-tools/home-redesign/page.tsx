"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

type TabId = "friends" | "ideas" | "shares";

const TAB_OPTIONS: Array<{
	id: TabId;
	label: string;
	icon: string;
	description: string;
}> = [
	{
		id: "friends",
		label: "友人の旅",
		icon: "mdi:account-group",
		description: "フォロー中のユーザーがシェアした旅やプランを時系列で追跡",
	},
	{
		id: "ideas",
		label: "旅のアイデア",
		icon: "mdi:lightbulb-on",
		description: "旅行プランナーのテンプレートをカタログ感覚で探索",
	},
	{
		id: "shares",
		label: "自分のシェア",
		icon: "mdi:tray-arrow-up",
		description: "公開範囲や期限を含めた自分のシェア旅を管理",
	},
];

const SEARCH_PLACEHOLDERS: Record<TabId, string> = {
	friends: "フォロー中の旅やハッシュタグを検索",
	ideas: "都市名・テーマ・日数などで検索",
	shares: "公開済みの旅をタイトル・都市で検索",
};

const FILTER_CHIPS: Record<TabId, string[]> = {
	friends: ["すべて", "今旅行中", "最近公開", "テンプレのみ"],
	ideas: ["エリア: 日本", "日数: 3-4日", "予算: ¥¥", "テーマ: 食"],
	shares: ["公開中", "期限あり", "フォロワー限定"],
};

const FRIEND_ACTIVITIES = [
	{
		id: "activity-okinawa",
		type: "shared" as const,
		status: "live" as const,
		userName: "佐藤 美奈",
		userHandle: "@mina_travel",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mina",
		action: "沖縄女子旅をシェアしました",
		timestamp: "45分前",
		title: "梅雨明けの沖縄3泊4日",
		location: "沖縄・那覇 / 恩納村",
		summary:
			"透明度の高い海とニューオープンのカフェを中心に巡る大人女子旅アルバム。",
		cover:
			"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
		tags: ["#女子旅", "#3泊4日", "#ビーチ"],
		metrics: { likes: 128, comments: 24, shares: 12 },
	},
	{
		id: "activity-template",
		type: "template" as const,
		status: "normal" as const,
		userName: "NAO PLANNER",
		userHandle: "@nao_planner",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nao",
		action: "京都グルメプランを公開",
		timestamp: "2時間前",
		title: "京町家に住むように滞在する48時間",
		location: "京都・五条 / 祇園",
		summary:
			"町家ステイと夜の茶会体験を組み合わせた2泊3日プラン。予約リンク付き。",
		cover:
			"https://images.unsplash.com/photo-1545569341-9eb8b30979d6?auto=format&fit=crop&w=1200&q=80",
		tags: ["#グルメ", "#町家ステイ", "#2泊3日"],
		metrics: { likes: 96, comments: 11, shares: 7 },
	},
	{
		id: "activity-hokkaido",
		type: "shared" as const,
		status: "normal" as const,
		userName: "Ken Yamamoto",
		userHandle: "@ken_outdoor",
		avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ken",
		action: "家族旅行をアルバム公開",
		timestamp: "昨日",
		title: "子連れで巡る北海道ドライブ",
		location: "札幌 / 富良野 / 美瑛",
		summary:
			"未就学児2人との北海道ドライブ。動物園やファーム富田を効率的に巡る実例。",
		cover:
			"https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1200&q=80",
		tags: ["#家族旅", "#ドライブ", "#夏休み"],
		metrics: { likes: 201, comments: 32, shares: 18 },
	},
];

const PLAN_IDEAS = [
	{
		id: "idea-helsinki",
		title: "北欧デザインを巡るヘルシンキ3日間",
		region: "ヨーロッパ / フィンランド",
		days: "3日間",
		budget: "¥¥",
		theme: "デザインとカフェ",
		tags: ["大人女子", "アート", "路面電車"],
		summary:
			"マリメッコ本社・デザインディストリクト・サウナ体験を詰め込んだ定番セット。",
		cover:
			"https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=1200&q=80",
		creator: {
			name: "Lina Planner",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lina",
			role: "Travel Creator",
		},
		stats: { likes: 86, clones: 14 },
	},
	{
		id: "idea-fukuoka",
		title: "福岡と糸島で過ごす48時間ショートトリップ",
		region: "日本 / 福岡",
		days: "2泊3日",
		budget: "¥",
		theme: "食と自然",
		tags: ["ひとり旅", "シーサイド", "カフェ巡り"],
		summary:
			"屋台よりも糸島の静かなカフェとワーケーションスポットを重視した構成。",
		cover:
			"https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
		creator: {
			name: "Takuya Nomad",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Takuya",
			role: "Nomad Planner",
		},
		stats: { likes: 54, clones: 21 },
	},
	{
		id: "idea-bali",
		title: "バリ島ワーク＆ウェルネス リトリート",
		region: "アジア / インドネシア",
		days: "4泊5日",
		budget: "¥¥¥",
		theme: "リモートワーク",
		tags: ["ウェルネス", "ヨガ", "サーフィン"],
		summary:
			"朝ヨガと夕方サーフで1日を区切るワークデイ設計。ビザ・SIM情報付き。",
		cover:
			"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
		creator: {
			name: "Studio Paon",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Paon",
			role: "Boutique Planner",
		},
		stats: { likes: 112, clones: 33 },
	},
	{
		id: "idea-sydney",
		title: "親子で楽しむシドニー体験セット",
		region: "オセアニア / オーストラリア",
		days: "5日間",
		budget: "¥¥",
		theme: "親子旅",
		tags: ["動物体験", "街歩き", "海沿い"],
		summary:
			"ライトレールとフェリーで巡る親子旅。タロンガ動物園とボンダイキッズプログラム込み。",
		cover:
			"https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1200&q=80",
		creator: {
			name: "Haruka & Co.",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Haruka",
			role: "Family Travel Lab",
		},
		stats: { likes: 73, clones: 17 },
	},
];

const MY_SHARED_TRIPS = [
	{
		id: "share-taiwan",
		title: "春の台湾・台北と九份",
		location: "台北 / 九份",
		visibility: "フォロワーまで",
		expires: "2025/05まで公開",
		updatedAt: "昨日更新",
		highlights: ["写真 48枚", "コメント 12件", "シェア 4回"],
		stats: { likes: 54, comments: 12, saves: 9 },
	},
	{
		id: "share-venice",
		title: "ヴェネツィア水上バースデー旅",
		location: "イタリア・ヴェネツィア",
		visibility: "全体公開",
		expires: "期限なし",
		updatedAt: "3日前",
		highlights: ["アルバム 32枚", "複製 6件"],
		stats: { likes: 102, comments: 18, saves: 15 },
	},
	{
		id: "share-nagano",
		title: "軽井沢でワーケーション",
		location: "長野・軽井沢",
		visibility: "リンク限定",
		expires: "2025/01で自動非公開",
		updatedAt: "10日前",
		highlights: ["メンバー 5名", "タスク 14件"],
		stats: { likes: 23, comments: 4, saves: 3 },
	},
];

export default function HomeRedesignDemoPage() {
	const [activeTab, setActiveTab] = useState<TabId>("friends");

	const renderTabContent = () => {
		switch (activeTab) {
			case "friends":
				return <FriendsTimeline />;
			case "ideas":
				return <PlanCatalog />;
			case "shares":
				return <MyShareManager />;
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-10">
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
				<header className="space-y-4">
					<p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
						/home concept
					</p>
					<h1 className="text-3xl font-bold text-slate-900">
						ホームタイムライン再設計デモ
					</h1>
					<p className="max-w-3xl text-base leading-7 text-slate-600">
						3つの動機「友人の旅」「旅のアイデア」「自分のシェア」をタブで切り替えられるハリボテ。実データに依存せず、体験の方向性を検証できます。
					</p>
				</header>

				<section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
					<div className="flex flex-wrap gap-3">
						{TAB_OPTIONS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className={`flex flex-1 min-w-[180px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
									activeTab === tab.id
										? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm"
										: "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"
								}`}
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-inner">
									<Icon
										icon={tab.icon}
										className={
											activeTab === tab.id
												? "text-indigo-600"
												: "text-slate-400"
										}
									/>
								</div>
								<div>
									<p className="text-sm font-semibold">{tab.label}</p>
									<p className="text-xs text-slate-500">{tab.description}</p>
								</div>
							</button>
						))}
					</div>

					<div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="relative flex-1">
							<Icon
								icon="mdi:magnify"
								className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
							/>
							<input
								type="search"
								placeholder={SEARCH_PLACEHOLDERS[activeTab]}
								className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
							/>
						</div>
						<div className="flex flex-wrap gap-2">
							{FILTER_CHIPS[activeTab].map((chip) => (
								<button
									key={`${activeTab}-${chip}`}
									type="button"
									className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
								>
									{chip}
								</button>
							))}
						</div>
					</div>
				</section>

				{renderTabContent()}

				<section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
					<p className="font-semibold mb-2">⚠️ ハリボテ注意</p>
					<p>
						このページはUIと導線の確認用モックです。Firestoreや本番APIには一切アクセスされません。
						画面サイズを変えながら、それぞれのタブがどんな情報密度になるかを確認してください。
					</p>
				</section>
			</div>
		</div>
	);
}

function FriendsTimeline() {
	return (
		<section className="space-y-6">
			{FRIEND_ACTIVITIES.map((activity) => {
				const typeStyles =
					activity.type === "shared"
						? "bg-sky-50 text-sky-700 border border-sky-100"
						: "bg-amber-50 text-amber-700 border border-amber-100";
				const typeLabel =
					activity.type === "shared" ? "SHARED TRIP" : "PLAN TEMPLATE";

				return (
					<article
						key={activity.id}
						className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
					>
						<div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-indigo-200/80 via-slate-200 to-transparent" />
						<div className="flex flex-col gap-5 md:flex-row">
							<div className="flex-1">
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<Image
											src={activity.avatar}
											alt={activity.userName}
											className="h-12 w-12 rounded-full border border-slate-100 object-cover"
										/>
										<div>
											<p className="text-sm font-semibold text-slate-900">
												{activity.userName}
											</p>
											<p className="text-xs text-slate-500">
												{activity.action}
											</p>
										</div>
									</div>
									<span className="text-xs text-slate-400">
										{activity.timestamp}
									</span>
								</div>

								<div className="mt-4 flex flex-wrap items-center gap-2">
									<span
										className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${typeStyles}`}
									>
										<Icon
											icon={
												activity.type === "shared"
													? "mdi:share-variant"
													: "mdi:file-document-outline"
											}
											className="h-3.5 w-3.5"
										/>
										{typeLabel}
									</span>
									<span className="text-xs text-slate-400">
										{activity.userHandle}
									</span>
								</div>

								<h2 className="mt-4 text-xl font-semibold text-slate-900">
									{activity.title}
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									{activity.location}
								</p>
								<p className="mt-3 text-sm leading-6 text-slate-600">
									{activity.summary}
								</p>

								<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
									{activity.tags.map((tag) => (
										<span
											key={`${activity.id}-${tag}`}
											className="rounded-full bg-slate-100 px-3 py-1"
										>
											{tag}
										</span>
									))}
								</div>

								<div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
									<span className="inline-flex items-center gap-1 text-rose-500">
										<Icon icon="mdi:heart" className="h-4 w-4" />
										{activity.metrics.likes}
									</span>
									<span className="inline-flex items-center gap-1 text-blue-500">
										<Icon icon="mdi:comment" className="h-4 w-4" />
										{activity.metrics.comments}
									</span>
									<span className="inline-flex items-center gap-1 text-emerald-500">
										<Icon icon="mdi:share" className="h-4 w-4" />
										{activity.metrics.shares}
									</span>
								</div>
							</div>

							<div className="md:w-64">
								<div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
									<Image
										src={activity.cover}
										alt={activity.title}
										className="h-full w-full object-cover transition duration-500 hover:scale-105"
									/>
									{activity.status === "live" && (
										<span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
											<span className="h-2 w-2 animate-pulse rounded-full bg-white" />
											LIVE
										</span>
									)}
								</div>
								<div className="mt-4 flex gap-2">
									<button className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
										旅を見る
									</button>
									<button className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700">
										<Icon icon="mdi:bookmark-outline" className="h-5 w-5" />
									</button>
								</div>
							</div>
						</div>
					</article>
				);
			})}
		</section>
	);
}

function PlanCatalog() {
	return (
		<section className="grid gap-6 md:grid-cols-2">
			{PLAN_IDEAS.map((plan) => (
				<article
					key={plan.id}
					className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
				>
					<div className="relative h-48 w-full overflow-hidden">
						<Image
							src={plan.cover}
							alt={plan.title}
							className="h-full w-full object-cover"
						/>
						<span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
							{plan.theme}
						</span>
					</div>
					<div className="space-y-4 p-5">
						<div className="flex items-center justify-between text-xs text-slate-500">
							<span>{plan.region}</span>
							<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
								<Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
								{plan.days}
							</span>
						</div>
						<h2 className="text-lg font-semibold text-slate-900">
							{plan.title}
						</h2>
						<p className="text-sm leading-6 text-slate-600">{plan.summary}</p>
						<div className="flex flex-wrap gap-2 text-xs text-slate-500">
							{plan.tags.map((tag) => (
								<span
									key={`${plan.id}-${tag}`}
									className="rounded-full bg-slate-100 px-3 py-1"
								>
									#{tag}
								</span>
							))}
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Image
									src={plan.creator.avatar}
									alt={plan.creator.name}
									className="h-11 w-11 rounded-full border border-white shadow"
								/>
								<div>
									<p className="text-sm font-semibold text-slate-900">
										{plan.creator.name}
									</p>
									<p className="text-xs text-slate-500">{plan.creator.role}</p>
								</div>
							</div>
							<div className="text-right text-sm text-slate-500">
								<div className="flex items-center justify-end gap-1 text-rose-500 font-semibold">
									<Icon icon="mdi:heart" className="h-4 w-4" />
									{plan.stats.likes}
								</div>
								<p className="text-xs">複製 {plan.stats.clones}</p>
							</div>
						</div>
						<button className="w-full rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">
							このプランで旅を作る
						</button>
					</div>
				</article>
			))}
		</section>
	);
}

function MyShareManager() {
	return (
		<section className="space-y-5">
			{MY_SHARED_TRIPS.map((trip) => (
				<article
					key={trip.id}
					className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:flex-row md:items-start"
				>
					<div className="flex-1 space-y-3">
						<div className="flex flex-wrap items-center gap-3">
							<h2 className="text-lg font-semibold text-slate-900">
								{trip.title}
							</h2>
							<VisibilityBadge label={trip.visibility} />
						</div>
						<p className="text-sm text-slate-500">{trip.location}</p>
						<div className="flex flex-wrap gap-2 text-xs text-slate-500">
							{trip.highlights.map((item) => (
								<span
									key={`${trip.id}-${item}`}
									className="rounded-full bg-slate-100 px-3 py-1"
								>
									{item}
								</span>
							))}
						</div>
						<div className="flex items-center gap-4 text-sm text-slate-500">
							<span className="inline-flex items-center gap-1 text-rose-500">
								<Icon icon="mdi:heart" className="h-4 w-4" />
								{trip.stats.likes}
							</span>
							<span className="inline-flex items-center gap-1 text-blue-500">
								<Icon icon="mdi:comment" className="h-4 w-4" />
								{trip.stats.comments}
							</span>
							<span className="inline-flex items-center gap-1 text-emerald-500">
								<Icon icon="mdi:content-save" className="h-4 w-4" />
								{trip.stats.saves}
							</span>
						</div>
					</div>

					<div className="w-full md:w-64">
						<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
							<div className="flex items-center justify-between text-slate-500">
								<span>公開期限</span>
								<span className="font-semibold text-slate-900">
									{trip.expires}
								</span>
							</div>
							<div className="mt-2 flex items-center justify-between text-xs text-slate-500">
								<span>最終更新</span>
								<span>{trip.updatedAt}</span>
							</div>
						</div>
						<div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-500">
							<div className="rounded-xl border border-slate-100 bg-white p-3">
								<p className="text-slate-900">{trip.stats.likes}</p>
								<p>いいね</p>
							</div>
							<div className="rounded-xl border border-slate-100 bg-white p-3">
								<p className="text-slate-900">{trip.stats.comments}</p>
								<p>コメント</p>
							</div>
							<div className="rounded-xl border border-slate-100 bg-white p-3">
								<p className="text-slate-900">{trip.stats.saves}</p>
								<p>保存</p>
							</div>
						</div>
						<div className="mt-3 flex gap-2">
							<button className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
								公開範囲
							</button>
							<button className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
								リンク
							</button>
						</div>
					</div>
				</article>
			))}
		</section>
	);
}

function VisibilityBadge({ label }: { label: string }) {
	let style = "bg-slate-100 text-slate-600 border border-slate-200";
	if (label.includes("全体"))
		style = "bg-emerald-50 text-emerald-700 border border-emerald-100";
	if (label.includes("フォロワー"))
		style = "bg-blue-50 text-blue-700 border border-blue-100";
	if (label.includes("リンク"))
		style = "bg-amber-50 text-amber-700 border border-amber-100";

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${style}`}
		>
			<Icon icon="mdi:lock-open-check" className="h-3.5 w-3.5" />
			{label}
		</span>
	);
}
