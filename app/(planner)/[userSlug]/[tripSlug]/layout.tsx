import { ReactNode, Suspense } from "react";
import { getTripServer } from "@/lib/travel/trip-server";
import { TripClientLayout } from "./TripClientLayout";
import { notFound } from "next/navigation";
import type { Trip } from "@/lib/core/types";

/**
 * Trip Detail Page Layout with Parallel Routes
 *
 * Phase 1: データフェッチの共通化（v3.0.0）
 *
 * Server ComponentとしてTripを一度だけfetchし、TripClientLayout経由で
 * Parallel Routesの各slot（@timeline, @map, @social）に提供します。
 */
export default async function TripDetailLayout({
	children,
	timeline,
	map,
	social,
	params,
}: {
	children: ReactNode;
	timeline: ReactNode;
	map: ReactNode;
	social: ReactNode;
	params: Promise<{ userSlug: string; tripSlug: string }>;
}) {
	const { tripSlug } = await params;

	// Server Componentで一度だけTripをfetch
	// 注意: Server Componentでは認証情報が取得できない場合があるため、
	// privateなTripの場合はnullが返される可能性がある
	// その場合、Client Component側（page.tsxまたは@timeline/default.tsx）で再取得を試みる
	const trip = await getTripServer(tripSlug);

	// tripがnullの場合でも、一旦レンダリングを試みる
	// Client Component側（TripProvider）で再取得を試みるため、notFound()は呼ばない
	// TripProviderはnullを受け取れるように修正済み
	if (!trip) {
		// Server Componentでは認証情報が取得できない場合、privateなTripは取得できない
		// その場合、Client Component側（TripProvider）で再取得を試みる
		// TripProviderにnullを渡すと、Client Component側で再取得を試みる
	}

	// Phase 5: Parallel Routesのみを使用（page.tsxは段階的に削除予定）
	// childrenは現時点では空（page.tsxが存在する場合は表示されるが、段階的に移行中）
	// TripWithDestinationをTripに変換（creatorの型を変換）
	// 注意: TripWithDestinationのcreatorはUser型の一部のプロパティしか持っていないため、
	// unknownを経由して型アサーションを使用する
	const tripForClient: Trip | null = trip
		? {
				...trip,
				creator: trip.creator
					? ({
							id: trip.creator.id,
							name: trip.creator.name,
							email: trip.creator.email,
							avatar_url: trip.creator.avatar_url || undefined,
							slug: trip.creator.slug || undefined,
						} as unknown as Trip["creator"])
					: undefined,
			}
		: null;

	return (
		<Suspense fallback={null}>
			<TripClientLayout
				trip={tripForClient}
				timeline={timeline}
				map={map}
				social={social}
			>
				{children}
			</TripClientLayout>
		</Suspense>
	);
}
