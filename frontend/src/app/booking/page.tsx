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
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold md:text-4xl">Book an Appointment</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Pick your service, choose your preferred date, and submit your details.
        </p>
      </section>
      <BookingWizard rentals={rentals.data} />
    </div>
  );
}
