import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy | St Agnes',
  description: 'Privacy policy for St Agnes website and booking system.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral max-w-3xl dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>
        St Agnes collects only the information required to process bookings, communicate updates, and improve service
        quality.
      </p>
      <h2>Information We Collect</h2>
      <p>Name, email, phone, booking preferences, and service history.</p>
      <h2>How We Use Data</h2>
      <p>To confirm bookings, send reminders, handle reschedules/cancellations, and provide customer support.</p>
      <h2>Retention & Security</h2>
      <p>
        We retain data only as necessary for operational and legal purposes, and apply reasonable security safeguards.
      </p>
    </article>
  );
}
