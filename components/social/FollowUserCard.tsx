"use client";

import Image from "next/image";
import Link from "next/link";
import FollowButton from "@/components/social/FollowButton";

interface FollowUserCardProps {
	user: {
		id: string;
		name: string;
		slug: string;
		profile_image_url?: string;
		bio?: string;
		isFollowing: boolean;
	};
	onFollowToggle?: (userSlug: string, nextState: boolean) => Promise<void>;
	disabled?: boolean;
}

/**
 * FollowUserCard Component
 *
 * フォロワー・フォロー中ユーザーカード
 * - ユーザーアバター
 * - ユーザー名・スラッグ
 * - Bio
 * - フォローボタン（isFollowing は API 側で返す）
 */
export default function FollowUserCard({
	user,
	onFollowToggle,
	disabled = false,
}: FollowUserCardProps) {
	return (
		<div className="flex items-start gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
			{/* アバター */}
			<Link
				href={`/${user.slug}`}
				className="flex-shrink-0"
				onClick={(e) => {
					if (disabled) {
						e.preventDefault();
					}
				}}
			>
				<div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
					{user.profile_image_url ? (
						<Image
							src={user.profile_image_url}
							alt={user.name}
							fill
							sizes="48px"
							className="object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<span className="text-lg text-gray-600 font-semibold">
								{user.name.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
				</div>
			</Link>

			{/* ユーザー情報 */}
			<div className="flex-1 min-w-0">
				<Link
					href={`/${user.slug}`}
					className="block"
					onClick={(e) => {
						if (disabled) {
							e.preventDefault();
						}
					}}
				>
					<div className="font-semibold text-gray-900 hover:underline">
						{user.name}
					</div>
					<div className="text-sm text-gray-500">@{user.slug}</div>
					{user.bio && (
						<div className="mt-1 text-sm text-gray-700 line-clamp-2">
							{user.bio}
						</div>
					)}
				</Link>
			</div>

			{/* フォローボタン */}
			<div className="flex-shrink-0">
				<FollowButton
					userSlug={user.slug}
					initialFollowing={user.isFollowing}
					onToggle={async (following) => {
						if (onFollowToggle) {
							await onFollowToggle(user.slug, following);
						}
					}}
					size="sm"
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
