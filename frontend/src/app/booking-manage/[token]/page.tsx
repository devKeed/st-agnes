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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold md:text-4xl">Manage your booking</h1>
      <p className="text-sm text-muted-foreground md:text-base">
        Token: <span className="font-mono">{resolved.token}</span>
      </p>
      <ManageBookingClient token={resolved.token} />
    </div>
  );
}
