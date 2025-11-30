"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/contexts/auth";
import { useUserData } from "@/lib/contexts/user-data";
import { useClickOutside } from "@/hooks/useClickOutside";
import Image from "next/image";
import Link from "next/link";
import { t } from "@/lib/i18n";

interface UserMenuProps {
	isCollapsed?: boolean;
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
	const { user, logout } = useAuth();
	const { userData } = useUserData();
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useClickOutside(menuRef, () => setMenuOpen(false));

	const userName = userData?.name || user?.displayName || "User";
	const avatarUrl =
		userData?.avatar_url || user?.photoURL || "/default-avatar.png";
	const userSlug = userData?.slug;

	const handleLogout = () => {
		setMenuOpen(false);
		logout();
	};

	// 折りたたみ時の表示
	if (isCollapsed) {
		return (
			<div className="relative" ref={menuRef}>
				<button
					onClick={() => setMenuOpen((v) => !v)}
					className="w-full flex justify-center p-1 hover:bg-gray-50 rounded transition-colors"
					aria-label="User menu"
				>
					<Image
						src={avatarUrl}
						alt="avatar"
						width={32}
						height={32}
						className="w-8 h-8 rounded-full object-cover"
					/>
				</button>

				{menuOpen && (
					<div
						className={`fixed left-14 bottom-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 zidx-float-modal-content`}
						role="menu"
						aria-orientation="vertical"
					>
						{/* Profile */}
						{userSlug && (
							<Link
								href={`/${userSlug}`}
								onClick={() => setMenuOpen(false)}
								className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
								role="menuitem"
							>
								{t("nav.profile")}
							</Link>
						)}

						{/* Logout */}
						<hr className="my-1 border-gray-200" />
						<button
							onClick={handleLogout}
							className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
							role="menuitem"
						>
							{t("nav.logout")}
						</button>
					</div>
				)}
			</div>
		);
	}

	// 展開時の表示
	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setMenuOpen((v) => !v)}
				className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
				aria-label="User menu"
				aria-expanded={menuOpen}
				aria-haspopup="menu"
			>
				<Image
					src={avatarUrl}
					alt="avatar"
					width={32}
					height={32}
					className="w-8 h-8 rounded-full object-cover"
				/>
				<span className="flex-1 text-left text-sm font-medium text-gray-900 truncate">
					{userName}
				</span>
				<svg
					className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{menuOpen && (
				<div
					className={`absolute left-0 right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 zidx-float-modal-content`}
					role="menu"
					aria-orientation="vertical"
				>
					{/* Profile */}
					{userSlug && (
						<Link
							href={`/${userSlug}`}
							onClick={() => setMenuOpen(false)}
							className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
							role="menuitem"
						>
							{t("nav.profile")}
						</Link>
					)}

					{/* Logout */}
					<hr className="my-1 border-gray-200" />
					<button
						onClick={handleLogout}
						className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
						role="menuitem"
					>
						{t("nav.logout")}
					</button>
				</div>
			)}
		</div>
	);
}

export default UserMenu;
