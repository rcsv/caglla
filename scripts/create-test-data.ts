#!/usr/bin/env ts-node

/**
 * テストデータ作成スクリプト
 *
 * 任意のユーザーとしてFirebaseにデータを作成するためのスクリプトです。
 * テンプレート作成や開発・テスト用のデータ作成に使用できます。
 *
 * 使用方法:
 *   ts-node scripts/create-test-data.ts
 *   または
 *   pnpm create-test-data
 *
 * 環境変数:
 *   - FIREBASE_PROJECT_ID: Firebase プロジェクトID
 *   - FIREBASE_CLIENT_EMAIL: Firebase Admin SDK のクライアントメール
 *   - FIREBASE_PRIVATE_KEY: Firebase Admin SDK の秘密鍵
 *
 * 注意: .env.local ファイルに環境変数を設定してください
 */

// 環境変数を読み込む
import dotenv from "dotenv";
import { resolve } from "path";

// .env.local ファイルを優先的に読み込む
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
// .env.local がない場合は .env を読み込む
dotenv.config({ path: resolve(process.cwd(), ".env") });

import {
	adminUserOperations,
	adminTripOperations,
	adminDayOperations,
} from "@/lib/firebase/admin-operation";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import logger from "@/lib/core/logger";
import type { User, Trip, Day } from "@/lib/core/types";

/**
 * テストユーザーを作成
 */
async function createTestUser(userData: {
	authUid: string;
	name: string;
	email: string;
	slug?: string;
	profileImageUrl?: string;
	bio?: string;
}): Promise<User> {
	logger.info("Creating test user...", {
		name: userData.name,
		email: userData.email,
	});

	// 既存ユーザーをチェック
	const existingUser = await adminUserOperations.getUserByAuthUid(
		userData.authUid,
	);
	if (existingUser) {
		logger.info("User already exists, returning existing user", {
			userId: existingUser.id,
		});
		return existingUser;
	}

	// スラッグを生成（既存のスラッグをチェック）
	let slug = userData.slug;
	if (!slug) {
		const baseSlug = generateSlug(userData.name);
		// 既存ユーザーのスラッグを取得
		const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).get();
		const existingSlugs = usersSnapshot.docs
			.map((doc: any) => doc.data().slug)
			.filter((s: any): s is string => Boolean(s));
		slug = generateUniqueSlug(baseSlug, existingSlugs);
	}

	const user = await adminUserOperations.createUser({
		auth_uid: userData.authUid,
		name: userData.name,
		email: userData.email,
		slug,
		profile_image_url: userData.profileImageUrl,
		bio: userData.bio,
		preferences: {
			currency: "JPY",
			language: "ja",
			theme: "light",
		},
		planId: "season_traveler",
	});

	logger.info("✅ Test user created", { userId: user.id, slug: user.slug });
	return user;
}

/**
 * テスト旅行を作成
 */
async function createTestTrip(
	userId: string,
	tripData: {
		title: string;
		destination?: string;
		description?: string;
		startDate?: Date;
		endDate?: Date;
		accessLevel?: "private" | "public";
		isTemplate?: boolean;
		dayCount?: number;
		imageUrl?: string;
	},
): Promise<Trip> {
	logger.info("Creating test trip...", { userId, title: tripData.title });

	// 既存の旅行スラッグを取得
	const existingTrips = await adminTripOperations.getTripsByUserId(userId);
	const existingSlugs = existingTrips
		.map((t) => t.slug)
		.filter((slug): slug is string => Boolean(slug));

	// スラッグを生成
	const finalTitle = tripData.title || tripData.destination || "Untitled Trip";
	const tripSlug = generateUniqueSlug(finalTitle, existingSlugs);

	// undefined値をフィルタリングしてFirestoreに保存
	const cleanTripData: any = {
		user_id: userId,
		title: tripData.title,
		slug: tripSlug,
		access_level: tripData.accessLevel || "private",
		is_template: tripData.isTemplate || false,
		status: "PLANNING",
		default_currency: "JPY",
	};

	// オプショナルフィールドはundefinedでない場合のみ追加
	if (tripData.description !== undefined) {
		cleanTripData.description = tripData.description;
	}
	if (tripData.destination !== undefined) {
		cleanTripData.destination = tripData.destination;
	}
	if (tripData.startDate !== undefined) {
		cleanTripData.start_date = tripData.startDate;
	}
	if (tripData.endDate !== undefined) {
		cleanTripData.end_date = tripData.endDate;
	}
	if (tripData.dayCount !== undefined) {
		cleanTripData.day_count = tripData.dayCount;
	}
	if (tripData.imageUrl !== undefined) {
		cleanTripData.image_url = tripData.imageUrl;
	}

	const trip = await adminTripOperations.createTrip(cleanTripData);

	logger.info("✅ Test trip created", { tripId: trip.id, slug: trip.slug });

	// 日付が指定されている場合はDayレコードを作成
	if (tripData.startDate && tripData.endDate) {
		await adminDayOperations.updateDaysForTrip(
			trip.id,
			tripData.startDate,
			tripData.endDate,
		);
		logger.info("✅ Days created for trip", { tripId: trip.id });
	}

	return trip;
}

/**
 * ユーザーIDでユーザーを取得
 */
async function getUserById(userId: string): Promise<User | null> {
	const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(userId).get();
	if (!userDoc.exists) {
		return null;
	}
	return {
		id: userDoc.id,
		...userDoc.data(),
	} as User;
}

/**
 * メイン処理
 */
async function main() {
	try {
		logger.info(
			"🚀 Starting template creation for user: faRoL34yjICfd6v21VMr...",
		);

		// 指定されたユーザーIDでユーザーを取得
		const userId = "faRoL34yjICfd6v21VMr";
		const user = await getUserById(userId);

		if (!user) {
			logger.error(`❌ User not found: ${userId}`);
			throw new Error(`User with ID ${userId} not found`);
		}

		logger.info("✅ User found", {
			userId: user.id,
			name: user.name,
			slug: user.slug,
		});

		// 旅行テンプレートのリスト（public）
		const publicTemplates = [
			{
				title: "東京3日間観光プラン",
				destination: "東京都",
				description: "東京の主要観光スポットを巡る3日間のプラン",
				dayCount: 3,
			},
			{
				title: "京都・奈良2泊3日",
				destination: "京都府",
				description: "古都京都と奈良を巡る歴史散策プラン",
				dayCount: 3,
			},
			{
				title: "沖縄リゾート5日間",
				destination: "沖縄県那覇市",
				description: "沖縄のビーチと文化を楽しむ5日間プラン",
				dayCount: 5,
			},
			{
				title: "北海道冬の旅4日間",
				destination: "北海道札幌市",
				description: "雪景色と温泉を楽しむ冬の北海道プラン",
				dayCount: 4,
			},
			{
				title: "大阪・神戸グルメ旅2日間",
				destination: "大阪府",
				description: "関西の名物グルメを巡る2日間プラン",
				dayCount: 2,
			},
			{
				title: "金沢・白川郷3日間",
				destination: "石川県金沢市",
				description: "加賀百万石の城下町と世界遺産を巡るプラン",
				dayCount: 3,
			},
			{
				title: "箱根温泉1泊2日",
				destination: "神奈川県箱根町",
				description: "箱根の温泉と自然を楽しむリラックスプラン",
				dayCount: 2,
			},
			{
				title: "広島・宮島観光2日間",
				destination: "広島県広島市",
				description: "原爆ドームと厳島神社を巡る歴史プラン",
				dayCount: 2,
			},
			{
				title: "福岡・博多グルメ旅3日間",
				destination: "福岡県福岡市",
				description: "博多ラーメンと屋台グルメを楽しむプラン",
				dayCount: 3,
			},
			{
				title: "長野・軽井沢避暑地4日間",
				destination: "長野県軽井沢町",
				description: "高原の涼しい空気と自然を楽しむプラン",
				dayCount: 4,
			},
		];

		// プライベートテンプレートのリスト（執筆中）
		const privateTemplates = [
			{
				title: "執筆中：鎌倉・江ノ島1日観光",
				destination: "神奈川県鎌倉市",
				description: "鎌倉の寺社と江ノ島を巡る1日プラン（執筆中）",
				dayCount: 1,
			},
			{
				title: "執筆中：伊豆・熱海温泉旅2日間",
				destination: "静岡県熱海市",
				description: "伊豆半島の温泉と海を楽しむプラン（執筆中）",
				dayCount: 2,
			},
			{
				title: "執筆中：高知・四万十川3日間",
				destination: "高知県高知市",
				description: "四万十川と高知の自然を楽しむプラン（執筆中）",
				dayCount: 3,
			},
			{
				title: "執筆中：熊本・阿蘇2日間",
				destination: "熊本県熊本市",
				description: "阿蘇山と熊本城を巡るプラン（執筆中）",
				dayCount: 2,
			},
			{
				title: "執筆中：鹿児島・桜島1泊2日",
				destination: "鹿児島県鹿児島市",
				description: "桜島と鹿児島の歴史を楽しむプラン（執筆中）",
				dayCount: 2,
			},
		];

		const createdTrips: Array<{
			id: string;
			title: string;
			slug?: string;
			accessLevel: string;
		}> = [];

		// 10件のpublicテンプレートを作成
		logger.info("Creating public templates...");
		for (const template of publicTemplates) {
			const trip = await createTestTrip(user.id, {
				title: template.title,
				destination: template.destination,
				description: template.description,
				isTemplate: true,
				dayCount: template.dayCount,
				accessLevel: "public",
			});
			createdTrips.push({
				id: trip.id,
				title: trip.title,
				slug: trip.slug,
				accessLevel: "public",
			});
			logger.info(`✅ Created public template: ${template.title}`, {
				tripId: trip.id,
			});
		}

		// 5件のprivateテンプレートを作成（執筆中）
		logger.info("Creating private templates (draft)...");
		for (const template of privateTemplates) {
			const trip = await createTestTrip(user.id, {
				title: template.title,
				destination: template.destination,
				description: template.description,
				isTemplate: true,
				dayCount: template.dayCount,
				accessLevel: "private",
			});
			createdTrips.push({
				id: trip.id,
				title: trip.title,
				slug: trip.slug,
				accessLevel: "private",
			});
			logger.info(`✅ Created private template: ${template.title}`, {
				tripId: trip.id,
			});
		}

		logger.info("🎉 Template creation completed!");
		logger.info("Created templates:", {
			user: {
				id: user.id,
				name: user.name,
				slug: user.slug,
			},
			totalTrips: createdTrips.length,
			publicTemplates: createdTrips.filter((t) => t.accessLevel === "public")
				.length,
			privateTemplates: createdTrips.filter((t) => t.accessLevel === "private")
				.length,
			trips: createdTrips,
		});
	} catch (error) {
		logger.error("❌ Error creating test data:", error);
		throw error;
	}
}

// スクリプト実行
main()
	.then(() => {
		logger.info("✅ Script completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		logger.error("❌ Script failed:", error);
		process.exit(1);
	});
