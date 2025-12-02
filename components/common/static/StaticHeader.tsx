"use client";

import React from "react";
import Link from "next/link";
import { CagllaLogo } from "@/components/common/icons/CagllaLogo";

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
	const { t } = require("@/lib/i18n");
	const { LanguageSwitcher } = require("@/components/common/LanguageSwitcher");

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
						{/* Navigation */}
						{!hideNavigation && (
							<nav className="hidden md:flex items-center gap-6">
								<Link
									href="/features"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t("features")}
								</Link>
								<Link
									href="/pricing"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t("pricing")}
								</Link>
								<Link
									href="/contact"
									className="text-gray-600 hover:text-gray-900 transition-colors"
								>
									{t("contact")}
								</Link>
							</nav>
						)}

						{/* Language Switcher */}
						{!hideLanguageSwitcher && (
							<LanguageSwitcher className="inline-block w-[72px] text-xs py-1 md:w-auto md:text-sm md:inline-block" />
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default StaticHeader;
