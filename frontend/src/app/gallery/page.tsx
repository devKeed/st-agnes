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
    <div className="space-y-8 md:space-y-10">
      <section className="premium-shell fade-up space-y-3 p-6 md:p-8">
        <h1 className="premium-title">Gallery</h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          A curated blend of collection pieces and muse editorials.
        </p>
        <div className="flex gap-3 text-sm">
          <Link
            href="/gallery/collection"
            className="rounded-full border border-border/80 bg-white px-4 py-1.5 transition-all hover:-translate-y-0.5 hover:bg-muted"
          >
            Collection
          </Link>
          <Link
            href="/gallery/muse"
            className="rounded-full border border-border/80 bg-white px-4 py-1.5 transition-all hover:-translate-y-0.5 hover:bg-muted"
          >
            Muse
          </Link>
        </div>
      </section>

      <section className="fade-up-delay grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="premium-card group overflow-hidden">
            <div className="overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{item.category}</p>
              <h2 className="font-medium">{item.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
