"use client";

import React from "react";
import Link from "next/link";
import { CagllaLogo } from "@/components/common/icons/CagllaLogo";

export interface LandingFooterProps {
	className?: string;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
	className = "",
}) => {
	const { t } = require("@/lib/i18n");
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<footer
			className={`relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-300 overflow-hidden ${className}`}
		>
			{/* Background Watermark Text */}
			<div className="absolute inset-0 flex items-center justify-start pointer-events-none">
				<span className="text-[50rem] font-bold text-white opacity-[0.03] select-none whitespace-nowrap -ml-8">
					Caglla
				</span>
			</div>

			<div className="relative container mx-auto px-6 py-12">
				{/* Top Section: Brand (6) + Navigation (4) - md以上で6:4の比率 */}
				<div className="flex flex-col gap-8 mb-8 md:grid md:grid-cols-10 md:items-start md:gap-10">
					{/* Brand Section (span 6) */}
					<div className="md:col-span-6 md:max-w-2xl">
						<div className="flex items-center gap-2 mb-4">
							<CagllaLogo className="w-8 h-8" />
							<span className="text-xl font-bold text-white font-rajdhani">
								Caglla
							</span>
						</div>
						<p className="text-sm">{t("footer.tagline")}</p>
					</div>

					{/* Navigation Links (span 4) - inside, 3 equal columns */}
					<div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
						{/* Products */}
						<div>
							<h3 className="text-white font-semibold mb-4">
								{t("footer.products")}
							</h3>
							<ul className="space-y-2 text-sm">
								<li>
									<button
										onClick={scrollToTop}
										className="hover:text-white transition-colors underline underline-offset-2"
									>
										{t("footer.backToTop")}
									</button>
								</li>
								<li>
									<Link href="/" className="hover:text-white transition-colors">
										{t("footer.products.summary")}
									</Link>
								</li>
								<li>
									<Link
										href="/product/features"
										className="hover:text-white transition-colors"
									>
										{t("features")}
									</Link>
								</li>
								<li>
									<Link
										href="/product/pricing"
										className="hover:text-white transition-colors"
									>
										{t("pricing")}
									</Link>
								</li>
								<li>
									<Link
										href="/product/releases"
										className="hover:text-white transition-colors"
									>
										{t("footer.releaseNotes")}
									</Link>
								</li>
							</ul>
						</div>

						{/* Resources */}
						<div>
							<h3 className="text-white font-semibold mb-4">
								{t("footer.resources")}
							</h3>
							<ul className="space-y-2 text-sm">
								<li>
									<Link
										href="/docs"
										className="hover:text-white transition-colors"
									>
										{t("footer.documentation")}
									</Link>
								</li>
								<li>
									<Link
										href="/blog"
										className="hover:text-white transition-colors"
									>
										{t("footer.blog")}
									</Link>
								</li>
								<li>
									<Link
										href="/faq"
										className="hover:text-white transition-colors"
									>
										{t("footer.faq")}
									</Link>
								</li>
								<li>
									<Link
										href="/support"
										className="hover:text-white transition-colors"
									>
										{t("footer.support")}
									</Link>
								</li>
							</ul>
						</div>

						{/* Company */}
						<div>
							<h3 className="text-white font-semibold mb-4">
								{t("footer.company")}
							</h3>
							<ul className="space-y-2 text-sm">
								<li>
									<Link
										href="/about"
										className="hover:text-white transition-colors"
									>
										{t("footer.about")}
									</Link>
								</li>
								<li>
									<Link
										href="/contact"
										className="hover:text-white transition-colors"
									>
										{t("contact")}
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Social Media Links */}
				<div className="mb-8 pb-8 border-b border-gray-800">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						{/* Social Media Links (Stub) */}
						<div className="flex items-center gap-4">
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
								aria-label="X (Twitter)"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
								aria-label="LinkedIn"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
							</a>
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
								aria-label="Instagram"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
								</svg>
							</a>
							<a
								href="#"
								className="text-gray-400 hover:text-white transition-colors"
								aria-label="Facebook"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
								</svg>
							</a>
						</div>

						{/* spacer keeps layout in this row; button moves to bottom bar */}
						<div />
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-4">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
						<div className="flex items-center gap-4 w-full md:w-auto">
							{/* Back to Top: move to left-bottom with green outline border */}
							<button
								onClick={scrollToTop}
								className="inline-flex items-center gap-1 px-3 py-1.5 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 transition-colors rounded"
								aria-label={t("footer.backToTopAria")}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 10l7-7m0 0l7 7m-7-7v18"
									/>
								</svg>
								{t("footer.backToTop")}
							</button>
							<p className="text-gray-400">
								{t("footer.copyright").replace(
									"{year}",
									String(new Date().getFullYear()),
								)}
							</p>
						</div>
						<div className="flex items-center gap-6 text-gray-400">
							<Link
								href="/privacy"
								className="hover:text-white transition-colors"
							>
								{t("footer.privacyPolicy")}
							</Link>
							<span className="text-gray-600">|</span>
							<Link
								href="/terms"
								className="hover:text-white transition-colors"
							>
								{t("footer.termsOfService")}
							</Link>
							<span className="text-gray-600">|</span>
							<button className="hover:text-white transition-colors">
								{t("footer.cookieSettings")}
							</button>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default LandingFooter;
