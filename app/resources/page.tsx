"use client";

import React from "react";
import Link from "next/link";
import { StaticPageLayout } from "@/components/common/static/StaticPageLayout";
import { Section } from "@/components/common/static/Section";
import { SolidCard } from "@/components/common/static/SolidCard";
import { SearchIcon } from "@/components/common/icons/SearchIcon";
import { CalendarIcon } from "@/components/common/icons/CalendarIcon";
import { PlannerIcon } from "@/components/common/icons/PlannerIcon";
import { LocationIcon } from "@/components/common/icons/LocationIcon";
import { RocketIcon } from "@/components/common/icons/RocketIcon";
import { CloudIcon } from "@/components/common/icons/CloudIcon";
import { WarningIcon } from "@/components/common/icons/WarningIcon";
import { PieChartIcon } from "@/components/common/icons/PieChartIcon";

export default function DocsPage() {
	const { t } = require("@/lib/i18n");
	const [query, setQuery] = React.useState("");

	const guides = [
		{
			id: "getting-started",
			title: "はじめに",
			description: "アカウント作成、初期設定、最初の旅の作成まで",
			icon: <RocketIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "About", href: "/about" },
				{ label: "新規トリップ作成", href: "/home" },
				{ label: "サポート", href: "/support" },
			],
		},
		{
			id: "planning",
			title: "旅の計画（Trip/Day/Itinerary）",
			description: "旅・日程・予定の作成、編集、共有",
			icon: <PlannerIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "機能一覧", href: "/product/features" },
				{ label: "FAQ: 旅・日程・予定", href: "/faq#trips" },
			],
		},
		{
			id: "places-maps",
			title: "場所・地図・多言語",
			description: "Places/Maps、vicinity、i18n、タイムゾーン",
			icon: <LocationIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "FAQ: 場所・地図", href: "/faq#places" },
				{ label: "サポート", href: "/support" },
			],
		},
		{
			id: "route-optimization",
			title: "ルート最適化",
			description: "Waypoint最適化、移動モード、回避設定、コスト見積り",
			icon: <PieChartIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "価格/プラン", href: "/product/pricing" },
				{ label: "FAQ", href: "/faq#trips" },
			],
		},
		{
			id: "environment",
			title: "環境変数・設定",
			description: "環境変数検証、Google APIキー、Firebase設定",
			icon: <CloudIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "プライバシー", href: "/privacy" },
				{ label: "利用規約", href: "/terms" },
			],
		},
		{
			id: "security",
			title: "セキュリティ",
			description: "認証/認可、公開設定、データ保護",
			icon: <WarningIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "リリースノート", href: "/product/releases" },
				{ label: "FAQ: セキュリティ", href: "/faq#privacy" },
			],
		},
		{
			id: "releases",
			title: "リリースノート",
			description: "バージョン履歴と変更点",
			icon: <CalendarIcon className="h-6 w-6 text-indigo-600" />,
			links: [{ label: "リリース一覧", href: "/product/releases" }],
		},
	];

	const filteredGuides = guides.filter((g) => {
		if (!query.trim()) return true;
		const qLower = query.toLowerCase();
		return (
			g.title.toLowerCase().includes(qLower) ||
			g.description.toLowerCase().includes(qLower)
		);
	});

	return (
		<StaticPageLayout>
			{/* Hero */}
			<section>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
					<div className="lg:col-span-9">
						<h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)] font-rajdhani">
							<span className="block">{t("docs.title1")}</span>
							<span className="block">{t("docs.title2")}</span>
						</h1>
					</div>
					<div className="lg:col-span-3 flex items-end">
						<div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
							<p className="text-lg md:text-xl text-gray-800 leading-relaxed">
								{t("docs.intro")}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Search */}
			<Section title={t("docs.search.title")}>
				<SolidCard className="p-6 md:p-8">
					<div className="relative">
						<span className="absolute left-3 top-2.5 text-gray-400">
							<SearchIcon className="h-5 w-5" />
						</span>
						<input
							type="text"
							className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							placeholder={t("docs.search.placeholder")}
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
				</SolidCard>
			</Section>

			{/* Guides */}
			<Section title={t("docs.guides.title")}>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{filteredGuides.map((g) => (
						<SolidCard key={g.id} className="p-6 hover:shadow-sm transition">
							<div className="flex items-start gap-3">
								{g.icon}
								<div>
									<div className="font-semibold text-gray-900">{g.title}</div>
									<div className="text-sm text-gray-600">{g.description}</div>
									<ul className="mt-2 space-y-1 text-sm text-indigo-600">
										{g.links.map((l) => (
											<li key={l.href} className="truncate">
												<Link
													href={l.href}
													className="underline decoration-dotted"
												>
													→ {l.label}
												</Link>
											</li>
										))}
									</ul>
								</div>
							</div>
						</SolidCard>
					))}
					{filteredGuides.length === 0 && (
						<div className="text-sm text-gray-600">{t("docs.empty")}</div>
					)}
				</div>
			</Section>

			{/* Shortcuts */}
			<Section title={t("docs.shortcuts.title")}>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<SolidCard className="p-6 hover:shadow-sm transition">
						<Link href="/support" className="flex items-center gap-3">
							<SearchIcon className="h-5 w-5 text-indigo-600" />
							<div>
								<div className="font-medium">{t("docs.shortcuts.support")}</div>
								<div className="text-sm text-gray-600">
									{t("docs.shortcuts.support.sub")}
								</div>
							</div>
						</Link>
					</SolidCard>
					<SolidCard className="p-6 hover:shadow-sm transition">
						<Link href="/faq" className="flex items-center gap-3">
							<SearchIcon className="h-5 w-5 text-indigo-600" />
							<div>
								<div className="font-medium">{t("docs.shortcuts.faq")}</div>
								<div className="text-sm text-gray-600">
									{t("docs.shortcuts.faq.sub")}
								</div>
							</div>
						</Link>
					</SolidCard>
					<SolidCard className="p-6 hover:shadow-sm transition">
						<Link href="/product/releases" className="flex items-center gap-3">
							<CalendarIcon className="h-5 w-5 text-indigo-600" />
							<div>
								<div className="font-medium">
									{t("docs.shortcuts.releases")}
								</div>
								<div className="text-sm text-gray-600">
									{t("docs.shortcuts.releases.sub")}
								</div>
							</div>
						</Link>
					</SolidCard>
				</div>
			</Section>

			{/* CTA */}
			<section className="text-center">
				<div className="bg-emerald-600 p-12 text-white">
					<h2 className="text-3xl font-bold mb-4">{t("docs.cta.title")}</h2>
					<p className="text-xl mb-8 opacity-90">{t("docs.cta.subtitle")}</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/support"
							className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200"
						>
							{t("docs.cta.support")}
						</Link>
						<Link
							href="/faq"
							className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
						>
							{t("docs.cta.faq")}
						</Link>
					</div>
				</div>
			</section>
		</StaticPageLayout>
	);
}
