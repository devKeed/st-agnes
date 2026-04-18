import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { rentalItems } from '@/lib/public-data';

interface Props {
  params: { id: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const item = rentalItems.find((x) => x.id === params.id);
  return {
    title: `${item?.name ?? 'Rental'} | St Agnes`,
    description: item?.description ?? 'Rental details page.',
  };
}

export default function RentalDetailPage({ params }: Props) {
  const item = rentalItems.find((x) => x.id === params.id);
  if (!item) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border">
        <img src={item.imageUrl} alt={item.name} className="h-full min-h-80 w-full object-cover" />
      </div>

      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">{item.name}</h1>
        <p className="text-sm text-muted-foreground md:text-base">{item.description}</p>
        <p className="text-sm">₦{item.pricePerDay.toLocaleString()} per day</p>
        <p className="text-sm text-muted-foreground">Sizes: {item.sizes.join(', ')}</p>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/booking">Book this piece</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/rentals">Back to rentals</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
