import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

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
    <section className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-foreground">
          <Check className="h-6 w-6" strokeWidth={1.4} />
        </div>
        <p className="section-index mt-8 justify-center">Confirmation</p>
        <h1 className="display-xl mt-5">
          Your request has been <em className="italic">received.</em>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          Our studio will be in touch shortly to confirm your appointment. Keep your manage
          link safe to reschedule or cancel according to studio policy.
        </p>

        {manageToken ? (
          <div className="mt-8 border border-border/60 bg-surface/50 p-5 text-left">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Manage token
            </p>
            <p className="mt-2 break-all font-mono text-sm text-foreground">{manageToken}</p>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {manageUrl ? (
            <Link href={manageUrl} className="btn-premium">Manage this booking</Link>
          ) : null}
          <Link href="/" className="btn-ghost-premium">Back home</Link>
          <Link
            href="/booking"
            className="link-underline self-center text-[11px] uppercase tracking-[0.3em] text-foreground"
          >
            Book another
          </Link>
        </div>
      </div>
    </section>
  );
}
