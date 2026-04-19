import type { Metadata } from 'next';
import { getActiveTerms } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Terms | St Agnes',
  description: 'Terms and conditions for St Agnes services and bookings.',
};

export default async function TermsPage() {
  const terms = await getActiveTerms().catch(() => null);

  if (terms) {
    return (
      <article className="prose prose-neutral max-w-3xl dark:prose-invert">
        <h1>Terms & Conditions ({terms.versionLabel})</h1>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{terms.content}</pre>
      </article>
    );
  }

  return (
    <article className="prose prose-neutral max-w-3xl dark:prose-invert">
      <h1>Terms & Conditions</h1>
      <p>
        By booking with St Agnes, you agree to service timelines, fitting requirements, and cancellation policies.
      </p>
      <h2>Booking Policy</h2>
      <p>
        Appointments are confirmed subject to availability. Please arrive on time for all consultation and fitting
        sessions.
      </p>
      <h2>Reschedule & Cancellation</h2>
      <p>
        Requests inside 24 hours of appointment time may not be accepted. Specific cancellation fees can apply based on
        service type.
      </p>
      <h2>Rentals</h2>
      <p>
        Rental pieces must be returned in agreed condition and timeline. Damage and late returns may attract charges.
      </p>
    </article>
  );
}
