import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ManageBookingClient } from '@/components/booking/manage-booking-client';

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Manage Booking | St Agnes',
  description: 'Use your secure manage token to reschedule or cancel your booking.',
};

export default async function BookingManagePage({ params }: Props) {
  const resolved = await params;

  if (!resolved.token || resolved.token.length < 10) {
    notFound();
  }

  const bookingCode = resolved.token.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="section-index">Concierge — Manage</p>
          <h1 className="display-hero mt-5">Manage your booking.</h1>
          <p className="mt-6 text-sm text-muted-foreground">
            Booking code · <span className="font-mono text-foreground">{bookingCode}</span>
          </p>
        </div>
        <ManageBookingClient token={resolved.token} />
      </div>
    </div>
  );
}
