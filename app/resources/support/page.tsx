"use client";

import React from "react";
import Link from "next/link";
import { StaticPageLayout } from "@/components/common/static/StaticPageLayout";
import { Section } from "@/components/common/static/Section";
import { SolidCard } from "@/components/common/static/SolidCard";
import { SearchIcon } from "@/components/common/icons/SearchIcon";
import { MailIcon } from "@/components/common/icons/MailIcon";
import { CalendarIcon } from "@/components/common/icons/CalendarIcon";
import { LocationIcon } from "@/components/common/icons/LocationIcon";
import { UserIcon } from "@/components/common/icons/UserIcon";
import { MoneyIcon } from "@/components/common/icons/MoneyIcon";
import { WarningIcon } from "@/components/common/icons/WarningIcon";

export default function SupportPage() {
	const [query, setQuery] = React.useState("");

	const categories = [
		{
			id: "getting-started",
			title: "はじめに",
			description: "サインイン、初期設定、最初の旅の作成",
			icon: <RocketLike />, // simple inline wrapper below
			links: [
				{ label: "アカウントの作成/ログイン", href: "/faq#login" },
				{ label: "最初の旅を作る", href: "/home" },
				{ label: "ドキュメント", href: "/docs" },
			],
		},
		{
			id: "trips-itineraries",
			title: "旅・日程・予定",
			description: "Trip/Day/Itinerary の管理",
			icon: <CalendarIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "日程を追加する", href: "/faq#add-day" },
				{ label: "予定を編集する", href: "/faq#edit-itinerary" },
				{ label: "共有・公開設定", href: "/faq#share" },
			],
		},
		{
			id: "places-maps",
			title: "場所・地図",
			description: "Google Places/Maps の使い方",
			icon: <LocationIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "場所の検索", href: "/faq#place-search" },
				{ label: "マップの表示", href: "/faq#map" },
				{ label: "言語/タイムゾーン", href: "/faq#i18n-timezone" },
			],
		},
		{
			id: "account-billing",
			title: "アカウント・プラン",
			description: "サブスクリプションと制限",
			icon: <UserIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "プランと機能", href: "/product/pricing" },
				{ label: "上限/制限について", href: "/faq#limits" },
				{ label: "請求・更新", href: "/faq#billing" },
			],
		},
		{
			id: "privacy-security",
			title: "プライバシー・セキュリティ",
			description: "データの扱い/公開範囲",
			icon: <WarningIcon className="h-6 w-6 text-indigo-600" />,
			links: [
				{ label: "プライバシーポリシー", href: "/privacy" },
				{ label: "利用規約", href: "/terms" },
				{ label: "公開設定", href: "/faq#visibility" },
			],
		},
		{
			id: "troubleshooting",
			title: "トラブルシューティング",
			description: "よくあるエラーと対処",
			icon: <MoneyIcon className="h-6 w-6 text-indigo-600" />, // reuse simple icon
			links: [
				{ label: "サインインできない", href: "/faq#cannot-login" },
				{ label: "地図が表示されない", href: "/faq#map-not-loading" },
				{ label: "問い合わせ", href: "/contact" },
			],
		},
	];

	const faqs = [
		{
			id: "login",
			q: "Googleでのログインは必須ですか？",
			a: "はい。Firebase AuthenticationのGoogleログインを採用しています。パスワードのローカル管理は行いません。",
			tags: ["はじめに", "アカウント"],
		},
		{
			id: "add-day",
			q: "旅の日程（Day）はどうやって追加しますか？",
			a: "Trip詳細画面から日付を選択して追加できます。日別のItineraryを作成・編集してください。",
			tags: ["旅・日程・予定"],
		},
		{
			id: "edit-itinerary",
			q: "Itineraryの並び替えや編集はできますか？",
			a: "はい。項目の追加・編集・削除、ドラッグでの順序調整に対応しています。",
			tags: ["旅・日程・予定"],
		},
		{
			id: "place-search",
			q: "場所検索はどのAPIを利用していますか？",
			a: "Google Places APIを使用します。環境変数の設定が必要です。",
			tags: ["場所・地図"],
		},
		{
			id: "i18n-timezone",
			q: "多言語・タイムゾーンはどのように扱われますか？",
			a: "i18n仕様とtimezoneユーティリティを利用し、都市に応じたタイムゾーン変換に対応します。",
			tags: ["場所・地図", "設定"],
		},
		{
			id: "limits",
			q: "プランの上限はどこで確認できますか？",
			a: "プラン別の制限は`/product/pricing`とアプリ内のチェックで確認できます。",
			tags: ["アカウント・プラン"],
		},
		{
			id: "billing",
			q: "請求や更新手続きはどうなりますか？",
			a: "現在は段階的に提供中です。詳細は`/product/pricing`およびサポートへお問い合わせください。",
			tags: ["アカウント・プラン"],
		},
		{
			id: "visibility",
			q: "旅の公開/非公開は切り替えられますか？",
			a: "はい。Tripの公開設定から変更できます。共有リンクでのアクセス範囲も制御できます。",
			tags: ["プライバシー・セキュリティ"],
		},
		{
			id: "cannot-login",
			q: "サインインに失敗します。どうすれば？",
			a: "ブラウザのサードパーティCookieやポップアップ設定をご確認ください。改善しない場合はお問い合わせください。",
			tags: ["トラブルシューティング"],
		},
		{
			id: "map-not-loading",
			q: "地図が表示されません。",
			a: "APIキー設定とリファラ制限、ネットワーク状況をご確認ください。詳細は「場所・地図」を参照。",
			tags: ["トラブルシューティング", "場所・地図"],
		},
	];

	const filteredFaqs = faqs.filter((f) => {
		if (!query.trim()) return true;
		const qLower = query.toLowerCase();
		return (
			f.q.toLowerCase().includes(qLower) ||
			f.a.toLowerCase().includes(qLower) ||
			f.tags.some((t) => t.toLowerCase().includes(qLower))
		);
	});

	return (
		<StaticPageLayout>
			{/* Hero-like heading to match About taste */}
			<section>
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
					<div className="lg:col-span-9">
						<h1 className="leading-[0.8] tracking-tight bg-text-image text-transparent bg-clip-text font-extrabold uppercase text-[clamp(3.5rem,10vw,9rem)] font-rajdhani">
							<span className="block">Support</span>
							<span className="block">Help Center</span>
						</h1>
					</div>
					<div className="lg:col-span-3 flex items-end">
						<div className="relative z-10 bg-white/85 backdrop-blur-sm p-6 border border-gray-200">
							<p className="text-lg md:text-xl text-gray-800 leading-relaxed">
								Caglla
								のサポートセンター。検索・カテゴリ・FAQ・お問い合わせで、素早く自己解決できます。
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Search & Categories */}
			<Section title="Find Answers">
				<SolidCard className="p-6 md:p-8">
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							検索
						</label>
						<div className="relative">
							<span className="absolute left-3 top-2.5 text-gray-400">
								<SearchIcon className="h-5 w-5" />
							</span>
							<input
								type="text"
								className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="キーワードで検索（例：共有、地図、ログイン）"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{categories.map((c) => (
							<Link
								key={c.id}
								href={`#${c.id}`}
								className="block bg-white border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition"
							>
								<div className="flex items-start gap-3">
									<div className="mt-0.5">{c.icon}</div>
									<div>
										<div className="font-semibold text-gray-900">{c.title}</div>
										<div className="text-sm text-gray-600">{c.description}</div>
										<ul className="mt-2 space-y-1 text-sm text-indigo-600">
											{c.links.map((l) => (
												<li key={l.href} className="truncate">
													<span className="mr-1">→</span>
													<span className="underline decoration-dotted">
														{l.label}
													</span>
												</li>
											))}
										</ul>
									</div>
								</div>
							</Link>
						))}
					</div>
				</SolidCard>
			</Section>

			{/* FAQ */}
			<Section title="FAQ">
				<SolidCard className="p-6 md:p-8">
					<div className="space-y-2">
						{filteredFaqs.map((item) => (
							<details
								key={item.id}
								id={item.id}
								className="group bg-white border border-gray-200 p-4 open:shadow-sm"
							>
								<summary className="flex cursor-pointer list-none items-center justify-between">
									<span className="font-medium text-gray-900">{item.q}</span>
									<span className="text-gray-400 group-open:rotate-180 transition">
										▾
									</span>
								</summary>
								<div className="mt-2 text-gray-700 text-sm leading-relaxed">
									{item.a}
								</div>
								<div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
									{item.tags.map((t) => (
										<span key={t} className="rounded bg-gray-100 px-2 py-0.5">
											{t}
										</span>
									))}
								</div>
							</details>
						))}
						{filteredFaqs.length === 0 && (
							<div className="text-sm text-gray-600">
								該当するFAQが見つかりませんでした。キーワードを変えてお試しください。
							</div>
						)}
					</div>
				</SolidCard>
			</Section>

			{/* Shortcuts / Contacts */}
			<Section title="Quick Links">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<SolidCard className="p-6 hover:shadow-sm transition">
						<Link href="/docs" className="flex items-center gap-3">
							<CalendarIcon className="h-5 w-5 text-indigo-600" />
							<div>
								<div className="font-medium">ドキュメント</div>
								<div className="text-sm text-gray-600">
									仕様・ガイドラインを参照
								</div>
							</div>
						</Link>
					</SolidCard>
					<SolidCard className="p-6 hover:shadow-sm transition">
						<Link href="/faq" className="flex items-center gap-3">
							<SearchIcon className="h-5 w-5 text-indigo-600" />
							<div>
								<div className="font-medium">FAQ一覧</div>
								<div className="text-sm text-gray-600">
									よくある質問をまとめて確認
								</div>
							</div>
						</Link>
					</SolidCard>
					<SolidCard className="p-6 hover:shadow-sm transition">
						<Link href="/contact" className="flex items-center gap-3">
							<MailIcon className="h-5 w-5 text-indigo-600" />
							<div>
								<div className="font-medium">お問い合わせ</div>
								<div className="text-sm text-gray-600">
									フォームでご連絡ください
								</div>
							</div>
						</Link>
					</SolidCard>
				</div>
				<div className="mt-6 text-xs text-gray-500">
					参考:
					モダンなサポートページの考え方（カテゴリー化・検索・FAQ・コンタクト）—
					<a
						className="underline ml-1"
						href="https://www.layerise.com/resources/blog/post/10-examples-of-modern-support-pages"
						target="_blank"
						rel="noopener noreferrer"
					>
						Layeriseの記事
					</a>
				</div>
			</Section>

			{/* CTA aligned with About */}
			<section className="text-center">
				<div className="bg-emerald-600 p-12 text-white">
					<h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
					<p className="text-xl mb-8 opacity-90">
						解決しない場合はサポートへお気軽にご連絡ください。
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/contact"
							className="px-8 py-3 bg-white text-emerald-600 font-semibold hover:bg-gray-100 transition-colors border border-emerald-200"
						>
							お問い合わせ
						</Link>
						<Link
							href="/docs"
							className="px-8 py-3 bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
						>
							ドキュメントを見る
						</Link>
					</div>
				</div>
			</section>
		</StaticPageLayout>
	);
}

function RocketLike() {
	return <CalendarIcon className="h-6 w-6 text-indigo-600" />;
}
