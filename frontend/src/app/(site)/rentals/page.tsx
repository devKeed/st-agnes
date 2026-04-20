import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getPublicRentals } from '@/lib/public-api';
import { rentalItems } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'Rentals | St Agnes',
  description: 'Browse the rental archive for weddings and special occasions.',
};

export default async function RentalsPage() {
  const rentals = await getPublicRentals().catch(() => ({ data: rentalItems }));

  return (
    <div>
      {/* HEADER */}
      <section className="mx-auto w-full max-w-[1440px] px-5 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="section-index">Index — Rentals</p>
            <h1 className="display-hero mt-5">
              The rental <em className="italic">archive</em>.
            </h1>
          </div>
          <div className="md:col-span-5">
            <p className="text-base leading-relaxed text-muted-foreground">
              A rotating selection of signature pieces, available for weddings, galas, and
              single-evening moments. All rentals include a pre-fitting and dedicated styling.
            </p>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto w-full max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {rentals.data.map((item, i) => {
            const imageUrl = 'imageUrl' in item ? item.imageUrl : item.imageUrls?.[0];
            return (
              <article key={item.id} className="group hover-grow">
                <Link href={`/rentals/${item.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    <span className="absolute left-4 top-4 font-display text-sm italic text-white mix-blend-difference">
                      № {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl leading-tight">{item.name}</h2>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        ₦{Number(item.pricePerDay).toLocaleString()} · per day
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground" />
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {rentals.data.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            The archive is being refreshed. Please check back shortly.
          </p>
        ) : null}
      </section>

      {/* CTA */}
      <section className="bg-surface/50">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-20 text-center md:px-10 md:py-24">
          <h2 className="display-lg mx-auto max-w-2xl">
            Looking for something specific? We can source it.
          </h2>
          <Link href="/booking" className="btn-premium mt-8 inline-flex">
            Begin a consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
