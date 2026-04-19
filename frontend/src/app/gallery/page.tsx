import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicGallery } from '@/lib/public-api';
import { galleryItems } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'Gallery | St Agnes',
  description: 'Browse Collection and Muse gallery categories.',
};

export default async function GalleryPage() {
  const items = await getPublicGallery().catch(() => galleryItems);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold md:text-4xl">Gallery</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          A curated blend of collection pieces and muse editorials.
        </p>
        <div className="flex gap-3 text-sm">
          <Link href="/gallery/collection" className="rounded-md border px-3 py-1.5 hover:bg-muted">
            Collection
          </Link>
          <Link href="/gallery/muse" className="rounded-md border px-3 py-1.5 hover:bg-muted">
            Muse
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-xl border">
            <img src={item.imageUrl} alt={item.title} className="h-64 w-full object-cover" />
            <div className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.category}</p>
              <h2 className="font-medium">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
