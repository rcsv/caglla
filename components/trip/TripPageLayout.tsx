"use client";

import { ReactNode } from "react";
import { Trip } from "@/lib/core/types";
import NavigationMenu from "@/components/planner/NavigationMenu";
import FloatingTitleBar from "@/components/planner/FloatingTitleBar";

interface TripPageLayoutProps {
	trip: Trip;
	children: ReactNode;
	rightPane?: ReactNode;
	rightPaneWidth?: "default" | "zero"; // 右ペインの幅制御
	leftNavExpanded: boolean;
	onToggleLeftNav: () => void;
	mobileMenuOpen: boolean;
	onToggleMobileMenu: () => void;
	onNavigateToSection: (sectionId: string) => void;
	onDayClick: (dayId: string) => void;
	titleBarActions?: ReactNode; // タイトルバーに追加のアクション（エクスポートボタンなど）
	menuItems?: Array<{
		id: string;
		label: string;
		icon?: string;
		onClick: () => void;
		disabled?: boolean;
	}>;
	onLogout?: () => void;
	mobileToolbar?: ReactNode;
	extraControlsMenuItems?: Array<{
		id: string;
		label: string;
		icon?: string;
		onClick: () => void;
		disabled?: boolean;
	}>;
}

export default function TripPageLayout({
	trip,
	children,
	rightPane,
	rightPaneWidth = "default",
	leftNavExpanded,
	onToggleLeftNav,
	mobileMenuOpen,
	onToggleMobileMenu,
	onNavigateToSection,
	onDayClick,
	titleBarActions,
	menuItems,
	onLogout,
	mobileToolbar,
	extraControlsMenuItems,
}: TripPageLayoutProps) {
	return (
		<div className="h-screen bg-gray-50 flex overflow-hidden">
			{/* Floating Hamburger (mobile only) */}
			<button
				onClick={onToggleMobileMenu}
				className="md:hidden fixed left-0 top-[180px] zidx-left-panel inline-flex items-center justify-center w-12 h-12 rounded-r-lg bg-white border border-gray-200 shadow text-gray-700 hover:bg-gray-50"
				aria-label="Open navigation menu"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>
			{/* Left Navigation Menu - 768px以上のみ表示 */}
			<div className="hidden md:block flex-shrink-0">
				<NavigationMenu
					trip={trip}
					onNavigateToSection={onNavigateToSection}
					onDayClick={onDayClick}
					isCollapsed={!leftNavExpanded}
					onToggleCollapse={onToggleLeftNav}
					onLogout={onLogout}
					extraControlsMenuItems={extraControlsMenuItems}
				/>
			</div>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div
					className={`fixed inset-0 bg-black bg-opacity-50 md:hidden zidx-left-panel`}
					onClick={onToggleMobileMenu}
				/>
			)}

			{/* Mobile Slide Menu - 188px固定幅 */}
			<nav
				className={`fixed top-0 left-0 h-full w-[188px] bg-white border-r border-gray-200 transform transition-transform duration-300 zidx-left-panel-content md:hidden ${
					mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="w-full h-full overflow-hidden">
					<NavigationMenu
						trip={trip}
						onNavigateToSection={(sectionId) => {
							onNavigateToSection(sectionId);
							onToggleMobileMenu();
						}}
						onDayClick={(dayId) => {
							onDayClick(dayId);
							onToggleMobileMenu();
						}}
						isCollapsed={false}
						onToggleCollapse={onToggleMobileMenu}
						onLogout={onLogout}
						extraControlsMenuItems={extraControlsMenuItems}
					/>
				</div>
			</nav>

			{/* Main Content Pane - Scrollable */}
			<div
				className={`flex-1 overflow-y-auto scrollbar-hide main-content-scrollable main-content-shadow ${
					rightPaneWidth === "zero" ? "main-content-full-width" : ""
				}`}
			>
				<FloatingTitleBar
					title={trip.title}
					accessLevel={trip.access_level === "private" ? "private" : "public"}
					actions={titleBarActions}
					menuItems={undefined}
					className="zidx-top-menu"
					mobileToolbar={mobileToolbar}
				/>
				{children}
			</div>

			{/* Right Pane（md以上のみ表示）*/}
			{rightPaneWidth === "default" && rightPane}
		</div>
	);
}
