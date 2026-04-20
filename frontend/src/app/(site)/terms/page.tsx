import type { Metadata } from 'next';
import { getActiveTerms } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Terms | St Agnes',
  description: 'Terms and conditions for St Agnes services and bookings.',
};

export default async function TermsPage() {
  const terms = await getActiveTerms().catch(() => null);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-2xl">
        <p className="section-index">Legal — Terms</p>
        <h1 className="display-hero mt-5">
          {terms ? `Terms & Conditions` : 'Terms & Conditions'}
        </h1>
        {terms ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Version {terms.versionLabel}
          </p>
        ) : null}

        {terms ? (
          <pre className="mt-12 whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground/90">
            {terms.content}
          </pre>
        ) : (
          <div className="mt-12 space-y-10 text-base leading-relaxed text-foreground/90">
            <p>
              By booking with St Agnes, you agree to service timelines, fitting requirements,
              and cancellation policies.
            </p>
            <div>
              <h2 className="font-display text-2xl">Booking policy</h2>
              <p className="mt-3 text-muted-foreground">
                Appointments are confirmed subject to availability. Please arrive on time for
                all consultation and fitting sessions.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl">Reschedule & cancellation</h2>
              <p className="mt-3 text-muted-foreground">
                Requests inside 24 hours of appointment time may not be accepted. Specific
                cancellation fees can apply based on service type.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl">Rentals</h2>
              <p className="mt-3 text-muted-foreground">
                Rental pieces must be returned in agreed condition and timeline. Damage and
                late returns may attract charges.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
