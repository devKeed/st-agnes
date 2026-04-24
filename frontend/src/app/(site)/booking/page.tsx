import type { Metadata } from 'next';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getContentMap, getPublicRental, getPublicRentals } from '@/lib/public-api';

export const metadata: Metadata = {
  title: 'Booking | St Agnes',
  description: 'Schedule a private consultation with the St Agnes atelier.',
};

interface Props {
  searchParams: Promise<{ service?: string; rentalId?: string; size?: string }>;
}

export default async function BookingPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const [rentals, content, requestedRental] = await Promise.all([
    getPublicRentals().catch(() => ({ data: [] })),
    getContentMap().catch(() => ({} as Record<string, string>)),
    resolved.rentalId ? getPublicRental(resolved.rentalId).catch(() => null) : Promise.resolve(null),
  ]);

  const rentalsData =
    requestedRental && !rentals.data.some((item) => item.id === requestedRental.id)
      ? [requestedRental, ...rentals.data]
      : rentals.data;

  const requestedService = resolved.service;
  const initialService =
    requestedService === 'CUSTOM_DESIGN' ||
    requestedService === 'ALTERATION' ||
    requestedService === 'RENTAL'
      ? requestedService
      : undefined;

  const initialRental = rentalsData.find((item) => item.id === resolved.rentalId);
  const requestedSize = resolved.size?.trim().toUpperCase();
  const initialRentalSize =
    initialRental && requestedSize && initialRental.sizes.includes(requestedSize)
      ? requestedSize
      : undefined;

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
      <section
        id="book-consultation"
        className="mx-auto w-full max-w-[1440px] scroll-mt-24 px-5 py-16 md:px-10 md:py-20"
      >
        <BookingWizard
          rentals={rentalsData}
          initialService={initialService}
          initialRentalId={initialRental?.id}
          initialRentalSize={initialRentalSize}
        />
      </section>
    </div>
  );
}
