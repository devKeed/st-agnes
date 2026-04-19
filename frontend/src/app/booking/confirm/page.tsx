import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Booking Confirmed | St Agnes',
  description: 'Booking confirmation and next steps.',
};

interface Props {
  searchParams: Promise<{ manageToken?: string; manageUrl?: string }>;
}

export default async function BookingConfirmPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const manageToken = resolved.manageToken;
  const manageUrl = resolved.manageUrl;

  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-xl border p-6 text-center md:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Confirmation</p>
      <h1 className="text-3xl font-semibold">Your booking request has been received.</h1>
      <p className="text-sm text-muted-foreground md:text-base">
        Your request is now in review. Keep your manage link safe to reschedule or cancel according to studio policy.
      </p>
      {manageToken ? (
        <p className="rounded-md border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
          Manage token: <span className="font-mono text-foreground">{manageToken}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        {manageUrl ? (
          <Button asChild>
            <Link href={manageUrl}>Manage this booking</Link>
          </Button>
        ) : null}
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
