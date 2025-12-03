"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";
import { CagllaLogo } from "@/components/common/icons/CagllaLogo";
import { t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export interface StaticHeaderProps {
	/**
	 * ナビゲーションリンクを非表示にするかどうか
	 * @default false
	 */
	hideNavigation?: boolean;
	/**
	 * 言語切り替えを非表示にするかどうか
	 * @default false
	 */
	hideLanguageSwitcher?: boolean;
}

/**
 * スタティックページ用のヘッダーコンポーネント
 * ログイン機構やユーザー名表示機構を含まない、純粋なスタティックページ向けのヘッダー
 */
export const StaticHeader: React.FC<StaticHeaderProps> = ({
	hideNavigation = false,
	hideLanguageSwitcher = false,
}) => {
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	const toggleMobileMenu = () => {
		setIsMobileOpen(!isMobileOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileOpen(false);
	};

	const navigationLinks = [
		{ href: "/about", label: t("footer.about") },
		{ href: "/product/features", label: t("features") },
		{ href: "/product/pricing", label: t("pricing") },
		{ href: "/contact", label: t("contact") },
	];

	return (
		<header className="border-b border-gray-200 bg-white sticky top-0 zidx-top-menu">
			<div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
				<div className="flex items-center justify-between min-h-12 sm:min-h-14 gap-3">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 text-gray-900"
						aria-label="Caglla home"
					>
						<CagllaLogo className="w-8 h-8" />
						<span className="text-lg sm:text-xl font-bold font-rajdhani whitespace-nowrap leading-none">
							Caglla
						</span>
					</Link>

					<div className="flex items-center gap-3 sm:gap-6">
						{/* Desktop Navigation */}
						{!hideNavigation && (
							<nav className="hidden md:flex items-center gap-6">
								{navigationLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="text-gray-600 hover:text-gray-900 transition-colors"
									>
										{link.label}
									</Link>
								))}
							</nav>
						)}

						{/* Language Switcher */}
						{!hideLanguageSwitcher && (
							<LanguageSwitcher className="hidden md:inline-block w-[72px] text-xs py-1 md:w-auto md:text-sm" />
						)}

						{/* Mobile Menu Button */}
						{!hideNavigation && (
							<button
								type="button"
								onClick={toggleMobileMenu}
								aria-expanded={isMobileOpen}
								aria-controls="mobile-menu"
								aria-label={isMobileOpen ? "メニューを閉じる" : "メニューを開く"}
								className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded"
							>
								{isMobileOpen ? (
									<svg
										className="w-6 h-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								) : (
									<svg
										className="w-6 h-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 6h16M4 12h16M4 18h16"
										/>
									</svg>
								)}
							</button>
						)}
					</div>
				</div>

				{/* Mobile Menu */}
				{!hideNavigation && isMobileOpen && (
					<div
						id="mobile-menu"
						className="md:hidden border-t border-gray-200 pt-4 pb-2"
					>
						<nav className="flex flex-col space-y-2">
							{navigationLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={closeMobileMenu}
									className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
								>
									{link.label}
								</Link>
							))}
							{!hideLanguageSwitcher && (
								<div className="px-4 py-2">
									<LanguageSwitcher className="w-full text-xs" />
								</div>
							)}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default StaticHeader;
