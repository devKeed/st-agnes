import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Booking Confirmed | St Agnes',
  description: 'Booking confirmation and next steps.',
};

export default function BookingConfirmPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-xl border p-6 text-center md:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Confirmation</p>
      <h1 className="text-3xl font-semibold">Your booking request has been received.</h1>
      <p className="text-sm text-muted-foreground md:text-base">
        A confirmation email and manage link will be sent after validation. You can use your manage link to reschedule
        or cancel according to studio policy.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/booking">Book another</Link>
        </Button>
      </div>
    </div>
  );
}
