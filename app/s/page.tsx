export const dynamic = "force-static";
export const revalidate = false;

import Link from "next/link";
import SLoginCTA from "./SLoginCTA";
import SRedirectIfAuthenticated from "./SRedirectIfAuthenticated";

export default function StaticHomePage() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<SRedirectIfAuthenticated />
			<section className="text-center space-y-4">
				<h1 className="text-4xl font-bold">Caglla</h1>
				<p className="text-gray-600">Travel Manager - static landing</p>
				<div className="flex items-center gap-4 justify-center pt-4">
					<SLoginCTA />
					<Link
						href="/"
						className="text-indigo-600 underline decoration-dotted"
					>
						Full site
					</Link>
				</div>
			</section>
		</main>
	);
}
