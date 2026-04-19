import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getPublicRentals } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Booking | St Agnes',
  description: 'Book appointments with the St Agnes studio using the multi-step wizard.',
};

export default async function BookingPage() {
  const rentals = await getPublicRentals().catch(() => ({ data: [] }));

  return (
    <div className="space-y-6">
      <section className="fade-up relative overflow-hidden rounded-3xl border border-stone-700/60 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-700 p-6 text-white shadow-[0_26px_70px_-35px_rgba(0,0,0,0.85)] md:p-8">
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.24em] text-stone-300">St Agnes Concierge Booking</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Book an Appointment</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-200 md:text-base">
          Choose your service, pick from real-time open slots, and confirm in minutes.
        </p>
      </section>
      <BookingWizard rentals={rentals.data} />
    </div>
  );
}
