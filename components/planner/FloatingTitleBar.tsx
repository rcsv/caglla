"use client";

import React from "react";

export interface FloatingTitleBarProps
	extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	accessLevel: "public" | "private";
	actions?: React.ReactNode;
	menuItems?: Array<{
		id: string;
		label: string;
		icon?: string;
		onClick: () => void;
		disabled?: boolean;
	}>;
	onToggleMobileMenu?: () => void;
	mobileMenuOpen?: boolean;
	mobileToolbar?: React.ReactNode;
}

export default function FloatingTitleBar({
	title,
	accessLevel: _accessLevel,
	actions,
	menuItems: _menuItems,
	className,
	onToggleMobileMenu: _onToggleMobileMenu,
	mobileMenuOpen: _mobileMenuOpen = false,
	mobileToolbar,
	...rest
}: FloatingTitleBarProps) {
	const hasCustomZIndex =
		typeof className === "string" &&
		(className.includes("zidx-") || className.includes("z-["));

	return (
		<div
			className={[
				"sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4",
				hasCustomZIndex ? "" : "zidx-main-content",
				className,
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}
		>
			<div className="flex items-center justify-between w-full gap-3 h-[53px]">
				<div className="flex items-center gap-3 min-w-0">
					<div className="text-sm md:text-base font-semibold text-gray-900 truncate">
						{title}
					</div>
				</div>
				<div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
			</div>
			{mobileToolbar && (
				<div className="md:hidden pb-3 w-full">{mobileToolbar}</div>
			)}
		</div>
	);
}
