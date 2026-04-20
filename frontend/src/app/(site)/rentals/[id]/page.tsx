import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPublicRental } from '@/lib/public-api';
import { rentalItems } from '@/lib/public-data';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const item = await getPublicRental(resolved.id).catch(() => rentalItems.find((x) => x.id === resolved.id));
  return {
    title: `${item?.name ?? 'Rental'} | St Agnes`,
    description: item?.description ?? 'Rental details page.',
  };
}

export default async function RentalDetailPage({ params }: Props) {
  const resolved = await params;
  const item = await getPublicRental(resolved.id).catch(() => rentalItems.find((x) => x.id === resolved.id));
  if (!item) notFound();

  const imageUrl = 'imageUrl' in item ? item.imageUrl : item.imageUrls?.[0];
  const sizes = item.sizes ?? [];

  return (
    <div>
      <section className="mx-auto w-full max-w-[1440px] px-5 pt-12 md:px-10 md:pt-16">
        <Link
          href="/rentals"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground link-underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to archive
        </Link>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
            </div>
          </div>

          <div className="md:col-span-5 md:pl-4">
            <div className="md:sticky md:top-28">
              <p className="section-index">Rental Piece</p>
              <h1 className="display-xl mt-5">{item.name}</h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                {item.description}
              </p>

              <dl className="mt-10 space-y-5 border-t border-border/60 pt-6 text-sm">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Rate
                  </dt>
                  <dd className="font-display text-2xl">
                    ₦{Number(item.pricePerDay).toLocaleString()}
                    <span className="ml-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      / day
                    </span>
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-6 border-b border-border/40 pb-4">
                  <dt className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Sizes
                  </dt>
                  <dd className="flex flex-wrap justify-end gap-2">
                    {sizes.length > 0 ? (
                      sizes.map((s) => (
                        <span
                          key={s}
                          className="inline-flex h-9 min-w-9 items-center justify-center border border-foreground/40 px-3 text-[11px] uppercase tracking-[0.2em]"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Ask the studio</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-col gap-4">
                <Link href="/booking" className="btn-premium w-full">Book this piece</Link>
                <Link href="/rentals" className="btn-ghost-premium w-full">View more rentals</Link>
              </div>

              <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
                All rentals include a pre-fitting and professional styling. A refundable deposit
                applies at booking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
