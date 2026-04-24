import type { Metadata } from 'next';
import { BookingRecoverClient } from '@/components/booking/booking-recover-client';

export const metadata: Metadata = {
  title: 'Find My Booking | St Agnes',
  description: 'Recover your booking manage link by email.',
};

export default function BookingRecoverPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-xl space-y-8">
        <div>
          <p className="section-index">Concierge — Recovery</p>
          <h1 className="display-hero mt-5">Find your booking.</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Enter the email address you used when booking. If we find any active bookings,
            we will send you the manage links securely by email.
          </p>
        </div>
        <BookingRecoverClient />
      </div>
    </div>
  );
}
