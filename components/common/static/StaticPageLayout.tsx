"use client";

import React from "react";
import { LandingHeader } from "@/components/common/LandingHeader";
import { LandingFooter } from "@/components/common/LandingFooter";

type StaticPageLayoutProps = {
	children: React.ReactNode;
	showLoginButton?: boolean;
	containerClassName?: string;
	showRail?: boolean;
};

export function StaticPageLayout({
	children,
	showLoginButton = false,
	containerClassName = "container mx-auto px-6 py-12",
	showRail = true,
}: StaticPageLayoutProps) {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
			<LandingHeader showLoginButton={showLoginButton} />
			<main className={containerClassName}>
				<div className={showRail ? "page-rail space-y-20" : "space-y-20"}>
					{children}
				</div>
			</main>
			<LandingFooter />
		</div>
	);
}
