import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicRentals } from '@/lib/public-api';
import { rentalItems } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'Rentals | St Agnes',
  description: 'Browse rental archive and view available pieces.',
};

export default async function RentalsPage() {
  const rentals = await getPublicRentals().catch(() => ({ data: rentalItems }));

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="premium-shell fade-up space-y-3 p-6 md:p-8">
        <h1 className="premium-title">Rental Archive</h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Explore signature rental pieces designed for weddings and special events.
        </p>
      </section>

      <section className="fade-up-delay grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rentals.data.map((item) => (
          <article key={item.id} className="premium-card group overflow-hidden">
            <div className="overflow-hidden">
              <img
                src={'imageUrl' in item ? item.imageUrl : item.imageUrls?.[0]}
                alt={item.name}
                className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-2 p-4">
              <h2 className="font-medium">{item.name}</h2>
              <p className="text-sm text-muted-foreground">
                ₦{Number(item.pricePerDay).toLocaleString()} / day
              </p>
              <Link
                href={`/rentals/${item.id}`}
                className="text-sm text-foreground/80 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                View details
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
