export const dynamic = "force-static";
export const revalidate = false;

export default function StaticContactPage() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<h1 className="text-3xl font-bold mb-4">Contact</h1>
			<p className="text-gray-700">Get in touch with us: hello@caglla.travel</p>
		</main>
	);
}
