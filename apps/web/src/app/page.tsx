export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-lg border bg-white p-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">St Agnes</p>
        <h1 className="mt-2 text-4xl font-semibold">Fashion Design & Booking Platform</h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          Book custom design, alterations, and rental fittings. Browse the collection and reserve
          multiple rental items in one appointment.
        </p>
        <a
          href="/booking"
          className="mt-6 inline-flex rounded bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Book a Consultation
        </a>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold">The Collection</h2>
          <p className="mt-2 text-sm text-neutral-600">Modeled editorial and concept designs.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold">The Muse</h2>
          <p className="mt-2 text-sm text-neutral-600">Real client moments and completed looks.</p>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="text-2xl font-semibold">Atelier Services</h2>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Custom Design</li>
          <li>Alterations</li>
          <li>Rentals</li>
        </ul>
      </section>
    </div>
  );
}
