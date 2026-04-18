import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Props {
  params: { token: string };
}

export const metadata: Metadata = {
  title: 'Manage Booking | St Agnes',
  description: 'Use your secure manage token to reschedule or cancel your booking.',
};

export default function BookingManagePage({ params }: Props) {
  if (!params.token || params.token.length < 10) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold md:text-4xl">Manage your booking</h1>
      <p className="text-sm text-muted-foreground md:text-base">
        Token: <span className="font-mono">{params.token}</span>
      </p>
      <div className="rounded-xl border p-5">
        <p className="text-sm text-muted-foreground">
          This page is ready for backend wiring to display booking details, reschedule availability, and cancellation
          actions via token.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline">Reschedule</Button>
          <Button variant="destructive">Cancel booking</Button>
        </div>
      </div>
    </div>
  );
}
