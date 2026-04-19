import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border">
        <img src={imageUrl} alt={item.name} className="h-full min-h-80 w-full object-cover" />
      </div>

      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">{item.name}</h1>
        <p className="text-sm text-muted-foreground md:text-base">{item.description}</p>
        <p className="text-sm">₦{Number(item.pricePerDay).toLocaleString()} per day</p>
        <p className="text-sm text-muted-foreground">Sizes: {sizes.join(', ')}</p>

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
