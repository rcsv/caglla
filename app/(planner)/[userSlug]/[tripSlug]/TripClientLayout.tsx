"use client";

import { ReactNode, useState, Fragment } from "react";
import { TripProvider, useTrip } from "./TripProvider";
import NavigationMenu from "@/components/planner/NavigationMenu";
import FloatingTitleBar from "@/components/planner/FloatingTitleBar";
import ICalPublishModal from "@/components/modals/ICalPublishModal";
import { useTripUrlState } from "./useTripUrlState";
import { useAuth } from "@/lib/contexts/auth";
import { useUserData } from "@/lib/contexts/user-data";
import { useRouter } from "next/navigation";
import { useTripActions } from "./useTripActions";
import { makeAuthenticatedRequest } from "@/lib/api/helpers";
import logger from "@/lib/core/logger";
import { t } from "@/lib/i18n";
import { useNotification } from "@/lib/contexts/notification";
import type { Trip } from "@/lib/core/types";

interface TripClientLayoutProps {
	trip: Trip | null;
	timeline: ReactNode;
	map: ReactNode;
	social: ReactNode;
	children?: ReactNode;
}

/**
 * TripClientLayoutContent
 *
 * NavigationMenuとFloatingTitleBarを含むレイアウトコンテンツ
 */
function TripClientLayoutContent({
	timeline,
	map,
	social,
	children,
}: {
	timeline: ReactNode;
	map: ReactNode;
	social: ReactNode;
	children?: ReactNode;
}) {
	const { trip, loading, error, refreshTrip, updateTrip } = useTrip();
	const { user } = useAuth();
	const { removeTrip, userData, userPlanId } = useUserData();
	const router = useRouter();
	const { currentView, selectedDayId, setSelectedDayId, updateQuery } =
		useTripUrlState();
	const { showConfirm, showSuccess, showError } = useNotification();

	const [leftNavExpanded, setLeftNavExpanded] = useState(true);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [icalModalOpen, setIcalModalOpen] = useState(false);
	const [unpublishLoading, setUnpublishLoading] = useState(false);

	// Trip actions (Publish, PDF, iCal)
	const { publish, exportPdf, publishLoading, pdfExporting } = useTripActions({
		trip,
		user,
		userData,
		refreshTrip,
		updateTrip,
		router,
		userPlan: userPlanId,
	});

	// tripがnullの場合、ローディングまたはエラー表示
	if (!trip) {
		if (loading) {
			return (
				<div className="flex items-center justify-center h-screen">
					<div className="text-gray-500">Loading trip...</div>
				</div>
			);
		}
		if (error === "not-found") {
			return (
				<div className="flex items-center justify-center h-screen">
					<div className="text-gray-500">Trip not found</div>
				</div>
			);
		}
		if (error === "forbidden") {
			return (
				<div className="flex items-center justify-center h-screen">
					<div className="text-gray-500">Access forbidden</div>
				</div>
			);
		}
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-gray-500">Loading trip...</div>
			</div>
		);
	}

	const navigateToSection = (sectionId: string) => {
		// Summary view内のセクションへのナビゲーション
		if (currentView === "summary") {
			const element = document.getElementById(sectionId);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	const handleDayClick = (dayId: string) => {
		if (selectedDayId === dayId) {
			setSelectedDayId(null);
			updateQuery({ sd: null, mf: "all" });
		} else {
			setSelectedDayId(dayId);
			updateQuery({ sd: dayId, si: null, mf: "day" });
		}
		// Itinerary viewに切り替え
		if (currentView !== "itinerary") {
			updateQuery({ view: "itinerary" });
		}
	};

	const handleICalExport = () => {
		setIcalModalOpen(true);
	};

	const handleTogglePublish = async () => {
		if (!trip || publishLoading || unpublishLoading) return;

		// Public → Private (Unpublish)
		if (trip.access_level === "public") {
			showConfirm(
				"warning",
				t("trip.publish.unpublishConfirmTitle"),
				t("trip.publish.unpublishConfirmMessage"),
				async () => {
					try {
						setUnpublishLoading(true);
						const response = await makeAuthenticatedRequest(
							`/api/trip/${trip.slug || trip.id}/publish`,
							{
								method: "DELETE",
								headers: { "Content-Type": "application/json" },
							},
						);

						if (!response.ok) {
							const errorData = await response.json().catch(() => ({}));
							showError(errorData.error || t("trip.publish.unpublishFailed"));
							return;
						}

						await refreshTrip();
						showSuccess(t("trip.publish.unpublishSuccess"));
					} catch (err) {
						logger.error("Unpublish failed:", err);
						showError(t("trip.publish.unpublishFailed"));
					} finally {
						setUnpublishLoading(false);
					}
				},
				undefined,
				t("trip.publish.unpublish"),
				t("common.cancel"),
			);
		} else {
			// Private → Public (Publish)
			await publish();
		}
	};

	// 編集権限の確認
	const canEdit =
		user &&
		trip &&
		(trip.user_id === userData?.id || trip.user_id === user.uid);

	return (
		<div className="h-screen bg-gray-50 flex overflow-hidden">
			{/* Floating Hamburger (mobile only) */}
			<button
				onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

			{/* Left Navigation Menu - 768px以上で常に表示（lg以上でも表示） */}
			{trip && (
				<div className="hidden md:block flex-shrink-0 z-10">
					<NavigationMenu
						trip={trip}
						onNavigateToSection={navigateToSection}
						onDayClick={handleDayClick}
						isCollapsed={!leftNavExpanded}
						onToggleCollapse={() => setLeftNavExpanded(!leftNavExpanded)}
					/>
				</div>
			)}

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 md:hidden zidx-left-panel"
					onClick={() => setMobileMenuOpen(false)}
				/>
			)}

			{/* Mobile Slide Menu */}
			<nav
				className={`fixed top-0 left-0 h-full w-[188px] bg-white border-r border-gray-200 transform transition-transform duration-300 zidx-left-panel-content md:hidden ${
					mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{trip && (
					<div className="w-full h-full overflow-hidden">
						<NavigationMenu
							trip={trip}
							onNavigateToSection={(sectionId) => {
								navigateToSection(sectionId);
								setMobileMenuOpen(false);
							}}
							onDayClick={(dayId) => {
								handleDayClick(dayId);
								setMobileMenuOpen(false);
							}}
							isCollapsed={false}
							onToggleCollapse={() => {}}
						/>
					</div>
				)}
			</nav>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
				{/* Left Content (Timeline) */}
				<div className="flex flex-col overflow-hidden main-content-scrollable lg:flex-shrink-0 lg:w-[740px]">
					{/* Floating Title Bar */}
					{trip && (
						<FloatingTitleBar
							title={trip.title}
							accessLevel={
								trip.access_level === "private" ? "private" : "public"
							}
							actions={
								canEdit ? (
									<div className="flex items-center gap-2">
										{/* PDF Export Button */}
										<button
											onClick={exportPdf}
											disabled={pdfExporting}
											className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 rounded-md transition-colors flex items-center gap-1.5"
											title="Export to PDF"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
												/>
											</svg>
											{pdfExporting ? "Exporting..." : "PDF"}
										</button>

										{/* iCal Export Button - テンプレートの場合は非表示 */}
										{!trip?.is_template && (
											<button
												onClick={handleICalExport}
												className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
													trip?.ical_enabled
														? "text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300"
														: "text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
												}`}
												title={
													trip?.ical_enabled
														? "iCal sharing enabled"
														: "Enable iCal sharing"
												}
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
													/>
												</svg>
												iCal
											</button>
										)}

										{/* Publish Toggle Switch */}
										<button
											onClick={handleTogglePublish}
											disabled={publishLoading || unpublishLoading}
											className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 rounded-md transition-colors"
											title={
												trip?.access_level === "public"
													? "Click to unpublish (make private)"
													: "Click to publish (make public)"
											}
										>
											<span>
												{publishLoading
													? t("trip.publish.publishing")
													: unpublishLoading
														? "Unpublishing..."
														: "Publish"}
											</span>
											{/* Toggle Switch: [o   ] OFF, [   o] ON */}
											<div
												className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
													publishLoading || unpublishLoading
														? "bg-gray-300"
														: trip?.access_level === "public"
															? "bg-blue-600"
															: "bg-gray-300"
												}`}
											>
												<span
													className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
														trip?.access_level === "public"
															? "translate-x-[18px]"
															: "translate-x-[3px]"
													}`}
												/>
											</div>
										</button>
									</div>
								) : null
							}
						/>
					)}

					{/* Timeline Slot */}
					<div className="flex-1 overflow-y-auto relative scrollbar-hide main-content-shadow">
						<Fragment key="timeline-slot">{timeline}</Fragment>
						<Fragment key="children-slot">{children}</Fragment>
						<Fragment key="social-slot">{social}</Fragment>
					</div>
				</div>

				{/* Map Panel (Desktop only) - Takes remaining space */}
				<div className="hidden lg:block lg:flex-1 lg:min-w-[400px] border-l border-gray-200 h-full overflow-hidden">
					{map}
				</div>
			</div>

			{/* iCal Publish Modal - テンプレートの場合は非表示 */}
			{trip && !trip.is_template && (
				<ICalPublishModal
					isOpen={icalModalOpen}
					onClose={() => setIcalModalOpen(false)}
					trip={trip}
					onUpdate={async (updatedTrip) => {
						updateTrip(updatedTrip);
						await refreshTrip();
					}}
				/>
			)}
		</div>
	);
}

/**
 * TripClientLayout
 *
 * Client Componentの境界として、TripProviderを配置します。
 * Parallel Routesの各slot（timeline, map, social）にTripデータを提供します。
 */
export function TripClientLayout({
	trip,
	timeline,
	map,
	social,
	children,
}: TripClientLayoutProps) {
	return (
		<TripProvider trip={trip}>
			<TripClientLayoutContent timeline={timeline} map={map} social={social}>
				{children}
			</TripClientLayoutContent>
		</TripProvider>
	);
}
