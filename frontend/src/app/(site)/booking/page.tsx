import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getContentMap, getPublicRentals } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Booking | St Agnes',
  description: 'Schedule a private consultation with the St Agnes atelier.',
};

export default async function BookingPage() {
  const [rentals, content] = await Promise.all([
    getPublicRentals().catch(() => ({ data: [] })),
    getContentMap().catch(() => ({} as Record<string, string>)),
  ]);
  const t = (key: string, fallback: string) => content[key] ?? fallback;

  return (
    <div>
      {/* HEADER */}
      <section className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-24">
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="section-index">{t('booking_eyebrow', 'Concierge — Booking')}</p>
              <h1 className="display-hero mt-5">
                {content.booking_title ?? (
                  <>A private <em className="italic">appointment</em>.</>
                )}
              </h1>
            </div>
            <div className="md:col-span-5">
              <p className="text-base leading-relaxed text-muted-foreground">
                {t(
                  'booking_intro',
                  "Choose your service, pick from real-time open slots, and confirm in minutes. You'll receive a manage link to reschedule or cancel in accordance with our studio policy.",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WIZARD */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10 md:py-20">
        <BookingWizard rentals={rentals.data} />
      </section>
    </div>
  );
}
