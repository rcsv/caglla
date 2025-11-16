export const dynamic = 'force-static'
export const revalidate = false

export default function StaticHomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Caglla</h1>
        <p className="text-gray-600">Travel Manager - static landing</p>
      </section>
    </main>
  )
}


