import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getPublicRentals } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Booking | St Agnes',
  description: 'Schedule a private consultation with the St Agnes atelier.',
};

export default async function BookingPage() {
  const rentals = await getPublicRentals().catch(() => ({ data: [] }));

  return (
    <div>
      {/* HEADER */}
      <section className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="section-index">Concierge — Booking</p>
              <h1 className="display-hero mt-5">
                A private <em className="italic">appointment</em>.
              </h1>
            </div>
            <div className="md:col-span-5">
              <p className="text-base leading-relaxed text-muted-foreground">
                Choose your service, pick from real-time open slots, and confirm in minutes.
                You'll receive a manage link to reschedule or cancel in accordance with our
                studio policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WIZARD */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <BookingWizard rentals={rentals.data} />
      </section>
    </div>
  );
}
