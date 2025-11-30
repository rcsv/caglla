"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TripCard } from "@/components/tripcard/TripCard";
import { Icon } from "@iconify/react";
import type { Trip, User, Day, Itinerary } from "@/lib/core/types";
import Loading from "@/components/common/Loading";
import Image from "next/image";

// ハリボテ用の拡張型定義
interface ExtendedTrip extends Trip {
	is_shared?: boolean;
	shared_from_trip_id?: string;
	shared_start_month?: number;
	shared_start_year?: number;
	shared_end_month?: number;
	shared_end_year?: number;
	shared_plan_type?: "user" | "business";
}

type TripType = "private" | "shared" | "template";

/**
 * 旅行タイプデモページ
 *
 * 3つの旅行タイプ（プライベート旅行、プライベート旅行のシェア、旅行プランのシェア）の
 * ユーザー体験を模擬できるハリボテページ
 */
export default function TripTypesDemoPage() {
	const [activeType, setActiveType] = useState<TripType>("private");
	const [isMounted, setIsMounted] = useState(false);

	// クライアントサイドでのみレンダリングしてHydrationエラーを防ぐ
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// モックユーザー
	const mockUser: User = {
		id: "user-demo",
		name: "Demo User",
		email: "demo@example.com",
		slug: "demo-user",
		auth_uid: "auth-demo",
		profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Demo",
		created_at: new Date(),
		updated_at: new Date(),
	};

	// 招待メンバーのモックデータ（会議の参加者のような扱い）
	const mockSharedMembers: User[] = [
		{
			id: "user-member-1",
			name: "Alice Traveler",
			email: "alice@example.com",
			slug: "alice-traveler",
			auth_uid: "auth-alice",
			profile_image_url:
				"https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
			created_at: new Date(),
			updated_at: new Date(),
		},
		{
			id: "user-member-2",
			name: "Bob Explorer",
			email: "bob@example.com",
			slug: "bob-explorer",
			auth_uid: "auth-bob",
			profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
			created_at: new Date(),
			updated_at: new Date(),
		},
		{
			id: "user-member-3",
			name: "Carol Adventurer",
			email: "carol@example.com",
			slug: "carol-adventurer",
			auth_uid: "auth-carol",
			profile_image_url:
				"https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
			created_at: new Date(),
			updated_at: new Date(),
		},
	];

	// モック日程データ（日付は後で設定）
	const mockDays: Day[] = [
		{
			id: "day-1",
			trip_id: "trip-demo",
			day_number: 1,
			date: new Date(), // 後で上書きされる
			description: "1日目",
			created_at: new Date(),
			updated_at: new Date(),
			itineraries: [
				{
					id: "itinerary-1",
					day_id: "day-1",
					sort_number: 1,
					title: "那覇空港到着",
					description: "ANA便で那覇空港に到着",
					location: "那覇空港",
					start_time: "14:30",
					end_time: "15:30",
					created_at: new Date(),
					updated_at: new Date(),
				},
				{
					id: "itinerary-2",
					day_id: "day-1",
					sort_number: 2,
					title: "ホテルチェックイン",
					description: "那覇市内のホテルにチェックイン",
					location: "那覇市内のホテル",
					start_time: "16:00",
					end_time: "16:30",
					created_at: new Date(),
					updated_at: new Date(),
				},
			],
		},
		{
			id: "day-2",
			trip_id: "trip-demo",
			day_number: 2,
			date: new Date(), // 後で上書きされる
			description: "2日目",
			created_at: new Date(),
			updated_at: new Date(),
			itineraries: [
				{
					id: "itinerary-3",
					day_id: "day-2",
					sort_number: 1,
					title: "美ら海水族館",
					description: "世界最大級の水族館を観光",
					location: "美ら海水族館",
					start_time: "10:00",
					end_time: "14:00",
					created_at: new Date(),
					updated_at: new Date(),
				},
			],
		},
	];

	// プライベート旅行のモックデータ
	// 日付を固定値にしてHydrationエラーを防ぐ（未来の日付を使用）
	const futureDate = new Date();
	futureDate.setMonth(futureDate.getMonth() + 2); // 2ヶ月後
	const futureEndDate = new Date(futureDate);
	futureEndDate.setDate(futureEndDate.getDate() + 3); // 3泊4日

	const privateTrip: ExtendedTrip = {
		id: "trip-private",
		user_id: mockUser.id,
		title: "家族で沖縄旅行",
		slug: "trip-private",
		destination: "沖縄県那覇市",
		description: "家族4人での沖縄旅行。美しい海と美味しい料理を楽しみます。",
		start_date: futureDate,
		end_date: futureEndDate,
		status: "PLANNING",
		access_level: "private",
		is_template: false,
		day_count: 4,
		created_at: new Date("2024-11-01"),
		updated_at: new Date("2024-11-15"),
		creator: mockUser,
		days: mockDays.map((day) => ({
			...day,
			date: new Date(
				futureDate.getTime() + (day.day_number - 1) * 24 * 60 * 60 * 1000,
			),
		})),
		social_stats: {
			likes_count: 0,
			comments_count: 0,
			shares_count: 0,
			views_count: 0,
			replicas_count: 0,
		},
	};

	// プライベート旅行のシェアのモックデータ
	const sharedTrip: ExtendedTrip = {
		id: "trip-shared",
		user_id: mockUser.id,
		title: "沖縄旅行のプラン（参考）",
		slug: "trip-shared",
		destination: "沖縄県那覇市",
		description: "家族で行った沖縄旅行のプランを参考として共有します。",
		// 日付は月のみ（start_date/end_dateは未設定）
		status: "PLANNING",
		access_level: "public",
		is_template: false,
		is_shared: true,
		shared_from_trip_id: "trip-private",
		shared_start_month: 12,
		shared_start_year: 2024,
		shared_end_month: 12,
		shared_end_year: 2024,
		day_count: 4,
		created_at: new Date("2024-11-20"),
		updated_at: new Date("2024-11-20"),
		creator: mockUser,
		// 宿泊先情報を削除した日程データ
		days: mockDays.map((day) => ({
			...day,
			itineraries: day.itineraries?.map((it) => ({
				...it,
				// 宿泊先情報を匿名化
				location: it.location?.includes("ホテル")
					? "那覇市内のホテル"
					: it.location,
				description: it.description?.includes("ホテル")
					? "ホテルにチェックイン"
					: it.description,
			})),
		})),
		social_stats: {
			likes_count: 15,
			comments_count: 3,
			shares_count: 2,
			views_count: 120,
			replicas_count: 0,
		},
	};

	// 旅行プランのシェアのモックデータ
	const templateTrip: ExtendedTrip = {
		id: "trip-template",
		user_id: mockUser.id,
		title: "沖縄3泊4日の楽しみ方",
		slug: "trip-template",
		destination: "沖縄県",
		description:
			"沖縄を効率的に楽しむための3泊4日のプランです。地域の楽しみ方や移動方法を紹介します。",
		// 日付は設定しない
		status: "PLANNING",
		access_level: "public",
		is_template: true,
		day_count: 4,
		shared_plan_type: "user",
		created_at: new Date("2024-10-01"),
		updated_at: new Date("2024-10-15"),
		creator: mockUser,
		// 日付なしの日程データ（day_numberのみ）
		days: mockDays.map((day) => ({
			...day,
			date: undefined as any, // 日付なし
		})),
		social_stats: {
			likes_count: 42,
			comments_count: 8,
			shares_count: 12,
			views_count: 350,
			replicas_count: 5,
		},
	};

	const currentTrip =
		activeType === "private"
			? privateTrip
			: activeType === "shared"
				? sharedTrip
				: templateTrip;

	// 日付表示のフォーマット
	const formatDateDisplay = (trip: ExtendedTrip): string => {
		if (trip.is_template) {
			return `${trip.day_count}泊${(trip.day_count || 0) + 1}日`;
		}
		if (trip.is_shared && trip.shared_start_month && trip.shared_start_year) {
			// プライベート旅行のシェア: プライバシー保護のため月のみ表示（具体的な日は非表示）
			const startMonth = trip.shared_start_month;
			const startYear = trip.shared_start_year;
			const endMonth = trip.shared_end_month || startMonth;
			const endYear = trip.shared_end_year || startYear;
			if (startMonth === endMonth && startYear === endYear) {
				return `${startYear}年${startMonth}月`;
			}
			return `${startYear}年${startMonth}月 - ${endYear}年${endMonth}月`;
		}
		if (trip.start_date && trip.end_date) {
			// プライベート旅行: 明確な日付を表示
			const start = new Date(trip.start_date);
			const end = new Date(trip.end_date);
			return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getFullYear()}年${end.getMonth() + 1}月${end.getDate()}日`;
		}
		return "日付未設定";
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="container mx-auto px-4 max-w-6xl">
				{/* ヘッダー */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						旅行タイプデモ
					</h1>
					<p className="text-gray-600">
						3つの旅行タイプのユーザー体験を模擬できます
					</p>
				</div>

				{/* タイプ切り替えタブ */}
				<div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="flex flex-wrap gap-4">
						<button
							onClick={() => setActiveType("private")}
							className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
								activeType === "private"
									? "bg-indigo-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<Icon icon="mdi:lock" className="h-5 w-5" />
							<span>プライベート旅行</span>
						</button>
						<button
							onClick={() => setActiveType("shared")}
							className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
								activeType === "shared"
									? "bg-indigo-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<Icon icon="mdi:share-variant" className="h-5 w-5" />
							<span>プライベート旅行のシェア</span>
						</button>
						<button
							onClick={() => setActiveType("template")}
							className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
								activeType === "template"
									? "bg-indigo-600 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							<Icon icon="mdi:file-document-outline" className="h-5 w-5" />
							<span>旅行プランのシェア</span>
						</button>
					</div>
				</div>

				{/* 現在のタイプの説明 */}
				<div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<Icon
							icon={
								activeType === "private"
									? "mdi:lock"
									: activeType === "shared"
										? "mdi:share-variant"
										: "mdi:file-document-outline"
							}
							className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
						/>
						<div>
							<h3 className="font-semibold text-blue-900 mb-1">
								{activeType === "private"
									? "プライベート旅行"
									: activeType === "shared"
										? "プライベート旅行のシェア"
										: "旅行プランのシェア"}
							</h3>
							<p className="text-sm text-blue-800">
								{activeType === "private"
									? "招待されたメンバーのみ閲覧可能。出発日・帰宅日を明確に設定し、すべての情報を完全に表示します。"
									: activeType === "shared"
										? "誰でも閲覧可能（パブリック）。プライバシー保護のため、日付は月のみ表示（具体的な日は非表示）、日程は「1日目」「2日目」として表示。宿泊先情報は匿名化されます。"
										: "誰でも閲覧可能（パブリック）。出発日・帰宅日なし、旅行期間のみ表示。一日目・二日目として表示されます。"}
							</p>
						</div>
					</div>
				</div>

				{/* TripCard表示 */}
				<div className="mb-8">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">
						TripCard表示
					</h2>
					<div className="max-w-2xl">
						{/* クライアントサイドでのみレンダリングしてHydrationエラーを防ぐ */}
						{isMounted ? (
							<TripCard trip={currentTrip as Trip} variant="standard" />
						) : (
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
								<Loading className="py-8" />
							</div>
						)}
					</div>
				</div>

				{/* 詳細情報表示 */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* 左カラム: 基本情報 */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Icon
								icon="mdi:information"
								className="h-6 w-6 text-indigo-600"
							/>
							基本情報
						</h2>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium text-gray-700">
									タイトル
								</label>
								<p className="text-gray-900 mt-1">{currentTrip.title}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									目的地
								</label>
								<p className="text-gray-900 mt-1">{currentTrip.destination}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									日付
								</label>
								<p className="text-gray-900 mt-1 flex items-center gap-2">
									{formatDateDisplay(currentTrip)}
									{currentTrip.is_shared && (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
											<Icon icon="mdi:share-variant" className="h-3 w-3" />
											シェア版
										</span>
									)}
									{currentTrip.is_template && (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
											<Icon
												icon="mdi:file-document-outline"
												className="h-3 w-3"
											/>
											プラン
										</span>
									)}
								</p>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									アクセスレベル
								</label>
								<p className="text-gray-900 mt-1">
									<span
										className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
											currentTrip.access_level === "private"
												? "bg-gray-100 text-gray-700"
												: "bg-green-100 text-green-700"
										}`}
									>
										<Icon
											icon={
												currentTrip.access_level === "private"
													? "mdi:lock"
													: "mdi:earth"
											}
											className="h-3 w-3"
										/>
										{currentTrip.access_level === "private"
											? "プライベート"
											: "パブリック"}
									</span>
								</p>
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									説明
								</label>
								<p className="text-gray-600 mt-1 text-sm">
									{currentTrip.description}
								</p>
							</div>
						</div>
					</div>

					{/* 右カラム: 日程情報 */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Icon
								icon="mdi:calendar-clock"
								className="h-6 w-6 text-indigo-600"
							/>
							日程情報
						</h2>
						<div className="space-y-4">
							{currentTrip.days?.map((day, index) => (
								<div
									key={day.id}
									className="border border-gray-200 rounded-lg p-4"
								>
									<div className="flex items-center gap-2 mb-2">
										<span className="font-semibold text-gray-900">
											{currentTrip.is_template
												? `${day.day_number}日目`
												: currentTrip.is_shared
													? `${day.day_number}日目`
													: day.date
														? `${new Date(day.date).getMonth() + 1}月${new Date(day.date).getDate()}日（${day.day_number}日目）`
														: `${day.day_number}日目`}
										</span>
										{currentTrip.is_shared && (
											<span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
												<Icon
													icon="mdi:shield-lock"
													className="h-3 w-3 inline mr-1"
												/>
												プライバシー保護
											</span>
										)}
										{currentTrip.is_shared &&
											day.itineraries?.some((it) =>
												it.location?.includes("ホテル"),
											) && (
												<span className="text-xs text-gray-500">
													（宿泊先情報は匿名化）
												</span>
											)}
									</div>
									<div className="space-y-2">
										{day.itineraries?.map((it) => (
											<div
												key={it.id}
												className="text-sm text-gray-600 pl-4 border-l-2 border-indigo-200"
											>
												<div className="font-medium text-gray-900">
													{it.title}
												</div>
												<div className="text-xs text-gray-500 mt-0.5">
													{it.description}
												</div>
												{it.location && (
													<div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
														<Icon icon="mdi:map-marker" className="h-3 w-3" />
														{it.location}
													</div>
												)}
												{it.start_time && it.end_time && (
													<div className="text-xs text-gray-500 mt-0.5">
														{it.start_time} - {it.end_time}
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* プライベート旅行の場合: 招待メンバー表示 */}
				{activeType === "private" && (
					<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Icon
								icon="mdi:account-group"
								className="h-6 w-6 text-indigo-600"
							/>
							招待メンバー
						</h2>
						<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-start gap-2">
								<Icon
									icon="mdi:information"
									className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
								/>
								<div className="text-sm text-blue-800">
									<p className="font-medium mb-1">
										この旅行は以下のメンバーと共有されています
									</p>
									<p className="text-xs">
										会議の参加者リストのように、誰がこの旅行にアクセスできるかが表示されます。
									</p>
								</div>
							</div>
						</div>
						<div className="space-y-3">
							{/* オーナー */}
							<div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
								<div className="relative">
									<Image
										src={mockUser.profile_image_url || "/default-avatar.png"}
										alt={mockUser.name}
										className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
									/>
									<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white">
										<Icon icon="mdi:crown" className="h-3 w-3 text-white" />
									</div>
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="font-semibold text-gray-900">
											{mockUser.name}
										</span>
										<span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
											オーナー
										</span>
									</div>
									<p className="text-xs text-gray-600">{mockUser.email}</p>
								</div>
								<Icon
									icon="mdi:check-circle"
									className="h-5 w-5 text-indigo-600"
								/>
							</div>

							{/* 招待メンバー */}
							{mockSharedMembers.map((member) => (
								<div
									key={member.id}
									className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<Image
										src={member.profile_image_url || "/default-avatar.png"}
										alt={member.name}
										className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
									/>
									<div className="flex-1">
										<div className="flex items-center gap-2">
											<span className="font-medium text-gray-900">
												{member.name}
											</span>
											<span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
												招待済み
											</span>
										</div>
										<p className="text-xs text-gray-600">{member.email}</p>
									</div>
									<div className="flex items-center gap-2">
										<Icon
											icon="mdi:check-circle"
											className="h-5 w-5 text-green-600"
										/>
										<button className="text-gray-400 hover:text-red-600 transition-colors">
											<Icon icon="mdi:account-remove" className="h-5 w-5" />
										</button>
									</div>
								</div>
							))}

							{/* メンバー追加ボタン */}
							<button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
								<Icon icon="mdi:account-plus" className="h-5 w-5" />
								<span className="font-medium">メンバーを招待</span>
							</button>
						</div>
					</div>
				)}

				{/* 旅行プランのシェアの場合: クリエイタープロフィール表示 */}
				{activeType === "template" && (
					<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Icon
								icon="mdi:account-circle"
								className="h-6 w-6 text-indigo-600"
							/>
							クリエイター
						</h2>
						<div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
							<div className="flex items-start gap-2">
								<Icon
									icon="mdi:information"
									className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5"
								/>
								<div className="text-sm text-emerald-800">
									<p className="font-medium mb-1">
										このプランを作成したクリエイターのプロフィールを表示します
									</p>
									<p className="text-xs">
										ツアー呼び込みや業者プランの場合、信頼性を高めるためにクリエイター情報を明確に表示します。
									</p>
								</div>
							</div>
						</div>

						{/* クリエイタープロフィールカード */}
						<div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
							<div className="flex flex-col md:flex-row items-start md:items-center gap-4">
								{/* アバター */}
								<div className="relative">
									<Image
										src={mockUser.profile_image_url || "/default-avatar.png"}
										alt={mockUser.name}
										className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
									/>
									{currentTrip.shared_plan_type === "business" && (
										<div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-md">
											<Icon icon="mdi:store" className="h-4 w-4 text-white" />
										</div>
									)}
								</div>

								{/* プロフィール情報 */}
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<h3 className="text-2xl font-bold text-gray-900">
											{mockUser.name}
										</h3>
										{currentTrip.shared_plan_type === "business" ? (
											<span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
												<Icon icon="mdi:store" className="h-4 w-4" />
												業者プラン
											</span>
										) : (
											<span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
												<Icon icon="mdi:account" className="h-4 w-4" />
												ユーザープラン
											</span>
										)}
									</div>
									<p className="text-gray-600 mb-3">{mockUser.email}</p>
									<p className="text-sm text-gray-700 mb-4">
										旅行プランナーとして、沖縄を中心に様々な旅行プランを作成しています。
										効率的な移動方法や地域の楽しみ方を提案します。
									</p>

									{/* 統計情報 */}
									<div className="flex flex-wrap gap-4 mb-4">
										<div className="flex items-center gap-2">
											<Icon
												icon="mdi:file-document-multiple"
												className="h-5 w-5 text-indigo-600"
											/>
											<div>
												<div className="text-sm font-semibold text-gray-900">
													24
												</div>
												<div className="text-xs text-gray-600">公開プラン</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Icon
												icon="mdi:heart"
												className="h-5 w-5 text-rose-600"
											/>
											<div>
												<div className="text-sm font-semibold text-gray-900">
													156
												</div>
												<div className="text-xs text-gray-600">総いいね数</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Icon
												icon="mdi:account-group"
												className="h-5 w-5 text-blue-600"
											/>
											<div>
												<div className="text-sm font-semibold text-gray-900">
													89
												</div>
												<div className="text-xs text-gray-600">フォロワー</div>
											</div>
										</div>
									</div>

									{/* アクションボタン */}
									<div className="flex gap-3">
										<button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
											<Icon icon="mdi:account-plus" className="h-5 w-5" />
											<span>フォロー</span>
										</button>
										<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
											<Icon icon="mdi:message" className="h-5 w-5" />
											<span>メッセージ</span>
										</button>
										<Link
											href={`/${mockUser.slug}`}
											className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
										>
											<Icon icon="mdi:account-circle" className="h-5 w-5" />
											<span>プロフィールを見る</span>
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* プライベート旅行のシェアの場合: 写真ギャラリー表示 */}
				{activeType === "shared" && (
					<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Icon
								icon="mdi:image-multiple"
								className="h-6 w-6 text-indigo-600"
							/>
							旅行の写真
						</h2>
						<div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
							<div className="flex items-start gap-2">
								<Icon
									icon="mdi:information"
									className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5"
								/>
								<div className="text-sm text-purple-800">
									<p className="font-medium mb-1">
										アップロードした写真がitinerariesと連動して表示されます
									</p>
									<p className="text-xs">
										InstagramやFacebookの写真投稿のように、ビジュアル重視のタイムライン形式で表示されます。
									</p>
								</div>
							</div>
						</div>

						{/* タイムライン形式の写真表示 */}
						<div className="space-y-6">
							{currentTrip.days?.map((day, dayIndex) => (
								<div
									key={day.id}
									className="border border-gray-200 rounded-lg overflow-hidden"
								>
									{/* 日付ヘッダー */}
									<div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3">
										<div className="flex items-center gap-2">
											<Icon icon="mdi:calendar" className="h-5 w-5" />
											<span className="font-semibold">
												{currentTrip.is_shared
													? `${day.day_number}日目`
													: day.date
														? `${new Date(day.date).getMonth() + 1}月${new Date(day.date).getDate()}日（${day.day_number}日目）`
														: `${day.day_number}日目`}
											</span>
											<span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-auto">
												プライバシー保護
											</span>
										</div>
									</div>

									{/* 各itineraryの写真と情報 */}
									<div className="divide-y divide-gray-200">
										{day.itineraries?.map((itinerary, itIndex) => {
											// モック写真URL（Unsplashを使用）
											const photoUrl = `https://source.unsplash.com/800x600/?travel,${itinerary.location?.replace(/\s+/g, ",") || "japan"}&sig=${dayIndex * 10 + itIndex}`;

											return (
												<div
													key={itinerary.id}
													className="p-4 hover:bg-gray-50 transition-colors"
												>
													<div className="flex flex-col md:flex-row gap-4">
														{/* 写真 */}
														<div className="md:w-1/3">
															<div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 group cursor-pointer">
																<Image
																	src={photoUrl}
																	alt={itinerary.title}
																	className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
																/>
																<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
																	<div className="absolute bottom-2 left-2 right-2 text-white text-xs">
																		<Icon
																			icon="mdi:map-marker"
																			className="h-4 w-4 inline mr-1"
																		/>
																		{itinerary.location || "場所未設定"}
																	</div>
																</div>
																{/* 写真数バッジ（複数写真がある場合） */}
																{itIndex === 0 && (
																	<div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
																		<Icon
																			icon="mdi:image-multiple"
																			className="h-3 w-3"
																		/>
																		<span>3</span>
																	</div>
																)}
															</div>
														</div>

														{/* 情報 */}
														<div className="md:w-2/3 flex flex-col justify-between">
															<div>
																<h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
																	{itinerary.title}
																	{itinerary.location?.includes("ホテル") && (
																		<span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
																			匿名化
																		</span>
																	)}
																</h3>
																<p className="text-sm text-gray-600 mb-2">
																	{itinerary.description}
																</p>
																{itinerary.location && (
																	<div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
																		<Icon
																			icon="mdi:map-marker"
																			className="h-4 w-4"
																		/>
																		<span>{itinerary.location}</span>
																	</div>
																)}
																{itinerary.start_time && itinerary.end_time && (
																	<div className="flex items-center gap-1 text-sm text-gray-500">
																		<Icon
																			icon="mdi:clock-outline"
																			className="h-4 w-4"
																		/>
																		<span>
																			{itinerary.start_time} -{" "}
																			{itinerary.end_time}
																		</span>
																	</div>
																)}
															</div>

															{/* ソーシャルアクション */}
															<div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
																<button className="flex items-center gap-1 text-gray-600 hover:text-rose-600 transition-colors">
																	<Icon
																		icon="mdi:heart-outline"
																		className="h-5 w-5"
																	/>
																	<span className="text-sm">12</span>
																</button>
																<button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors">
																	<Icon
																		icon="mdi:comment-outline"
																		className="h-5 w-5"
																	/>
																	<span className="text-sm">3</span>
																</button>
																<button className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors">
																	<Icon
																		icon="mdi:share-variant"
																		className="h-5 w-5"
																	/>
																	<span className="text-sm">シェア</span>
																</button>
															</div>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* ソーシャル統計 */}
				<div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<Icon icon="mdi:chart-line" className="h-6 w-6 text-indigo-600" />
						ソーシャル統計
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-rose-600">
								{currentTrip.social_stats?.likes_count || 0}
							</div>
							<div className="text-sm text-gray-600 mt-1">いいね</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{currentTrip.social_stats?.comments_count || 0}
							</div>
							<div className="text-sm text-gray-600 mt-1">コメント</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{currentTrip.social_stats?.shares_count || 0}
							</div>
							<div className="text-sm text-gray-600 mt-1">シェア</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">
								{currentTrip.social_stats?.views_count || 0}
							</div>
							<div className="text-sm text-gray-600 mt-1">閲覧</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{currentTrip.social_stats?.replicas_count || 0}
							</div>
							<div className="text-sm text-gray-600 mt-1">複製</div>
						</div>
					</div>
				</div>

				{/* 注意事項 */}
				<div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
						<Icon icon="mdi:information" className="h-5 w-5" />
						注意事項
					</h3>
					<ul className="text-sm text-yellow-700 space-y-1">
						<li>
							• これはユーザー体験を模擬するためのハリボテ（モック）ページです
						</li>
						<li>• 実際のデータベースには影響しません</li>
						<li>• 各タイプの表示の違いを確認できます</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
