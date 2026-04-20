import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy | St Agnes',
  description: 'Privacy policy for St Agnes website and booking system.',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-2xl">
        <p className="section-index">Legal — Privacy</p>
        <h1 className="display-hero mt-5">Privacy Policy</h1>

        <div className="mt-12 space-y-10 text-base leading-relaxed text-foreground/90">
          <p>
            St Agnes collects only the information required to process bookings, communicate
            updates, and improve service quality.
          </p>
          <div>
            <h2 className="font-display text-2xl">Information we collect</h2>
            <p className="mt-3 text-muted-foreground">
              Name, email, phone, booking preferences, and service history.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl">How we use data</h2>
            <p className="mt-3 text-muted-foreground">
              To confirm bookings, send reminders, handle reschedules and cancellations, and
              provide customer support.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl">Retention & security</h2>
            <p className="mt-3 text-muted-foreground">
              We retain data only as necessary for operational and legal purposes, and apply
              reasonable security safeguards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
