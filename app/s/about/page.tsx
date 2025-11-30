export const dynamic = "force-static";
export const revalidate = false;

export default function StaticAboutPage() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<h1 className="text-3xl font-bold mb-4">About</h1>
			<p className="text-gray-700">
				Caglla is a personal travel manager designed to help you plan, organize,
				and share your trips.
			</p>
		</main>
	);
}
